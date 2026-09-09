// ============================================================
//  CALCULATOR.JS - ฟังก์ชันคำนวณทั้งหมด
//  ใช้ข้อมูลจาก sample-data.json
// ============================================================

// ---------- คำนวณค่าไฟต่อหน่วย ----------
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

// ---------- คำนวณการประหยัด ----------
function calculateSavings(bill, kwh, businessType, budget, appData) {
    const bizData = appData?.businesses?.[businessType];
    const carbonFactor = appData?.carbonFactors?.co2PerKwh || 0.5;

    let savingRate = 0.20;
    let recommendation = "ปรับตั้งเวลาเปิด-ปิดเครื่องใช้ไฟฟ้า + เปลี่ยนหลอดไฟ LED";
    let deviceType = "LED + Automation";
    let options = ["LED", "Automation"];

    if (bizData) {
        savingRate = bizData.savingRate || savingRate;
        recommendation = bizData.recommendation || recommendation;
        deviceType = bizData.deviceType || deviceType;
        options = bizData.options || options;
    }

    const monthlySaving = bill * savingRate;
    const yearlySaving = monthlySaving * 12;
    const roi = budget > 0 ? (yearlySaving / budget) * 100 : 0;
    const paybackPeriod = monthlySaving > 0 ? budget / monthlySaving : 999;

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

// ---------- ทำนายค่าไฟล่วงหน้า ----------
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

// ---------- ดึงอุปกรณ์แนะนำ ----------
function getDeviceRecommendations(businessType, budget, bill, appData) {
    const allDevices = appData?.deviceOptions || {};
    const bizData = appData?.businesses?.[businessType];

    const deviceList = Object.entries(allDevices).map(([key, value]) => ({
        id: key,
        name: value.name || key,
        cost: value.cost || 0,
        saving: value.saving || 10,
        payback: value.payback || 12,
        desc: value.desc || ''
    }));

    let recommended = bizData?.options || ["LED", "Automation", "Solar"];

    const result = deviceList
        .filter(d => recommended.includes(d.id) && d.cost <= budget * 0.8)
        .map(d => ({
            ...d,
            monthlySaving: Math.round(bill * (d.saving / 100)),
            payback: Math.round(d.cost / (bill * (d.saving / 100)))
        }));

    if (result.length === 0) {
        return deviceList.slice(0, 3).map(d => ({
            ...d,
            monthlySaving: Math.round(bill * (d.saving / 100)),
            payback: Math.round(d.cost / (bill * (d.saving / 100)))
        }));
    }

    return result;
}

// ---------- Solar Estimation ----------
function estimateSolar(bill, kwh, areaSqm, budget) {
    const kwpFromArea = areaSqm / 7;
    const kwpFromUsage = kwh / 150;
    const recKwp = Math.max(0.5, Math.min(kwpFromArea, kwpFromUsage));
    const dailyProdPerKwp = 4.2;
    const monthlyProduction = recKwp * dailyProdPerKwp * 30;
    const offset = Math.min(monthlyProduction / Math.max(kwh, 1), 0.9);
    const savings = bill * offset;
    const newBill = Math.max(bill - savings, bill * 0.08);
    const systemCost = recKwp * 36000;
    const paybackYears = savings > 0 ? systemCost / (savings * 12) : 99;
    const co2Month = monthlyProduction * 0.5;

    return {
        recKwp: Math.round(recKwp * 10) / 10,
        monthlyProduction: Math.round(monthlyProduction),
        savings: Math.round(savings),
        newBill: Math.round(newBill),
        systemCost: Math.round(systemCost),
        paybackYears: Math.round(paybackYears * 10) / 10,
        co2Month: Math.round(co2Month),
        offset: Math.round(offset * 100)
    };
}
