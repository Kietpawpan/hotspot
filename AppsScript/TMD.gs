   
  function doGet(e) {
  try {
    var lat = e.parameter.lat;
    var lon = e.parameter.lon;
    
    if (!lat || !lon) {
       return ContentService.createTextOutput(JSON.stringify({"error": "Missing lat/lon"})).setMimeType(ContentService.MimeType.JSON);
    }

    // นำ Token ของท่านมาใส่ที่นี่
 var tmdToken = "YOUR TMD TOKEN";
    
    // สิ่งที่เพิ่มขึ้นมาคือ &fields=tc,rh,cond,ws10m,wd10m เพื่อบังคับดึงข้อมูลลม
    var url = "https://data.tmd.go.th/nwpapi/v1/forecast/location/hourly/at?lat=" + lat + "&lon=" + lon + "&fields=tc,rh,cond,ws10m,wd10m";
    
    var options = {
      "method": "get",
      "headers": {
        "Authorization": "Bearer " + tmdToken,
        "Accept": "application/json"
      },
      "muteHttpExceptions": true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var json = response.getContentText();
    
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"error": error.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
