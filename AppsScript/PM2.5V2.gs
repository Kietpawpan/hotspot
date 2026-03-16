const SHEET_NAME = "ข้อมูลรายวัน"; // ใช้ชื่อ Sheet เดิมของท่าน
const AIR4THAI_URL = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php";

// รหัสสถานีตรวจวัดคุณภาพอากาศในพื้นที่ สคพ.11
const STATIONS = {
  "43t": "นครราชสีมา",
  "114t": "ชัยภูมิ",
  "115t": "บุรีรัมย์",
  "116t": "สุรินทร์"
};

// ==========================================
// 1. ฟังก์ชันอัตโนมัติ: ดึงข้อมูล Air4Thai ลง Sheet ทุกวัน (ต้องตั้ง Trigger)
// ==========================================
function updateDailyPM25() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  // ดึงข้อมูลเดิมจาก Sheet (ดึงแถวที่ 2 ถึง 5 ตั้งแต่คอลัมน์ A ถึง G)
  const dataRange = sheet.getRange(2, 1, 4, 7);
  const oldData = dataRange.getValues();

  // ดึงข้อมูลล่าสุดจาก Air4Thai
  const response = UrlFetchApp.fetch(AIR4THAI_URL);
  const jsonData = JSON.parse(response.getContentText());

  // สกัดเอาเฉพาะค่า PM2.5 ของ 4 จังหวัด
  let newPMData = {};
  jsonData.stations.forEach(station => {
    if (STATIONS[station.stationID]) {
      newPMData[STATIONS[station.stationID]] = station.AQILast.PM25.value;
    }
  });

  // ทำการเลื่อนข้อมูลเก่าไปเป็นข้อมูลย้อนหลังและอัปเดตค่าของวันนี้
  for (let i = 0; i < oldData.length; i++) {
    let province = oldData[i][0];
    let pmTodayOld = oldData[i][1];

    // เลื่อนข้อมูลประวัติ (จากขวาไปซ้ายเพื่อไม่ให้ทับซ้อนกัน)
    oldData[i][6] = oldData[i][5]; // เอา ย้อน 3 ไปใส่ ย้อน 4
    oldData[i][5] = oldData[i][4]; // เอา ย้อน 2 ไปใส่ ย้อน 3
    oldData[i][4] = oldData[i][3]; // เอา ย้อน 1 ไปใส่ ย้อน 2
    oldData[i][3] = pmTodayOld;    // เอาค่าของ วันนี้ ไปใส่ ย้อน 1

    // นำค่าใหม่ที่ดึงจาก API มาอัปเดตในช่อง PM2.5 วันนี้
    if (newPMData[province] !== undefined) {
      oldData[i][1] = newPMData[province];
    } else {
      oldData[i][1] = "-";
    }
  }

  // นำข้อมูลที่จัดเรียงเสร็จแล้วบันทึกกลับลงไปใน Sheet
  dataRange.setValues(oldData);
}

// ==========================================
// 2. ฟังก์ชันหลักสำหรับรับคำสั่ง GET (ดึง Sheet หรือ ดึง NASA)
// ==========================================
function doGet(e) {
  // หากมีพารามิเตอร์ action=hotspots ให้ไปดึงข้อมูล NASA
  if (e && e.parameter && e.parameter.action === 'hotspots') {
    return getNasaHotspots();
  }

  // หากไม่มีพารามิเตอร์ ให้ดึงข้อมูลฝุ่นจาก Sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 3. ฟังก์ชันสำหรับส่งข้อมูลให้ Gemini AI วิเคราะห์ (POST)
// ==========================================
function doPost(e) {
  var requestData = JSON.parse(e.postData.contents);
  var promptText = requestData.prompt;
  
  // API Key ของท่าน
  var GEMINI_API_KEY = 'YOUR KEY'; 
  var apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' + GEMINI_API_KEY;
  
  var parts = [{ "text": promptText }];
  
  // URLs กราฟอัตราการระบายอากาศ
  var imageUrls = [
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_431201.png",
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_403201.png",
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_436201.png",
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_432201.png"
  ];
  
  for (var i = 0; i < imageUrls.length; i++) {
    try {
      var imgResponse = UrlFetchApp.fetch(imageUrls[i], { muteHttpExceptions: true });
      if (imgResponse.getResponseCode() === 200) {
        var blob = imgResponse.getBlob();
        var base64Data = Utilities.base64Encode(blob.getBytes());
        parts.push({
          "inlineData": {
            "mimeType": "image/png",
            "data": base64Data
          }
        });
      }
    } catch (err) {}
  }
  
  var payload = {
    "contents": [{ "parts": parts }]
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  
  try {
    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseData = JSON.parse(response.getContentText());
    var aiText = responseData.candidates[0].content.parts[0].text;
    
    return ContentService.createTextOutput(JSON.stringify({ "result": aiText }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 4. ฟังก์ชันดึงข้อมูลจุดความร้อนจาก NASA (คงเดิม)
// ==========================================
function getNasaHotspots() {
  try {
    var nasaApiKey = 'YOUR NASA KEY';
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
// 6. ฟังก์ชันสร้าง Trigger ให้ทำงานเวลา 07.15 น. ทุกวัน
// ==========================================
function createExactTrigger() {
  // ลบ Trigger เดิมที่ผูกกับ updateDailyPM25 ออกก่อน
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'updateDailyPM25') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // สร้าง Trigger ใหม่ให้ทำงานทุกวันเวลา 07:15 น.
  ScriptApp.newTrigger('updateDailyPM25')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(15) // สั่งให้รันใกล้เคียงนาทีที่ 15
    .create();
}
