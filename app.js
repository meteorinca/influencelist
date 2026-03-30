// app.js 

async function initDashboard() {
    try {
        const response = await fetch('influences.md');
        const text = await response.text();

        // ---- Parse data line by line ----
        const lines = text.split(/\r?\n/);
        const influences = []; // each item: { name, effect }

        for (const line of lines) {
            if (!line.trim()) continue;
            // Matches: optional number + name + effect size (allow en dash or minus)
            // Examples:
            // "147 Welfare policies –0.12"
            // "Retention –0.13"
            // "Feedback 0.73"
            const match = line.match(/^(?:\d+\s+)?(.+?)\s+([–-]?\d+\.\d{2})$/);
            if (match) {
                let name = match[1].trim();
                let scoreStr = match[2].trim().replace(/[–—]/g, '-'); // en dash → minus
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

        // ----- 1. Create the Horizontal Bar Chart (with scrolling) -----
        const barCanvas = document.getElementById('barChart');
        const barHeightPx = 28; // pixels per bar
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
                    borderRadius: 5,
                    barPercentage: 0.9,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { callbacks: {
                        label: (ctx) => `Effect: ${ctx.raw.toFixed(2)}`
                    }},
                    legend: { position: 'top' }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Effect Size (d)', font: { weight: 'bold' } }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,      // show every label
                            font: { size: 10 },
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

        // ----- 2. Create the Scatter Chart -----
        const scatterCanvas = document.getElementById('scatterChart');
        const scatterCtx = scatterCanvas.getContext('2d');
        
        // Prepare scatter data: each influence as a point (x = effect, y = random jitter for visibility)
        const scatterData = influences.map(item => ({
            x: item.effect,
            y: Math.random() * 2 - 1, // jitter between -1 and 1 to avoid overlap
            name: item.name
        }));

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
                    pointRadius: 6,
                    pointHoverRadius: 8,
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
                        max: 1.5
                    },
                    y: {
                        display: false, // hide y-axis because it's just jitter
                        min: -1.5,
                        max: 1.5
                    }
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length) {
                        const dataPoint = scatterData[activeElements[0].index];
                        updateSidePanel(dataPoint.name, dataPoint.x);
                    }
                }
            }
        });

        // ----- Helper: Update side panel when an item is clicked -----
        function updateSidePanel(name, effect) {
            document.getElementById('active-name').textContent = name;
            document.getElementById('active-score').textContent = effect.toFixed(2);
            const comparison = effect >= 0.4 ? "Above the hinge point (0.4) – accelerates learning." :
                               effect >= 0.15 ? "Within typical growth zone (0.15–0.4)." :
                               effect >= 0 ? "Below typical growth – consider other strategies." :
                               "Negative effect – likely harmful.";
            document.getElementById('active-comparison').innerHTML = comparison;
            // Optional: add color coding to the stat number
            const scoreElem = document.getElementById('active-score');
            if (effect >= 0.7) scoreElem.style.color = '#27ae60';
            else if (effect >= 0.4) scoreElem.style.color = '#2ecc71';
            else if (effect >= 0.15) scoreElem.style.color = '#f1c40f';
            else scoreElem.style.color = '#e74c3c';
        }

        // Optional: set default selection to the highest influence
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
