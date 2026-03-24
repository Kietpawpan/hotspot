# หน้าจอที่ส่งมาคือข้อผิดพลาดรหัส 503 Service Unavailable
<img src="img/AIBusy.png"></img>

ข้อความ "This model is currently experiencing high demand" หมายความว่า เซิร์ฟเวอร์ของ Gemini API กำลังมีผู้ใช้งานหนาแน่นมากในขณะนี้ ทำให้ระบบฝั่งเซิร์ฟเวอร์ประมวลผลไม่ทันและไม่สามารถรับคำสั่งเพิ่มได้ชั่วคราว ปัญหานี้ไม่ได้เกิดจากโค้ดผิดพลาดแต่อย่างใด

## วิธีแก้ไขเบื้องต้น
ปัญหานี้มักเป็นปัญหาชั่วคราวที่เกิดขึ้นในช่วงสั้น ๆ ให้เว้นระยะรอสัก 1-2 นาที แล้วลองกดปุ่ม "ประมวลผลข้อมูลด้วย Gemini API" ใหม่อีกครั้ง

## แนวทางปรับปรุงระบบให้เสถียรขึ้นในระยะยาว
เพื่อให้ระบบทำงานได้ไหลลื่นและไม่แสดงข้อความ Error ดิบๆ ยาว ๆ แบบนี้บนหน้าจอ จึงเข้าไปปรับแก้โค้ดฝั่งหลังบ้าน (Google Apps Script) 2 ส่วน

1. เพิ่มพารามิเตอร์ muteHttpExceptions: true ในคำสั่ง UrlFetchApp.fetch() เพื่อดักจับ Error กลับมาแปลงเป็นข้อความภาษาไทยแจ้งเตือนผู้ใช้งานแบบสุภาพ เช่น "ขณะนี้เซิร์ฟเวอร์ AI มีผู้ใช้งานหนาแน่น โปรดลองใหม่อีกครั้งในภายหลัง"
2. สร้างระบบสู้ไม่ถอย (Auto-Retry) ในฝั่ง Apps Script ให้พยายามเรียก Gemini API ซ้ำอัตโนมัติสัก 2-3 รอบหากเจอ Error 503

```

    // ==========================================
    // ส่ง Request ไปยัง Gemini API ผ่านระบบ Auto-Retry
    // ==========================================
    var geminiResult = callGeminiWithRetry(apiUrl, payload);

    if (geminiResult.success) {
      return ContentService.createTextOutput(JSON.stringify({ "result": geminiResult.text })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ "error": geminiResult.error })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// ฟังก์ชันสำหรับเรียกใช้ Gemini API พร้อมระบบดักจับ Error และ Auto-Retry
// ==========================================
function callGeminiWithRetry(apiUrl, payloadData) {
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payloadData),
    "muteHttpExceptions": true 
  };

  var maxRetries = 3;
  var delayMs = 2000; 

  for (var i = 0; i < maxRetries; i++) {
    try {
      var response = UrlFetchApp.fetch(apiUrl, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();

      if (responseCode === 200) {
        var jsonResponse = JSON.parse(responseText);
        if (jsonResponse.candidates && jsonResponse.candidates[0] && jsonResponse.candidates[0].content) {
          return { success: true, text: jsonResponse.candidates[0].content.parts[0].text };
        } else {
          return { success: false, error: "ไม่พบข้อความตอบกลับจากระบบ AI" };
        }
      } else if (responseCode === 503 || responseCode === 429) {
        console.warn("Gemini Error " + responseCode + " ครั้งที่ " + (i + 1) + ": " + responseText);
        if (i < maxRetries - 1) {
          Utilities.sleep(delayMs);
          delayMs *= 2; 
        }
      } else {
        console.error("API Error " + responseCode + ": " + responseText);
        return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อระบบประมวลผล (รหัส " + responseCode + ")" };
      }
    } catch (e) {
      console.error("Fetch Exception ครั้งที่ " + (i + 1) + ": " + e.message);
      if (i < maxRetries - 1) {
        Utilities.sleep(delayMs);
      }
    }
  }

  return { success: false, error: "ขณะนี้เซิร์ฟเวอร์ AI มีผู้ใช้งานหนาแน่น โปรดรอสักครู่แล้วลองกดประมวลผลใหม่อีกครั้ง" };
}

```
