async function initDashboard() {
    const response = await fetch('influences.md');
    const text = await response.text();

    const lines = text.split(/\r?\n/);
    const dataPoints = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Matches:
        // 1 STUDENT EXPECTATIONS 1.44
        // 146 Summer vacation –0.02
        // Keeps the rank number as part of the displayed label
        const match = line.match(/^(\d+)\s+(.+?)\s+([−–-]?\d+\.\d{2})$/);

        if (match) {
            const rank = match[1];
            const name = match[2].trim();
            const score = parseFloat(match[3].replace(/[−–]/g, '-'));

            dataPoints.push({
                rank: parseInt(rank, 10),
                name: `${rank} ${name}`,
                shortName: name,
                score
            });
        }
    }

    // Sort by impact, highest first
    dataPoints.sort((a, b) => b.score - a.score);

    renderCharts(dataPoints);
}

function renderCharts(data) {
    const barCanvas = document.getElementById('barChart');
    const scatterCanvas = document.getElementById('scatterChart');

    const ctxBar = barCanvas.getContext('2d');
    const ctxScatter = scatterCanvas.getContext('2d');

    // Make the bar chart tall enough so every item gets its own visible row
    const rowHeight = 28;
    const chartHeight = Math.max(500, data.length * rowHeight);
    barCanvas.height = chartHeight;
    barCanvas.style.height = `${chartHeight}px`;

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, elements, chart) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const item = data[index];
                updateImpactUI(item);
            }
        }
    };

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Effect Size',
                data: data.map(d => d.score),
                backgroundColor: data.map(d => d.score >= 0.4 ? '#27ae60' : '#e74c3c'),
                borderWidth: 0,
                barThickness: 18,
                maxBarThickness: 18,
                categoryPercentage: 1.0,
                barPercentage: 0.95
            }]
        },
        options: {
            ...commonOptions,
            indexAxis: 'y',
            animation: false,
            scales: {
                y: {
                    ticks: {
                        autoSkip: false,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    beginAtZero: false,
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#eee'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${data[ctx.dataIndex].name}: ${ctx.raw.toFixed(2)}`
                    }
                }
            }
        }
    });

    new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Influences',
                data: data.map(d => ({ x: d.score, y: Math.random() * 10 - 5 })),
                backgroundColor: data.map(d =>
                    d.score >= 0.4
                        ? 'rgba(39, 174, 96, 0.6)'
                        : 'rgba(231, 76, 60, 0.6)'
                ),
                pointRadius: 8,
                hoverRadius: 12
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                y: { display: false },
                x: {
                    title: { display: true, text: 'Effect Size (d)' },
                    grid: {
                        color: (c) => c.tick.value === 0.4 ? 'red' : '#eee'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${data[ctx.dataIndex].name}: ${ctx.raw.x.toFixed(2)}`
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
