# PM2.5 Air Quality Dashboard - EPO11

EPO11PM([https://esc.mnre.go.th/f4.php](https://kietpawpan.github.io/hotspot/epo11PM.html)) is a real-time web-based dashboard for monitoring PM2.5 air quality, hotspots, and ventilation rates in the lower Northeastern region of Thailand (Nakhon Ratchasima, Chaiyaphum, Buriram, and Surin). 

This project was developed to provide clear visual data and actionable health advisories for the public and relevant agencies.

## Features
- **Real-time Data:** Fetches the latest PM2.5 and hotspot data via a Google Sheets API.
- **AQI Color Coding:** Automatically categorizes air quality based on the Pollution Control Department (PCD) standards.
- **Health Advisory & Alerts:** Provides health recommendations and automatic warning levels (Orange/Red alerts) based on PM2.5 concentrations.
- **Data Visualization:** Uses Chart.js to display today's PM2.5 levels, cumulative days exceeding the standard (comparing current and previous years), and hotspot accumulation.
- **Ventilation Rate (VR):** Integrates daily ventilation rate charts from the Thai Meteorological Department (TMD) for all four provinces.
- **Responsive Design:** Fully optimized for both desktop and mobile viewing using Tailwind CSS.

## Technologies Used
- HTML5
- Tailwind CSS (via CDN)
- Chart.js & ChartDataLabels plugin (via CDN)
- Vanilla JavaScript (Fetch API)
- Google Apps Script (Data source backend)

## Getting Started
1. Clone this repository to your local machine.
2. Open the `epo11PM.html` file in any modern web browser.
3. The dashboard will automatically fetch and display the latest environmental data.

## Credits & Author
&copy; EPO11 (M. Kietpawpan, Director)
Environmental and Pollution Control Office 11 (Nakhon Ratchasima), Pollution Control Department, Thailand.
