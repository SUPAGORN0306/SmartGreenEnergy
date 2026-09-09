// ============================================================
//  CALCULATOR.JS - ฟังก์ชันคำนวณทั้งหมด
//  รับข้อมูลจาก JSON ที่ส่งมา ไม่มีฮาร์ดโค้ด
// ============================================================

// ---------- คำนวณค่าไฟต่อหน่วย ----------
function calcAvgRate(bill, kwh) {
    if (kwh <= 0) return 0;
    return Math.round((bill / kwh) * 100) / 100;
}

// ---------- คำนวณการประหยัดตามประเภทกิจการ (รับ appData) ----------
function calculateSavings(bill, kwh, businessType, budget, appData) {
    // ตั้งค่าเริ่มต้น
    let savingRate = 0.20;
    let recommendation = "ปรับตั้งเวลาเปิด-ปิดเครื่องใช้ไฟฟ้า + เปลี่ยนหลอดไฟ LED";
    let deviceType = "LED + Automation";
    let options = ["LED", "Automation"];

    // ถ้ามีข้อมูลใน JSON ให้ใช้
    if (appData && appData.businesses && appData.businesses[businessType]) {
        const biz = appData.businesses[businessType];
        // ใช้ค่าจาก JSON ถ้ามี
        if (biz.savingRate) savingRate = biz.savingRate;
        if (biz.recommendation) recommendation = biz.recommendation;
        if (biz.deviceType) deviceType = biz.deviceType;
        if (biz.options) options = biz.options;
    } else {
        // fallback ตามประเภทกิจการ
        switch (businessType) {
            case "โรงงาน":
                savingRate = 0.30;
                recommendation = "ติดตั้ง Solar ขนาด 50kW + เปลี่ยนมอเตอร์เป็น Inverter + ติดตั้ง VFD";
                deviceType = "Solar + Inverter + VFD";
                options = ["Solar", "Inverter", "VFD", "PFC"];
                break;
            case "ร้านอาหาร":
                savingRate = 0.20;
                recommendation = "เปลี่ยนแอร์เป็น Inverter + ติดตั้ง Solar ขนาด 10kW";
                deviceType = "Inverter + Solar";
                options = ["Inverter", "Solar", "LED"];
                break;
            case "โรงแรม":
                savingRate = 0.22;
                recommendation = "ติดตั้งระบบ BMS + เปลี่ยนแอร์เป็น Inverter + Solar ขนาด 20kW";
                deviceType = "BMS + Inverter + Solar";
                options = ["BMS", "Inverter", "Solar", "LED"];
                break;
            case "ห้างสรรพสินค้า":
                savingRate = 0.25;
                recommendation = "เปลี่ยนหลอดไฟ LED + ตั้งเวลาเปิด-ปิด + Solar ขนาด 30kW";
                deviceType = "LED + Automation + Solar";
                options = ["LED", "Automation", "Solar", "BESS"];
                break;
            default:
                savingRate = 0.20;
                recommendation = "ปรับตั้งเวลาเปิด-ปิดเครื่องใช้ไฟฟ้า + เปลี่ยนหลอดไฟ LED";
                deviceType = "LED + Automation";
                options = ["LED", "Automation"];
        }
    }

    const monthlySaving = bill * savingRate;
    const yearlySaving = monthlySaving * 12;
    const roi = budget > 0 ? (yearlySaving / budget) * 100 : 0;
    const paybackPeriod = monthlySaving > 0 ? budget / monthlySaving : 999;

    // คำนวณ Carbon (ใช้ kwh จริง)
    const carbonFactor = appData?.carbonFactors?.co2PerKwh || 0.5;
    const carbonPerYear = kwh * 12 * carbonFactor / 1000;
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

// ---------- สร้างข้อมูลย้อนหลัง 12 เดือน (คงเดิม) ----------
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

// ---------- ทำนายค่าไฟล่วงหน้า (คงเดิม) ----------
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

// ---------- จำลองข้อมูลการใช้งานรายชั่วโมง ----------
function generateHourlyUsage() {
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

// ---------- ดึงอุปกรณ์แนะนำจาก JSON ----------
function getDeviceRecommendations(businessType, budget, bill, appData) {
    const allDevices = appData?.deviceOptions || {};

    // แปลง object เป็น array
    const deviceList = Object.entries(allDevices).map(([key, value]) => ({
        id: key,
        name: value.name || key,
        icon: value.icon || '🔧',
        cost: value.cost || 0,
        saving: value.saving || 10,
        payback: value.payback || 12,
        desc: value.desc || ''
    }));

    // ตามประเภทกิจการ
    let recommended = [];
    const bizData = appData?.businesses?.[businessType];
    if (bizData && bizData.options) {
        recommended = bizData.options;
    } else {
        switch (businessType) {
            case "โรงงาน":
                recommended = ["Solar", "VFD", "PFC", "LED"];
                break;
            case "ร้านอาหาร":
                recommended = ["LED", "Inverter", "Solar"];
                break;
            case "โรงแรม":
                recommended = ["LED", "Inverter", "BMS", "Solar"];
                break;
            case "ห้างสรรพสินค้า":
                recommended = ["LED", "Inverter", "BMS", "Solar", "BESS"];
                break;
            default:
                recommended = ["LED", "Inverter", "Automation", "Solar"];
        }
    }

    const result = deviceList
        .filter(d => recommended.includes(d.id) && d.cost <= budget * 0.8)
        .map(d => ({
            ...d,
            monthlySaving: Math.round(bill * (d.saving / 100)),
            payback: Math.round(d.cost / (bill * (d.saving / 100)))
        }));

    return result.length > 0 ? result : deviceList.slice(0, 3).map(d => ({
        ...d,
        monthlySaving: Math.round(bill * (d.saving / 100)),
        payback: Math.round(d.cost / (bill * (d.saving / 100)))
    }));
}
