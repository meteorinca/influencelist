// app.js – Fixed scatter spread + bar chart readability

async function initDashboard() {
    try {
        const response = await fetch('influences.md');
        const text = await response.text();

        // Parse data line by line
        const lines = text.split(/\r?\n/);
        const influences = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            // Matches: optional number + name + effect size (allow en dash or minus)
            const match = line.match(/^(?:\d+\s+)?(.+?)\s+([–-]?\d+\.\d{2})$/);
            if (match) {
                let name = match[1].trim();
                let scoreStr = match[2].trim().replace(/[–—]/g, '-');
                const effect = parseFloat(scoreStr);
                influences.push({ name, effect });
            }
        }

        if (influences.length === 0) {
            console.error("No data parsed. Check file format.");
            return;
        }

        console.log(`Loaded ${influences.length} influences`);

        // Sort for bar chart (highest effect first)
        const sorted = [...influences].sort((a, b) => b.effect - a.effect);
        const labels = sorted.map(item => item.name);
        const values = sorted.map(item => item.effect);

        // Colors based on Hattie's zones
        const colors = values.map(v => {
            if (v >= 0.7) return '#27ae60';
            if (v >= 0.4) return '#2ecc71';
            if (v >= 0.15) return '#f1c40f';
            return '#e74c3c';
        });

        // ----- 1. Horizontal Bar Chart (readable) -----
        const barCanvas = document.getElementById('barChart');
        const barHeightPx = 35;            // increased from 28 for better label spacing
        const totalHeight = labels.length * barHeightPx;
        barCanvas.height = totalHeight;
        barCanvas.style.height = `${totalHeight}px`;

        const barCtx = barCanvas.getContext('2d');
        const barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Effect Size (d)',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 4,
                    barPercentage: 0.85,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Effect: ${ctx.raw.toFixed(2)}`
                        }
                    },
                    legend: { position: 'top' }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Effect Size (d)', font: { weight: 'bold' } }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,
                            font: { size: 9 },      // smaller font to fit long names
                            maxRotation: 0,
                            minRotation: 0
                        },
                        grid: { display: false }
                    }
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length) {
                        const idx = activeElements[0].index;
                        updateSidePanel(labels[idx], values[idx]);
                    }
                }
            }
        });

        // ----- 2. Scatter Plot (spread out + vertical line at 0.4) -----
        const scatterCanvas = document.getElementById('scatterChart');
        const scatterCtx = scatterCanvas.getContext('2d');

        // Create a strip plot: group by effect rounded to 1 decimal, then spread vertically
        const effectGroups = new Map();
        influences.forEach(item => {
            const key = Math.round(item.effect * 10) / 10; // one decimal bin
            if (!effectGroups.has(key)) effectGroups.set(key, []);
            effectGroups.get(key).push(item);
        });

        const scatterData = [];
        for (let [effectBin, items] of effectGroups.entries()) {
            const count = items.length;
            // Spread vertically from -1.5 to 1.5 based on position within the bin
            items.forEach((item, idx) => {
                let yOffset;
                if (count === 1) {
                    yOffset = 0;
                } else {
                    // equally spaced jitter
                    yOffset = (idx / (count - 1)) * 3 - 1.5;
                }
                scatterData.push({
                    x: item.effect,
                    y: yOffset,
                    name: item.name,
                    effect: item.effect
                });
            });
        }

        const scatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Influences',
                    data: scatterData,
                    backgroundColor: (ctx) => {
                        const effect = ctx.raw.x;
                        if (effect >= 0.7) return '#27ae60';
                        if (effect >= 0.4) return '#2ecc71';
                        if (effect >= 0.15) return '#f1c40f';
                        return '#e74c3c';
                    },
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const point = ctx.raw;
                                return `${point.name}: ${point.x.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Effect Size (d)' },
                        beginAtZero: true,
                        min: -0.5,
                        max: 1.5,
                        grid: { color: '#ccc' }
                    },
                    y: {
                        display: false,   // hide y-axis because it's just jitter
                        min: -1.8,
                        max: 1.8
                    }
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length) {
                        const point = scatterData[activeElements[0].index];
                        updateSidePanel(point.name, point.effect);
                    }
                }
            }
        });

        // Add a vertical line at 0.4 (custom drawing without extra plugin)
        // We draw after chart is rendered, and also on resize.
        function drawVerticalLine() {
            const canvas = scatterCanvas;
            const chart = scatterChart;
            if (!chart || !chart.ctx) return;
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            if (!xAxis) return;
            const xPixel = xAxis.getPixelForValue(0.4);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xPixel, chart.scales.y.top);
            ctx.lineTo(xPixel, chart.scales.y.bottom);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#e74c3c';
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.restore();

            // Add label "Hinge Point (0.4)"
            ctx.font = '12px "Inter", sans-serif';
            ctx.fillStyle = '#e74c3c';
            ctx.shadowBlur = 0;
            ctx.fillText('Hinge Point (0.4)', xPixel + 5, chart.scales.y.top + 15);
        }

        // Draw after initial render and on resize
        setTimeout(drawVerticalLine, 100);
        window.addEventListener('resize', () => {
            setTimeout(drawVerticalLine, 100);
        });
        // Also redraw when tooltips or interactions occur – simplest: hook into chart update
        const originalUpdate = scatterChart.update;
        scatterChart.update = function(...args) {
            originalUpdate.apply(this, args);
            setTimeout(drawVerticalLine, 50);
        };

        // ----- Helper: Update side panel -----
        function updateSidePanel(name, effect) {
            document.getElementById('active-name').textContent = name;
            document.getElementById('active-score').textContent = effect.toFixed(2);
            const comparison = effect >= 0.4 ? "Above the hinge point (0.4) – accelerates learning." :
                               effect >= 0.15 ? "Within typical growth zone (0.15–0.4)." :
                               effect >= 0 ? "Below typical growth – consider other strategies." :
                               "Negative effect – likely harmful.";
            document.getElementById('active-comparison').innerHTML = comparison;
            const scoreElem = document.getElementById('active-score');
            if (effect >= 0.7) scoreElem.style.color = '#27ae60';
            else if (effect >= 0.4) scoreElem.style.color = '#2ecc71';
            else if (effect >= 0.15) scoreElem.style.color = '#f1c40f';
            else scoreElem.style.color = '#e74c3c';
        }

        // Set default selection to highest effect
        if (sorted.length) {
            updateSidePanel(sorted[0].name, sorted[0].effect);
        }

    } catch (err) {
        console.error("Failed to load or parse influences.md:", err);
        document.getElementById('active-name').textContent = "Error loading data";
        document.getElementById('active-score').textContent = "?";
    }
}

initDashboard();
