async function initDashboard() {
    try {
        const response = await fetch('sample.md');
        const text = await response.text();
        
        // REGEX FIX: Ignores leading numbers, captures name, captures score
        const regex = /(?:\d+\s+)?([\w\s–\/-]+?)\s(-?\d\.\d{2})/g;
        let match;
        const dataPoints = [];

        while ((match = regex.exec(text)) !== null) {
            dataPoints.push({
                name: match[1].trim(),
                score: parseFloat(match[2])
            });
        }

        // Sort Highest to Lowest
        dataPoints.sort((a, b) => b.score - a.score);

        renderDashboard(dataPoints);
    } catch (e) {
        console.error("Data load failed", e);
    }
}

function renderDashboard(data) {
    // 1. DYNAMIC HEIGHT: We give each bar 35 pixels.
    const barHeight = data.length * 35;
    const barCanvas = document.getElementById('barChart');
    barCanvas.parentNode.style.height = `${barHeight}px`;

    // 2. SCATTER CHART (Distribution)
    new Chart(document.getElementById('scatterChart'), {
        type: 'scatter',
        data: {
            datasets: [{
                data: data.map(d => ({ x: d.score, y: Math.random() * 6 - 3 })),
                backgroundColor: data.map(d => d.score >= 0.4 ? 'rgba(39, 174, 96, 0.5)' : 'rgba(231, 76, 60, 0.5)'),
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { display: false },
                x: { title: { display: true, text: 'Effect Size (d)' }, grid: { color: c => c.tick.value === 0.4 ? '#e74c3c' : '#f0f0f0' } }
            },
            plugins: { 
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => data[ctx.dataIndex].name } } 
            },
            onClick: (e, el) => { if(el[0]) updateUI(data[el[0].index]); }
        }
    });

    // 3. BAR CHART (The Scrollable List)
    new Chart(barCanvas, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Effect Size',
                data: data.map(d => d.score),
                backgroundColor: data.map(d => d.score >= 0.4 ? '#27ae60' : '#e74c3c'),
                borderRadius: 4,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { position: 'top', grid: { color: '#eee' } },
                y: { ticks: { font: { size: 11 } } }
            },
            plugins: { legend: { display: false } },
            onClick: (e, el) => { if(el[0]) updateUI(data[el[0].index]); }
        }
    });
}

function updateUI(item) {
    const hinge = 0.40;
    const multiplier = (item.score / hinge).toFixed(1);
    
    document.getElementById('active-name').innerText = item.name;
    document.getElementById('active-score').innerText = item.score.toFixed(2);
    document.getElementById('active-score').style.color = item.score >= 0.4 ? '#27ae60' : '#e74c3c';
    
    let text = item.score >= 0.4 
        ? `Impressive! This is ${multiplier}x more effective than average schooling.`
        : `This has low impact (${Math.round(multiplier*100)}% of typical growth).`;
    
    if (item.score < 0) text = "Caution: This intervention may actually hinder learning.";
    document.getElementById('active-comparison').innerText = text;
}

initDashboard();