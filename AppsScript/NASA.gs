const NASA_API_KEY = 'YOUR API KEY';
const BBOX = '101.0,14.0,104.5,16.5';
const DAYS = '2';
const SOURCE = 'VIIRS_SNPP_NRT';

function doGet(e) {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_API_KEY}/${SOURCE}/${BBOX}/${DAYS}`;
  
  try {
    // ดึงข้อมูลจาก NASA FIRMS
    const response = UrlFetchApp.fetch(url);
    const csvText = response.getContentText();
    
    // ส่งค่ากลับเป็น Text (CSV) เพื่อให้ฝั่งหน้าเว็บประมวลผลต่อได้ทันทีเหมือนเดิม
    return ContentService.createTextOutput(csvText).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}
