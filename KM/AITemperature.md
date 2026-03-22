# AI Temperature
โมเดล AI ในตระกูล Flash Lite การทำงานจะมีความเสถียรและแม่นยำอยู่ในเกณฑ์ที่ เชื่อถือได้ระดับสูง แต่ไม่ถึงขั้น 100% แบบการเขียนโค้ดโปรแกรมปกติ

## ปัจจัยที่มีผลต่อความเสถียร

### AI ทำงานบนความน่าจะเป็น (Probabilistic) 
- โมเดลภาษาไม่ได้ถูกออกแบบมาให้ตอบเหมือนเดิมเป๊ะทุกตัวอักษรเหมือนระบบฐานข้อมูล แม้เราจะป้อนกฎเดิมและตัวเลขชุดเดิม โครงสร้างประโยคหรือการเลือกใช้คำอาจจะมีการสลับสับเปลี่ยนกันบ้างเล็กน้อยในแต่ละวัน แต่ "ใจความสำคัญและข้อสั่งการ" จะยังคงอยู่ครบถ้วนตามกฎเหล็ก
- ความแม่นยำในการทำตามกฎ (Rule Adherence) ถ้าจัดระเบียบ Prompt ใหม่ให้เป็นแบบแบ่งข้อย่อย (Decision Tree) ความแม่นยำในการดึงเงื่อนไขมาใช้จะพุ่งสูงถึง 90-95% ทันที แต่อาจมีโอกาสเล็กน้อยที่ AI จะเกิดอาการ "หลอน" (Hallucination) หรือดึงข้อมูลมาอธิบายผิดจุด หากวันนั้นมีตัวเลขสภาพอากาศที่ซับซ้อนมากและไปกระตุ้นเงื่อนไขหลายข้อพร้อมกันจน AI จัดลำดับความสำคัญไม่ถูก
- จุดอ่อนของรุ่น Flash Lite โมเดลรุ่นนี้ถูกสร้างมาเพื่อเน้น "ความเร็ว" เป็นหลัก หากกฎเหล็กของเราในอนาคตมีความยาวหรือซับซ้อนเกิน 10-15 ข้อ AI อาจจะเริ่มมีอาการ "ลืม" กฎข้อแรกๆ หรือทำตามคำสั่งได้ไม่ครบทุกมิติ

## วิธีล็อกความเสถียรให้ AI ทำงานเป๊ะที่สุด
ในฝั่งการเขียนโค้ดเชื่อมต่อ API (Apps Script) จะมีพารามิเตอร์ลับตัวหนึ่งที่เรียกว่า ค่าอุณหภูมิ (Temperature) ซึ่งเป็นตัวควบคุมความสร้างสรรค์ของ AI
- หากตั้งค่าสูง (เช่น 0.8 หรือ 1.0) AI จะพยายามเป็นนักเขียน ใช้คำสละสลวยและเปลี่ยนรูปแบบประโยคไปเรื่อยๆ ซึ่งอาจทำให้หลุดกรอบวิชาการได้
- หากตั้งค่าต่ำ (เช่น 0.1 หรือ 0.2) AI จะลดความสร้างสรรค์ลง หันมาตอบแบบตรงไปตรงมา ใช้แพตเทิร์นภาษาเดิมๆ และยึดติดกับกฎเหล็กที่เราสั่งไว้อย่างเคร่งครัดที่สุด
- สำหรับระบบ PODI ที่ต้องใช้สั่งการอย่างเป็นทางการ แนะนำอย่างยิ่งให้ล็อกค่า Temperature ให้อยู่ในระดับต่ำสุด เพื่อบังคับให้ AI ผู้ช่วยมีความนิ่งและเสถียรสูงสุด

## ตัวอย่าง
```
// ... โค้ดเดิม ...
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
    // ... จบโค้ดเดิม ...

    // ==========================================
    // เพิ่มการสร้าง payload และ generationConfig ตรงนี้
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
```
