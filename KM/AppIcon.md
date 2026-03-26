# ให้รูปไอคอนเด้งขึ้นมาแบบ "ทันที" โดยไม่ต้องรอโหลด 

เราใช้เทคนิคการฝังรูปภาพลงไปในโค้ด (Base64 Encoding)
- ทำให้รูปภาพถูกโหลดเตรียมไว้พร้อมกับตอนที่เปิดหน้าเว็บ เมื่อกด Add to Home Screen ระบบ iOS จะดึงรูปไปใช้ได้ทันทีโดยไม่ต้องวิ่งไปดึงรูปจากเว็บ GitHub อีกรอบ
- มี 2 แนวทางให้เลือกใช้ตามความเหมาะสม

## 1. วิธีฝังรูปภาพลงในโค้ด (เร็วที่สุดและชัวร์ที่สุด)
แปลงรูปภาพเป็นตัวอักษรแล้วใส่ลงไปตรงๆ ได้เลย
1.1 นำไฟล์รูป EPO11App.png ไปแปลงเป็นโค้ด Base64 (สามารถค้นหาเว็บแปลงฟรีด้วยคำว่า image to base64) เช่น ที่ https://www.base64-image.de/
1.2 นำโค้ดที่ได้มาใส่ใน href แทนลิงก์เดิม
```
HTML
<link rel="apple-touch-icon" sizes="180x180" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...[ใส่โค้ดยาวๆ ที่แปลงได้แบบเต็มๆ ที่นี่]...">
```
2. วิธี Preload รูปภาพล่วงหน้า (โค้ดสะอาดกว่า)
ถ้าไม่อยากให้หน้า HTML มีโค้ดตัวอักษรยาวเกินไป ผอ. สามารถเพิ่มคำสั่งแอบโหลดรูปรอไว้ทันทีที่เปิดเว็บได้ พอจะกด Add ระบบก็จะมีรูปพร้อมใช้งานอยู่ในแคชของเครื่องแล้ว
```
HTML
<link rel="preload" as="image" href="https://raw.githubusercontent.com/Kietpawpan/hotspot/main/img/EPO11App.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://raw.githubusercontent.com/Kietpawpan/hotspot/main/img/EPO11App.png">
```
ถ้าเน้นความชัวร์แบบ 100% ว่ากดปุ๊บมาปั๊บ ใช้วิธีที่ 1

