/**
 * Custom descriptors for specific educational influences.
 * Add as many as you'd like here using the EXACT name from the list (without rank).
 */
const descriptors = {
    "STUDENT EXPECTATIONS": "When students are involved in predicting their own performance, they tend to reach those self-set bars. It is the most powerful predictor of success.",
    "SELF-REPORTED GRADES": "Similar to expectations; students are remarkably accurate at knowing their own level of achievement, which can be leveraged for goal setting.",
    "TEACHER CLARITY": "When students understand the learning intentions and success criteria, their achievement increases significantly.",
    "FEEDBACK": "One of the most powerful influences, though it is most effective when it is 'just in time' and 'just for me.'",
    "HOMEWORK": "Has a much higher impact in secondary school than in primary school, where its effect is nearly zero.",
    "CLASS SIZE": "While popular with parents and teachers, reducing class size has a relatively small impact compared to changing HOW teachers teach.",
    "RETENTION": "Holding a student back a year is one of the few interventions with a consistently negative impact on achievement and social-emotional well-being.",
    "TELEVISION": "Excessive consumption of non-educational media negatively correlates with academic performance and engagement.",
    "MOBILITY": "Moving schools frequently disrupts the 'social capital' of a student and leads to gaps in curriculum coverage."
};

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
        const nameOnly = match[2].trim();
        const score = parseFloat(match[3].replace(/[−–]/g, '-'));

        dataPoints.push({
            rank: parseInt(rank, 10),
            name: `${rank} ${nameOnly}`, // Display name with rank
            cleanName: nameOnly,         // Reference name for descriptors
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

    // Set actual canvas render size for scrolling
    barCanvas.width = barCanvas.parentElement.clientWidth - 10;
    barCanvas.style.height = `${chartHeight}px`; // Fixed the display height
    barCanvas.height = chartHeight;

    const commonOptions = {
        responsive: true,
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
                        autoSkip: false, // Ensure every influence is shown
                        font: { size: 12 }
                    },
                    grid: { display: false }
                },
                x: {
                    position: 'top',
                    ticks: { font: { size: 12 } },
                    grid: { color: '#eee' }
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

    // Check if we have a custom descriptor for this item
    const customDescription = descriptors[item.cleanName];
    if (customDescription) {
        comparisonText += `<br><br><hr style="border:0; border-top:1px solid #eee; margin: 10px 0;"><span style="color: #34495e; font-style: normal; display: block;">${customDescription}</span>`;
    }

    // Use innerHTML to allow the <br> and <span> tags to render
    document.getElementById('active-comparison').innerHTML = comparisonText;
}

initDashboard();
