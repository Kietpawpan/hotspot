const SHEET_NAME = "ข้อมูลรายวัน"; 
const AIR4THAI_URL = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php?region=5";

const STATIONS = {
  "47t": "นครราชสีมา",
  "108t": "ชัยภูมิ",
  "101t": "บุรีรัมย์",
  "111t": "สุรินทร์"
};
// ==========================================
// 1. เพิ่มฟังก์ชันใหม่นี้ลงไปใน GAS
// ==========================================
function getLivePM25Data() {
  const AIR4THAI_URL = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php?region=5";
  const targetStations = { "47t": "นครราชสีมา", "108t": "ชัยภูมิ", "101t": "บุรีรัมย์", "111t": "สุรินทร์" };
  let livePM25 = {};

  try {
    const response = UrlFetchApp.fetch(AIR4THAI_URL);
    const jsonData = JSON.parse(response.getContentText());
    jsonData.stations.forEach(station => {
      if (targetStations[station.stationID]) {
        livePM25[targetStations[station.stationID]] = station.AQILast.PM25.value;
      }
    });
    // ประกันว่าทุกจังหวัดมีค่า ถ้าดึงไม่ได้ให้เป็น Error
    Object.values(targetStations).forEach(prov => {
      if (!livePM25[prov]) livePM25[prov] = 'Error';
    });
  } catch (e) {
    console.error("Error fetching live Air4Thai data:", e);
    // กรณีเกิดข้อผิดพลาด ให้ทุกจังหวัดเป็น Error
     Object.values(targetStations).forEach(prov => livePM25[prov] = 'Error');
  }
  return livePM25;
}


// ==========================================
// 1. ฟังก์ชันดึง GeoJSON จาก Google Drive (แก้ไขตามที่คุยกัน)
// ==========================================
function getGeoJsonFromDrive() {
  const fileId = "1AGXM9PAFLH-J9GiV0RM0nYvqIC-u9JdR"; 
  try {
    const file = DriveApp.getFileById(fileId);
    const content = file.getBlob().getDataAsString();
    return JSON.parse(content);
  } catch (e) {
    Logger.log("ไม่สามารถดึงไฟล์ GeoJSON จาก Drive ได้: " + e.toString());
    return null;
  }
}

// ==========================================
// 2. ฟังก์ชันอัปเดตข้อมูลลง Sheet (รันอัตโนมัติวันละ 1 ครั้ง)
// ==========================================
function updateDailyPM25() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  // ดึงข้อมูล PM2.5
  const response = UrlFetchApp.fetch(AIR4THAI_URL);
  const jsonData = JSON.parse(response.getContentText());
  let newPMData = {};
  jsonData.stations.forEach(station => {
    if (STATIONS[station.stationID]) {
      newPMData[STATIONS[station.stationID]] = station.AQILast.PM25.value;
    }
  });

  // ดึงข้อมูล Hotspots
  const hotspotResponse = getNasaHotspots();
  const hotspotData = JSON.parse(hotspotResponse.getContent());

  const today = new Date();
  const todayStr = Utilities.formatDate(today, "GMT+7", "dd/MM/yyyy");

  // ดึงข้อมูล 12 คอลัมน์ (A ถึง L)
  const dataRange = sheet.getRange(2, 1, 4, 12); 
  const data = dataRange.getValues();

  for (let i = 0; i < data.length; i++) {
    let lastUpdateDate = data[i][0] instanceof Date ? 
                         Utilities.formatDate(data[i][0], "GMT+7", "dd/MM/yyyy") : 
                         data[i][0];
    let province = data[i][1];
    let newPM25Value = newPMData[province];
    
    // กำหนดค่าจุดความร้อน ถ้าดึงไม่ได้ให้เป็น 0
    let newHotspotValue = hotspotData[province] !== undefined ? parseInt(hotspotData[province]) : 0;

    if (lastUpdateDate === todayStr) {
      // =====================================
      // กรณีเผลอกดรันซ้ำในวันเดิม 
      // =====================================
      // อัปเดตแค่ค่ารายวันให้เป็นปัจจุบัน แต่ "ไม่บวกยอดสะสม" เพื่อป้องกันการบวกเบิ้ล
      if (newPM25Value !== undefined) data[i][2] = newPM25Value; 
      data[i][3] = newHotspotValue; 

    } else {
      // =====================================
      // กรณีขึ้นวันใหม่ (ระบบรันตามเวลาที่ตั้งไว้)
      // =====================================
      data[i][0] = today; // อัปเดตวันที่เป็นวันนี้
      
      // เลื่อนข้อมูลฝุ่นย้อนหลังเป็นแผง
      data[i][7] = data[i][6]; // H <- G
      data[i][6] = data[i][5]; // G <- F
      data[i][5] = data[i][4]; // F <- E
      data[i][4] = data[i][2]; // E <- C (นำค่าเมื่อวานไปไว้ย้อนหลัง 1 วัน)

      // อัปเดตค่า PM2.5 ของเช้าวันนี้
      data[i][2] = (newPM25Value !== undefined) ? newPM25Value : "-"; 
      
      // ตรวจสอบค่าฝุ่น หากเกินเกณฑ์ให้บวกวันเกินมาตรฐาน (ช่อง J Index 9)
      if (newPM25Value !== undefined && parseFloat(newPM25Value) > 37.5) {
         let currentExceedDays = parseInt(data[i][9]) || 0;
         data[i][9] = currentExceedDays + 1;
      }
      
      // อัปเดตจุดความร้อนรายวัน (ช่อง D)
      data[i][3] = newHotspotValue;
      
      // บวกทบยอดจุดความร้อนสะสมตรงๆ (ช่อง L Index 11)
      let currentAccumulated = parseInt(data[i][11]) || 0;
      data[i][11] = currentAccumulated + newHotspotValue; 
    }
  }

  // นำข้อมูลทั้งหมดกลับไปบันทึกลง Sheet
  dataRange.setValues(data);

  // ลบ Trigger ชั่วคราวหลังรันเสร็จ เพื่อรอการสร้างใหม่ในคืนถัดไป
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'updateDailyPM25') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// ==========================================
// 3. ฟังก์ชันดึง Hotspot (แก้ไขให้เรียกใช้ GeoJSON จาก Drive)
// ==========================================
function getNasaHotspots() {
  try {
    var nasaApiKey = '61454931fdc7c145936ad477ae95fd9a';
    var bbox = '101.0,14.0,104.5,16.8'; 
    var nasaUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/' + nasaApiKey + '/VIIRS_SNPP_NRT/' + bbox + '/2';

    var csvResponse = UrlFetchApp.fetch(nasaUrl);
    var csvText = csvResponse.getContentText();

    // แก้ไขตรงนี้: เรียกใช้ฟังก์ชันดึงจาก Drive แทน URL
    var geojson = getGeoJsonFromDrive();
    if (!geojson) throw new Error("GeoJSON data is null");

    var targets = ["นครราชสีมา", "ชัยภูมิ", "บุรีรัมย์", "สุรินทร์"];
    var targetEng = ["Nakhon Ratchasima", "Chaiyaphum", "Buri Ram", "Surin", "Buriram"];

    var boundaries = [];
    for (var i = 0; i < geojson.features.length; i++) {
      var feature = geojson.features[i];
      var propStr = JSON.stringify(feature.properties);
      var match = false;
      for (var k = 0; k < targets.length; k++) {
        if (propStr.indexOf(targets[k]) !== -1 || propStr.indexOf(targetEng[k]) !== -1) {
          match = targets[k]; 
          break;
        }
      }
      if (match) {
        boundaries.push({ name: match, geometry: feature.geometry });
      }
    }

    var results = { "นครราชสีมา": 0, "ชัยภูมิ": 0, "บุรีรัมย์": 0, "สุรินทร์": 0 };
    var lines = csvText.trim().split('\n');
    if (lines.length > 1 && lines[0].indexOf('latitude') !== -1) {
      var headers = lines[0].split(',');
      var latIdx = headers.indexOf('latitude');
      var lonIdx = headers.indexOf('longitude');
      var dateIdx = headers.indexOf('acq_date');
      var timeIdx = headers.indexOf('acq_time');

      var now = new Date();
      var cutoffTime = now.getTime() - (24 * 60 * 60 * 1000);

      for (var j = 1; j < lines.length; j++) {
        var values = lines[j].split(',');
        if (values.length < headers.length) continue;
        var lat = parseFloat(values[latIdx]);
        var lon = parseFloat(values[lonIdx]);
        var dateParts = values[dateIdx].split('-');
        var timeStr = ("0000" + values[timeIdx]).slice(-4);
        var acqDateTime = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1])-1, parseInt(dateParts[2]), parseInt(timeStr.substring(0,2)), parseInt(timeStr.substring(2,4)))).getTime();

        if (acqDateTime >= cutoffTime) {
          var point = [lon, lat];
          for (var b = 0; b < boundaries.length; b++) {
            if (isPointInGeometry(point, boundaries[b].geometry)) {
              results[boundaries[b].name]++;
              break; 
            }
          }
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"error": error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชันเสริม (isPointInGeometry, isPointInPolygon, isPointInRing ให้ใช้ของเดิมที่ท่านมี)
// ==========================================
// แก้ไขฟังก์ชัน doGet(e) เดิมให้เป็นแบบนี้
// ==========================================
function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.action === 'hotspots') return getNasaHotspots();
    // เพิ่มบรรทัดนี้เพื่อรองรับ request live_pm25
    if (e.parameter.action === 'live_pm25') return ContentService.createTextOutput(JSON.stringify(getLivePM25Data())).setMimeType(ContentService.MimeType.JSON);
  }
  // Default: ดึงข้อมูล dashboard จาก sheet ตามเดิม
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}


function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const SECRET_PASSWORD = props.getProperty('AI_PASSWORD');
  const GEMINI_API_KEY = props.getProperty('GEMINI_API_KEY');
  const DIR_NAME = props.getProperty('DIR_NAME');
  const DIR_POSITION = props.getProperty('DIR_POSITION');
  
  try {
    var requestData = JSON.parse(e.postData.contents);
    if (requestData.password !== SECRET_PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({ "error": "Unauthorized" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var contextData = requestData.contextData;
    var bbox = "97.0,8.0,108.0,23.0"; 
    var nasaMapUrl = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=BlueMarble_ShadedRelief,VIIRS_SNPP_Thermal_Anomalies_375m_Day,VIIRS_SNPP_Thermal_Anomalies_375m_Night&WIDTH=800&HEIGHT=1100&BBOX=" + bbox + "&SRS=EPSG:4326&FORMAT=image/png";

    var promptText = `สวมบทบาทเป็น ${DIR_POSITION} ผู้ชาย แทนตนเองว่า สคพ.11 ไม่มีหางเสียง เขียนข้อความส่งเข้ากลุ่ม LINE ขึ้นต้นว่า เรียน ท่าน ผู้ประสานงาน ทสจ. 4 จังหวัด นครราชสีมา ชัยภูมิ บุรีรัมย์ สุรินทร์ เพื่อแจ้งสถานการณ์สิ่งแวดล้อมประจำวันและแนะมาตรการที่เหมาะสม \n
นโยบายและเป้าหมายปี 2569 (อ้างอิงจากมาตรการระดับชาติ):
- เป้าหมายภาคอีสาน: ลดพื้นที่เผาไหม้เกษตร (เน้นนาข้าวและอ้อย) ไม่น้อยกว่า 10% และลดวันฝุ่นเกินมาตรฐาน 5%
- สาเหตุหลักที่ต้องเฝ้าระวัง: การเผาในพื้นที่เกษตร โดยเฉพาะนาข้าวและอ้อยโรงงาน
- มาตรการเร่งด่วน: ควบคุมอ้อยไฟไหม้เข้าโรงงานไม่เกิน 15% และตัดสิทธิ์ความช่วยเหลือจากภาครัฐหากพบการลักลอบเผา
- คำสั่งพิเศษ: ให้เชื่อมโยงข้อมูลสถานการณ์รายวันเข้ากับเป้าหมายข้างต้นนี้ เพื่อกำชับและกระตุ้นการทำงานของ ทสจ. อย่างเด็ดขาด\n
ข้อมูลสถานการณ์ล่าสุดที่ต้องรายงาน:
${contextData}

ภาพประกอบที่แนบไปเพื่อการวิเคราะห์ (เรียงตามลำดับ):
1 ภาพที่ 1 คือ แผนที่แสดงจุดความร้อน (Hotspot) จากดาวเทียม NASA ประจำวันครอบคลุมประเทศไทย ลาว และกัมพูชา (จุดสีแดง) โปรดวิเคราะห์ลักษณะการกระจายตัวเพื่อประเมินความเสี่ยงหมอกควันข้ามแดนและใช้ประกอบการสั่งการ
2 ภาพที่ 2-5 คือ กราฟอัตราการระบายอากาศ (VR) ของ นครราชสีมา ชัยภูมิ บุรีรัมย์ และสุรินทร์ ตามลำดับ โปรดวิเคราะห์แนวโน้มการระบายอากาศจากกราฟ

รูปแบบข้อความที่ต้องการ:
1. ความยาวพอเหมาะกับการอ่านบนหน้าจอมือถือ
2. ใช้ Emoji ประกอบเพื่อให้ดูทันสมัย โดยยึดเกณฑ์สีดังนี้:
- 0-15.0: สีฟ้า (ดีมาก) 😊
- 15.1-25.0: สีเขียว (ดี) 🙂
- 25.1-37.5: สีเหลือง (ปานกลาง) 😐
- 37.6-75.0: สีส้ม (เริ่มมีผลกระทบ) ⚠️
- 75.1 ขึ้นไป: สีแดง (มีผลกระทบ) 🚨
3. แบ่งเนื้อหาเป็น 2 ส่วนหลัก คือ "รายงานสถานการณ์ประจำวัน" และ "📌 ข้อเสนอแนะทางวิชาการ:" โดยห้ามใช้คำว่า "ข้อสั่งการ"
4. สำคัญมาก: ในส่วนรายงานสถานการณ์ 
4.1 ต้องขึ้นต้นด้วยดอกจัน (*) หน้าชื่อจังหวัด และเว้น 1 บรรทัดคั่นระหว่างจังหวัดเสมอ
4.2 ห้ามใช้คำว่า "สะสมโควต้า" แต่ให้ใช้คำตามเงื่อนไขดังนี้
4.2.1 ถ้าจำนวนวันที่ค่าฝุ่นเกินมาตรฐาน มากกว่า 0 ให้ใช้คำว่า "เหลือโควต้า" เช่น เหลือโควต้า 10 วัน
4.2.2 ถ้าจำนวนวันที่ค่าฝุ่นเกินมาตรฐาน  เท่ากับ 0 ให้ใช้คำว่า "หมดโควต้า" เช่น ⚠️ หมดโควต้าแล้ว
4.2.3 ถ้าจำนวนวันที่ค่าฝุ่นเกินมาตรฐาน  น้อยกว่า 0 ให้ใช้คำว่า "เกินโควต้า" เช่น 🚨 เกินโควต้า 1 วัน
5. กฎเหล็กสำหรับส่วน "ข้อเสนอแนะทางวิชาการ":
5.1 โครงสร้างเนื้อหา: สรุปเป็นข้อๆ รวม 3-4 ข้อ เน้นเฉพาะประเด็นวิกฤตหรือภาพรวมที่สำคัญ ไม่ต้องเขียนแยกครบทุกจังหวัดหากสถานการณ์ปกติ
5.2 การเชื่อมโยงบริบท: ต้องมีข้อที่เชื่อมโยงจุดความร้อนในภาพแผนที่ เข้ากับยอดจุดความร้อนสะสม, โควต้าวันฝุ่น และเป้าหมายลดการเผาปี 2569 เสมอ
5.3 เงื่อนไขด้านจุดความร้อน (เลือกใช้เมื่อตรงเงื่อนไข):
5.3.1 ในพื้นที่: หากจุดความร้อนหนาแน่น ให้ใช้คำสั่ง "ขอแจ้งให้ ทสจ. จัดชุดลาดตระเวนระงับเหตุทันที โดยเฉพาะการเผานาข้าวและอ้อย"
5.3.2 ข้ามแดน: หากพบจุดความร้อนหนาแน่นในประเทศเพื่อนบ้าน ให้ใช้คำสั่ง "ขอแจ้งให้ ทสจ. เฝ้าระวังผลกระทบตามแนวชายแดนและทิศทางลมอย่างใกล้ชิด"
5.4 เงื่อนไขด้านสภาพอากาศ (ให้เลือกอธิบายเฉพาะปัจจัยที่เด่นชัดที่สุดของวันนั้น):
5.4.1 กรณี BLH สูงแต่ฝุ่นยังเกินมาตรฐาน: ให้อธิบายว่าเป็น "ความหน่วงของค่าเฉลี่ยฝุ่น 24 ชม." ที่สะสมมาตั้งแต่ช่วงกลางคืนที่อากาศปิด และหากลมผิวพื้นอ่อน ให้ระบุว่าลมไม่พอที่จะพัดพาฝุ่นออกไป
5.4.2 กรณีความชื้นสูงและลมสงบ: ให้เตือนเรื่องการระวังการก่อตัวของ "ฝุ่นละอองทุติยภูมิ (Secondary PM2.5)"
5.4.3 กรณีมีโอกาสเกิดฝน: ให้ประเมินเชิงบวกว่า "ฝนจะช่วยชะล้างฝุ่นละอองและบรรเทาสถานการณ์ได้"
5.4.4 กรณีตรวจสอบสถานการณ์ในช่วงบ่ายหรือเย็น (หลัง 16.00 น.): หากพบว่าค่าฝุ่นปัจจุบันสูงกว่าค่าฝุ่นรอบ 07.00 น. ให้แจ้งเตือนว่าฝุ่นกำลังอยู่ในภาวะสะสมตัวรุนแรงจนระบายไม่ทัน และเมื่อเข้าสู่ช่วงกลางคืนที่เพดานอากาศปิด จะทำให้เช้าวันพรุ่งนี้สถานการณ์วิกฤตลง ขอแจ้งให้ ทสจ. เตรียมประชาสัมพันธ์กลุ่มเสี่ยงรับมือล่วงหน้า
5.5 ข้อกำหนดทางภาษา: ทุกครั้งที่มีการสั่งการ ให้ใช้คำเริ่มต้นว่า "ขอแจ้งให้ ทสจ." เสมอ
6. บังคับรูปแบบการรายงานสถานการณ์รายจังหวัด (Strict Template):
ห้ามเปลี่ยนแปลงโครงสร้าง สัญลักษณ์ หรือการขึ้นบรรทัดใหม่จากแม่แบบด้านล่างนี้เด็ดขาด ให้แทนที่เฉพาะข้อมูลในวงเล็บด้วยข้อมูลจริงเท่านั้น
* จังหวัด[ชื่อจังหวัด]
ฝุ่น PM2.5 ปัจจุบัน [ค่าฝุ่น] มคก./ลบ.ม. [อีโมจิ] (สถานะ: [โควต้าปี 2569])
สภาพอากาศ: [สภาพอากาศ] | อุณหภูมิ: [อุณหภูมิ] °C | ความเร็วลม: [ความเร็วลม] | โอกาสเกิดฝน: [โอกาสเกิดฝน]
เพดานการระบายอากาศ (BLH): [ค่า BLH]
จุดความร้อน 24 ชม.: [จำนวน] จุด 
7 น้ำเสียง: หนักแน่น เด็ดขาด เชิงรุก ให้เกียรติผู้ร่วมงาน
8. รูปแบบ: ห้ามใช้เครื่องหมายจุลภาค ห้ามใส่จุดท้ายประโยค ยกเว้นคำว่า ทสจ. หัวข้อใหม่ใช้เลขตามด้วยจุด (เช่น 1.)
9. ลงท้ายว่า จึงเรียนมาเพื่อโปรดทราบ\n\n ${DIR_NAME}\n${DIR_POSITION}`;

    var apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' + GEMINI_API_KEY;

   // ... โค้ดเดิมของ ผอ. ...
    var parts = [{ "text": promptText }];
    var imageUrls = [nasaMapUrl, "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_431201.png", "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_403201.png", "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_436201.png", "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_432201.png"];
    
    for (var i = 0; i < imageUrls.length; i++) {
      try {
        var imgResponse = UrlFetchApp.fetch(imageUrls[i], { muteHttpExceptions: true });
        if (imgResponse.getResponseCode() === 200) {
          var blob = imgResponse.getBlob();
          parts.push({ "inlineData": { "mimeType": "image/png", "data": Utilities.base64Encode(blob.getBytes()) } });
        }
      } catch (err) {}
    }
    // ... จบโค้ดเดิมของ ผอ. ...

    // ==========================================
    // เพิ่มการสร้าง payload และ generationConfig ตรงนี้ครับ
    // ==========================================
    var payload = {
      "contents": [
        {
          "parts": parts // นำตัวแปร parts ที่ประกอบร่างเสร็จแล้วมาใส่ตรงนี้
        }
      ],
      "generationConfig": {
        "temperature": 0.1, // ล็อกความแม่นยำสูงสุด ไม่ให้ AI แต่งประโยคเองจนออกนอกกรอบ
        "topK": 1,
        "topP": 0.1
      }
    };

    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    // ส่ง Request ไปยัง Gemini API
    // var response = UrlFetchApp.fetch(apiUrl, options);
    
    var response = UrlFetchApp.fetch(apiUrl, { "method": "post", "contentType": "application/json", "payload": JSON.stringify({ "contents": [{ "parts": parts }] }) });
    var aiText = JSON.parse(response.getContentText()).candidates[0].content.parts[0].text;
    return ContentService.createTextOutput(JSON.stringify({ "result": aiText })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
/*
// ==========================================
// 4. ฟังก์ชันดึงข้อมูลจุดความร้อนจาก NASA (คงเดิม)
// ==========================================
function getNasaHotspots() {
  try {
    var nasaApiKey = '61454931fdc7c145936ad477ae95fd9a';
    var bbox = '101.0,14.0,104.5,16.8'; 
    var nasaUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/' + nasaApiKey + '/VIIRS_SNPP_NRT/' + bbox + '/2';

    var csvResponse = UrlFetchApp.fetch(nasaUrl);
    var csvText = csvResponse.getContentText();

    var geojsonUrl = 'https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json';
    var geojsonResponse = UrlFetchApp.fetch(geojsonUrl);
    var geojson = JSON.parse(geojsonResponse.getContentText());

    var targets = ["นครราชสีมา", "ชัยภูมิ", "บุรีรัมย์", "สุรินทร์"];
    var targetEng = ["Nakhon Ratchasima", "Chaiyaphum", "Buri Ram", "Surin", "Buriram"];

    var boundaries = [];
    for (var i = 0; i < geojson.features.length; i++) {
      var feature = geojson.features[i];
      var propStr = JSON.stringify(feature.properties);
      var match = false;
      for (var k = 0; k < targets.length; k++) {
        if (propStr.indexOf(targets[k]) !== -1 || propStr.indexOf(targetEng[k]) !== -1) {
          match = targets[k]; 
          break;
        }
      }
      if (match) {
        boundaries.push({
          name: match,
          geometry: feature.geometry
        });
      }
    }

    var results = {
      "นครราชสีมา": 0,
      "ชัยภูมิ": 0,
      "บุรีรัมย์": 0,
      "สุรินทร์": 0
    };

    var lines = csvText.trim().split('\n');
    if (lines.length > 1 && lines[0].indexOf('latitude') !== -1) {
      var headers = lines[0].split(',');
      var latIdx = headers.indexOf('latitude');
      var lonIdx = headers.indexOf('longitude');
      var dateIdx = headers.indexOf('acq_date');
      var timeIdx = headers.indexOf('acq_time');

      var now = new Date();
      var cutoffTime = now.getTime() - (24 * 60 * 60 * 1000);

      for (var j = 1; j < lines.length; j++) {
        var values = lines[j].split(',');
        if (values.length < headers.length) continue;

        var lat = parseFloat(values[latIdx]);
        var lon = parseFloat(values[lonIdx]);

        var dateParts = values[dateIdx].split('-');
        var timeStr = ("0000" + values[timeIdx]).slice(-4);
        var hours = parseInt(timeStr.substring(0, 2), 10);
        var mins = parseInt(timeStr.substring(2, 4), 10);
        var acqDateTime = new Date(Date.UTC(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10), hours, mins)).getTime();

        if (acqDateTime >= cutoffTime) {
          var point = [lon, lat];
          for (var b = 0; b < boundaries.length; b++) {
            if (isPointInGeometry(point, boundaries[b].geometry)) {
              results[boundaries[b].name]++;
              break; 
            }
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"error": error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
*/
// ==========================================
// 5. ฟังก์ชันย่อยสำหรับคำนวณพิกัด (คงเดิม)
// ==========================================
function isPointInGeometry(point, geometry) {
  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    for (var i = 0; i < geometry.coordinates.length; i++) {
      if (isPointInPolygon(point, geometry.coordinates[i])) {
        return true;
      }
    }
  }
  return false;
}

function isPointInPolygon(point, polygon) {
  var isInsideOuter = isPointInRing(point, polygon[0]);
  if (!isInsideOuter) return false;
  for (var i = 1; i < polygon.length; i++) {
    if (isPointInRing(point, polygon[i])) {
      return false;
    }
  }
  return true;
}

function isPointInRing(point, ring) {
  var inside = false;
  var x = point[0];
  var y = point[1];
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var xi = ring[i][0];
    var yi = ring[i][1];
    var xj = ring[j][0];
    var yj = ring[j][1];
    var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ฟังก์ชันจัดการเรื่องการอนุญาตเชื่อมต่อข้ามโดเมน
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function testAuth() {
  UrlFetchApp.fetch("https://www.google.com");
}

// ==========================================
// 6. ฟังก์ชันสร้าง Trigger แบบเจาะจงเวลาเป๊ะๆ
// ==========================================

// ฟังก์ชันนี้จะรันเพื่อสร้างคิวงานของแต่ละวันเวลา 07:20 น.
function setupDailyExactTrigger() {
  // ลบ Trigger เดิมของ updateDailyPM25 ทิ้งก่อน เพื่อป้องกันการทำงานซ้ำซ้อน
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'updateDailyPM25') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // กำหนดเวลา 07:20 น. ของวันนี้ (เผื่อเวลาให้ Air4Thai อัปเดตข้อมูลของ 07:00 น.)
  var triggerTime = new Date();
  triggerTime.setHours(7);
  triggerTime.setMinutes(20);
  triggerTime.setSeconds(0);

  // สร้าง Trigger ใหม่ให้รันตามเวลาที่กำหนดเป๊ะๆ
  ScriptApp.newTrigger('updateDailyPM25')
    .timeBased()
    .at(triggerTime)
    .create();
}

// ฟังก์ชันหลักสำหรับรันครั้งแรกเพียงครั้งเดียว เพื่อตั้งให้ระบบตื่นมาเตรียมคิวงานตอนตี 1 ของทุกวัน
function createMidnightTrigger() {
  // ลบ Trigger ตี 1 เดิมออกก่อน (ถ้ามี)
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'setupDailyExactTrigger') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // สร้างคิวงานให้รัน setupDailyExactTrigger ทุกวันช่วงตี 1
  ScriptApp.newTrigger('setupDailyExactTrigger')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();
}
