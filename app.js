async function initDashboard() {
    const response = await fetch('influences.md');
    const text = await response.text();

    const lines = text.split(/\r?\n/);
    const dataPoints = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Keep rank number in label
        const match = line.match(/^(\d+)\s+(.+?)\s+([−–-]?\d+\.\d{2})$/);
        if (!match) continue;

        const rank = match[1];
        const name = match[2].trim();
        const score = parseFloat(match[3].replace(/[−–]/g, '-'));

        dataPoints.push({
            rank: parseInt(rank, 10),
            name: `${rank} ${name}`,
            score
        });
    }

    dataPoints.sort((a, b) => b.score - a.score);
    renderCharts(dataPoints);
}

function renderCharts(data) {
    const barCanvas = document.getElementById('barChart');
    const scatterCanvas = document.getElementById('scatterChart');

    const ctxBar = barCanvas.getContext('2d');
    const ctxScatter = scatterCanvas.getContext('2d');

    // One row per influence
    const rowHeight = 26;
    const chartHeight = data.length * rowHeight;

    // Important: set actual canvas render size, not CSS style height
    barCanvas.width = barCanvas.parentElement.clientWidth - 10;
    barCanvas.height = chartHeight;

    const commonOptions = {
        responsive: false,
        maintainAspectRatio: false,
        onClick: (e, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                updateImpactUI(data[index]);
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
                barThickness: 16,
                maxBarThickness: 16,
                categoryPercentage: 0.9,
                barPercentage: 0.9
            }]
        },
        options: {
            ...commonOptions,
            indexAxis: 'y',
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${data[ctx.dataIndex].name}: ${ctx.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        autoSkip: false,
                        font: { size: 12 }
                    },
                    grid: { display: false }
                },
                x: {
                    ticks: {
                        font: { size: 12 }
                    },
                    grid: {
                        color: '#eee'
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
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    updateImpactUI(data[index]);
                }
            },
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
