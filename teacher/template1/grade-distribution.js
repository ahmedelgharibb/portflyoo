// Grade Distribution Functions
async function loadGradeDistribution() {
    try {
        const { data, error } = await supabase
            .from('grade_distribution')
            .select('*')
            .order('subject');

        if (error) throw error;

        if (data) {
            updateGradeDistributionUI(data);
            initializeSubjectCharts(data);
        }
    } catch (error) {
        console.error('Error loading grade distribution:', error);
        showAdminAlert('error', 'Failed to load grade distribution data');
    }
}

function updateGradeDistributionUI(subjects) {
    const container = document.getElementById('gradeDistributionContainer');
    if (!container) return;

    container.innerHTML = subjects.map(subject => `
        <div class="subject-grade-card bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-xl font-semibold mb-4">${subject.subject}</h3>
            <div class="grid grid-cols-3 gap-4">
                <div class="grade-input">
                    <label class="block text-sm font-medium text-gray-700 mb-1">A* Students</label>
                    <input type="number" 
                           class="a-star-input w-full px-3 py-2 border rounded-md" 
                           value="${subject.a_star_count}"
                           data-subject="${subject.subject}"
                           min="0">
                </div>
                <div class="grade-input">
                    <label class="block text-sm font-medium text-gray-700 mb-1">A Students</label>
                    <input type="number" 
                           class="a-input w-full px-3 py-2 border rounded-md" 
                           value="${subject.a_count}"
                           data-subject="${subject.subject}"
                           min="0">
                </div>
                <div class="grade-input">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Other Grades</label>
                    <input type="number" 
                           class="rest-input w-full px-3 py-2 border rounded-md" 
                           value="${subject.rest_count}"
                           data-subject="${subject.subject}"
                           min="0">
                </div>
            </div>
            <div class="mt-4" style="height: 300px;">
                <canvas id="chart-${subject.subject.toLowerCase().replace(/\s+/g, '-')}"></canvas>
            </div>
        </div>
    `).join('');

    // Add event listeners to inputs
    document.querySelectorAll('.a-star-input, .a-input, .rest-input').forEach(input => {
        input.addEventListener('change', handleGradeInputChange);
    });
}

function initializeSubjectCharts(subjects) {
    subjects.forEach(subject => {
        const canvasId = `chart-${subject.subject.toLowerCase().replace(/\s+/g, '-')}`;
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['A*', 'A', 'Other Grades'],
                datasets: [{
                    data: [subject.a_star_count, subject.a_count, subject.rest_count],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',  // Blue for A*
                        'rgba(16, 185, 129, 0.8)',  // Green for A
                        'rgba(245, 158, 11, 0.8)'   // Yellow for rest
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} students (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    });
}

async function handleGradeInputChange(e) {
    const subjectName = e.target.dataset.subject;
    const gradeType = e.target.classList.contains('a-star-input') ? 'a_star_count' :
                     e.target.classList.contains('a-input') ? 'a_count' : 'rest_count';
    const value = parseInt(e.target.value) || 0;

    try {
        const { error } = await supabase
            .from('grade_distribution')
            .update({ [gradeType]: value })
            .eq('subject', subjectName);

        if (error) throw error;

        // Update the chart
        const canvasId = `chart-${subjectName.toLowerCase().replace(/\s+/g, '-')}`;
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        const chart = Chart.getChart(ctx);
        if (!chart) return;

        const dataIndex = gradeType === 'a_star_count' ? 0 :
                         gradeType === 'a_count' ? 1 : 2;
        
        chart.data.datasets[0].data[dataIndex] = value;
        chart.update();
    } catch (error) {
        console.error('Error updating grade distribution:', error);
        showAdminAlert('error', 'Failed to update grade distribution');
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    loadGradeDistribution();
}); 