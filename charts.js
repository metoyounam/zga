/* ============================
   charts.js - Chart Rendering
   Updated: Breakdown radar & bar charts
   ============================ */

const Charts = {
    instances: {},

    destroy(id) {
        if (this.instances[id]) {
            this.instances[id].destroy();
            delete this.instances[id];
        }
    },
    destroyAll() {
        Object.keys(this.instances).forEach(k => this.destroy(k));
    },

    /**
     * Student performance line chart
     */
    createStudentTrendChart(canvasId, grades) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = grades.map(g => g.fileName || 'اختبار');
        const data = grades.map(g => parseFloat(g.percentage));

        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'النسبة المئوية',
                    data,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    borderWidth: 3, fill: true, tension: 0.4,
                    pointBackgroundColor: '#6366F1', pointBorderColor: '#fff',
                    pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { rtl: true, textDirection: 'rtl', fontFamily: 'Tajawal', callbacks: { label: (c) => `${c.parsed.y}%` } }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { family: 'Tajawal', size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { ticks: { font: { family: 'Tajawal', size: 10 }, maxRotation: 45 }, grid: { display: false } }
                }
            }
        });
    },

    /**
     * Grade distribution doughnut chart
     */
    createDistributionChart(canvasId, grades) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const dist = Analyzer.getGradeDistribution(grades);

        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [dist.excellent.label, dist.veryGood.label, dist.good.label, dist.acceptable.label, dist.weak.label],
                datasets: [{
                    data: [dist.excellent.count, dist.veryGood.count, dist.good.count, dist.acceptable.count, dist.weak.count],
                    backgroundColor: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B', '#EF4444'],
                    borderWidth: 2, borderColor: '#fff'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal', size: 11 }, padding: 12, usePointStyle: true } },
                    tooltip: { rtl: true, fontFamily: 'Tajawal', callbacks: { label: (c) => { const t = c.dataset.data.reduce((a, b) => a + b, 0); return `${c.label}: ${c.parsed} (${t > 0 ? ((c.parsed / t) * 100).toFixed(1) : 0}%)`; } } }
                },
                cutout: '60%'
            }
        });
    },

    /**
     * Class averages bar chart across files
     */
    createClassAveragesChart(canvasId, files, students) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = [];
        const avgs = [];
        files.forEach(file => {
            labels.push(file.name);
            const fg = students.map(s => s.grades.find(g => g.fileId === file.id)).filter(g => g).map(g => parseFloat(g.percentage));
            avgs.push(fg.length > 0 ? (fg.reduce((a, b) => a + b, 0) / fg.length).toFixed(1) : 0);
        });

        const colors = avgs.map(a => a >= 80 ? '#10B981' : a >= 70 ? '#3B82F6' : a >= 60 ? '#F59E0B' : '#EF4444');

        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'متوسط الصف', data: avgs, backgroundColor: colors, borderRadius: 8, borderSkipped: false }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { rtl: true, fontFamily: 'Tajawal', callbacks: { label: c => `المتوسط: ${c.parsed.y}%` } } },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { family: 'Tajawal', size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { ticks: { font: { family: 'Tajawal', size: 10 }, maxRotation: 45 }, grid: { display: false } }
                }
            }
        });
    },

    /**
     * Breakdown bar chart for a student (latest grades components)
     */
    createBreakdownChart(canvasId, breakdown) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx || !breakdown) return;

        const keys = ['written', 'homework', 'oral', 'attendance'];
        const labels = keys.map(k => Analyzer.getBreakdownLabel(k));
        const scores = keys.map(k => breakdown[k] ? ((breakdown[k].score / breakdown[k].max) * 100).toFixed(1) : 0);
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];

        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'النسبة',
                    data: scores,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 36
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        rtl: true, fontFamily: 'Tajawal',
                        callbacks: { label: c => { const k = keys[c.dataIndex]; return `${breakdown[k]?.score || 0} / ${breakdown[k]?.max || 0} (${c.parsed.x}%)`; } }
                    }
                },
                scales: {
                    x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { family: 'Tajawal', size: 10 } } },
                    y: { ticks: { font: { family: 'Tajawal', size: 12, weight: 'bold' } } }
                }
            }
        });
    },

    /**
     * Breakdown radar chart comparing student to class average
     */
    createBreakdownRadar(canvasId, studentBreakdown, classAverages) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx || !studentBreakdown) return;

        const keys = ['written', 'homework', 'oral', 'attendance'];
        const labels = keys.map(k => Analyzer.getBreakdownLabel(k));
        const studentData = keys.map(k => studentBreakdown[k] ? (studentBreakdown[k].score / studentBreakdown[k].max) * 100 : 0);
        const classData = keys.map(k => classAverages[k] ? parseFloat(classAverages[k]) : 0);

        this.instances[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'الطالب',
                        data: studentData,
                        borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.15)',
                        borderWidth: 2, pointBackgroundColor: '#6366F1', pointRadius: 4
                    },
                    {
                        label: 'متوسط الصف',
                        data: classData,
                        borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)',
                        borderWidth: 2, pointBackgroundColor: '#F59E0B', pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal', size: 11 }, usePointStyle: true } },
                    tooltip: { rtl: true, fontFamily: 'Tajawal', callbacks: { label: c => `${c.dataset.label}: ${c.parsed.r.toFixed(1)}%` } }
                },
                scales: {
                    r: {
                        beginAtZero: true, max: 100,
                        ticks: { stepSize: 25, font: { family: 'Tajawal', size: 9 }, backdropColor: 'transparent' },
                        pointLabels: { font: { family: 'Tajawal', size: 11, weight: 'bold' } }
                    }
                }
            }
        });
    },

    /**
     * Group comparison chart
     */
    createGroupComparisonChart(canvasId, groups, files, students) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const datasets = groups.map((group, idx) => {
            const groupStudents = students.filter(s => s.groupId === group.id);
            const data = files.map(file => {
                const grades = groupStudents.map(s => s.grades.find(g => g.fileId === file.id)).filter(g => g).map(g => parseFloat(g.percentage));
                return grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : null;
            });
            return {
                label: group.name, data,
                borderColor: group.color || colors[idx % colors.length],
                backgroundColor: 'transparent', borderWidth: 3, tension: 0.4,
                pointRadius: 5, pointBackgroundColor: group.color || colors[idx % colors.length]
            };
        });

        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { labels: files.map(f => f.name), datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', rtl: true, labels: { font: { family: 'Tajawal', size: 11 }, usePointStyle: true } }, tooltip: { rtl: true, fontFamily: 'Tajawal' } },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { family: 'Tajawal', size: 10 } } },
                    x: { ticks: { font: { family: 'Tajawal', size: 10 }, maxRotation: 45 } }
                }
            }
        });
    }
};
