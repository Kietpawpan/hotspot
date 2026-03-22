        // ✨ พระเอกของเราอยู่ตรงนี้ครับ! สั่ง Register ให้ปลั๊กอินทำงาน
        Chart.register(ChartDataLabels);
        
        let globalDashboardData = []; // ตัวแปรสำหรับเก็บข้อมูลฝุ่นไปให้ AI ประมวลผล
        let globalWeatherData = {}; // ตัวแปรสำหรับเก็บข้อมูลสภาพอากาศไปให้ AI ประมวลผล
        let globalNasaHotspots = {}; // ตัวแปรเก็บจุดความร้อนจาก NASA ให้ AI ใช้

        function getAqiClass(value) {
            if (isNaN(value)) return 'bg-gray-300 text-gray-700';
            if (value <= 15) return 'aqi-excellent';
            if (value <= 25) return 'aqi-good';
            if (value <= 37.5) return 'aqi-moderate';
            if (value <= 75) return 'aqi-unhealthy-sensitive';
            return 'aqi-unhealthy';
        }

        function getHealthAdvice(value) {
            if (isNaN(value)) return 'ไม่มีข้อมูลฝุ่น PM2.5 ในขณะนี้';
            if (value <= 15) return 'ประชาชนทุกคนสามารถดำเนินชีวิตได้ตามปกติ';
            if (value <= 25) return 'สามารถทำกิจกรรมกลางแจ้งได้ตามปกติ';
            if (value <= 37.5) return 'ลดระยะเวลาทำกิจกรรมกลางแจ้งหรือออกกำลังกายที่ใช้แรงมาก';
            if (value <= 75) return 'สวมหน้ากากป้องกันฝุ่น PM2.5 และจำกัดระยะเวลาทำกิจกรรมกลางแจ้ง';
            return 'งดกิจกรรมกลางแจ้ง และสวมหน้ากากป้องกันฝุ่น PM2.5';
        }

        function updateDateText() {
            const date = new Date();
            const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
            const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            
            const dayName = days[date.getDay()];
            const day = date.getDate();
            const monthName = months[date.getMonth()];
            const year = date.getFullYear() + 543;
            
            document.getElementById('report-date').innerText = `ประจำวัน${dayName}ที่ ${day} ${monthName} ${year} เวลา 07.00 น.`;
        }


        // --------------------------------------------------
        // แทนที่ฟังก์ชัน window.onload เดิมด้วยโค้ดชุดนี้
        // --------------------------------------------------
        window.onload = function() {
            const btnLogin = document.getElementById('btnLogin');
            const inputUser = document.getElementById('loginUsername');
            const inputPass = document.getElementById('loginPassword');
            
            function attemptLogin() {
                // ใส่ค่ารหัสผ่าน admin ที่ถูกแปลงเป็น SHA3-512 แล้วลงในเครื่องหมายคำพูดด้านล่าง
                const validUserHash = "a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26";
                
                // ใส่ค่ารหัสผ่าน 1234 ที่ถูกแปลงเป็น SHA3-512 แล้วลงในเครื่องหมายคำพูดด้านล่าง
                const validPassHash = "a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26";
                
                // แปลงค่าที่กรอกมาให้เป็น SHA3-512 ก่อนเปรียบเทียบ
                const hashedInputUser = sha3_512(inputUser.value);
                const hashedInputPass = sha3_512(inputPass.value);

	
                
                if (hashedInputUser === validUserHash && hashedInputPass === validPassHash) {
                    // ปิดหน้า Login แล้วแสดงหน้ากำลังโหลดข้อมูล
                    document.getElementById('globalLoginModal').style.display = 'none';
                    document.getElementById('loader').style.display = 'flex';
                    
                    // เรียกฟังก์ชันเริ่มดึงข้อมูล
                    startLoadingData();
                } else {
                    document.getElementById('loginError').classList.remove('hidden');
                }
            }

            btnLogin.addEventListener('click', attemptLogin);
            
            // รองรับการกดปุ่ม Enter ในช่องรหัสผ่าน
            inputPass.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') attemptLogin();
            });
            inputUser.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') inputPass.focus();
            });
        };

        // --------------------------------------------------
        // นำโค้ดดึงข้อมูลเดิมทั้งหมดมาใส่ไว้ในฟังก์ชันนี้
        // --------------------------------------------------
        function startLoadingData() {
            updateDateText();
            
            const apiUrl = 'https://script.google.com/macros/s/AKfycby2OvLen-3AxfZH2mJ9f-63DClvUT5RuSbbNDuD1_T6SqStLKDYKVapnPOVj_ir_ogj-Q/exec';

            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    globalDashboardData = data; 
                    renderDashboard(data);
                })
                .catch(error => {
                    showError(error);
                });
        }

     
        function renderDashboard(data) {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('main-content').classList.remove('hidden');

            const cardsContainer = document.getElementById('province-cards');
            const historyTable = document.getElementById('history-table');
            
            let chartLabels = [];
            let chartData = [];
            let chartColors = [];

            let daysOver68Data = [];
            let daysOver69Data = [];
            let hotspot68Data = [];
            let hotspot69Data = [];

            // --- เพิ่มตัวแปรสำหรับกราฟเส้น ---
            let historyLineDatasets = [];
            const provinceColors = {
                "นครราชสีมา": "#7E22CE", // สีม่วง
                "ชัยภูมิ": "#F59E0B",    // สีส้ม
                "บุรีรัมย์": "#3B82F6",   // สีฟ้า
                "สุรินทร์": "#10B981"    // สีเขียว
            };

            // กำหนดจังหวัดที่อนุญาตและตัวแปรเช็กการแสดงซ้ำ
            const targetProvinces = ["นครราชสีมา", "ชัยภูมิ", "บุรีรัมย์", "สุรินทร์"];
            const seenProvinces = new Set();

            data.forEach(row => {
                const province = row[1];
                
                // กรองเฉพาะ 4 จังหวัด และต้องไม่เคยแสดงผลมาก่อน
                if (!targetProvinces.includes(province) || seenProvinces.has(province)) return;
                seenProvinces.add(province);

                const pmTodayNum = parseFloat(row[2]);
                const pmToday = isNaN(pmTodayNum) ? "N/A" : pmTodayNum;

        const hotspotFromSheet = row[3] || 0; 
        globalNasaHotspots[province] = hotspotFromSheet; // เก็บไว้ให้ AI ใช้ด้วย
                
                const dayMinus1Num = parseFloat(row[4]);
                const dayMinus1 = isNaN(dayMinus1Num) ? "-" : dayMinus1Num;
                const dayMinus2Num = parseFloat(row[5]);
                const dayMinus2 = isNaN(dayMinus2Num) ? "-" : dayMinus2Num;
                const dayMinus3Num = parseFloat(row[6]);
                const dayMinus3 = isNaN(dayMinus3Num) ? "-" : dayMinus3Num;
                const dayMinus4Num = parseFloat(row[7]); 
                const dayMinus4 = isNaN(dayMinus4Num) ? "-" : dayMinus4Num;

                const daysOver68 = parseFloat(row[8]) || 0;
                const daysOver69 = parseFloat(row[9]) || 0;
                
                daysOver68Data.push(daysOver68);
                daysOver69Data.push(daysOver69);
                hotspot68Data.push(parseFloat(row[10]) || 0);
                hotspot69Data.push(parseFloat(row[11]) || 0);

                const currentAqiClass = getAqiClass(pmTodayNum);
                const healthAdvice = getHealthAdvice(pmTodayNum);

                const target69 = Math.floor(daysOver68 * 0.95);
                const remainingDays = target69 - daysOver69;
                let quotaHtml = '';

                if (remainingDays > 0) {
                    quotaHtml = `
                        <div class="mt-2 text-xs p-2 bg-blue-100 text-blue-900 rounded-lg w-full text-left border border-blue-300">
                            📉 <span class="font-bold">เป้าหมายลดฝุ่น 5% จากปี 68:</span> ต้องไม่เกิน ${target69} วัน<br>
                            ⏳ <span class="font-bold text-green-700">เหลือโควต้าอีก: ${remainingDays} วัน</span>
                        </div>
                    `;
                } else if (remainingDays === 0) {
                    quotaHtml = `
                        <div class="mt-2 text-xs p-2 bg-orange-100 text-orange-900 rounded-lg w-full text-left border border-orange-400">
                            ⚠️ <span class="font-bold">เป้าหมายลดฝุ่น 5% จากปี 68:</span> ต้องไม่เกิน ${target69} วัน<br>
                            🚨 <span class="font-bold text-orange-700">คำเตือน: วันนี้ฝุ่นเกินมาตรฐานชนเพดานเป้าหมายแล้ว!</span>
                        </div>
                    `;
                } else {
                    quotaHtml = `
                        <div class="mt-2 text-xs p-2 bg-red-200 text-red-900 rounded-lg w-full text-left border border-red-500 font-bold">
                            ❌ เป้าหมายลดฝุ่น 5% จากปี 68: ต้องไม่เกิน ${target69} วัน<br>
                            ทะลุเป้าหมายแล้ว (เกินมา ${Math.abs(remainingDays)} วัน)
                        </div>
                    `;
                }

                let riskAdviceHtml = '';
                if (pmTodayNum >= 25.1 && pmTodayNum <= 37.5) {
                    riskAdviceHtml = `
                        <div class="mt-2 text-xs p-2 bg-yellow-50 text-yellow-900 rounded-lg w-full text-left border border-yellow-300">
                            <span class="font-bold">กลุ่มเสี่ยง:</span> สวมหน้ากาก ป้องกันตนเอง เฝ้าระวังสุขภาพตนเอง หากมีอาการผิดปกติ ให้รีบไปพบแพทย์
                        </div>
                    `;
                } else if (pmTodayNum >= 37.6 && pmTodayNum <= 75.0) {
                    riskAdviceHtml = `
                        <div class="mt-2 text-xs p-2 bg-orange-50 text-orange-900 rounded-lg w-full text-left border border-orange-300">
                            <span class="font-bold">กลุ่มเสี่ยง:</span> เลี่ยงกิจกรรมกลางแจ้ง สวมหน้ากากป้องกันฝุ่น พกพายาประจำตัวและอุปกรณ์ที่จำเป็นให้พร้อม หากมีอาการผิดปกติ ให้รีบไปพบแพทย์
                        </div>
                    `;
                }

                let warningHtml = '';
                
                if (pmTodayNum >= 75.1) {
                    warningHtml = `
                        <div class="mt-3 text-xs p-3 bg-red-100 text-red-900 rounded-lg border-2 border-red-600 w-full text-left overflow-y-auto max-h-48 custom-scrollbar">
                            <div class="font-bold text-sm mb-2 text-red-700">🚨 ยกระดับมาตรการรับมือฝุ่น PM2.5 สีแดง:</div>
                            <div class="space-y-3">
                                <div>
                                    <span class="font-bold">1. การป้องกันสุขภาพและบริหารจัดการภาพรวม</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li><span class="font-semibold">ลดการรับสัมผัสฝุ่น:</span> ขอความร่วมมือประชาชนงดกิจกรรมกลางแจ้ง เช่น การแข่งขันกีฬาหรือคอนเสิร์ตกลางแจ้ง ให้หน่วยงานพิจารณาทำงานที่บ้าน (Work From Home) และพิจารณาปิดสถานศึกษาชั่วคราว</li>
                                        <li><span class="font-semibold">การแจ้งเตือน:</span> แจ้งเตือนภัยสถานการณ์ฝุ่นละอองผ่านระบบ Cell Broadcast และ SMS ส่งตรงถึงโทรศัพท์มือถือของประชาชนในพื้นที่เสี่ยง</li>
                                        <li><span class="font-semibold">การสาธารณสุข:</span> จัดเตรียมห้องปลอดฝุ่นเพื่อดูแลกลุ่มเปราะบาง แจกอุปกรณ์ป้องกันส่วนบุคคล (หน้ากากมุ่งสู้ฝุ่น) จัดหน่วยแพทย์ลงพื้นที่ และเปิดคลินิกมลพิษ</li>
                                        <li><span class="font-semibold">การบรรเทาสถานการณ์:</span> ปฏิบัติการทำฝนหลวงเพื่อลดปริมาณฝุ่นละออง และพิจารณาประกาศเขตการให้ความช่วยเหลือผู้ประสบภัยพิบัติกรณีฉุกเฉินเพื่อให้ความช่วยเหลือประชาชนได้ทันท่วงที</li>
                                    </ul>
                                </div>
                                <div>
                                    <span class="font-bold">2. การควบคุมฝุ่นในเขตเมือง</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li><span class="font-semibold">ยานพาหนะ:</span> ตั้งจุดตรวจจับยานพาหนะควันดำอย่างเข้มงวด หากพบค่าเกินมาตรฐานให้บังคับใช้กฎหมายอย่างเด็ดขาด</li>
                                        <li><span class="font-semibold">อุตสาหกรรมและก่อสร้าง:</span> ตรวจกำกับและบังคับใช้กฎหมายอย่างเข้มงวดกับโรงงานที่มีความเสี่ยงสูง (เช่น โรงงานใช้หม้อไอน้ำ แพลนท์ปูน โรงหลอมโลหะ) รวมถึงสถานที่ก่อสร้าง</li>
                                    </ul>
                                </div>
                                <div>
                                    <span class="font-bold">3. การควบคุมการเผาในพื้นที่ป่าและเกษตรกรรม</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li><span class="font-semibold">บังคับใช้กฎหมายการเผา:</span> หากพบการเผาในพื้นที่เกษตร จะถูกบังคับใช้กฎหมาย และถูกตัดสิทธิ์ความช่วยเหลือจากภาครัฐ</li>
                                        <li><span class="font-semibold">การจัดการไฟป่า:</span> จัดชุดปฏิบัติการลาดตระเวนและจุดสกัดในพื้นที่เสี่ยง หากมีไฟป่าเกิดขึ้นเจ้าของพื้นที่ต้องร่วมรับผิดชอบ และพิจารณาประกาศปิดป่าในห้วงเวลาที่เหมาะสม</li>
                                        <li><span class="font-semibold">บทลงโทษขั้นเด็ดขาด:</span> หากพบการลักลอบเผาในพื้นที่เกษตรกรรมที่ตั้งอยู่ในเขตที่ดินของรัฐ จะถูกดำเนินการเพิกถอนสิทธิในการเข้าทำประโยชน์หรืออยู่อาศัยทันที</li>
                                    </ul>
                                </div>
                                <div>
                                    <span class="font-bold">4. การจัดการหมอกควันข้ามแดน</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li>ควบคุมและบังคับใช้กฎหมายอย่างเคร่งครัดกับผู้ลักลอบนำเข้าข้าวโพดเลี้ยงสัตว์ที่ไม่ปลอดการเผา</li>
                                        <li>ประสานงานเพื่อแก้ไขปัญหาหมอกควันข้ามแดนผ่านกลไกคณะกรรมการชายแดน และการประชุมระดับอาเซียน</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (pmTodayNum >= 37.6 && pmTodayNum <= 75.0) {
                    warningHtml = `
                        <div class="mt-3 text-xs p-3 bg-orange-100 text-orange-900 rounded-lg border-2 border-orange-500 w-full text-left overflow-y-auto max-h-48 custom-scrollbar">
                            <div class="font-bold text-sm mb-2 text-orange-700">⚠️ ยกระดับมาตรการรับมือฝุ่น PM2.5 สีส้ม:</div>
                            <div class="space-y-3">
                                <div>
                                    <span class="font-bold">1. การแจ้งเตือนและป้องกันสุขภาพของประชาชน</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li><span class="font-semibold">แจ้งเตือนภัย:</span> ยกระดับการแจ้งเตือนสถานการณ์ฝุ่น PM2.5</li>
                                        <li><span class="font-semibold">ลดการรับสัมผัส:</span> ขอความร่วมมือประชาชนงดกิจกรรมกลางแจ้ง</li>
                                        <li><span class="font-semibold">สาธารณสุข:</span> จัดเตรียมห้องปลอดฝุ่นเพื่อดูแลกลุ่มเปราะบาง</li>
                                    </ul>
                                </div>
                                <div>
                                    <span class="font-bold">2. การควบคุมฝุ่นในเขตเมือง</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li><span class="font-semibold">ตรวจจับยานพาหนะ:</span> เข้มงวดการตรวจสอบและตรวจจับรถยนต์ควันดำ หากพบค่าเกินมาตรฐานให้บังคับใช้กฎหมายอย่างเด็ดขาด</li>
                                        <li><span class="font-semibold">คุมเข้มโรงงานและก่อสร้าง:</span> ตรวจกำกับและบังคับใช้กฎหมายอย่างเข้มงวดกับโรงงานอุตสาหกรรมเสี่ยงสูง (เช่น หม้อไอน้ำ แพลนท์ปูน โรงหลอมโลหะ) และสถานที่ก่อสร้าง</li>
                                    </ul>
                                </div>
                                <div>
                                    <span class="font-bold">3. การควบคุมการเผาในพื้นที่เกษตรและไฟป่า</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li><span class="font-semibold">คุมเข้มการเผาทางการเกษตร:</span> ควบคุมการเผาอย่างเคร่งครัด หากเกษตรกรฝ่าฝืนหรือไม่ปฏิบัติตามเงื่อนไข จะถูกบังคับใช้กฎหมายและตัดสิทธิ์การรับความช่วยเหลือจากรัฐ</li>
                                        <li><span class="font-semibold">การจัดการป่าไม้:</span> จัดชุดปฏิบัติการลาดตระเวน ตั้งจุดสกัดและจุดเฝ้าระวังในพื้นที่ป่าอนุรักษ์และป่าสงวน หากเกิดไฟป่าเจ้าของพื้นที่ต้องร่วมรับผิดชอบ</li>
                                        <li><span class="font-semibold">บทลงโทษในที่ดินรัฐ:</span> หากพบการกระทำผิดลักลอบเผาในพื้นที่เกษตรกรรมที่อยู่ในเขตที่ดินของรัฐ จะถูกพิจารณาเพิกถอนสิทธิการทำประโยชน์หรืออยู่อาศัย</li>
                                    </ul>
                                </div>
                                <div>
                                    <span class="font-bold">4. การบริหารจัดการภาพรวม</span>
                                    <ul class="list-disc pl-4 mt-1 space-y-1">
                                        <li>ติดตามสถานการณ์อย่างใกล้ชิด หากสถานการณ์รุนแรงเข้าตามหลักเกณฑ์ จังหวัดพิจารณาประกาศเขตการให้ความช่วยเหลือผู้ประสบภัยพิบัติกรณีฉุกเฉินเพื่อให้การดูแลประชาชนได้ทันท่วงที</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (dayMinus2Num > 25.0 && dayMinus2Num <= 37.5 &&
                           dayMinus1Num > 25.0 && dayMinus1Num <= 37.5 &&
                           pmTodayNum >= 30.0 && pmTodayNum <= 37.5 &&
                           dayMinus2Num < dayMinus1Num && dayMinus1Num < pmTodayNum) {
                    warningHtml = `
                        <div class="mt-3 text-xs p-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold border border-yellow-500 w-full text-left">
                            ⚠️ แจ้งเตือน: ควรพิจารณายกระดับมาตรการป้องกันปัญหาฝุ่น PM2.5 ก่อนจะเริ่มมีผลกระทบต่อสุขภาพ
                        </div>
                    `;
                }

    cardsContainer.innerHTML += `
            <div class="p-4 rounded-xl shadow-md text-center flex flex-col justify-start items-center ${currentAqiClass}">
                <h4 class="text-xl font-bold">${province}</h4>
                <div class="text-3xl font-black mt-2">${pmToday}</div>
                <div class="text-xs">มคก./ลบ.ม.</div>
                <div class="mt-2 text-sm bg-white bg-opacity-30 rounded px-2 py-1 w-full">
                    จุดความร้อน (NASA 24 ชม.): <span id="hotspot-val-${province}" class="font-bold text-red-700">${hotspotFromSheet} จุด</span>                        
                </div>
                ${quotaHtml}
                <div class="mt-2 text-xs p-2 bg-white bg-opacity-60 rounded-lg text-black w-full text-left">
                    <span class="font-bold">คำแนะนำ:</span> ${healthAdvice}
                </div>
                ${riskAdviceHtml}
                ${warningHtml}
            </div>
        `;

                historyTable.innerHTML += `
                    <tr>
                        <td class="border p-2 font-semibold text-left">${province}</td>
                        <td class="border p-2 ${getAqiClass(dayMinus4Num)}">${dayMinus4}</td>
                        <td class="border p-2 ${getAqiClass(dayMinus3Num)}">${dayMinus3}</td>
                        <td class="border p-2 ${getAqiClass(dayMinus2Num)}">${dayMinus2}</td>
                        <td class="border p-2 ${getAqiClass(dayMinus1Num)}">${dayMinus1}</td>
                        <td class="border p-2 font-bold ${currentAqiClass}">${pmToday}</td>
                    </tr>
                `;

                chartLabels.push(province);
                chartData.push(isNaN(pmTodayNum) ? null : pmTodayNum);
                
                if (isNaN(pmTodayNum)) chartColors.push('#D1D5DB');
                else if (pmTodayNum <= 15) chartColors.push('#00B0F0');
                else if (pmTodayNum <= 25) chartColors.push('#92D050');
                else if (pmTodayNum <= 37.5) chartColors.push('#FFFF00');
                else if (pmTodayNum <= 75) chartColors.push('#FFC000');
                else chartColors.push('#FF0000');

                // --- จัดเตรียมข้อมูลสำหรับกราฟเส้น ---
                let pmDataArray = [
                    isNaN(dayMinus4Num) ? null : dayMinus4Num,
                    isNaN(dayMinus3Num) ? null : dayMinus3Num,
                    isNaN(dayMinus2Num) ? null : dayMinus2Num,
                    isNaN(dayMinus1Num) ? null : dayMinus1Num,
                    isNaN(pmTodayNum) ? null : pmTodayNum
                ];

                historyLineDatasets.push({
                    label: province,
                    data: pmDataArray,
                    borderColor: provinceColors[province] || '#333',
                    backgroundColor: provinceColors[province] || '#333',
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 4
                });
            });

            const datalabelsOptions = {
                anchor: 'end',
                align: 'top',
                color: '#333',
                font: { weight: 'bold' },
                formatter: Math.round
            };

            new Chart(document.getElementById('aqiChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'ค่าฝุ่น PM2.5 วันนี้',
                        data: chartData,
                        backgroundColor: chartColors,
                        borderWidth: 1,
                        borderColor: '#333'
                    }]
                },
                options: { 
                    responsive: true, 
                    layout: { padding: { top: 25 } },
                    scales: { y: { beginAtZero: true } }, 
                    plugins: { 
                        legend: { display: false },
                        datalabels: datalabelsOptions
                    } 
                }
            });

            new Chart(document.getElementById('daysOverChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [
                        { label: 'ปี 2568', data: daysOver68Data, backgroundColor: '#9CA3AF' },
                        { label: 'ปี 2569', data: daysOver69Data, backgroundColor: '#EF4444' }
                    ]
                },
                options: { 
                    responsive: true, 
                    layout: { padding: { top: 25 } },
                    scales: { y: { beginAtZero: true } },
                    plugins: { datalabels: datalabelsOptions }
                }
            });

            new Chart(document.getElementById('hotspotAccumChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [
                        { label: 'ปี 2568', data: hotspot68Data, backgroundColor: '#9CA3AF' },
                        { label: 'ปี 2569', data: hotspot69Data, backgroundColor: '#F97316' }
                    ]
                },
                options: { 
                    responsive: true, 
                    layout: { padding: { top: 25 } },
                    scales: { y: { beginAtZero: true } },
                    plugins: { datalabels: datalabelsOptions }
                }
            });

            // --- สร้างกราฟเส้นแนวโน้ม PM2.5 ---
            new Chart(document.getElementById('historyLineChart').getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['ย้อนหลัง 4 วัน', 'ย้อนหลัง 3 วัน', 'ย้อนหลัง 2 วัน', 'ย้อนหลัง 1 วัน', 'วันนี้'],
                    datasets: historyLineDatasets
                },
        options: {
               responsive: true,
             layout: { padding: { top: 25, right: 20, left: 10, bottom: 10 } },
              scales: {
                    y: {
                       // 1. เปลี่ยนเป็น false เพื่อให้กราฟซูมตามช่วงข้อมูลจริง (ไม่บังคับเริ่มที่ 0)
                      beginAtZero: false, 
            
             // 2. (แนะนำ) เพิ่มคำสั่ง grace เพื่อเว้นช่องว่างด้านบนและด้านล่างของเส้นกราฟ 10% 
             // ทำให้เส้นไม่ไปชนขอบกราฟพอดีเป๊ะ ดูสบายตาขึ้น
             grace: '10%', 

             title: { display: true, text: 'PM2.5 (มคก./ลบ.ม.)', font: { family: 'Sarabun' } }
              },
                    x: {
                 ticks: { font: { family: 'Sarabun' } }
                 }
          },
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top',
                            labels: { font: { family: 'Sarabun', size: 14 } }
                        },
                        datalabels: {
                            display: false // ปิดตัวเลขบนเส้นกราฟ
                        },
                        annotation: {
                            drawTime: 'beforeDatasetsDraw', // วาดพื้นหลังก่อน เพื่อไม่ให้บังเส้นกราฟ
                            annotations: {
                                zoneBlue: {
                                    type: 'box',
                                    yMin: 0,
                                    yMax: 15,
                                    backgroundColor: 'rgba(0, 176, 240, 0.2)',
                                    borderWidth: 0,
                                    adjustScaleRange: false // คำสั่งป้องกันไม่ให้แถบสีดึงแกน Y ให้สูงเกินไป
                                },
                                zoneGreen: {
                                    type: 'box',
                                    yMin: 15,
                                    yMax: 25,
                                    backgroundColor: 'rgba(146, 208, 80, 0.2)',
                                    borderWidth: 0,
                                    adjustScaleRange: false
                                },
                                zoneYellow: {
                                    type: 'box',
                                    yMin: 25,
                                    yMax: 37.5,
                                    backgroundColor: 'rgba(255, 255, 0, 0.2)',
                                    borderWidth: 0,
                                    adjustScaleRange: false
                                },
                                zoneOrange: {
                                    type: 'box',
                                    yMin: 37.5,
                                    yMax: 75,
                                    backgroundColor: 'rgba(255, 192, 0, 0.2)',
                                    borderWidth: 0,
                                    adjustScaleRange: false
                                },
                                zoneRed: {
                                    type: 'box',
                                    yMin: 75,
                                    yMax: 1000, 
                                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                    borderWidth: 0,
                                    adjustScaleRange: false
                                }
                            }
                        }
                    }
                }
            });

            fetchWeatherData();
           // fetchNasaHotspots();
        }

       function showError(error) {
            document.getElementById('loader').innerHTML = "เกิดข้อผิดพลาดในการดึงข้อมูล โปรดตรวจสอบ Google Sheets";
            console.error(error);
        }

        function updateDownloadLinkClean() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const dynamicUrl = `http://air4thai.pcd.go.th/report/HazeTableReportNE_V2003_${formattedDate}_7.pdf`;
            document.getElementById('hazeDownloadBtnClean').href = dynamicUrl;
        }
  
        updateDownloadLinkClean();

// วาง URL ของ Google Apps Script ที่ท่านเพิ่งสร้างลงไปตรงนี้
const GAS_WEATHER_PROXY = 'https://script.google.com/macros/s/AKfycbxwoNT9sKWRIz2jGIqN44-71pjnMVyeV_ofNx0jDodMfMITcbCyw81Vsxw9rAURiRtDuw/exec';

        // ฟังก์ชันแปลงรหัสสภาพอากาศเป็นข้อความ
        function getWeatherCondition(condCode) {
            switch(parseInt(condCode)) {
                case 1: return "ท้องฟ้าแจ่มใส";
                case 2: return "มีเมฆบางส่วน";
                case 3: return "เมฆเป็นส่วนมาก";
                case 4: return "มีเมฆมาก";
                case 5: return "ฝนตกเล็กน้อย";
                case 6: return "ฝนปานกลาง";
                case 7: return "ฝนตกหนัก";
                case 8: return "ฝนฟ้าคะนอง";
                case 9: return "อากาศหนาวจัด";
                case 10: return "อากาศหนาว";
                case 11: return "อากาศเย็น";
                case 12: return "อากาศร้อนจัด";
                default: return "-";
            }
        }

        // ฟังก์ชันแปลงองศาเป็นชื่อทิศภาษาไทย
        function getWindDirectionThai(degree) {
            if (degree === undefined || isNaN(degree)) return '-';
            const directions = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
            const index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
            return directions[index] + ' (' + degree + '°)';
        }

// ==========================================
// ส่วนใหม่: กำหนด URL Proxy สำหรับดึง live PM2.5 (ผอ. นำ URL ที่ได้จาก GAS มาใส่ตรงนี้)
// ==========================================
const GAS_LIVE_PM25_PROXY = 'https://script.google.com/macros/s/AKfycby2OvLen-3AxfZH2mJ9f-63DClvUT5RuSbbNDuD1_T6SqStLKDYKVapnPOVj_ir_ogj-Q/exec';

// URL Proxy ของ ผอ.
// const GAS_WEATHER_PROXY = '...';
// const GAS_LIVE_PM25_PROXY = '...';

async function fetchWeatherData() {
    const weatherContainer = document.getElementById('weather-cards');
    const provinces = [
        { name: 'นครราชสีมา', lat: 14.9799, lon: 102.0978 },
        { name: 'ชัยภูมิ', lat: 15.8063, lon: 102.0315 },
        { name: 'บุรีรัมย์', lat: 14.9951, lon: 103.1116 },
        { name: 'สุรินทร์', lat: 14.8818, lon: 103.4936 }
    ];

    weatherContainer.innerHTML = '';

    // สร้างกล่อง Loading รอไว้ก่อน (เอา Spinner ออก ใช้ตัวหนังสือกะพริบเบาๆ แทน)
    for (const prov of provinces) {
        weatherContainer.innerHTML += `
            <div class="border rounded-lg p-3 bg-blue-50 relative" id="weather-${prov.name}">
                <h4 class="font-bold text-blue-800 text-center border-b pb-2 mb-2">จ.${prov.name}</h4>
                <div class="text-sm text-center text-gray-500 py-4 animate-pulse">
                    กำลังดึงข้อมูล...
                </div>
            </div>
        `;
    }

    // ดึง Live PM2.5 แค่ครั้งเดียวนอกลูป
    let livePMData = {};
    try {
        const livePMResponse = await fetch(`${GAS_LIVE_PM25_PROXY}?action=live_pm25`);
        if (livePMResponse.ok) {
            livePMData = await livePMResponse.json();
        }
    } catch (e) {
        console.error("ไม่สามารถดึงข้อมูล Live PM2.5 ได้:", e);
    }

    // สั่งดึงข้อมูลสภาพอากาศของ 4 จังหวัดพร้อมกัน (Parallel)
    const fetchPromises = provinces.map(async (prov) => {
        try {
            const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${prov.lat}&longitude=${prov.lon}&hourly=boundary_layer_height,precipitation_probability&timezone=Asia%2FBangkok&forecast_days=1`;
            // ดึง TMD API และ Open-Meteo API พร้อมกัน
            const [weatherResponse, meteoResponse] = await Promise.all([
                fetch(`${GAS_WEATHER_PROXY}?lat=${prov.lat}&lon=${prov.lon}`).catch(() => null),
                fetch(meteoUrl).catch(() => null)
            ]);

            if (weatherResponse && weatherResponse.ok) {
                const data = await weatherResponse.json();
                
                if (data && data.WeatherForecasts && data.WeatherForecasts.length > 0) {
                    const forecastObj = data.WeatherForecasts[0].forecasts[0]; 
                    const weatherData = forecastObj.data;
                    const rawTime = forecastObj.time;
                    
                    const dateObj = new Date(rawTime);
                    const timeString = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                    const dateString = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                    const displayTime = `${dateString} เวลา ${timeString} น.`;
                    
                    const condText = weatherData.cond !== undefined ? getWeatherCondition(weatherData.cond) : '-';
                    const tc = weatherData.tc !== undefined ? weatherData.tc : '-';
                    const rh = weatherData.rh !== undefined ? weatherData.rh : '-';

                    let rainChanceDisplay = '0 %';
                    if (weatherData.pop !== undefined) rainChanceDisplay = `${weatherData.pop} %`;
                    else if (weatherData.rain !== undefined) rainChanceDisplay = `ปริมาณ ${weatherData.rain} มม.`;

                    let windSpeedDisplay = '-';
                    if (weatherData.ws10m !== undefined) {
                        const kmh = (weatherData.ws10m * 3.6).toFixed(1);
                        windSpeedDisplay = `${kmh} กม./ชม.`;
                    }
                    const windDirDisplay = weatherData.wd10m !== undefined ? getWindDirectionThai(weatherData.wd10m) : '-';

		// จัดการค่า BLH และโอกาสเกิดฝนจาก Open-Meteo
		let blhDisplay = '-';
			if (meteoResponse && meteoResponse.ok) {
   			 try {
    			    const meteoData = await meteoResponse.json();
       				 const currentHour = new Date().getHours();
        
       		 // จัดการค่า BLH
       		 const currentBlh = meteoData.hourly.boundary_layer_height[currentHour];
        	if (currentBlh !== null && currentBlh !== undefined) {
          		  blhDisplay = `${Math.round(currentBlh)} เมตร`;
       		 }

        	// จัดการโอกาสเกิดฝน นำมาเขียนทับค่าจาก TMD
       		 const currentPop = meteoData.hourly.precipitation_probability[currentHour];
       		 if (currentPop !== null && currentPop !== undefined) {
        	    rainChanceDisplay = `${currentPop} %`;
        	}
    		} catch(e) {}
		}

                    // จัดการค่า Live PM2.5 ที่ดึงมาแล้ว
                    const currentLivePM = livePMData[prov.name] || 'N/A';
                    let livePMClass = 'text-gray-500';
                    let livePMIcon = '⚪';
                    const pmNum = parseFloat(currentLivePM);
                    
                    if (!isNaN(pmNum)) {
                        if (pmNum <= 15.0) { livePMClass = 'text-blue-600'; livePMIcon = '😊'; }
                        else if (pmNum <= 25.0) { livePMClass = 'text-green-600'; livePMIcon = '🙂'; }
                        else if (pmNum <= 37.5) { livePMClass = 'text-yellow-600'; livePMIcon = '😐'; }
                        else if (pmNum <= 75.0) { livePMClass = 'text-orange-600'; livePMIcon = '⚠️'; }
                        else if (pmNum > 75.0) { livePMClass = 'text-red-600'; livePMIcon = '🚨'; }
                    }

                    const livePMHtml = `
                        <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200 shadow-inner my-2">
                            <span class="font-bold text-gray-800 flex items-center gap-1">${livePMIcon} ฝุ่น PM2.5:</span>
                            <span class="font-extrabold text-lg ${livePMClass}">${currentLivePM} มคก./ลบ.ม.</span>
                        </div>
                    `;

                    // อัปเดตข้อมูลให้ AI
                    globalWeatherData[prov.name] = {
                        cond: condText,
                        temp: tc,
                        rh: rh,
                        windSpeed: windSpeedDisplay,
                        windDir: windDirDisplay,
                        rainChance: rainChanceDisplay,
                        blh: blhDisplay,
                        currentPM25: currentLivePM
                    };

                    let windArrowHtml = '';
                    if (weatherData.wd10m !== undefined) {
                        const rotation = (weatherData.wd10m + 180) % 360;
                        windArrowHtml = `<svg style="transform: rotate(${rotation}deg);" class="inline-block w-5 h-5 ml-1 text-blue-600 font-bold drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 19V5m-7 7l7-7 7 7"></path></svg>`;
                    }

                    // เรนเดอร์ HTML
                    document.getElementById(`weather-${prov.name}`).innerHTML = `
                        <h4 class="font-bold text-blue-800 text-center border-b pb-2 mb-2">จ.${prov.name}</h4>
                        <div class="text-xs text-center text-gray-500 mb-2 bg-white py-1 rounded border border-gray-200 shadow-sm">
                            อัปเดตข้อมูล weather: <span class="font-bold text-blue-700">${displayTime}</span>
                        </div>
                        ${livePMHtml}
			<div class="text-sm space-y-2">
                            <div class="flex justify-between"><span>🌤️ สภาพอากาศ:</span> <span class="font-semibold text-blue-700">${condText}</span></div>
                            <div class="flex justify-between"><span>🌡️ อุณหภูมิ:</span> <span class="font-semibold">${tc} °C</span></div>
                            <div class="flex justify-between"><span>💧 ความชื้น:</span> <span class="font-semibold">${rh} %</span></div>
                            <div class="flex justify-between"><span>🌧️ โอกาสเกิดฝน:</span> <span class="font-semibold text-blue-600">${rainChanceDisplay}</span></div>
                            <div class="flex justify-between"><span>🌬️ ความเร็วลม:</span> <span class="font-semibold">${windSpeedDisplay}</span></div>
                            <div class="flex justify-between items-center">
                                <span>🧭 ทิศทางลม:</span> 
                                <span class="font-semibold text-right flex items-center justify-end">
                                    ${windDirDisplay} ${windArrowHtml}
                                </span>
                            </div>
                            <div class="flex justify-between border-t border-blue-200 pt-2 mt-2">
                                <span class="font-bold text-purple-800">📏 เพดานการระบายอากาศ:</span>
                                <span class="font-bold text-purple-600">${blhDisplay}</span>
                            </div>
                        </div>                  


                    `;
                }
            } else {
                throw new Error("Failed to load TMD");
            }
        } catch (error) {
            document.getElementById(`weather-${prov.name}`).innerHTML = `
                <h4 class="font-bold text-blue-800 text-center border-b pb-2 mb-2">จ.${prov.name}</h4>
                <div class="text-sm text-red-500 text-center py-4">ไม่สามารถดึงข้อมูลสภาพอากาศได้</div>
            `;
        }
    });

    // สั่งให้รอจนกว่าทั้ง 4 จังหวัดโหลดเสร็จพร้อมกัน
    await Promise.all(fetchPromises);
}

   


// ====
// ดึงข้อมูล NASA ผ่าน Google Apps Script Proxy
async function fetchNasaHotspots() {
    // เรียกใช้ GAS Proxy ที่ทำหน้าที่ประมวลผลแล้วส่งกลับมาแค่ตัวเลข
    const GAS_HOTSPOT_PROXY = 'https://script.google.com/macros/s/AKfycby2OvLen-3AxfZH2mJ9f-63DClvUT5RuSbbNDuD1_T6SqStLKDYKVapnPOVj_ir_ogj-Q/exec?action=hotspots';
    
    try {
        const response = await fetch(GAS_HOTSPOT_PROXY);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // นำตัวเลขที่ได้มาแสดงผลบน UI ได้ทันทีโดยไม่ต้องคำนวณพิกัดเอง
        for (const [prov, count] of Object.entries(data)) {
            globalNasaHotspots[prov] = count;
            const el = document.getElementById(`hotspot-val-${prov}`);
            if (el) {
                el.innerText = count + " จุด";
            }
        }
        
    } catch (error) {
        console.error("Error fetching NASA data via proxy:", error);
        ["นครราชสีมา", "ชัยภูมิ", "บุรีรัมย์", "สุรินทร์"].forEach(prov => {
            const el = document.getElementById(`hotspot-val-${prov}`);
            if (el) el.innerText = "ไม่สามารถดึงข้อมูลได้";
        });
    }
}
        // ==========================================
        // ฟังก์ชันสั่งการ AI (อัปเดตใหม่ ส่งรหัสไปตรวจสอบที่ Backend)
        // ==========================================

        // เมื่อกดปุ่มประมวลผลหลัก ให้แสดงหน้าต่างรหัสผ่าน
        document.getElementById('btnAnalyze').addEventListener('click', function() {
            document.getElementById('aiPasswordInput').value = '';
            document.getElementById('passwordError').classList.add('hidden');
            document.getElementById('passwordModal').classList.remove('hidden');
            // ทำให้เคอร์เซอร์ไปกะพริบรอที่ช่องกรอกอัตโนมัติ
            setTimeout(() => document.getElementById('aiPasswordInput').focus(), 100);
        });

        // ปุ่มยกเลิกในหน้าต่างรหัสผ่าน
        document.getElementById('btnCancelPassword').addEventListener('click', function() {
            document.getElementById('passwordModal').classList.add('hidden');
        });

        // รองรับการกดปุ่ม Enter ในช่องกรอกรหัสผ่านเพื่อยืนยัน
        document.getElementById('aiPasswordInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('btnConfirmPassword').click();
            }
        });

        // ตรวจสอบเมื่อกดปุ่มยืนยันรหัสผ่าน
        document.getElementById('btnConfirmPassword').addEventListener('click', async function() {
            const inputVal = document.getElementById('aiPasswordInput').value;
            
            // ซ่อนหน้าต่างรหัสผ่านแล้วส่งข้อมูลไปประมวลผล
            document.getElementById('passwordModal').classList.add('hidden');
            await runAiAnalysis(inputVal);
        });

        // ฟังก์ชันประมวลผล AI (ส่งรหัสผ่านไปกับข้อมูล)
        async function runAiAnalysis(password) {
            const resultDiv = document.getElementById('aiResult');
            const btn = document.getElementById('btnAnalyze');
            
            resultDiv.style.display = 'block';
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = '<div class="text-center text-purple-600 animate-pulse"><i>กำลังตรวจสอบสิทธิ์และวิเคราะห์ข้อมูล... กรุณารอสักครู่</i></div>';
            
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');

            const gasWebAppUrl = 'https://script.google.com/macros/s/AKfycby2OvLen-3AxfZH2mJ9f-63DClvUT5RuSbbNDuD1_T6SqStLKDYKVapnPOVj_ir_ogj-Q/exec';

            let contextData = "ข้อมูลสถานการณ์รายจังหวัด:\n";
            let totalHotspots = 0;

            if (globalDashboardData && globalDashboardData.length > 1) {
                globalDashboardData.forEach((row, index) => {
                    if (index > 0 && row[0]) { 
                        const province = row[1]; 
                        const pmToday = row[2];
                        const hotspot = globalNasaHotspots[province] !== undefined ? globalNasaHotspots[province] : 0;
                        const daysOver68 = parseFloat(row[8]) || 0; 
                        const daysOver69 = parseFloat(row[9]) || 0; 
                        
		   if (["นครราชสีมา", "ชัยภูมิ", "บุรีรัมย์", "สุรินทร์"].includes(province)) {
                        totalHotspots += parseInt(hotspot) || 0;

                        const target69 = Math.floor(daysOver68 * 0.95);
                        const remainingDays = target69 - daysOver69;
                        
                        let quotaText = "";
                        if (remainingDays > 0) {
                            quotaText = `เหลือโควต้าอีก ${remainingDays} วัน`;
                        } else if (remainingDays === 0) {
                            quotaText = `ไม่มีโควต้าเหลือแล้ว ชนเพดานเป้าหมาย`;
                        } else {
                            quotaText = `เกินเป้าหมายแล้ว ${Math.abs(remainingDays)} วัน`;
                        }

                        let weatherText = "ไม่มีข้อมูลสภาพอากาศ";
                        let livePMText = "ไม่มีข้อมูลเรียลไทม์";
                        if (globalWeatherData[province]) {
                            const w = globalWeatherData[province];
                            // เพิ่ม BLH เข้าไปในข้อมูลสภาพอากาศ
                            weatherText = `สภาพอากาศ: ${w.cond} | อุณหภูมิ ${w.temp} °C | ความชื้น ${w.rh} % | โอกาสเกิดฝน ${w.rainChance} | ลม${w.windDir} ความเร็ว ${w.windSpeed} | เพดานการระบายอากาศ ${w.blh}`;
                            // ดึงค่า PM2.5 ปัจจุบันมาสร้างข้อความ
                            livePMText = `PM2.5 ปัจจุบัน (Real-time): ${w.currentPM25} มคก./ลบ.ม.`;
                        }

                        const pmVal = parseFloat(pmToday); // ค่ารอบ 07.00 น.
                        const dayMinus1Num = parseFloat(row[4]);
                        const dayMinus2Num = parseFloat(row[5]);
                        const dayMinus3Num = parseFloat(row[6]); // ย้อนหลัง 3 วัน
                        const dayMinus4Num = parseFloat(row[7]); // ย้อนหลัง 4 วัน

                        let healthAdv = getHealthAdvice(pmVal);
                        let policyAdv = "";
                        
                        if (pmVal >= 75.1) {
                            policyAdv = "มาตรการสีแดง (มีผลกระทบ): งดกิจกรรมกลางแจ้ง พิจารณา WFH และปิดสถานศึกษา แจ้งเตือน SMS บังคับใช้กฎหมายกับโรงงานและรถควันดำอย่างเด็ดขาด ห้ามเผาในพื้นที่เกษตรและป่าไม้เด็ดขาด";
                        } else if (pmVal >= 37.6) {
                            policyAdv = "มาตรการสีส้ม (เริ่มมีผลกระทบ): แจ้งเตือนกลุ่มเสี่ยง ควบคุมการเผาทางการเกษตรอย่างเคร่งครัด ตั้งจุดตรวจจับควันดำ และเฝ้าระวังการเกิดไฟป่า";
                        } else if (pmVal >= 25.1) {
                            policyAdv = "เฝ้าระวัง: ให้กลุ่มเสี่ยงระวังป้องกันตนเอง สวมหน้ากากอนามัย และเตรียมยกระดับมาตรการหากค่าฝุ่นสูงขึ้น";
                        } else {
                            policyAdv = "สถานการณ์ปกติ: ดำเนินมาตรการเฝ้าระวังตามปกติ";
                        }

                        let trendWarning = "";
                        // ปรับเงื่อนไขการเตือนแนวโน้มให้พิจารณาค่าฝุ่นปัจจุบันด้วย
                        let currentPMNum = parseFloat(globalWeatherData[province]?.currentPM25) || pmVal;
                        
                        if (dayMinus2Num > 25.0 && dayMinus1Num > 25.0 && currentPMNum >= 30.0 && dayMinus2Num < dayMinus1Num && dayMinus1Num < currentPMNum) {
                            trendWarning = "⚠️ แจ้งเตือนพิเศษ: แนวโน้มฝุ่นสูงขึ้นอย่างต่อเนื่อง ควรพิจารณายกระดับมาตรการป้องกันปัญหาฝุ่น PM2.5 ก่อนจะเริ่มมีผลกระทบต่อสุขภาพ";
                        }

                        // ปรับโครงสร้างข้อความที่ส่งให้ AI ใหม่ทั้งหมดให้เป็นระเบียบและครบถ้วน
                        contextData += `* ${province}:\n`;
                        contextData += `  - ${livePMText}\n`;
                        contextData += `  - PM2.5 รอบ 07.00 น. เช้านี้: ${pmToday} มคก./ลบ.ม.\n`;
                        contextData += `  - PM2.5 ย้อนหลัง 4 วัน: (เมื่อวาน: ${dayMinus1Num} | 2 วันก่อน: ${dayMinus2Num} | 3 วันก่อน: ${dayMinus3Num} | 4 วันก่อน: ${dayMinus4Num})\n`;
                        contextData += `  - สถานะเป้าหมายปี 2569: ${quotaText} | พบจุดความร้อน ${hotspot} จุด\n`;
                        contextData += `  - ${weatherText}\n`;
                        contextData += `  - คำแนะนำสุขภาพ: ${healthAdv}\n`;
                        contextData += `  - แนวทาง/มาตรการ: ${policyAdv}\n`;
                        
                        if (trendWarning !== "") {
                            contextData += `  - ข้อควรระวัง: ${trendWarning}\n`;
                        }
                        contextData += `\n`;
                    }

                    }
                });
                contextData += `ยอดรวมจุดความร้อนทั้งหมดในพื้นที่ สคพ.11 (4 จังหวัด) วันนี้ ${totalHotspots} จุด\n`;
            } else {
                contextData += "- ไม่มีข้อมูลหรือรอการอัปเดต\n";
            }

            try {
                const response = await fetch(gasWebAppUrl, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        contextData: contextData, // ส่งไปแค่ข้อมูลดิบ
                        password: password // ส่งรหัสผ่านไปตรวจสอบ
                    })
                });
                
                const data = await response.json();

        // ตรวจสอบกรณีรหัสผ่านผิด
                if (data.error === "Unauthorized") {
                    // ซ่อนข้อความกำลังโหลดให้หมดจด
                    resultDiv.style.display = 'none';
                    resultDiv.classList.add('hidden');
                    
                    // แสดงหน้าต่างรหัสผ่านและข้อความแจ้งเตือน
                    document.getElementById('passwordModal').classList.remove('hidden');
                    document.getElementById('passwordError').classList.remove('hidden');
                    document.getElementById('passwordError').innerText = 'รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง';
                    document.getElementById('aiPasswordInput').value = '';
                    document.getElementById('aiPasswordInput').focus();
                    
                    // คืนค่าปุ่มหลักให้กลับมากดได้ปกติ
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                    
                    return;
                }
                
                if (data.result) {
                    let cleanText = data.result
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                        .replace(/\n/g, '<br>');
                    
                    resultDiv.innerHTML = cleanText;
                    
                    resultDiv.innerHTML += `
                        <button id="copyToLineBtn" class="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md flex justify-center items-center gap-2">
                            📋 คัดลอกข้อความไปที่ LINE
                        </button>
                    `;

                    let clipboardText = data.result.replace(/\*\*(.*?)\*\*/g, '$1');

                    const copyBtn = document.getElementById('copyToLineBtn');
                    copyBtn.addEventListener('click', function() {
                        navigator.clipboard.writeText(clipboardText).then(() => {
                            const originalText = copyBtn.innerHTML;
                            copyBtn.innerHTML = '✅ คัดลอกข้อความสำเร็จแล้ว!';
                            copyBtn.classList.replace('bg-green-600', 'bg-blue-600');
                            copyBtn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');
                            
                            setTimeout(() => {
                                copyBtn.innerHTML = originalText;
                                copyBtn.classList.replace('bg-blue-600', 'bg-green-600');
                                copyBtn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
                            }, 2000);
                        }).catch(err => {
                            console.error('คัดลอกไม่สำเร็จ:', err);
                            alert('เกิดข้อผิดพลาดในการคัดลอกข้อความ โปรดลองใหม่อีกครั้ง');
                        });
                    });

                } else {
                    resultDiv.innerHTML = '<span class="text-red-600">เกิดข้อผิดพลาด: ' + (data.error || 'ไม่มีการส่งค่าผลลัพธ์กลับมา') + '</span>';
                }
            } catch (error) {
                console.error('Error fetching AI result:', error);
                resultDiv.innerHTML = '<span class="text-red-600">ไม่สามารถเชื่อมต่อระบบประมวลผล AI ได้ โปรดตรวจสอบว่าท่านได้ใส่ URL ของ Apps Script ให้ถูกต้อง</span>';
            } finally {
                if (document.getElementById('passwordModal').classList.contains('hidden')) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        }
