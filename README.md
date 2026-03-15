# ระบบรายงานสถานการณ์ฝุ่นละออง PM2.5 และจุดความร้อนอัจฉริยะ (สคพ.11)

ต้นแบบระบบเฝ้าระวังและบริหารจัดการสถานการณ์ฝุ่นละอองขนาดเล็ก (PM2.5) และจุดความร้อน (Hotspot) พัฒนาโดยสำนักงานสิ่งแวดล้อมและควบคุมมลพิษที่ 11 (นครราชสีมา) เพื่อสนับสนุนการตัดสินใจของผู้บริหารในการสั่งการและแจ้งเตือนภัยแบบเบ็ดเสร็จในหน้าจอเดียว (Single Command Dashboard)

## 📌 คุณสมบัติเด่น (Features)

1. **แดชบอร์ดสรุปสถานการณ์ฝุ่น PM2.5 และสภาพอากาศ**
   * ติดตามค่าฝุ่นรายวันและข้อมูลย้อนหลัง 4 วัน ในพื้นที่รับผิดชอบ (นครราชสีมา ชัยภูมิ บุรีรัมย์ สุรินทร์)
   * คำนวณและแจ้งเตือนโควตาวันที่ค่าฝุ่นเกินมาตรฐานแบบ Real-time เพื่อประเมินเป้าหมายการลดฝุ่น 5%
   * แสดงข้อมูลอัตราการระบายอากาศ (Ventilation Rate) และพยากรณ์อากาศจากกรมอุตุนิยมวิทยา

2. **ระบบผู้ช่วย AI ร่างข้อความสั่งการ (AI Assistant)**
   * เชื่อมต่อกับ Gemini API เพื่อประมวลผลข้อมูลสภาพอากาศ ค่าฝุ่น และจุดความร้อน
   * ร่างข้อความสรุปสถานการณ์และข้อเสนอแนะทางวิชาการสำหรับส่งเข้ากลุ่ม LINE ศูนย์บัญชาการ
   * ปรับโทนเสียงและระดับความเร่งด่วนของข้อความอัตโนมัติตามเกณฑ์คุณภาพอากาศ (เช่น ใช้คำสั่งเด็ดขาดเมื่อค่าฝุ่นอยู่ในระดับสีส้มหรือสีแดง)

3. **แผนที่ระบบเฝ้าระวังจุดความร้อนเชิงลึก (Hotspot Interactive Map)**
   * ดึงข้อมูลพิกัดจุดความร้อนจากดาวเทียม Suomi-NPP (NASA FIRMS)
   * ใช้ Longdo API ทำ Reverse Geocoding เพื่อแปลงพิกัดเป็นชื่อตำบลและอำเภอโดยอัตโนมัติ
   * กรองช่วงเวลาการแสดงผลได้ (รอบ 24 ชั่วโมง หรือรอบเช้า/บ่าย 12 ชั่วโมง)
   * รองรับการดาวน์โหลดข้อมูลเป็นไฟล์ Excel พร้อมลิงก์นำทาง Google Maps สำหรับมอบหมายชุดปฏิบัติการลงพื้นที่ระงับเหตุ

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

* **Frontend:** HTML5 CSS3 (Tailwind CSS) Vanilla JavaScript
* **Data Visualization:** Chart.js
* **Mapping:** Leaflet.js MarkerCluster Turf.js
* **APIs & Backend Integration:** * Google Apps Script (ทำหน้าที่เป็น Proxy สำหรับดึงข้อมูลและจัดการ CORS)
  * Gemini API (ประมวลผลข้อความ)
  * Longdo Map API (แปลงพิกัดเป็นที่อยู่)
  * TMD API (ข้อมูลสภาพอากาศ)
  * NASQ API (ข้อมูลจุดความร้อนล่าสุด 24 ชม.)
  * GISTDA API (ข้อมูลจุดความร้อนย้อนหลัง 30 วัน)

## 🚀 การติดตั้งและนำไปใช้งาน (Getting Started)

1. ดาวน์โหลดหรือโคลน (Clone) Repository นี้ไปยังเครื่องของคุณ
2. เปิดไฟล์ `index.html` (แดชบอร์ด) และ `map.html` (แผนที่) ด้วย Web Browser เพื่อดูผลลัพธ์
3. **การตั้งค่า API (Configuration):**
   * **Gemini & NASA Data:** เปลี่ยน URL ของ `gasWebappUrl` ในโค้ดให้เป็น URL จาก Google Apps Script ของหน่วยงานคุณ
   * **Longdo Map API:** สมัครและเปลี่ยน `longdoApiKey` ในไฟล์แผนที่ให้เป็น Key ของคุณเองเพื่อใช้งานระบบแปลงพิกัด

## 👤 ผู้พัฒนา

**มนตรี เกียรติเผ่าพันธ์**
ผู้อำนวยการสำนักงานสิ่งแวดล้อมและควบคุมมลพิษที่ 11 (นครราชสีมา) กรมควบคุมมลพิษ

## 📄 ลิขสิทธิ์ (License)
โครงการนี้จัดทำขึ้นเพื่อเป็นวิทยาทานและต้นแบบสำหรับการบริหารจัดการสิ่งแวดล้อม สามารถนำไปพัฒนาต่อยอดได้ตามความเหมาะสม

# PM2.5 Air Quality & Weather Dashboard - EPO11
A real-time web-based dashboard for monitoring PM2.5 air quality hotspots and weather conditions in the lower Northeastern region of Thailand (Nakhon Ratchasima, Chaiyaphum, Buriram, and Surin)

This project, EPO11-PM ([https://esc.mnre.go.th/f4.php](https://kietpawpan.github.io/hotspot/epo11PM.html)), was developed to provide clear visual data actionable health advisories and meteorological context for the public and relevant agencies.

## Features
* **Real-time PM2.5 & Hotspots:** Fetches the latest PM2.5 and hotspot data via a Google Sheets API
* **AQI Color Coding:** Automatically categorizes air quality based on the Pollution Control Department (PCD) standards
* **Health Advisory & Alerts:** Provides health recommendations and automatic warning levels (Orange/Red alerts) based on PM2.5 concentrations
* **Data Visualization:** Uses Chart.js to display today's PM2.5 levels cumulative days exceeding the standard and hotspot accumulation
* **Ventilation Rate (VR):** Integrates daily ventilation rate charts from the Thai Meteorological Department (TMD) for all four provinces
* **Real-time Weather Data:** Displays temperature relative humidity wind speed and dynamic wind direction arrows using the TMD API

## TMD Weather API Integration Process
We successfully integrated meteorological data from the Thai Meteorological Department (TMD) to analyze factors affecting PM2.5 accumulation using the following approach:

1. **API Endpoint Selection & Authentication:** Utilized the TMD Hourly Location Forecast API targeting the exact coordinates of the four target provinces authenticated via an OAuth Access Token. See https://data.tmd.go.th/nwpapi/doc/apidoc/forecast_location.html
2. **Overcoming CORS via Google Apps Script (Proxy):** To bypass Cross-Origin Resource Sharing (CORS) restrictions and secure the API Token a Google Apps Script was deployed as a middleware proxy to fetch data securely from the TMD servers
3. **Query Parameters Configuration:** Customized the API request by appending specific fields (`&fields=tc rh cond ws10m wd10m`) to ensure the payload includes temperature humidity weather conditions wind speed and wind direction
4. **Data Transformation:** Developed JavaScript functions to convert raw data into user-friendly formats (e.g. converting wind speed from m/s to km/h translating wind degrees to Thai compass directions and parsing ISO time strings into readable Thai formats)
5. **UI/UX Design & Dynamic Wind Direction:** Designed responsive weather cards using Tailwind CSS and implemented dynamic SVG arrows that rotate automatically (adding 180 degrees to the wind origin) to visually indicate where the wind is blowing aiding in the analysis of transboundary haze

## Technologies Used
* HTML5
* Tailwind CSS (via CDN)
* Chart.js & ChartDataLabels plugin (via CDN)
* Vanilla JavaScript (Fetch API)
* Google Apps Script (Data source backend & CORS Proxy)

## Getting Started
1. Clone this repository to your local machine
2. Open the `index.html` file in any modern web browser
3. The dashboard will automatically fetch and display the latest environmental and weather data

## Credits & Author
&copy; EPO11 (M. Kietpawpan, Director)
Environmental and Pollution Control Office 11 (Nakhon Ratchasima), Pollution Control Department, Thailand.

For more information, see this [paper](https://kietpawpan.github.io/hotspot/paper.html) (in Thai).

* Longdo Map API: https://map.longdo.com/console/
* NASA API
* TMD API
* GISTDA API
* Google App Script
