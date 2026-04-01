async function initDashboard() {
    const response = await fetch('influences.md');
    const text = await response.text();
    
    // Updated Regex: Handles "83 Name 0.34" or "Name 0.34"
    const regex = /(?:\d+\s+)?([\w\s–\/-]+?)\s+(-?\d\.\d{2})/g;
    let match;
    const dataPoints = [];

    while ((match = regex.exec(text)) !== null) {
        dataPoints.push({
            name: match[1].trim(),
            score: parseFloat(match[2])
        });
    }

    // Sort by impact
    dataPoints.sort((a, b) => b.score - a.score);

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
   // Calculate total height: 150 items * 30px per item = 4500px
   const totalHeight = labels.length * 30; 
   ctxBar.canvas.style.height = `${totalHeight}px`;
    // 1. Bar Chart
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels, // Your labels parsed from influences.md
        datasets: [{
            label: 'Effect Size',
            data: values, // Your scores parsed from influences.md
            backgroundColor: colors,
            borderRadius: 4,
            barThickness: 20 // Keeps the bars a consistent, readable size
        }]
    },
    options: {
        indexAxis: 'y',
        maintainAspectRatio: false, // REQUIRED: Allows the canvas to be tall
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                ticks: {
                    autoSkip: false, // REQUIRED: Prevents skipping items
                    font: {
                        size: 12 // Keeping your original font size
                    }
                },
                grid: { display: false }
            },
            x: {
                position: 'top'
            }
        }
    }
});

    // 2. Scatter Plot (The "Scale" Visualizer)
    new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Influences',
                data: data.map(d => ({ x: d.score, y: Math.random() * 10 - 5 })), // Jitter
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
                    grid: { color: (c) => c.tick.value === 0.4 ? 'red' : '#eee' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: { label: (ctx) => data[ctx.dataIndex].name + ': ' + ctx.raw.x }
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
