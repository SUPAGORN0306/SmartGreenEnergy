// ============================================================
//  CALCULATOR.JS - ฟังก์ชันคำนวณทั้งหมด
//  สำหรับ SmartGreenEnergy
// ============================================================

// ---------- คำนวณค่าไฟต่อหน่วย ----------
function calcAvgRate(bill, kwh) {
    if (kwh <= 0) return 0;
    return Math.round((bill / kwh) * 100) / 100;
}

// ---------- คำนวณการประหยัดตามประเภทกิจการ ----------
function calculateSavings(bill, businessType, budget) {
    // อัตราการประหยัดตามประเภทกิจการ
    let savingRate = 0.25; // default
    let recommendation = "";
    let deviceType = "";
    let options = [];

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
        case "สำนักงาน":
        default:
            savingRate = 0.20;
            recommendation = "ปรับตั้งเวลาเปิด-ปิดเครื่องใช้ไฟฟ้า + เปลี่ยนหลอดไฟ LED";
            deviceType = "LED + Automation";
            options = ["LED", "Automation"];
            break;
    }

    const monthlySaving = bill * savingRate;
    const yearlySaving = monthlySaving * 12;
    const roi = budget > 0 ? (yearlySaving / budget) * 100 : 0;
    const paybackPeriod = monthlySaving > 0 ? budget / monthlySaving : 999;

    // คำนวณ Carbon Reduction (สมมติ 0.5 kg CO2 ต่อ kWh, ค่าไฟ 10 บาท/kWh)
    const kwhPerMonth = bill / 10;
    const carbonPerYear = kwhPerMonth * 12 * 0.5 / 1000; // ตัน/ปี
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
    // เริ่มจาก 85% ของปัจจุบัน แล้วค่อยๆ เพิ่มขึ้นตามฤดูกาล
    for (let i = 0; i < months; i++) {
        const base = currentBill * (0.82 + (i / months) * 0.18);
        // เพิ่มความผันผวนตามฤดูกาล (ร้อน = สูง, หนาว = ต่ำ)
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

    let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0;
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

// ---------- จำลองข้อมูลการใช้งานรายชั่วโมง (สำหรับกราฟ) ----------
function generateHourlyUsage() {
    const hours = [];
    for (let h = 0; h < 24; h++) {
        let base = 0;
        if (h >= 6 && h <= 8) base = 30; // เช้า
        else if (h >= 9 && h <= 12) base = 60; // สาย
        else if (h >= 13 && h <= 17) base = 70; // บ่าย
        else if (h >= 18 && h <= 21) base = 50; // เย็น
        else base = 15; // กลางคืน
        const variance = 1 + (Math.random() - 0.5) * 0.2;
        hours.push(Math.round(base * variance));
    }
    return hours;
}

// ---------- ข้อมูลตัวอย่างสำหรับประเภทกิจการ ----------
function getBusinessExamples() {
    return {
        "ร้านอาหาร": { bill: 25000, kwh: 2500, budget: 200000 },
        "สำนักงาน": { bill: 35000, kwh: 3500, budget: 300000 },
        "โรงงาน": { bill: 120000, kwh: 12000, budget: 800000 },
        "ห้างสรรพสินค้า": { bill: 80000, kwh: 8000, budget: 600000 },
        "โรงแรม": { bill: 60000, kwh: 6000, budget: 500000 }
    };
}

// ---------- คำนวณอุปกรณ์ที่เหมาะสม ----------
function getDeviceRecommendations(businessType, budget) {
    const allDevices = [
        { name: "LED Lighting", icon: "💡", cost: 5000, saving: 8, desc: "เปลี่ยนหลอดไฟเป็น LED" },
        { name: "Inverter AC", icon: "❄️", cost: 50000, saving: 15, desc: "เปลี่ยนแอร์เป็น Inverter" },
        { name: "VFD", icon: "⚙️", cost: 80000, saving: 12, desc: "ติดตั้ง VFD ในมอเตอร์" },
        { name: "PFC", icon: "🔌", cost: 60000, saving: 10, desc: "ปรับปรุงคุณภาพไฟฟ้า" },
        { name: "Solar", icon: "☀️", cost: 300000, saving: 25, desc: "ติดตั้ง Solar Cell" },
        { name: "BESS", icon: "🔋", cost: 400000, saving: 18, desc: "ระบบกักเก็บพลังงาน" },
        { name: "BMS", icon: "🤖", cost: 150000, saving: 20, desc: "ระบบบริหารจัดการอาคาร" },
        { name: "Automation", icon: "📱", cost: 30000, saving: 10, desc: "ระบบควบคุมอัตโนมัติ" }
    ];

    // ตามประเภทกิจการ
    let recommended = [];
    switch (businessType) {
        case "โรงงาน":
            recommended = ["LED Lighting", "VFD", "PFC", "Solar", "BESS"];
            break;
        case "ร้านอาหาร":
            recommended = ["LED Lighting", "Inverter AC", "Solar", "Automation"];
            break;
        case "โรงแรม":
            recommended = ["LED Lighting", "Inverter AC", "BMS", "Solar"];
            break;
        case "ห้างสรรพสินค้า":
            recommended = ["LED Lighting", "Inverter AC", "BMS", "Solar", "BESS"];
            break;
        default: // สำนักงาน
            recommended = ["LED Lighting", "Inverter AC", "Automation", "Solar"];
            break;
    }

    // กรองตามงบประมาณ
    const result = allDevices
        .filter(d => recommended.includes(d.name) && d.cost <= budget * 0.8)
        .map(d => ({
            ...d,
            monthlySaving: Math.round(50000 * (d.saving / 100)), // สมมติค่าไฟ 50,000
            payback: Math.round(d.cost / (50000 * (d.saving / 100)))
        }));

    return result.length > 0 ? result : allDevices.slice(0, 3).map(d => ({
        ...d,
        monthlySaving: Math.round(50000 * (d.saving / 100)),
        payback: Math.round(d.cost / (50000 * (d.saving / 100)))
    }));
}
