// ==========================================
// Fire Radar: PM2.5 จากสถานีตรวจวัดคุณภาพอากาศ กรมควบคุมมลพิษ (Air4Thai) ทั่วประเทศ
// ใช้คู่กับ MAPS11 Backend (ไฟล์ที่มี doGet / loadBoundaries / findProvince / jsonOut)
//
// วิธีติดตั้ง
// 1) ในโปรเจกต์ Apps Script เดียวกับ MAPS11 Backend: กด + > Script แล้ววางโค้ดไฟล์นี้ทั้งหมด
// 2) ใน doGet() เพิ่มบรรทัดนี้ไว้ใต้ if (action === 'hotspots') ...
//        if (action === 'pm25') return getPm25Stations();
// 3) Deploy > Manage deployments > ✏️ แก้ไข > Version: New version > Deploy
//    (ต้องสร้าง New version ทุกครั้ง ลิงก์ /exec เดิมจึงจะใช้โค้ดใหม่)
// 4) ทดสอบเปิด <ลิงก์ /exec>?action=pm25 ต้องได้ JSON ที่มี "stations": [...]
// ==========================================

var AIR4THAI_ALL_URL   = 'http://air4thai.pcd.go.th/services/getNewAQI_JSON.php'; // ไม่ระบุ region = ทุกสถานีทั่วประเทศ
var PM25_CACHE_KEY     = 'fireradar_pm25_v1';
var PM25_CACHE_SECONDS = 600; // เก็บผลไว้ 10 นาที (Air4Thai อัปเดตรายชั่วโมง) ลดการยิงซ้ำเมื่อมีผู้ใช้หลายคน

function getPm25Stations() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(PM25_CACHE_KEY);
  if (cached) {
    return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
  }

  var res;
  try {
    res = UrlFetchApp.fetch(AIR4THAI_ALL_URL, { muteHttpExceptions: true });
  } catch (err) {
    return jsonOut({ error: 'เชื่อมต่อ Air4Thai ไม่ได้: ' + err });
  }
  if (res.getResponseCode() !== 200) {
    return jsonOut({ error: 'Air4Thai ตอบกลับ HTTP ' + res.getResponseCode() });
  }

  var raw;
  try {
    raw = JSON.parse(res.getContentText());
  } catch (err) {
    return jsonOut({ error: 'รูปแบบข้อมูล Air4Thai ไม่ถูกต้อง' });
  }

  // ระบุจังหวัดด้วยขอบเขตชุดเดียวกับจุดความร้อน (ถ้าโหลดไม่ได้ หน้าเว็บจะระบุจากที่อยู่สถานีแทน)
  var boundaries = [];
  try {
    boundaries = loadBoundaries();
  } catch (err) {
    console.error('โหลดขอบเขตจังหวัดไม่สำเร็จ: ' + err);
  }

  var stations = [];
  (raw.stations || []).forEach(function (s) {
    var last = s.AQILast || {};
    var lat = parseFloat(s.lat);
    var lon = parseFloat(s['long'] !== undefined ? s['long'] : s.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    var pm = parseFloat(last.PM25 ? last.PM25.value : NaN);
    var aqi = parseFloat(last.AQI ? last.AQI.aqi : NaN);

    stations.push({
      id: s.stationID,
      name: s.nameTH,
      area: s.areaTH,
      type: s.stationType,
      lat: lat,
      lon: lon,
      prov: boundaries.length ? findProvince(lon, lat, boundaries) : '',
      pm25: (isNaN(pm) || pm < 0) ? null : pm,   // Air4Thai ใช้ -1 / -999 แทนค่าที่ไม่มีข้อมูล
      aqi: (isNaN(aqi) || aqi < 0) ? null : aqi,
      date: last.date || '',
      time: last.time || ''
    });
  });

  if (stations.length === 0) {
    return jsonOut({ error: 'ไม่พบข้อมูลสถานีจาก Air4Thai' });
  }

  var out = JSON.stringify({
    source: 'Air4Thai (กรมควบคุมมลพิษ)',
    updated: new Date().toISOString(),
    stations: stations
  });

  try {
    cache.put(PM25_CACHE_KEY, out, PM25_CACHE_SECONDS); // จำกัด 100KB ต่อค่า ถ้าเกินก็แค่ไม่เก็บแคช
  } catch (err) {
    console.warn('เก็บแคช PM2.5 ไม่ได้: ' + err);
  }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}
