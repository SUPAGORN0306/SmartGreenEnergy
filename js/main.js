// ============================================================
//  MAIN.JS - ควบคุม UI และการทำงานทั้งหมด
//  ข้อมูลจาก sample-data.json ทั้งหมด
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
        alert('ไม่สามารถโหลดข้อมูลได้ กรุณา refresh หน้าเว็บ');
        return null;
    }
}

// ---------- โหลดข้อมูลผู้ใช้ ----------
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

// ---------- บันทึกข้อมูลผู้ใช้ ----------
function saveUserData() {
    const bill = document.getElementById('bill')?.value;
    const kwh = document.getElementById('kwh')?.value;
    const province = document.getElementById('province')?.value;
    const area = document.getElementById('area')?.value;
    const business = document.getElementById('business')?.value;
    const budget = document.getElementById('budget')?.value;

    // ตรวจสอบ
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

// ---------- โหลดข้อมูลตัวอย่าง ----------
async function loadSampleData() {
    const business = document.getElementById('business')?.value;
    if (!business) {
        alert('⚠️ กรุณาเลือกประเภทกิจการก่อน');
        return;
    }

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
}

// ---------- ฟังก์ชันช่วยแสดงผล ----------
function setElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ---------- แสดง Dashboard ----------
async function renderDashboard() {
    if (!appData) {
        await loadAppData();
    }

    const data = loadUserData();
    
    // ถ้าไม่มีข้อมูล ให้กลับไปหน้า Input
    if (data.bill === 0 || data.kwh === 0 || !data.business) {
        window.location.href = 'input.html';
        return;
    }

    // คำนวณ
    const rates = appData?.electricityRates || {};
    const rateInfo = calcAvgRate(data.bill, data.kwh, data.province, rates);
    const savings = calculateSavings(data.bill, data.kwh, data.business, data.budget, appData);
    const historical = generateHistoricalData(data.bill);
    const future = predictFutureBill(historical);
    const hourlyData = getHourlyUsageFromData(data.business, appData);
    const pieData = appData?.businesses?.[data.business]?.pieData || {};
    const solarInfo = appData?.solarInfo || { costPerKw: 35000, lifetimeYears: 25 };
    const carbonFactor = appData?.carbonFactors || { co2PerKwh: 0.5 };

    // ---- แสดง Key Metrics ----
    setElement('currentBill', data.bill.toLocaleString());
    setElement('currentKwh', data.kwh.toLocaleString());
    setElement('avgRate', rateInfo.avg.toFixed(2) + ' บาท/kWh');
    setElement('avgRateProvider', '(' + rateInfo.provider + ' อัตรา ' + rateInfo.rate.toFixed(2) + ' บาท/kWh)');
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
    
    setElement('recommendationText', savings.recommendation);
    
    // ---- ข้อมูล Solar ----
    const solarCost = 10 * (solarInfo.costPerKw || 35000);
    const solarSaving = data.bill * 0.25;
    const solarROI = ((solarSaving * 12) / solarCost) * 100;
    const solarPayback = solarCost / solarSaving;
    
    setElement('solarCost', solarCost.toLocaleString());
    setElement('solarSaving', Math.round(solarSaving).toLocaleString());
    setElement('solarROI', solarROI.toFixed(1) + '%');
    setElement('solarPayback', solarPayback.toFixed(1) + ' ปี');
    setElement('solarLifetime', (solarInfo.lifetimeYears || 25) + ' ปี');
    
    // ---- Before/After ----
    const afterBill = data.bill - savings.monthlySaving;
    setElement('beforeBill', data.bill.toLocaleString());
    setElement('afterBill', afterBill.toLocaleString());
    setElement('savingAmount', savings.monthlySaving.toLocaleString());
    setElement('beforeCarbon', savings.carbonCurrent.toFixed(2));
    setElement('afterCarbon', (savings.carbonCurrent - savings.carbonReduction).toFixed(2));
    setElement('savingRateDisplay', savings.savingRate + '%');
    
    // ---- Sidebar ----
    setElement('sidebarName', localStorage.getItem('sg_name') || 'เจ้าของกิจการ');
    setElement('sidebarBusiness', data.business || '-');
    
    // ---- กราฟ ----
    createTrendChart(historical, future);
    createPieChart(pieData);
    createHourlyChart(hourlyData);
}

// ---------- กราฟแนวโน้ม ----------
function createTrendChart(historical, future) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const allData = [...historical, ...future];
    const labels = [];
    for (let i = -11; i <= 6; i++) {
        if (i <= 0) labels.push('เดือนที่ ' + (i + 12));
        else labels.push('+' + i + ' เดือน');
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ค่าไฟจริง',
                data: historical,
                borderColor: '#0f172a',
                backgroundColor: 'rgba(15,23,42,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }, {
                label: 'คาดการณ์',
                data: future,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.08)',
                fill: true,
                borderDash: [6, 4],
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#22c55e'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' บาท';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: function(value) { return value.toLocaleString(); } }
                }
            }
        }
    });
}

// ---------- กราฟวงกลม ----------
function createPieChart(pieData) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    const labels = Object.keys(pieData);
    const values = Object.values(pieData);
    const colors = ['#0f172a', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } }
            },
            cutout: '65%'
        }
    });
}

// ---------- กราฟรายชั่วโมง ----------
function createHourlyChart(hourlyData) {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;

    const hours = [];
    for (let h = 0; h < 24; h++) {
        hours.push(h + ':00');
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'การใช้ไฟฟ้า (kWh)',
                data: hourlyData,
                backgroundColor: function(context) {
                    const value = context.parsed.y;
                    if (value > 60) return '#22c55e';
                    if (value > 40) return '#3b82f6';
                    if (value > 25) return '#f59e0b';
                    return '#ef4444';
                },
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { font: { size: 10 }, maxTicksLimit: 12 } },
                y: { beginAtZero: true, title: { display: true, text: 'kWh' } }
            }
        }
    });
}

// ---------- หน้า Recommend: แสดง Before/After ----------
async function showComparison() {
    const data = loadUserData();
    if (data.bill === 0 || data.kwh === 0 || !data.business) {
        alert('⚠️ กรุณากรอกข้อมูลในหน้ากรอกข้อมูลก่อน');
        window.location.href = 'input.html';
        return;
    }

    if (!appData) {
        await loadAppData();
    }

    const savings = calculateSavings(data.bill, data.kwh, data.business, data.budget, appData);
    const afterBill = data.bill - savings.monthlySaving;

    // Before/After
    setElement('beforeBill', data.bill.toLocaleString());
    setElement('afterBill', afterBill.toLocaleString());
    setElement('savingAmount', savings.monthlySaving.toLocaleString());
    setElement('beforeCarbon', savings.carbonCurrent.toFixed(2));
    setElement('afterCarbon', (savings.carbonCurrent - savings.carbonReduction).toFixed(2));
    setElement('savingRateDisplay', savings.savingRate + '%');

    // ตารางเปรียบเทียบ
    const behaviorSaving = data.bill * 0.08;
    const efficiencySaving = data.bill * 0.15;
    const solarSaving = data.bill * 0.25;

    setElement('savingBehavior', Math.round(behaviorSaving).toLocaleString() + ' บาท');
    setElement('savingEfficiency', Math.round(efficiencySaving).toLocaleString() + ' บาท');
    setElement('savingSolar', Math.round(solarSaving).toLocaleString() + ' บาท');

    // อุปกรณ์แนะนำ
    const devices = getDeviceRecommendations(data.business, data.budget, data.bill, appData);
    const deviceContainer = document.getElementById('deviceRecommendations');
    if (deviceContainer) {
        deviceContainer.innerHTML = devices.map(d => `
            <div style="background:#f8fafc; border-radius:12px; padding:16px; margin-bottom:12px; border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <strong>${d.name}</strong>
                        <span style="color:#64748b; font-size:14px; margin-left:10px;">${d.desc || ''}</span>
                    </div>
                    <div style="display:flex; gap:15px; font-size:14px; flex-wrap:wrap;">
                        <span>💰 ${d.cost.toLocaleString()} บาท</span>
                        <span style="color:#22c55e;">⚡ ประหยัด ${d.saving}%</span>
                        <span>⏳ คืนทุน ${d.payback} เดือน</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Sidebar
    setElement('sidebarName', localStorage.getItem('sg_name') || 'เจ้าของกิจการ');
    setElement('sidebarBusiness', data.business || '-');
}

// ---------- เปิดหน้าเมื่อโหลดเสร็จ ----------
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard
    if (document.getElementById('trendChart')) {
        renderDashboard();
    }

    // Recommend
    if (document.getElementById('deviceRecommendations')) {
        showComparison();
    }
});
