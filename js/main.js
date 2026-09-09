// ============================================================
//  MAIN.JS - จัดการ UI และการทำงานทั้งหมด
// ============================================================

let appData = null;

// ---------- โหลดข้อมูลจาก JSON ----------
async function loadAppData() {
    try {
        const response = await fetch('data/sample-data.json');
        if (!response.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
        appData = await response.json();
        console.log('✅ โหลดข้อมูลสำเร็จ');
        return appData;
    } catch (error) {
        console.error('❌ โหลดข้อมูลล้มเหลว:', error);
        return null;
    }
}

// ---------- ฟังก์ชันช่วยแสดงผล ----------
function setElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function fmtBaht(n) {
    return '฿' + Math.round(n).toLocaleString('th-TH');
}

// ---------- Solar Estimation Engine ----------
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

// ---------- Breakdown Data ----------
const breakdowns = {
    'ร้านอาหาร': { labels: ['เครื่องปรับอากาศ', 'อุปกรณ์ครัว', 'แสงสว่าง', 'อื่นๆ'], data: [40, 35, 15, 10] },
    'สำนักงาน': { labels: ['เครื่องปรับอากาศ', 'อุปกรณ์สำนักงาน', 'แสงสว่าง', 'อื่นๆ'], data: [50, 25, 15, 10] },
    'โรงงาน': { labels: ['เครื่องจักร', 'ระบบทำความเย็น', 'แสงสว่าง', 'อื่นๆ'], data: [60, 18, 12, 10] },
    'ห้างสรรพสินค้า': { labels: ['เครื่องปรับอากาศ', 'แสงสว่าง', 'อุปกรณ์ไฟฟ้า', 'อื่นๆ'], data: [45, 30, 15, 10] },
    'โรงแรม': { labels: ['เครื่องปรับอากาศ', 'ทำน้ำอุ่น', 'แสงสว่าง', 'อื่นๆ'], data: [42, 26, 20, 12] }
};

const palette = ['#3E7C82', '#8AA48D', '#E3A542', '#C9C2A6'];

// ---------- ฟังก์ชันสำหรับหน้า Dashboard ----------
function renderCharts(current, predicted, businessType) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const seasonal = [1.05, 1.0, 1.1, 1.18, 1.12, 1.0, 0.98, 0.97, 1.0, 1.02, 1.0, 1.08];
    const currentSeries = seasonal.map(f => Math.round(current * f));
    const predictedSeries = seasonal.map(f => Math.round(predicted * f));

    const billCtx = document.getElementById('billChart');
    if (billCtx && window.billChartInstance) {
        window.billChartInstance.destroy();
    }
    if (billCtx) {
        window.billChartInstance = new Chart(billCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'ปัจจุบัน',
                    data: currentSeries,
                    borderColor: '#B7C4B6',
                    backgroundColor: 'transparent',
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 0
                }, {
                    label: 'หลังติดตั้ง',
                    data: predictedSeries,
                    borderColor: '#3E7C82',
                    backgroundColor: 'rgba(62,124,130,0.12)',
                    tension: 0.35,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, font: { family: 'IBM Plex Sans Thai', size: 11 } }
                    }
                },
                scales: {
                    y: { ticks: { font: { family: 'IBM Plex Sans Thai', size: 10 } }, grid: { color: 'rgba(23,36,27,0.06)' } },
                    x: { ticks: { font: { family: 'IBM Plex Sans Thai', size: 10 } }, grid: { display: false } }
                }
            }
        });
    }

    const bd = breakdowns[businessType] || breakdowns['สำนักงาน'];
    const bdCtx = document.getElementById('breakdownChart');
    if (bdCtx && window.breakdownChartInstance) {
        window.breakdownChartInstance.destroy();
    }
    if (bdCtx) {
        window.breakdownChartInstance = new Chart(bdCtx, {
            type: 'doughnut',
            data: {
                labels: bd.labels,
                datasets: [{ data: bd.data, backgroundColor: palette, borderWidth: 0 }]
            },
            options: {
                responsive: true,
                cutout: '62%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, font: { family: 'IBM Plex Sans Thai', size: 10.5 } }
                    }
                }
            }
        });
    }
}

// ---------- ฟังก์ชันสำหรับหน้า Dashboard ----------
function runFullAnalysis() {
    const bill = parseFloat(document.getElementById('billInput')?.value) || 0;
    const kwh = parseFloat(document.getElementById('kwhInput')?.value) || 1;
    const area = parseFloat(document.getElementById('areaInput')?.value) || 0;
    const budget = parseFloat(document.getElementById('budgetInput')?.value) || 0;
    const businessType = document.getElementById('businessInput')?.value || 'สำนักงาน';

    const est = estimateSolar(bill, kwh, area, budget);

    const kpiCurrent = document.getElementById('kpiCurrent');
    const kpiPredicted = document.getElementById('kpiPredicted');
    const kpiRoi = document.getElementById('kpiRoi');
    const kpiCarbon = document.getElementById('kpiCarbon');
    const recommendNote = document.getElementById('recommendNote');

    if (kpiCurrent) kpiCurrent.textContent = fmtBaht(bill);
    if (kpiPredicted) kpiPredicted.textContent = fmtBaht(est.newBill);
    if (kpiRoi) kpiRoi.textContent = (est.paybackYears < 30 ? est.paybackYears.toFixed(1) : '>30') + ' ปี';
    if (kpiCarbon) kpiCarbon.textContent = Math.round(est.co2Month).toLocaleString('th-TH') + ' กก.';

    if (recommendNote) {
        const budgetNote = budget >= est.systemCost ?
            'อยู่ในงบประมาณที่ตั้งไว้' :
            `ต่ำกว่าที่แนะนำ (${fmtBaht(est.systemCost)}) — พิจารณาระบบขนาดเล็กลง`;
        recommendNote.innerHTML =
            `ขนาดระบบที่แนะนำ: <b>${est.recKwp.toFixed(1)} kWp</b> (ราว ${fmtBaht(est.systemCost)}) · งบประมาณของคุณ <b>${budgetNote}</b>`;
    }

    renderCharts(bill, est.newBill, businessType);
}

// ---------- MINI CALCULATOR ----------
function updateMini() {
    const bill = parseFloat(document.getElementById('miniBill')?.value) || 0;
    const area = parseFloat(document.getElementById('miniArea')?.value) || 0;
    const est = estimateSolar(bill, bill / 6.3, area, 0);

    const miniNewBill = document.getElementById('miniNewBill');
    const miniSave = document.getElementById('miniSave');

    if (miniNewBill) miniNewBill.textContent = fmtBaht(est.newBill);
    if (miniSave) miniSave.textContent = fmtBaht(est.savings);
}

// ---------- เริ่มต้นเมื่อโหลดหน้า ----------
document.addEventListener('DOMContentLoaded', function() {
    // Mini Calculator
    const miniBill = document.getElementById('miniBill');
    const miniArea = document.getElementById('miniArea');
    if (miniBill) miniBill.addEventListener('input', updateMini);
    if (miniArea) miniArea.addEventListener('input', updateMini);
    updateMini();

    // Full Analysis
    const runBtn = document.getElementById('runAnalysis');
    if (runBtn) {
        runBtn.addEventListener('click', runFullAnalysis);
    }

    // เรียกครั้งแรก
    if (document.getElementById('billInput')) {
        runFullAnalysis();
    }
});
