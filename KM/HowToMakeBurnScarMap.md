1. Go to https://disaster.gistda.or.th/services/download?type=fire
2. Login with Google
3. You will go to https://disaster.gistda.or.th/services/download
4. Click the Fire menu
5. Go to ข้อมูลรายสัปดาห์ ข้อมูลสรุป เอกสารที่เกี่ยวข้อง / แผนที่ไฟไหม้
6. Set type to Shapefile / รายเดือน / มกราคม 2569
7. Download the shapefile.
8. Unzip to get: .shp .dbf .shx และ .prj
9. Go to https://mapshaper.org
10. Option: encoding=windows-874
11. Select the four files: .shp .dbf .shx, and .prj
12. Click Console
13. Cut the provincial data by typing and Enter:
   
    ```
    -filter "/Nakhon Ratchasima|Chaiyaphum|Buri Ram|Buriram|Surin/i.test(PV_EN)"
    ```
14. Make it smaller in size:
    ```
    -simplify dp 20%
    ```
15. You can reduce more:
```
-simplify dp 10%
```
16. Ensure lat long
    ```
    -proj wgs84
    ```
18. Save as geojson
```
-o burn_scar_reo11_small.geojson
```
17. Upload to Github
