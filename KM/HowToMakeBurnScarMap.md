1. Go to https://disaster.gistda.or.th/services/download?type=fire
2. Login with Google
3. You will go to https://disaster.gistda.or.th/services/download
4. Click the Fire menu
5. Go to ข้อมูลรายสัปดาห์ ข้อมูลสรุป เอกสารที่เกี่ยวข้อง / แผนที่ไฟไหม้
6. Set type to Shapefile / รายเดือน / มกราคม 2569
7. Download the shapefile.
8. Unzip to get: .shp .dbf .shx และ .prj
9. Go to https://mapshaper.org
10. Select the four files: .shp .dbf .shx, and .prj
11. Click Console
12. Cut the provincial data by typing and Enter:
   
    ```
    -filter "/Nakhon Ratchasima|Chaiyaphum|Buri Ram|Buriram|Surin/i.test(PV_EN)"
    ```
