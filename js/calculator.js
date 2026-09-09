// ============================================================
//  CALCULATOR.JS - ฟังก์ชันคำนวณทั้งหมด
//  ใช้ข้อมูลจาก sample-data.json เท่านั้น
// ============================================================

// ---------- คำนวณค่าไฟต่อหน่วย (ใช้ข้อมูลจังหวัดจริง) ----------
function calcAvgRate(bill, kwh, province, ratesData) {
    if (kwh <= 0) return { avg: 0, rate: 0, provider: '-', diff: 0 };
    
    const avg = bill / kwh;
    const rateInfo = ratesData?.[province] || { rate: 4.20, provider: 'กฟภ.' };
    
    return {
        avg: Math.round(avg * 100) / 100,
        rate: rateInfo.rate,
        provider: rateInfo.provider,
        diff: Math.round((avg - rateInfo.rate) * 100) / 100
    };
}

// ---------- คำนวณการประหยัด (ใช้ข้อมูลจาก JSON) ----------
function calculateSavings(bill, kwh, businessType, budget, appData) {
    // ดึงข้อมูลจาก JSON
    const bizData = appData?.businesses?.[businessType];
    const carbonFactor = appData?.carbonFactors?.co2PerKwh || 0.5;
    
    // ค่าเริ่มต้น
    let savingRate = 0.20;
    let recommendation = "ปรับตั้งเวลาเปิด-ปิดเครื่องใช้ไฟฟ้า + เปลี่ยนหลอดไฟ LED";
    let deviceType = "LED + Automation";
    let options = ["LED", "Automation"];
    
    // ถ้ามีข้อมูลใน JSON ให้ใช้
    if (bizData) {
        savingRate = bizData.savingRate || savingRate;
        recommendation = bizData.recommendation || recommendation;
        deviceType = bizData.deviceType || deviceType;
        options = bizData.options || options;
    }
    
    // คำนวณ
    const monthlySaving = bill * savingRate;
    const yearlySaving = monthlySaving * 12;
    const roi = budget > 0 ? (yearlySaving / budget) * 100 : 0;
    const paybackPeriod = monthlySaving > 0 ? budget / monthlySaving : 999;
    
    // Carbon (ใช้ kWh จริง)
    const carbonPerYear = (kwh * 12 * carbonFactor) / 1000;
    const carbonReduction = carbonPerYear * savingRate;
    
    return {
        savingRate: Math.round(savingRate * 100),
        monthlySaving: Math.round(monthlySaving),
        yearlySaving: Math.round(yearlySaving),
        roi: Math.round(roi * 10) / 10,
        paybackPeriod: Math.round(paybackPeriod * 10) / 10,
        recommendation: recommendation,
        deviceType: deviceType,
        options: options,
        carbonReduction: Math.round(carbonReduction * 100) / 100,
        carbonCurrent: Math.round(carbonPerYear * 100) / 100
    };
}

// ---------- สร้างข้อมูลย้อนหลัง 12 เดือน ----------
function generateHistoricalData(currentBill, months = 12) {
    const data = [];
    for (let i = 0; i < months; i++) {
        const base = currentBill * (0.82 + (i / months) * 0.18);
        const season = 1 + 0.08 * Math.sin((i + 3) * Math.PI / 6);
        const variance = 1 + (Math.random() - 0.5) * 0.06;
        data.push(Math.round(base * season * variance));
    }
    return data;
}

// ---------- ทำนายค่าไฟล่วงหน้า (Linear Regression) ----------
function predictFutureBill(historicalData, months = 6) {
    const n = historicalData.length;
    if (n < 2) return [];

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += historicalData[i];
        sumXY += i * historicalData[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions = [];
    for (let i = n; i < n + months; i++) {
        predictions.push(Math.round(slope * i + intercept));
    }
    return predictions;
}

// ---------- คำนวณเปอร์เซ็นต์เปลี่ยนแปลง ----------
function calcPercentChange(current, previous) {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// ---------- สร้างข้อมูลการใช้ไฟรายชั่วโมง (จาก JSON) ----------
function getHourlyUsageFromData(businessType, appData) {
    const pattern = appData?.hourlyUsagePattern?.[businessType];
    if (pattern && pattern.length === 24) {
        return pattern;
    }
    // fallback: สร้างเอง
    const hours = [];
    for (let h = 0; h < 24; h++) {
        let base = 0;
        if (h >= 6 && h <= 8) base = 30;
        else if (h >= 9 && h <= 12) base = 60;
        else if (h >= 13 && h <= 17) base = 70;
        else if (h >= 18 && h <= 21) base = 50;
        else base = 15;
        const variance = 1 + (Math.random() - 0.5) * 0.2;
        hours.push(Math.round(base * variance));
    }
    return hours;
}

// ---------- ดึงอุปกรณ์แนะนำ (จาก JSON) ----------
function getDeviceRecommendations(businessType, budget, bill, appData) {
    const allDevices = appData?.deviceOptions || {};
    const bizData = appData?.businesses?.[businessType];
    
    // แปลง object เป็น array
    const deviceList = Object.entries(allDevices).map(([key, value]) => ({
        id: key,
        name: value.name || key,
        cost: value.cost || 0,
        saving: value.saving || 10,
        payback: value.payback || 12,
        desc: value.desc || ''
    }));
    
    // ตัวเลือกที่แนะนำตามประเภทกิจการ
    let recommended = bizData?.options || ["LED", "Automation", "Solar"];
    
    // กรองตามงบประมาณ และคำนวณตัวเลขจริง
    const result = deviceList
        .filter(d => recommended.includes(d.id) && d.cost <= budget * 0.8)
        .map(d => ({
            ...d,
            monthlySaving: Math.round(bill * (d.saving / 100)),
            payback: Math.round(d.cost / (bill * (d.saving / 100)))
        }));
    
    // ถ้าไม่มีเลย ให้แสดง 3 ตัวเลือกแรก
    if (result.length === 0) {
        return deviceList.slice(0, 3).map(d => ({
            ...d,
            monthlySaving: Math.round(bill * (d.saving / 100)),
            payback: Math.round(d.cost / (bill * (d.saving / 100)))
        }));
    }
    
    return result;
}
