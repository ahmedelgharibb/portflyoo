// Grade Distribution Functions

// Helper to get current grade categories (from global variable)
function getCurrentGradeCategories() {
    return Array.isArray(window.gradeCategories) && window.gradeCategories.length > 0
        ? window.gradeCategories
        : ['A*', 'A', 'Other'];
}

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
    const categories = getCurrentGradeCategories();
    container.innerHTML = subjects.map(subject => {
        const gradeCounts = subject.grade_counts || {};
        return `
        <div class="subject-grade-card bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-xl font-semibold mb-4">${subject.subject}</h3>
            <div class="grid grid-cols-${categories.length} gap-4">
                ${categories.map(cat => `
                    <div class="grade-input">
                        <label class="block text-sm font-medium text-gray-700 mb-1">${cat} Students</label>
                        <input type="number" 
                               class="grade-input-field w-full px-3 py-2 border rounded-md" 
                               value="${gradeCounts[cat] || 0}"
                               data-subject="${subject.subject}"
                               data-grade="${cat}"
                               min="0">
                    </div>
                `).join('')}
            </div>
            <div class="mt-4" style="height: 300px;">
                <canvas id="chart-${subject.subject.toLowerCase().replace(/\s+/g, '-')}"></canvas>
            </div>
        </div>
        `;
    }).join('');

    // Add event listeners to inputs
    document.querySelectorAll('.grade-input-field').forEach(input => {
        input.addEventListener('change', handleGradeInputChange);
    });
}

function initializeSubjectCharts(subjects) {
    const categories = getCurrentGradeCategories();
    subjects.forEach(subject => {
        const gradeCounts = subject.grade_counts || {};
        const canvasId = `chart-${subject.subject.toLowerCase().replace(/\s+/g, '-')}`;
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;
        const dataArr = categories.map(cat => gradeCounts[cat] || 0);
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: dataArr,
                    backgroundColor: categories.map((_, i) => [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 99, 132, 0.8)'][i % 7]),
                    borderColor: categories.map((_, i) => [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'][i % 7]),
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
                                const percentage = total ? ((context.raw / total) * 100).toFixed(1) : 0;
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
    const grade = e.target.dataset.grade;
    const value = parseInt(e.target.value) || 0;
    try {
        // Fetch the current grade_counts for this subject
        const { data, error: fetchError } = await supabase
            .from('grade_distribution')
            .select('grade_counts')
            .eq('subject', subjectName)
            .single();
        if (fetchError) throw fetchError;
        const gradeCounts = data.grade_counts || {};
        gradeCounts[grade] = value;
        // Update in Supabase
        const { error } = await supabase
            .from('grade_distribution')
            .update({ grade_counts: gradeCounts })
            .eq('subject', subjectName);
        if (error) throw error;
        // Update the chart
        const canvasId = `chart-${subjectName.toLowerCase().replace(/\s+/g, '-')}`;
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;
        const chart = Chart.getChart(ctx);
        if (!chart) return;
        const categories = getCurrentGradeCategories();
        chart.data.datasets[0].data = categories.map(cat => gradeCounts[cat] || 0);
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