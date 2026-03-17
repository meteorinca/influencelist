async function initDashboard() {
    const response = await fetch('influences.md');
    const text = await response.text();
    
    // Split into lines and parse each line robustly
    const lines = text.split('\n');
    const dataPoints = [];

    for (let line of lines) {
        line = line.trim();
        if (line === '') continue;

        // Look for a number at the end of the line: optional sign, digits, decimal, two digits
        const scoreMatch = line.match(/(-?\d+\.\d{2})\s*$/);
        if (!scoreMatch) continue; // skip lines without a score

        const score = parseFloat(scoreMatch[1]);
        // Everything before the score is the name, but we also need to remove a leading number if present
        let name = line.substring(0, scoreMatch.index).trim();
        // Remove leading numbering like "1 ", "2. ", etc.
        name = name.replace(/^\d+[\s.)-]*/, '').trim();

        dataPoints.push({ name, score });
    }

    // Sort by impact (highest first)
    dataPoints.sort((a, b) => b.score - a.score);

    // Dynamically size the bar chart canvas so all bars are visible
    const barCanvas = document.getElementById('barChart');
    // Roughly 35px per bar – adjust as needed for comfortable reading
    barCanvas.style.height = (dataPoints.length * 35) + 'px';

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

    // 1. Bar Chart (horizontal)
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
                legend: { display: false }
            }
        }
    });

    // 2. Scatter Plot
    new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Influences',
                data: data.map(d => ({ x: d.score, y: Math.random() * 10 - 5 })), // jitter
                backgroundColor: data.map(d => d.score >= 0.4 ? 'rgba(39, 174, 96, 0.6)' : 'rgba(231, 76, 60, 0.6)'),
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
                        color: (context) => context.tick.value === 0.4 ? 'red' : '#eee'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const item = data[ctx.dataIndex];
                            return item.name + ': ' + item.score.toFixed(2);
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
