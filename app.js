async function initDashboard() {
    try {
        // 1. Fetch the data from your influences.md file
        const response = await fetch('influences.md');
        const text = await response.text();
        
        const labels = [];
        const values = [];
        const colors = [];

        // 2. Parse the lines
        const lines = text.trim().split('\n');
        
        lines.forEach(line => {
            const parts = line.split(' ');
            const score = parseFloat(parts.pop()); // Get the number at the end
            const rank = parts.shift(); // Get the rank at the beginning
            const name = parts.join(' '); // Join the remaining middle parts as the name
            
            labels.push(`${rank}. ${name}`);
            values.push(score);
            
            // Color based on Hattie's 0.4 "Hinge Point"
            if (score >= 0.4) colors.push('#27ae60');      // High impact
            else if (score >= 0) colors.push('#f1c40f');   // Medium/Low impact
            else colors.push('#e74c3c');                   // Negative impact
        });

        // 3. Fix the Bar Chart "Squeeze"
        const ctxBar = document.getElementById('barChart').getContext('2d');
        
        // Dynamic Height: 150 items * 30 pixels each = 4500px tall
        ctxBar.canvas.style.height = `${labels.length * 30}px`;

        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Effect Size',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false, // Essential for scrolling
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        ticks: {
                            autoSkip: false, // Show every single item
                            font: { size: 12 }
                        },
                        grid: { display: false }
                    },
                    x: { position: 'top' }
                }
            }
        });

        // 4. Scatter Plot (Minimal setup to ensure it shows up)
        const ctxScatter = document.getElementById('scatterChart').getContext('2d');
        new Chart(ctxScatter, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Influences',
                    data: values.map((v, i) => ({ x: i, y: v })),
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } catch (error) {
        console.error("Error loading or parsing influences.md:", error);
    }
}

// Run the function when the page loads
initDashboard();
