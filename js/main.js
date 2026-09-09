// ============================================================
//  MAIN.JS - จัดการ UI และการทำงานทั้งหมด
//  สำหรับ SmartGreenEnergy
// ============================================================

// ---------- โหลดข้อมูลจาก localStorage ----------
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

    // ตรวจสอบข้อมูล
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

    // บันทึกข้อมูล
    localStorage.setItem('sg_bill', bill);
    localStorage.setItem('sg_kwh', kwh);
    localStorage.setItem('sg_province', province || '');
    localStorage.setItem('sg_area', area || '0');
    localStorage.setItem('sg_business', business);
    localStorage.setItem('sg_budget', budget);

    // ไปหน้า Dashboard
    window.location.href = 'dashboard.html';
}

// ---------- โหลดตัวอย่างข้อมูล ----------
function loadSampleData() {
    const business = document.getElementById('business')?.value;
    if (!business) {
        alert('⚠️ กรุณาเลือกประเภทกิจการก่อน');
        return;
    }

    const examples = getBusinessExamples();
    const data = examples[business];
    if (!data) return;

    if (document.getElementById('bill')) {
        document.getElementById('bill').value = data.bill;
    }
    if (document.getElementById('kwh')) {
        document.getElementById('kwh').value = data.kwh;
    }
    if (document.getElementById('budget')) {
        document.getElementById('budget').value = data.budget;
    }
}

// ---------- แสดง Dashboard ----------
function renderDashboard() {
    const data = loadUserData();

    // ถ้าไม่มีข้อมูล ให้กลับไปหน้า Input
    if (data.bill === 0 || data.kwh === 0) {
        window.location.href = 'input.html';
        return;
    }

    // คำนวณ
    const avgRate = calcAvgRate(data.bill, data.kwh);
    const savings = calculateSavings(data.bill, data.business, data.budget);
    const historical = generateHistoricalData(data.bill);
    const future = predictFutureBill(historical);
    const hourlyData = generateHourlyUsage();

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
    const prevKwh = data.kwh * 0.95;
    const kwhChange = calcPercentChange(data.kwh, prevKwh);
    setElement('billChange', (billChange > 0 ? '+' : '') + billChange + '%');
    setElement('kwhChange', (kwhChange > 0 ? '+' : '') + kwhChange + '%');

    // คำแนะนำ
    setElement('recommendationText', savings.recommendation);

    // สร้างกราฟ
    createTrendChart(historical, future);
    createPieChart();
    createHourlyChart(hourlyData);

    // คำนวณ Before/After
    const afterBill = data.bill - savings.monthlySaving;
    setElement('beforeBill', data.bill.toLocaleString());
    setElement('afterBill', afterBill.toLocaleString());
    setElement('savingAmount', savings.monthlySaving.toLocaleString());
    setElement('beforeCarbon', savings.carbonCurrent.toFixed(2));
    setElement('afterCarbon', (savings.carbonCurrent - savings.carbonReduction).toFixed(2));

    // ข้อมูลการลงทุน Solar
    const solarCost = 350000;
    const solarSaving = data.bill * 0.25;
    const solarROI = ((solarSaving * 12) / solarCost) * 100;
    const solarPayback = solarCost / solarSaving;
    setElement('solarCost', solarCost.toLocaleString());
    setElement('solarSaving', Math.round(solarSaving).toLocaleString());
    setElement('solarROI', solarROI.toFixed(1) + '%');
    setElement('solarPayback', solarPayback.toFixed(1) + ' ปี');
    setElement('solarLifetime', '25 ปี');
}

// ---------- ฟังก์ชันช่วยแสดงผล ----------
function setElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ---------- สร้างกราฟแนวโน้ม ----------
function createTrendChart(historical, future) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const allData = [...historical, ...future];
    const labels = [];
    for (let i = -11; i <= 6; i++) {
        if (i <= 0) {
            labels.push(`เดือนที่ ${i+12}`);
        } else {
            labels.push(`+${i} เดือน`);
        }
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ค่าไฟจริง',
                data: historical,
                borderColor: '#1a3a5c',
                backgroundColor: 'rgba(26, 58, 92, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }, {
                label: 'คาดการณ์',
                data: future,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.08)',
                fill: true,
                borderDash: [6, 4],
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#2ecc71'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20 }
                },
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
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// ---------- สร้างกราฟสัดส่วนการใช้พลังงาน ----------
function createPieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['เครื่องปรับอากาศ', 'อุปกรณ์ครัว', 'แสงสว่าง', 'เครื่องจักร', 'อื่นๆ'],
            datasets: [{
                data: [45, 25, 15, 10, 5],
                backgroundColor: ['#1a3a5c', '#2ecc71', '#3498db', '#f39c12', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15 }
                }
            },
            cutout: '65%'
        }
    });
}

// ---------- สร้างกราฟการใช้ไฟรายชั่วโมง ----------
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
                    if (value > 60) return '#2ecc71';
                    if (value > 40) return '#3498db';
                    if (value > 25) return '#f39c12';
                    return '#e74c3c';
                },
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { font: { size: 10 }, maxTicksLimit: 12 }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'kWh' }
                }
            }
        }
    });
}

// ---------- แสดง Before/After (หน้า Recommend) ----------
function showComparison() {
    const data = loadUserData();
    if (data.bill === 0) {
        alert('⚠️ กรุณากรอกข้อมูลในหน้ากรอกข้อมูลก่อน');
        window.location.href = 'input.html';
        return;
    }

    const savings = calculateSavings(data.bill, data.business, data.budget);
    const afterBill = data.bill - savings.monthlySaving;

    setElement('beforeBill', data.bill.toLocaleString());
    setElement('afterBill', afterBill.toLocaleString());
    setElement('savingAmount', savings.monthlySaving.toLocaleString());
    setElement('beforeCarbon', savings.carbonCurrent.toFixed(2));
    setElement('afterCarbon', (savings.carbonCurrent - savings.carbonReduction).toFixed(2));

    // คำนวณค่าในตาราง
    const behaviorSaving = data.bill * 0.08;
    const efficiencySaving = data.bill * 0.15;
    const solarSaving = data.bill * 0.25;

    setElement('savingBehavior', Math.round(behaviorSaving).toLocaleString() + ' บาท');
    setElement('savingEfficiency', Math.round(efficiencySaving).toLocaleString() + ' บาท');
    setElement('savingSolar', Math.round(solarSaving).toLocaleString() + ' บาท');

    // ข้อมูลอุปกรณ์
    const devices = getDeviceRecommendations(data.business, data.budget);
    const deviceContainer = document.getElementById('deviceRecommendations');
    if (deviceContainer) {
        deviceContainer.innerHTML = devices.map(d => `
            <div class="card" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <span style="font-size:24px; margin-right:10px;">${d.icon}</span>
                        <strong>${d.name}</strong>
                        <span style="color:#7f8c8d; font-size:14px; margin-left:10px;">${d.desc}</span>
                    </div>
                    <div style="display:flex; gap:15px; font-size:14px; flex-wrap:wrap;">
                        <span>💰 ${d.cost.toLocaleString()} บาท</span>
                        <span style="color:#2ecc71;">⚡ ประหยัด ${d.saving}%</span>
                        <span>⏳ คืนทุน ${d.payback} เดือน</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

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
            // แสดงปุ่มโหลดตัวอย่าง
            const btn = document.getElementById('loadSampleBtn');
            if (btn) btn.style.display = 'inline-block';
        });
    }
});
