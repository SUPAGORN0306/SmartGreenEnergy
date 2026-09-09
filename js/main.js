// ============================================================
//  MAIN.JS - จัดการ UI และการทำงานทั้งหมด
//  โหลดข้อมูลจาก data/sample-data.json ทั้งหมด
// ============================================================

let appData = null; // เก็บข้อมูลทั้งหมดจาก JSON

// ---------- โหลดข้อมูลจาก JSON ----------
async function loadAppData() {
    try {
        const response = await fetch('data/sample-data.json');
        if (!response.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
        appData = await response.json();
        console.log('✅ โหลดข้อมูล sample-data.json สำเร็จ');
        return appData;
    } catch (error) {
        console.error('❌ โหลดข้อมูลล้มเหลว:', error);
        return null;
    }
}

// ---------- โหลดข้อมูลผู้ใช้จาก localStorage ----------
function loadUserData() {
    return {
        bill: parseFloat(localStorage.getItem('sg_bill')) || 0,
        kwh: parseFloat(localStorage.getItem('sg_kwh')) || 0,
        province: localStorage.getItem('sg_province') || '',
        area: parseFloat(localStorage.getItem('sg_area')) || 0,
        business: localStorage.getItem('sg_business') || '',
        budget: parseFloat(localStorage.getItem('sg_budget')) || 0
    };
}

// ---------- บันทึกข้อมูลจากฟอร์ม ----------
function saveUserData() {
    const bill = document.getElementById('bill')?.value;
    const kwh = document.getElementById('kwh')?.value;
    const province = document.getElementById('province')?.value;
    const area = document.getElementById('area')?.value;
    const business = document.getElementById('business')?.value;
    const budget = document.getElementById('budget')?.value;

    if (!bill || parseFloat(bill) <= 0) {
        alert('⚠️ กรุณากรอกค่าไฟฟ้ารายเดือน');
        return;
    }
    if (!kwh || parseFloat(kwh) <= 0) {
        alert('⚠️ กรุณากรอกปริมาณการใช้ไฟฟ้า');
        return;
    }
    if (!business) {
        alert('⚠️ กรุณาเลือกประเภทกิจการ');
        return;
    }
    if (!budget || parseFloat(budget) <= 0) {
        alert('⚠️ กรุณากรอกงบประมาณลงทุน');
        return;
    }

    localStorage.setItem('sg_bill', bill);
    localStorage.setItem('sg_kwh', kwh);
    localStorage.setItem('sg_province', province || '');
    localStorage.setItem('sg_area', area || '0');
    localStorage.setItem('sg_business', business);
    localStorage.setItem('sg_budget', budget);

    window.location.href = 'dashboard.html';
}

// ---------- โหลดตัวอย่างข้อมูลจาก JSON ----------
async function loadSampleData() {
    const business = document.getElementById('business')?.value;
    if (!business) {
        alert('⚠️ กรุณาเลือกประเภทกิจการก่อน');
        return;
    }

    // โหลดข้อมูลจาก JSON ถ้ายังไม่มี
    if (!appData) {
        await loadAppData();
    }

    const sample = appData?.businesses?.[business];
    if (!sample) {
        alert('⚠️ ไม่พบข้อมูลตัวอย่างสำหรับกิจการนี้');
        return;
    }

    if (document.getElementById('bill')) {
        document.getElementById('bill').value = sample.monthlyBill || 0;
    }
    if (document.getElementById('kwh')) {
        document.getElementById('kwh').value = sample.monthlyKwh || 0;
    }
    if (document.getElementById('budget')) {
        document.getElementById('budget').value = sample.budget || 0;
    }
    if (document.getElementById('area')) {
        document.getElementById('area').value = sample.area || '';
    }
    if (document.getElementById('province')) {
        document.getElementById('province').value = sample.province || '';
    }

    console.log(`✅ โหลดตัวอย่างข้อมูล: ${business}`, sample);
}

// ---------- ดึงข้อมูลจาก JSON ตามประเภทกิจการ ----------
function getBusinessData(businessType) {
    if (!appData) return null;
    return appData.businesses?.[businessType] || null;
}

// ---------- ดึงสัดส่วนพลังงานจาก JSON ----------
function getEnergyPieData(businessType) {
    if (!appData) return null;
    return appData.energyPieData || {
        "เครื่องปรับอากาศ": 45,
        "อุปกรณ์ครัว": 25,
        "แสงสว่าง": 15,
        "เครื่องจักร": 10,
        "อื่นๆ": 5
    };
}

// ---------- ดึงข้อมูลการใช้ไฟรายชั่วโมงจาก JSON ----------
function getHourlyUsage(businessType) {
    if (!appData) return null;
    const hourly = appData.hourlyUsagePattern?.[businessType];
    if (!hourly) return null;
    return Object.values(hourly);
}

// ---------- ดึงข้อมูล Solar จาก JSON ----------
function getSolarInfo() {
    if (!appData) return null;
    return appData.solarInfo || {
        costPerKw: 35000,
        averageSunHours: 5,
        lifetimeYears: 25,
        efficiency: 0.85
    };
}

// ---------- ดึงข้อมูล Carbon Factor จาก JSON ----------
function getCarbonFactor() {
    if (!appData) return null;
    return appData.carbonFactors || {
        co2PerKwh: 0.5,
        treeEquivalent: 20,
        carKmEquivalent: 2100
    };
}

// ---------- ดึงข้อมูลอุปกรณ์จาก JSON ----------
function getDeviceOptions() {
    if (!appData) return null;
    return appData.deviceOptions || {};
}

// ---------- แสดง Dashboard ----------
async function renderDashboard() {
    // โหลดข้อมูล JSON
    if (!appData) {
        await loadAppData();
    }

    const data = loadUserData();
    if (data.bill === 0 || data.kwh === 0) {
        window.location.href = 'input.html';
        return;
    }

    const savings = calculateSavings(
        data.bill,
        data.kwh,
        data.business,
        data.budget,
        appData
    );

    const historical = generateHistoricalData(data.bill);
    const future = predictFutureBill(historical);
    const hourlyData = getHourlyUsage(data.business) || generateHourlyUsage();
    const pieData = getEnergyPieData(data.business);
    const solarInfo = getSolarInfo();
    const carbonFactor = getCarbonFactor();

    // คำนวณค่าไฟต่อหน่วย
    const avgRate = data.kwh > 0 ? data.bill / data.kwh : 0;

    // แสดง Key Metrics
    setElement('currentBill', data.bill.toLocaleString());
    setElement('currentKwh', data.kwh.toLocaleString());
    setElement('avgRate', avgRate.toFixed(2));
    setElement('monthlySaving', savings.monthlySaving.toLocaleString());
    setElement('roi', savings.roi.toFixed(1) + '%');
    setElement('payback', savings.paybackPeriod.toFixed(1) + ' ปี');
    setElement('carbonReduce', savings.carbonReduction.toFixed(2));
    setElement('carbonCurrent', savings.carbonCurrent.toFixed(2));

    // เปอร์เซ็นต์เปลี่ยนแปลง
    const prevBill = historical[historical.length - 2] || data.bill;
    const billChange = calcPercentChange(data.bill, prevBill);
    setElement('billChange', (billChange > 0 ? '▲ ' : '▼ ') + Math.abs(billChange).toFixed(1) + '%');

    const prevKwh = data.kwh * 0.95;
    const kwhChange = calcPercentChange(data.kwh, prevKwh);
    setElement('kwhChange', (kwhChange > 0 ? '▲ ' : '▼ ') + Math.abs(kwhChange).toFixed(1) + '%');

    // คำแนะนำ
    setElement('recommendationText', savings.recommendation);

    // ข้อมูล Solar
    const solarCost = (10 * (solarInfo?.costPerKw || 35000));
    const solarSaving = data.bill * 0.25;
    const solarROI = ((solarSaving * 12) / solarCost) * 100;
    const solarPayback = solarCost / solarSaving;

    setElement('solarCost', solarCost.toLocaleString());
    setElement('solarSaving', Math.round(solarSaving).toLocaleString());
    setElement('solarROI', solarROI.toFixed(1) + '%');
    setElement('solarPayback', solarPayback.toFixed(1) + ' ปี');
    setElement('solarLifetime', (solarInfo?.lifetimeYears || 25) + ' ปี');

    // Before/After
    const afterBill = data.bill - savings.monthlySaving;
    setElement('beforeBill', data.bill.toLocaleString());
    setElement('afterBill', afterBill.toLocaleString());
    setElement('savingAmount', savings.monthlySaving.toLocaleString());
    setElement('beforeCarbon', savings.carbonCurrent.toFixed(2));
    setElement('afterCarbon', (savings.carbonCurrent - savings.carbonReduction).toFixed(2));

    // สร้างกราฟ
    createTrendChart(historical, future);
    createPieChart(pieData);
    createHourlyChart(hourlyData);

    // อัปเดตชื่อใน Sidebar
    setElement('sidebarName', localStorage.getItem('sg_name') || 'Supagorn');
    setElement('sidebarBusiness', data.business || 'เจ้าของกิจการ');
}

// ---------- ฟังก์ชันช่วยแสดงผล ----------
function setElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ---------- ฟังก์ชันอื่นๆ (คงเดิม) ----------
// ... (createTrendChart, createPieChart, createHourlyChart, showComparison, etc.)
// ส่วนนี้คงโค้ดเดิมจากที่เคยมี

// ---------- เรียกใช้เมื่อหน้าโหลด ----------
document.addEventListener('DOMContentLoaded', function() {
    // หน้า Dashboard
    if (document.getElementById('trendChart')) {
        renderDashboard();
    }

    // หน้า Recommend
    if (document.getElementById('deviceRecommendations')) {
        showComparison();
    }

    // หน้า Input: ตัวอย่างข้อมูล
    const businessSelect = document.getElementById('business');
    if (businessSelect) {
        businessSelect.addEventListener('change', function() {
            const btn = document.getElementById('loadSampleBtn');
            if (btn) btn.style.display = 'inline-block';
        });
    }
});
