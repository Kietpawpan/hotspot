// ฟังก์ชันหลักสำหรับรับคำสั่ง GET
function doGet(e) {
  // หากมีพารามิเตอร์ action=hotspots ให้ไปดึงข้อมูล NASA
  if (e && e.parameter && e.parameter.action === 'hotspots') {
    return getNasaHotspots();
  }

  // หากไม่มีพารามิเตอร์ ให้ทำงานตามฟังก์ชันเดิมคือดึงข้อมูลฝุ่น PM2.5
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ข้อมูลรายวัน");
  var data = sheet.getDataRange().getValues();
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ฟังก์ชันใหม่สำหรับเป็นตัวกลางรับข้อมูลข้อความและรูปภาพไปให้ Gemini AI วิเคราะห์
function doPost(e) {
  var requestData = JSON.parse(e.postData.contents);
  var promptText = requestData.prompt;
  
  // นำ API Key ของท่านมาใส่ตรงนี้
  var GEMINI_API_KEY = 'YOUR GEMINI API KEY'; 
  
  // ปรับใช้รุ่น Gemini ตามที่ระบบของท่านรองรับ
  var apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' + GEMINI_API_KEY;
  
  // เตรียมโครงสร้างข้อความเริ่มต้น
  var parts = [{ "text": promptText }];
  
  // URLs กราฟอัตราการระบายอากาศของ 4 จังหวัด (นครราชสีมา ชัยภูมิ บุรีรัมย์ สุรินทร์)
  var imageUrls = [
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_431201.png",
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_403201.png",
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_436201.png",
    "https://ozone.tmd.go.th/PM2.5/weather/Metgram/output/VR_daily/daily_VR_432201.png"
  ];
  
  // วนลูปดาวน์โหลดภาพกราฟและแปลงเป็น Base64
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
    } catch (err) {
      // หากดึงภาพไหนไม่ได้ให้ข้ามไปทำงานส่วนอื่นต่อ
    }
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

// ฟังก์ชันดึงข้อมูลจุดความร้อนจาก NASA
function getNasaHotspots() {
  try {
    var nasaApiKey = 'YOUR NASA API KEY';
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

// ฟังก์ชันย่อยสำหรับคำนวณพิกัด (Ray-Casting Algorithm)
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
