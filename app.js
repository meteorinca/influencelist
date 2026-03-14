async function initChart() {
    try {
        const response = await fetch('influences.md');
        const text = await response.text();
        
        // Regex to find "Influence Name" followed by "0.00"
        const regex = /([\w\s–\/-]+)\s(\d\.\d{2})/g;
        let match;
        const labels = [];
        const values = [];
        const colors = [];

        while ((match = regex.exec(text)) !== null) {
            const name = match[1].trim();
            const score = parseFloat(match[2]);
            
            labels.push(name);
            values.push(score);
            
            // Color coding based on Hattie's zones
            if (score >= 0.7) colors.push('#27ae60'); // High Impact
            else if (score >= 0.4) colors.push('#2ecc71'); // Desired Effect
            else if (score >= 0.15) colors.push('#f1c40f'); // Typical growth
            else colors.push('#e74c3c'); // Low/Negative
        }

        const ctx = document.getElementById('hattieChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Effect Size (d)',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars are better for long labels
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    annotation: { // Optional: Requires annotation plugin
                        annotations: {
                            line1: { type: 'line', xMin: 0.4, xMax: 0.4, borderColor: 'red', borderWidth: 2, label: { content: 'Hinge Point (0.4)', enabled: true } }
                        }
                    }
                },
                scales: {
                    x: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Effect Size (d)' }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Error loading the MD file:", err);
    }
}

initChart();