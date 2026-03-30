async function initChart() {
    try {
        const response = await fetch('influences.md');
        const text = await response.text();

        // Parse line by line (more reliable than a single regex)
        const lines = text.split(/\r?\n/);
        const labels = [];
        const values = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            // Matches: optional number at start, then name, then effect size (negative allowed)
            // Example: "147 Welfare policies –0.12" or "Retention –0.13"
            const match = line.match(/^(?:\d+\s+)?(.+?)\s+([–-]?\d+\.\d{2})$/);
            if (match) {
                let name = match[1].trim();
                let scoreStr = match[2].trim();

                // Replace en dash (–) or em dash with regular minus
                scoreStr = scoreStr.replace(/[–—]/g, '-');
                const score = parseFloat(scoreStr);

                labels.push(name);
                values.push(score);
            }
        }

        // Color coding based on Hattie's zones
        const colors = values.map(score => {
            if (score >= 0.7) return '#27ae60';      // High Impact
            if (score >= 0.4) return '#2ecc71';      // Desired Effect
            if (score >= 0.15) return '#f1c40f';     // Typical growth
            return '#e74c3c';                        // Low/Negative
        });

        // --- Fix the squeezed bars: set canvas height dynamically ---
        const canvas = document.getElementById('hattieChart');
        const barHeightPx = 28;                // pixels per bar (adjust as needed)
        const totalHeight = labels.length * barHeightPx;
        canvas.height = totalHeight;
        canvas.style.height = `${totalHeight}px`;

        // --- Create the chart ---
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Effect Size (d)',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 5,
                    barPercentage: 0.9,          // slightly thinner bars for readability
                    categoryPercentage: 0.8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,       // respect canvas.height we set
                plugins: {
                    tooltip: { enabled: true },
                    legend: { position: 'top' }
                    // annotation plugin is optional – remove or keep as is
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Effect Size (d)', font: { weight: 'bold' } },
                        grid: { color: '#e0e0e0' }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,       // show EVERY label (requires enough height)
                            font: { size: 10 },
                            maxRotation: 0,
                            minRotation: 0
                        },
                        grid: { display: false }
                    }
                },
                layout: {
                    padding: { top: 10, right: 20, bottom: 10, left: 10 }
                }
            }
        });

        console.log(`Chart rendered with ${labels.length} items. Canvas height set to ${totalHeight}px`);

    } catch (err) {
        console.error("Error loading or parsing the MD file:", err);
    }
}

initChart();
