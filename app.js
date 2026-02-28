/* ═══════════════════════════════════════════
   Freeport Dashboard — JavaScript
   Chart.js integration + Table interactivity
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── 1. USAGE CHART (Chart.js) ───
    const ctx = document.getElementById('usageChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["April'25", "May'25", "June'25", "July'25", "Aug'25", "Sep'25"],
                datasets: [{
                    label: 'Usage Quantity',
                    data: [1380, 1320, 1180, 1140, 1480, 1110],
                    backgroundColor: '#0049a8',
                    borderRadius: 3,
                    borderSkipped: false,
                    barPercentage: 0.55,
                    categoryPercentage: 0.7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c1c1c',
                        titleColor: '#e7e7e7',
                        bodyColor: '#bbbbbb',
                        borderColor: '#2b2b2b',
                        borderWidth: 1,
                        cornerRadius: 4,
                        padding: 10,
                        titleFont: { family: "'IBM Plex Sans'", size: 12 },
                        bodyFont: { family: "'IBM Plex Sans'", size: 12 },
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255,255,255,.06)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#bbbbbb',
                            font: { family: "'IBM Plex Sans'", size: 10 },
                        },
                        border: { display: false },
                    },
                    y: {
                        min: 1000,
                        max: 1600,
                        grid: {
                            color: 'rgba(255,255,255,.06)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#bbbbbb',
                            font: { family: "'IBM Plex Sans'", size: 10 },
                            stepSize: 100,
                        },
                        border: { display: false },
                    },
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart',
                },
            }
        });
    }

    // ─── 2. TABLE: Select-All Checkboxes ───
    function setupSelectAll(headerCheckboxId, tableId) {
        const headerCb = document.getElementById(headerCheckboxId);
        const table = document.getElementById(tableId);
        if (!headerCb || !table) return;

        const rowCbs = table.querySelectorAll('tbody input[type="checkbox"]');

        headerCb.addEventListener('change', () => {
            rowCbs.forEach(cb => {
                cb.checked = headerCb.checked;
                cb.closest('tr').classList.toggle('row-selected', headerCb.checked);
            });
        });

        rowCbs.forEach(cb => {
            cb.addEventListener('change', () => {
                cb.closest('tr').classList.toggle('row-selected', cb.checked);
                headerCb.checked = Array.from(rowCbs).every(c => c.checked);
            });
        });
    }

    setupSelectAll('chkAllDup', 'duplicatesTable');
    setupSelectAll('chkAllEquip', 'equipmentTable');

    // ─── 3. ACTION BUTTONS ───
    const btnAccept = document.getElementById('btnAccept');
    const btnReset = document.getElementById('btnReset');
    const btnCalculate = document.getElementById('btnCalculate');

    if (btnAccept) {
        btnAccept.addEventListener('click', () => {
            btnAccept.textContent = '✓ Accepted';
            btnAccept.style.background = '#005126';
            setTimeout(() => {
                btnAccept.textContent = 'Accept';
                btnAccept.style.background = '';
            }, 1500);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            document.getElementById('userRop').value = 0;
            document.getElementById('userMax').value = 0;
            document.getElementById('altRop').value = 0;
            document.getElementById('altMax').value = 0;
            document.getElementById('remarkInput').value = '';
        });
    }

    if (btnCalculate) {
        btnCalculate.addEventListener('click', () => {
            btnCalculate.textContent = 'Calculating...';
            setTimeout(() => {
                btnCalculate.textContent = 'Calculate';
            }, 1000);
        });
    }

    // ─── 4. SIDEBAR NAV HIGHLIGHT ───
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // ─── 5. DROPDOWN TOGGLE (visual) ───
    document.querySelectorAll('.dropdown-sim').forEach(dd => {
        dd.addEventListener('click', () => {
            const icon = dd.querySelector('i');
            if (icon.classList.contains('ri-arrow-down-s-line')) {
                icon.classList.replace('ri-arrow-down-s-line', 'ri-arrow-up-s-line');
            } else {
                icon.classList.replace('ri-arrow-up-s-line', 'ri-arrow-down-s-line');
            }
        });
    });

});
