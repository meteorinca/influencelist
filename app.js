async function initDashboard() {
    const response = await fetch('influences.md');
    const text = await response.text();
    
    // Parse each line
    const lines = text.split('\n');
    const dataPoints = [];

    for (let line of lines) {
        line = line.trim();
        if (line === '') continue;

        // Find the last number with two decimals (e.g. 1.44, -0.23)
        const scoreMatch = line.match(/(-?\d+\.\d{2})\s*$/);
        if (!scoreMatch) continue; // skip lines without a score

        const score = parseFloat(scoreMatch[1]);
        // Name is everything before the score, then remove any leading numbering
        let name = line.substring(0, scoreMatch.index).trim();
        name = name.replace(/^\d+[\s.)-]*/, '').trim();

        dataPoints.push({ name, score });
    }

    // Sort by impact (highest first)
    dataPoints.sort((a, b) => b.score - a.score);

    // --- Bar chart sizing ---
    // Find the longest label (in characters)
    const maxLabelLength = Math.max(...dataPoints.map(d => d.name.length));
    // Approx width per character: 8px, plus some padding for the bar and margins
    const barCanvasWidth = Math.max(800, maxLabelLength * 8 + 200);
    const barCanvas = document.getElementById('barChart');
    barCanvas.width = barCanvasWidth;               // set canvas resolution
    barCanvas.style.width = barCanvasWidth + 'px';  // ensure CSS width matches
    // Height: roughly 35px per bar, with a minimum of 400px
    barCanvas.style.height = Math.max(400, dataPoints.length * 35) + 'px';

    renderCharts(dataPoints);
}

function renderCharts(data) {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxScatter = document.getElementById('scatterChart').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const item = data[index];
                updateImpactUI(item);
            }
        }
    };

    // 1. Horizontal Bar Chart (now wide enough for all labels)
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Effect Size',
                data: data.map(d => d.score),
                backgroundColor: data.map(d => d.score >= 0.4 ? '#27ae60' : '#e74c3c')
            }]
        },
        options: {
            ...commonOptions,
            indexAxis: 'y',
            scales: {
                y: {
                    ticks: {
                        autoSkip: false,      // show every label
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw} (Effect size)`
                    }
                }
            }
        }
    });

    // 2. Scatter Plot (stable jitter, fixed y‑range)
    const jitterAmount = 2; // spread points vertically
    new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Influences',
                // Use index to create deterministic jitter so points don't move on every render
                data: data.map((d, i) => ({
                    x: d.score,
                    y: (i % 10) - 5   // repeat pattern between -5 and 4
                })),
                backgroundColor: data.map(d => d.score >= 0.4 ? 'rgba(39, 174, 96, 0.6)' : 'rgba(231, 76, 60, 0.6)'),
                pointRadius: 8,
                hoverRadius: 12
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                y: {
                    display: false,
                    min: -6,   // ensure all points are inside
                    max: 6
                },
                x: {
                    title: { display: true, text: 'Effect Size (d)' },
                    grid: {
                        color: (context) => context.tick.value === 0.4 ? 'red' : '#eee'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const item = data[ctx.dataIndex];
                            return `${item.name}: ${item.score.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function updateImpactUI(item) {
    const hinge = 0.40;
    const multiplier = (item.score / hinge).toFixed(1);
    
    document.getElementById('active-name').innerText = item.name;
    document.getElementById('active-score').innerText = item.score.toFixed(2);
    
    let comparisonText = "";
    if (item.score >= hinge) {
        comparisonText = `This is ${multiplier}x more powerful than the average educational intervention. It's in the "Zone of Desired Effects."`;
    } else if (item.score > 0) {
        comparisonText = `This provides only ${Math.round(multiplier * 100)}% of the expected annual growth. Standard schooling is more effective.`;
    } else {
        comparisonText = `This actually has a negative impact on student learning.`;
    }
    document.getElementById('active-comparison').innerText = comparisonText;
}

initDashboard();
