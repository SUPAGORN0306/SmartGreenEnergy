// ============================================================
// CALCULATOR.JS - ระบบคำนวณเชิงกำหนด (Deterministic Calculation)
// ============================================================

function calcAvgRate(bill, kwh) {
    if (kwh <= 0) return 0;
    return Math.round((bill / kwh) * 100) / 100;
}

function calculateSavings(bill, businessType, budget) {
    let savingRate = 0.20;
    let recommendation = "ปรับปรุงประสิทธิภาพการใช้พลังงานภายในอาคาร";
    
    switch (businessType) {
        case "โรงงาน":
            savingRate = 0.30;
            recommendation = "ติดตั้งระบบผลิตไฟฟ้าแสงอาทิตย์ร่วมกับอินเวอร์เตอร์และอุปกรณ์ปรับความเร็วรอบมอเตอร์ (VFD)";
            break;
        case "ร้านอาหาร":
            savingRate = 0.20;
            recommendation = "เปลี่ยนเครื่องปรับอากาศเป็นระบบอินเวอร์เตอร์และติดตั้งโซล่าเซลล์ขนาดเหมาะสม";
            break;
        case "โรงแรม":
            savingRate = 0.22;
            recommendation = "ติดตั้งระบบบริหารจัดการพลังงานอัจฉริยะ (BMS) และระบบโซล่าเซลล์";
            break;
        case "ห้างสรรพสินค้า":
            savingRate = 0.25;
            recommendation = "เปลี่ยนระบบแสงสว่างเป็นหลอด LED และติดตั้งระบบโซล่าเซลล์ขนาดใหญ่";
            break;
        case "สำนักงาน":
        default:
            savingRate = 0.20;
            recommendation = "ปรับตั้งเวลาการทำงานระบบปรับอากาศและเปลี่ยนมาใช้หลอดไฟประหยัดพลังงาน";
            break;
    }

    const monthlySaving = bill * savingRate;
    const yearlySaving = monthlySaving * 12;
    const roi = budget > 0 ? (yearlySaving / budget) * 100 : 0;
    const paybackPeriod = monthlySaving > 0 ? budget / monthlySaving : 999;

    const kwhPerMonth = bill / 5; 
    const carbonPerYear = (kwhPerMonth * 12 * 0.5) / 1000; // ตัน CO2 ต่อปี
    const carbonReduction = carbonPerYear * savingRate;

    return {
        savingRate: Math.round(savingRate * 100),
        monthlySaving: Math.round(monthlySaving),
        yearlySaving: Math.round(yearlySaving),
        roi: Math.round(roi * 10) / 10,
        paybackPeriod: Math.round(paybackPeriod * 10) / 10,
        recommendation: recommendation,
        carbonReduction: Math.round(carbonReduction * 100) / 100,
        carbonCurrent: Math.round(carbonPerYear * 100) / 100
    };
}

function generateHistoricalData(currentBill, months = 12) {
    const data = [];
    // คำนวณแนวโน้มย้อนหลังแบบมีทิศทางคงที่ ไม่อาศัยการสุ่ม
    for (let i = 0; i < months; i++) {
        const factor = 0.85 + (i * 0.012);
        data.push(Math.round(currentBill * factor));
    }
    return data;
}

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

function calcPercentChange(current, previous) {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function generateHourlyUsage(currentKwh) {
    const hours = [];
    const baseHourPattern = [
        10, 8, 8, 10, 15, 25, 40, 60, 75, 85, 90, 85, 
        80, 85, 90, 95, 85, 70, 50, 40, 30, 20, 15, 12
    ];
    const totalPatternSum = baseHourPattern.reduce((a, b) => a + b, 0);
    const dailyKwh = currentKwh / 30;

    for (let h = 0; h < 24; h++) {
        const proportion = baseHourPattern[h] / totalPatternSum;
        hours.push(Math.round(dailyKwh * proportion * 24));
    }
    return hours;
}

function getBusinessExamples() {
    return {
        "ร้านอาหาร": { bill: 25000, kwh: 2500, budget: 200000 },
        "สำนักงาน": { bill: 35000, kwh: 3500, budget: 300000 },
        "โรงงาน": { bill: 120000, kwh: 12000, budget: 800000 },
        "ห้างสรรพสินค้า": { bill: 80000, kwh: 8000, budget: 600000 },
        "โรงแรม": { bill: 60000, kwh: 6000, budget: 500000 }
    };
}
