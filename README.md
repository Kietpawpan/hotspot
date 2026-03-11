# PM2.5 Air Quality & Weather Dashboard - EPO11
A real-time web-based dashboard for monitoring PM2.5 air quality hotspots and weather conditions in the lower Northeastern region of Thailand (Nakhon Ratchasima, Chaiyaphum, Buriram, and Surin)

This project, EPO11-PM ([https://esc.mnre.go.th/f4.php](https://kietpawpan.github.io/hotspot/epo11PM.html)), was developed to provide clear visual data actionable health advisories and meteorological context for the public and relevant agencies

## Features
* **Real-time PM2.5 & Hotspots:** Fetches the latest PM2.5 and hotspot data via a Google Sheets API
* **AQI Color Coding:** Automatically categorizes air quality based on the Pollution Control Department (PCD) standards
* **Health Advisory & Alerts:** Provides health recommendations and automatic warning levels (Orange/Red alerts) based on PM2.5 concentrations
* **Data Visualization:** Uses Chart.js to display today's PM2.5 levels cumulative days exceeding the standard and hotspot accumulation
* **Ventilation Rate (VR):** Integrates daily ventilation rate charts from the Thai Meteorological Department (TMD) for all four provinces
* **Real-time Weather Data:** Displays temperature relative humidity wind speed and dynamic wind direction arrows using the TMD API

## TMD Weather API Integration Process
We successfully integrated meteorological data from the Thai Meteorological Department (TMD) to analyze factors affecting PM2.5 accumulation using the following approach:

1. **API Endpoint Selection & Authentication:** Utilized the TMD Hourly Location Forecast API targeting the exact coordinates of the four target provinces authenticated via an OAuth Access Token
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
