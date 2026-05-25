/* ============================
   analyzer.js - Pattern Detection & Analysis Engine
   Updated: Multi-component grade support
   ============================ */

const Analyzer = {

    getGradeClassification(percentage) {
        if (percentage >= 90) return { label: 'ممتاز', class: 'excellent', color: '#10B981' };
        if (percentage >= 80) return { label: 'جيد جداً', class: 'very-good', color: '#3B82F6' };
        if (percentage >= 70) return { label: 'جيد', class: 'good', color: '#6366F1' };
        if (percentage >= 60) return { label: 'مقبول', class: 'acceptable', color: '#F59E0B' };
        return { label: 'ضعيف', class: 'weak', color: '#EF4444' };
    },

    /**
     * Get breakdown label in Arabic
     */
    getBreakdownLabel(key) {
        const labels = {
            written: 'التحريري',
            homework: 'الواجبات',
            oral: 'الشفوي',
            attendance: 'المواظبة'
        };
        return labels[key] || key;
    },

    /**
     * Get breakdown icon SVG
     */
    getBreakdownIcon(key) {
        const icons = {
            written: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
            homework: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
            oral: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
            attendance: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        };
        return icons[key] || '';
    },

    calculateStats(grades) {
        if (!grades || grades.length === 0) {
            return { avg: 0, median: 0, max: 0, min: 0, count: 0, stdDev: 0 };
        }
        const sorted = [...grades].sort((a, b) => a - b);
        const sum = grades.reduce((a, b) => a + b, 0);
        const avg = sum / grades.length;
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const variance = grades.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / grades.length;
        const stdDev = Math.sqrt(variance);

        return {
            avg: avg.toFixed(1), median: median.toFixed(1),
            max: Math.max(...grades).toFixed(1), min: Math.min(...grades).toFixed(1),
            count: grades.length, stdDev: stdDev.toFixed(1), sum: sum.toFixed(1)
        };
    },

    /**
     * Calculate breakdown averages across students for a file
     */
    calculateBreakdownStats(students, fileId) {
        const totals = { written: [], homework: [], oral: [], attendance: [] };
        students.forEach(s => {
            const grade = s.grades.find(g => g.fileId === fileId);
            if (grade && grade.breakdown) {
                Object.keys(totals).forEach(key => {
                    if (grade.breakdown[key]) {
                        totals[key].push((grade.breakdown[key].score / grade.breakdown[key].max) * 100);
                    }
                });
            }
        });
        const result = {};
        Object.keys(totals).forEach(key => {
            const arr = totals[key];
            result[key] = arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;
        });
        return result;
    },

    calculateSlope(values) {
        if (values.length < 2) return 0;
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
        }
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    },

    getStudentTrend(studentGrades) {
        if (studentGrades.length < 2) return { trend: 'stable', label: 'لا بيانات كافية', icon: '→' };
        const percentages = studentGrades.map(g => parseFloat(g.percentage));
        const slope = this.calculateSlope(percentages);
        const lastTwo = percentages.slice(-2);
        const diff = lastTwo[1] - lastTwo[0];

        if (slope > 1.5 || diff > 5) return { trend: 'improving', label: 'يتحسن ↑', icon: '↑', slope };
        else if (slope < -1.5 || diff < -5) return { trend: 'declining', label: 'يتراجع ↓', icon: '↓', slope };
        else return { trend: 'stable', label: 'مستقر →', icon: '→', slope };
    },

    detectPatterns(students, files) {
        const alerts = [];
        if (files.length < 2 || students.length === 0) return alerts;

        // 1. Sudden decline after a specific exam
        if (files.length >= 2) {
            const lastFile = files[files.length - 1];
            const prevFile = files[files.length - 2];
            let declineCount = 0;
            let declineStudents = [];

            students.forEach(student => {
                if (student.grades.length >= 2) {
                    const lastGrade = parseFloat(student.grades[student.grades.length - 1].percentage);
                    const prevGrade = parseFloat(student.grades[student.grades.length - 2].percentage);
                    if (lastGrade < prevGrade - 10) {
                        declineCount++;
                        declineStudents.push(student.name);
                    }
                }
            });

            const declineRatio = declineCount / students.length;
            if (declineRatio > 0.4) {
                alerts.push({ type: 'danger', title: 'تراجع جماعي', message: `${declineCount} طالب من أصل ${students.length} تراجعوا بشكل ملحوظ في "${lastFile.name}" مقارنة بـ"${prevFile.name}".`, students: declineStudents.slice(0, 5) });
            } else if (declineRatio > 0.2) {
                alerts.push({ type: 'warning', title: 'تراجع جزئي', message: `${declineCount} طالب تراجعوا في "${lastFile.name}". يُنصح بمتابعتهم.`, students: declineStudents.slice(0, 5) });
            }
        }

        // 2. Consistently weak
        students.forEach(student => {
            if (student.grades.length >= 2) {
                const avgPercent = student.grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / student.grades.length;
                const lastPercent = parseFloat(student.grades[student.grades.length - 1].percentage);
                if (avgPercent < 50 && lastPercent < 50) {
                    alerts.push({ type: 'danger', title: `أداء ضعيف مستمر: ${student.name}`, message: `متوسط ${avgPercent.toFixed(1)}% وآخر درجة ${lastPercent.toFixed(1)}%. يحتاج تدخل عاجل.`, students: [student.name] });
                }
            }
        });

        // 3. Improving students
        students.forEach(student => {
            if (student.grades.length >= 3) {
                const firstThird = student.grades.slice(0, Math.ceil(student.grades.length / 3));
                const lastThird = student.grades.slice(-Math.ceil(student.grades.length / 3));
                const firstAvg = firstThird.reduce((s, g) => s + parseFloat(g.percentage), 0) / firstThird.length;
                const lastAvg = lastThird.reduce((s, g) => s + parseFloat(g.percentage), 0) / lastThird.length;
                if (lastAvg > firstAvg + 15) {
                    alerts.push({ type: 'info', title: `تحسن ملحوظ: ${student.name}`, message: `تحسن من متوسط ${firstAvg.toFixed(1)}% إلى ${lastAvg.toFixed(1)}%.`, students: [student.name] });
                }
            }
        });

        // 4. Unstable
        students.forEach(student => {
            if (student.grades.length >= 3) {
                const percentages = student.grades.map(g => parseFloat(g.percentage));
                const stats = this.calculateStats(percentages);
                if (parseFloat(stats.stdDev) > 15) {
                    alerts.push({ type: 'warning', title: `عدم استقرار: ${student.name}`, message: `تذبذب كبير في الأداء (انحراف: ${stats.stdDev}%).`, students: [student.name] });
                }
            }
        });

        // 5. Class trend
        if (files.length >= 3) {
            const fileAverages = files.map(file => {
                const g = students.map(s => s.grades.find(g => g.fileId === file.id)).filter(g => g).map(g => parseFloat(g.percentage));
                return g.length > 0 ? g.reduce((a, b) => a + b, 0) / g.length : 0;
            });
            const classSlope = this.calculateSlope(fileAverages);
            if (classSlope > 2) {
                alerts.unshift({ type: 'info', title: 'اتجاه إيجابي للصف', message: `الصف يتحسن بمعدل ${classSlope.toFixed(1)}% بين كل اختبار.`, students: [] });
            } else if (classSlope < -2) {
                alerts.unshift({ type: 'warning', title: 'اتجاه سلبي للصف', message: `متوسط الصف يتراجع بمعدل ${Math.abs(classSlope).toFixed(1)}%.`, students: [] });
            }
        }

        return alerts;
    },

    getGradeDistribution(grades) {
        const dist = {
            excellent: { count: 0, label: 'ممتاز (90-100%)', color: '#10B981' },
            veryGood: { count: 0, label: 'جيد جداً (80-89%)', color: '#3B82F6' },
            good: { count: 0, label: 'جيد (70-79%)', color: '#6366F1' },
            acceptable: { count: 0, label: 'مقبول (60-69%)', color: '#F59E0B' },
            weak: { count: 0, label: 'ضعيف (أقل من 60%)', color: '#EF4444' }
        };
        grades.forEach(grade => {
            if (grade >= 90) dist.excellent.count++;
            else if (grade >= 80) dist.veryGood.count++;
            else if (grade >= 70) dist.good.count++;
            else if (grade >= 60) dist.acceptable.count++;
            else dist.weak.count++;
        });
        return dist;
    },

    rankStudents(students) {
        const ranked = students.map(s => {
            const grades = s.grades;
            const latestGrade = grades.length > 0 ? grades[grades.length - 1] : null;
            const latestPercentage = latestGrade ? parseFloat(latestGrade.percentage) : 0;
            const latestRawGrade = latestGrade ? latestGrade.grade : 0;
            const latestBreakdown = latestGrade ? latestGrade.breakdown : null;
            return { ...s, latestPercentage, latestRawGrade, latestBreakdown, rank: 0 };
        });
        ranked.sort((a, b) => b.latestPercentage - a.latestPercentage);
        ranked.forEach((s, i) => { s.rank = i + 1; });
        return ranked;
    },

    /**
     * Get students eligible for excellence certificate
     */
    getExcellentStudents(students, threshold = 90) {
        const ranked = this.rankStudents(students);
        return ranked.filter(s => s.latestPercentage >= threshold);
    },

    compareGroups(group1Students, group2Students, files) {
        const results = {};
        files.forEach(file => {
            const g1G = group1Students.map(s => s.grades.find(g => g.fileId === file.id)).filter(g => g).map(g => parseFloat(g.percentage));
            const g2G = group2Students.map(s => s.grades.find(g => g.fileId === file.id)).filter(g => g).map(g => parseFloat(g.percentage));
            results[file.id] = {
                fileName: file.name,
                group1Avg: g1G.length > 0 ? (g1G.reduce((a, b) => a + b, 0) / g1G.length).toFixed(1) : null,
                group2Avg: g2G.length > 0 ? (g2G.reduce((a, b) => a + b, 0) / g2G.length).toFixed(1) : null,
                group1Count: g1G.length, group2Count: g2G.length
            };
        });
        return results;
    }
};
