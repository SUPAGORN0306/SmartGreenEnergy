// ============================================================
// MAIN.JS - จัดการการแสดงผลและข้อมูลผู้ใช้งาน
// ============================================================

function loadUserData() {
    return {
        bill: parseFloat(localStorage.getItem('sg_bill')) || 25000,
        kwh: parseFloat(localStorage.getItem('sg_kwh')) || 2500,
        province: localStorage.getItem('sg_province') || 'กรุงเทพฯ',
        area: parseFloat(localStorage.getItem('sg_area')) || 150,
        business: localStorage.getItem('sg_business') || 'ร้านอาหาร',
        budget: parseFloat(localStorage.getItem('sg_budget')) || 200000
    };
}

function saveUserDataFromForm() {
    const bill = document.getElementById('bill')?.value;
    const kwh = document.getElementById('kwh')?.value;
    const province = document.getElementById('province')?.value;
    const area = document.getElementById('area')?.value;
    const business = document.getElementById('business')?.value;
    const budget = document.getElementById('budget')?.value;

    if (!bill || parseFloat(bill) <= 0 || !kwh || parseFloat(kwh) <= 0 || !business) {
        alert('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
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

function renderDashboard() {
    const data = loadUserData();
    const savings = calculateSavings(data.bill, data.business, data.budget);
    const historical = generateHistoricalData(data.bill);
    const future = predictFutureBill(historical);
    const hourlyData = generateHourlyUsage(data.kwh);

    setElement('currentBill', data.bill.toLocaleString() + ' บาท');
    setElement('currentKwh', data.kwh.toLocaleString() + ' kWh');
    setElement('monthlySaving', savings.monthlySaving.toLocaleString() + ' บาท/เดือน');
    setElement('carbonReduce', savings.carbonReduction.toFixed(2) + ' ตัน/ปี');
    setElement('carbonCurrent', savings.carbonCurrent.toFixed(2) + ' ตัน/ปี');
    setElement('solarCost', data.budget.toLocaleString() + ' บาท');
    setElement('solarSaving', savings.monthlySaving.toLocaleString() + ' บาท');
    setElement('solarPayback', savings.paybackPeriod.toFixed(1) + ' ปี');
    setElement('solarROI', savings.roi.toFixed(1) + '%');
}

function setElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('currentBill')) {
        renderDashboard();
    }
});
