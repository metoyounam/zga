/* ============================
   reports.js - PDF Reports & Certificates
   Certificate section fully redesigned with template engine
   Fixed: getSetting/saveSetting → getGlobalSetting/setGlobalSetting
   Added: Group report export feature
   ============================ */

const Reports = {

    async renderPage() {
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const files = await getAllFiles(getCurrentClassLevelId());

        let html = `<div class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                التقارير والشهادات
            </div>`;

        if (students.length === 0) {
            html += `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3>لا توجد بيانات</h3><p>قم باستيراد ملفات الطلاب أولاً</p></div>`;
        } else {
            html += `
                <div class="report-card" onclick="Reports.generateClassReport()">
                    <div class="report-card-icon" style="background:var(--primary-bg)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </div>
                    <div class="report-card-info"><h4>تقرير شامل للصف</h4><p>إحصائيات كاملة مع تحليل تفصيلي لكل مكون</p></div>
                </div>

                <div class="report-card" onclick="Reports.showStudentReportPicker()">
                    <div class="report-card-icon" style="background:var(--success-bg)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="report-card-info"><h4>تقرير طالب فردي</h4><p>تقرير مفصل جاهز لمشاركته مع ولي الأمر</p></div>
                </div>

                <div class="report-card" onclick="Reports.generateWeakStudentsReport()">
                    <div class="report-card-icon" style="background:var(--warning-bg)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div class="report-card-info"><h4>تقرير الطلاب المتعثرين</h4><p>قائمة الطلاب الذين يحتاجون دعماً إضافياً</p></div>
                </div>

                <div class="report-card" onclick="Reports.showCertificatePage()">
                    <div class="report-card-icon" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border-radius:12px">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    </div>
                    <div class="report-card-info"><h4>شهادات التفوق 🏅</h4><p>إصدار شهادات للطلاب المتفوقين مع تخصيص كامل للصيغة</p></div>
                </div>

                <div class="report-card" onclick="Reports.showGroupReportPicker()">
                    <div class="report-card-icon" style="background:var(--info-bg)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                    <div class="report-card-info"><h4>تقرير حسب المجموعة 📋</h4><p>تصدير تقرير PDF لمجموعة محددة من الطلاب</p></div>
                </div>

                <div class="report-card" onclick="Reports.exportCSV()">
                    <div class="report-card-icon" style="background:var(--info-bg)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <div class="report-card-info"><h4>تصدير البيانات CSV</h4><p>تصدير جميع البيانات كملف جدول بيانات</p></div>
                </div>`;
        }

        document.getElementById('contentArea').innerHTML = `<div class="page">${html}</div>`;
    },

    // ============================
    // Class Report (unchanged)
    // ============================
    async generateClassReport() {
        showLoading('جارٍ إنشاء التقرير...');
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const files = await getAllFiles(getCurrentClassLevelId());
        if (students.length === 0) { hideLoading(); return; }

        const ranked = Analyzer.rankStudents(students);
        const latestGrades = ranked.map(s => s.latestPercentage);
        const stats = Analyzer.calculateStats(latestGrades.map(Number));
        const alerts = Analyzer.detectPatterns(students, files);
        const latestFile = files[files.length - 1];
        const breakdownStats = latestFile ? Analyzer.calculateBreakdownStats(students, latestFile.id) : null;

        const reportEl = document.createElement('div');
        reportEl.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Tajawal,sans-serif;direction:rtl;';

        reportEl.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #4F46E5;padding-bottom:20px">
                <h1 style="color:#4F46E5;font-size:24px;margin-bottom:8px">📊 تقرير أداء الصف الشامل</h1>
                <p style="color:#64748B;font-size:14px">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
                <p style="color:#64748B;font-size:14px">عدد الطلاب: ${students.length} | عدد الاختبارات: ${files.length}</p>
            </div>
            <div style="display:flex;justify-content:space-around;margin-bottom:30px">
                <div style="text-align:center;padding:15px;background:#EEF2FF;border-radius:12px;min-width:120px"><div style="font-size:24px;font-weight:800;color:#4F46E5">${stats.avg}%</div><div style="font-size:12px;color:#64748B">المتوسط</div></div>
                <div style="text-align:center;padding:15px;background:#D1FAE5;border-radius:12px;min-width:120px"><div style="font-size:24px;font-weight:800;color:#10B981">${stats.max}%</div><div style="font-size:12px;color:#64748B">أعلى درجة</div></div>
                <div style="text-align:center;padding:15px;background:#FEE2E2;border-radius:12px;min-width:120px"><div style="font-size:24px;font-weight:800;color:#EF4444">${stats.min}%</div><div style="font-size:12px;color:#64748B">أدنى درجة</div></div>
                <div style="text-align:center;padding:15px;background:#FEF3C7;border-radius:12px;min-width:120px"><div style="font-size:24px;font-weight:800;color:#F59E0B">${stats.median}%</div><div style="font-size:12px;color:#64748B">الوسيط</div></div>
            </div>
            ${breakdownStats ? `<h2 style="color:#1E293B;font-size:16px;margin-bottom:12px">📈 متوسط مكونات الدرجات</h2>
            <div style="display:flex;justify-content:space-around;margin-bottom:30px">
                ${Object.keys(breakdownStats).map(k => { const v = breakdownStats[k]; const color = k === 'written' ? '#6366F1' : k === 'homework' ? '#10B981' : k === 'oral' ? '#F59E0B' : '#EC4899'; return `<div style="text-align:center;padding:12px;background:${color}15;border-radius:8px;min-width:100px"><div style="font-size:20px;font-weight:800;color:${color}">${v}%</div><div style="font-size:11px;color:#64748B">${Analyzer.getBreakdownLabel(k)}</div></div>`; }).join('')}
            </div>` : ''}
            <h2 style="color:#1E293B;font-size:18px;margin-bottom:15px">📋 قائمة الطلاب</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:30px">
                <thead><tr style="background:#EEF2FF">
                    <th style="padding:10px;text-align:right;color:#4F46E5;border:1px solid #E2E8F0">الترتيب</th>
                    <th style="padding:10px;text-align:right;color:#4F46E5;border:1px solid #E2E8F0">اسم الطالب</th>
                    <th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">تحريري</th>
                    <th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">واجبات</th>
                    <th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">شفوي</th>
                    <th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">مواظبة</th>
                    <th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">المجموع</th>
                    <th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">التقدير</th>
                </tr></thead>
                <tbody>${ranked.map(s => { const cl = Analyzer.getGradeClassification(s.latestPercentage); const bd = s.latestBreakdown; return `<tr><td style="padding:8px;text-align:right;border:1px solid #E2E8F0">${s.rank}</td><td style="padding:8px;text-align:right;border:1px solid #E2E8F0;font-weight:600">${s.name}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.written.score : '-'}/50</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.homework.score : '-'}/20</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.oral.score : '-'}/20</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.attendance.score : '-'}/10</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;font-weight:700">${s.latestRawGrade}/100</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:${cl.color};font-weight:700">${cl.label}</td></tr>`; }).join('')}</tbody>
            </table>
            ${alerts.length > 0 ? `<h2 style="color:#1E293B;font-size:18px;margin-bottom:15px">🔍 الملاحظات</h2>${alerts.slice(0, 5).map(a => `<div style="padding:12px;border-radius:8px;margin-bottom:8px;background:${a.type === 'danger' ? '#FEE2E2' : a.type === 'warning' ? '#FEF3C7' : '#D1FAE5'}\"><strong style="color:${a.type === 'danger' ? '#991B1B' : a.type === 'warning' ? '#92400E' : '#065F46'}\">${a.title}</strong><p style="font-size:12px;margin-top:4px;color:${a.type === 'danger' ? '#991B1B' : a.type === 'warning' ? '#92400E' : '#065F46'}\">${a.message}</p></div>`).join('')}` : ''}
            <div style="margin-top:30px;text-align:center;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:15px">محلل الطالب الذكي - إصدار المعلم المحمول</div>`;

        document.body.appendChild(reportEl);
        try {
            const canvas = await html2canvas(reportEl, { scale: 2, backgroundColor: '#ffffff' });
            document.body.removeChild(reportEl);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pw = pdf.internal.pageSize.getWidth();
            const ph = (canvas.height * pw) / canvas.width;
            let hl = ph, pos = 0;
            const pageH = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, pos, pw, ph);
            hl -= pageH;
            while (hl > 0) { pos = hl - ph; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, pos, pw, ph); hl -= pageH; }
            pdf.save(`تقرير_الصف_${new Date().toLocaleDateString('ar-SA')}.pdf`);
            showToast('تم تحميل التقرير بنجاح', 'success');
        } catch (err) { if (reportEl.parentNode) document.body.removeChild(reportEl); showToast('خطأ في إنشاء التقرير', 'error'); }
        hideLoading();
    },

    // ============================
    // Student Report Picker (unchanged)
    // ============================
    async showStudentReportPicker() {
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const ranked = Analyzer.rankStudents(students);
        const dialogHtml = `<div class="dialog-overlay" id="studentReportDialog" style="align-items:flex-start;padding-top:20px">
            <div class="dialog-content" style="max-height:80vh;overflow-y:auto">
                <div class="dialog-title">اختر الطالب</div>
                <div class="group-select-list">${ranked.map(s => `
                    <div class="group-select-item" onclick="Reports.generateStudentReport('${escapeHtml(s.id)}')">
                        <div class="student-avatar">${s.name.charAt(0)}</div>
                        <div style="flex:1"><div style="font-size:13px;font-weight:600">${s.name}</div>
                        <div style="font-size:11px;color:var(--text-muted)">الترتيب: ${s.rank} | ${s.latestPercentage}%</div></div>
                    </div>`).join('')}</div>
                <div class="dialog-actions mt-12"><button class="btn btn-outline btn-block" onclick="closeDialog('studentReportDialog')">إلغاء</button></div>
            </div></div>`;
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
    },

    // ============================
    // Individual Student Report (unchanged)
    // ============================
    async generateStudentReport(studentId) {
        closeDialog('studentReportDialog');
        showLoading('جارٍ إنشاء التقرير...');
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const files = await getAllFiles(getCurrentClassLevelId());
        const ranked = Analyzer.rankStudents(students);
        const student = ranked.find(s => s.id === studentId);
        if (!student) { hideLoading(); return; }

        const trend = Analyzer.getStudentTrend(student.grades);
        const classification = Analyzer.getGradeClassification(student.latestPercentage);
        const avgGrade = student.grades.length > 0 ? (student.grades.reduce((s, g) => s + parseFloat(g.percentage), 0) / student.grades.length).toFixed(1) : '0';
        const latestFile = files[files.length - 1];
        const classAvg = latestFile ? Analyzer.calculateBreakdownStats(students, latestFile.id) : null;

        const reportEl = document.createElement('div');
        reportEl.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Tajawal,sans-serif;direction:rtl;';
        reportEl.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #4F46E5;padding-bottom:20px">
                <h1 style="color:#4F46E5;font-size:22px;margin-bottom:8px">📝 تقرير أداء الطالب</h1>
                <h2 style="color:#1E293B;font-size:26px;margin-bottom:4px">${student.name}</h2>
                <p style="color:#64748B;font-size:14px">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <div style="display:flex;justify-content:space-around;margin-bottom:30px">
                <div style="text-align:center;padding:15px;background:#EEF2FF;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:#4F46E5">${student.latestPercentage}%</div><div style="font-size:12px;color:#64748B">المجموع</div></div>
                <div style="text-align:center;padding:15px;background:${classification.color}20;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:${classification.color}">${classification.label}</div><div style="font-size:12px;color:#64748B">التقدير</div></div>
                <div style="text-align:center;padding:15px;background:#D1FAE5;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:#10B981">${student.rank}</div><div style="font-size:12px;color:#64748B">الترتيب</div></div>
                <div style="text-align:center;padding:15px;background:${trend.trend === 'improving' ? '#D1FAE5' : trend.trend === 'declining' ? '#FEE2E2' : '#DBEAFE'};border-radius:12px;min-width:100px"><div style="font-size:20px;font-weight:800;color:${trend.trend === 'improving' ? '#10B981' : trend.trend === 'declining' ? '#EF4444' : '#3B82F6'}">${trend.icon} ${trend.label}</div><div style="font-size:12px;color:#64748B">الاتجاه</div></div>
            </div>
            ${student.latestBreakdown ? `<h3 style="color:#1E293B;font-size:16px;margin-bottom:12px">📊 تفصيل الدرجات</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
                <thead><tr style="background:#F8FAFC"><th style="padding:10px;text-align:right;border:1px solid #E2E8F0">المكون</th><th style="padding:10px;text-align:center;border:1px solid #E2E8F0">الدرجة</th><th style="padding:10px;text-align:center;border:1px solid #E2E8F0">العظمى</th><th style="padding:10px;text-align:center;border:1px solid #E2E8F0">النسبة</th>${classAvg ? '<th style="padding:10px;text-align:center;border:1px solid #E2E8F0">متوسط الصف</th>' : ''}</tr></thead>
                <tbody>${['written', 'homework', 'oral', 'attendance'].map(k => { const bd = student.latestBreakdown[k]; const pct = bd ? ((bd.score / bd.max) * 100).toFixed(1) : 0; const clsPct = classAvg ? classAvg[k] : '-'; const clr = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444'; return `<tr><td style="padding:8px;text-align:right;border:1px solid #E2E8F0;font-weight:600">${Analyzer.getBreakdownLabel(k)}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;font-weight:700">${bd ? bd.score : '-'}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#94A3B8">${bd ? bd.max : '-'}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:${clr};font-weight:700">${pct}%</td>${classAvg ? `<td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#64748B">${clsPct}%</td>` : ''}</tr>`; }).join('')}
                <tr style="background:#F8FAFC;font-weight:800"><td style="padding:8px;text-align:right;border:1px solid #E2E8F0">المجموع الكلي</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#4F46E5">${student.latestRawGrade}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#94A3B8">100</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#4F46E5">${student.latestPercentage}%</td>${classAvg ? '<td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#64748B">-</td>' : ''}</tr></tbody>
            </table>` : ''}
            <h3 style="color:#1E293B;font-size:16px;margin-bottom:12px">📋 سجل الدرجات</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
                <thead><tr style="background:#EEF2FF"><th style="padding:10px;text-align:right;color:#4F46E5;border:1px solid #E2E8F0">الاختبار</th><th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">الدرجة</th><th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">النسبة</th><th style="padding:10px;text-align:center;color:#4F46E5;border:1px solid #E2E8F0">التقدير</th></tr></thead>
                <tbody>${student.grades.map(g => { const gc = Analyzer.getGradeClassification(parseFloat(g.percentage)); return `<tr><td style="padding:8px;text-align:right;border:1px solid #E2E8F0">${g.fileName}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${g.grade}/${g.maxGrade}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${g.percentage}%</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:${gc.color};font-weight:700">${gc.label}</td></tr>`; }).join('')}</tbody>
            </table>
            <div style="margin-top:30px;text-align:center;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:15px">محلل الطالب الذكي - إصدار المعلم المحمول</div>`;

        document.body.appendChild(reportEl);
        try {
            const canvas = await html2canvas(reportEl, { scale: 2, backgroundColor: '#ffffff' });
            document.body.removeChild(reportEl);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
            pdf.save(`تقرير_${student.name}_${new Date().toLocaleDateString('ar-SA')}.pdf`);
            showToast('تم تحميل التقرير بنجاح', 'success');
        } catch (err) { if (reportEl.parentNode) document.body.removeChild(reportEl); showToast('خطأ', 'error'); }
        hideLoading();
    },

    // ============================
    // Weak Students Report (unchanged)
    // ============================
    async generateWeakStudentsReport() {
        showLoading('جارٍ إنشاء التقرير...');
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const ranked = Analyzer.rankStudents(students);
        const weakStudents = ranked.filter(s => s.latestPercentage < 60);
        if (weakStudents.length === 0) { hideLoading(); showToast('لا يوجد طلاب ضعاف!', 'success'); return; }

        const reportEl = document.createElement('div');
        reportEl.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Tajawal,sans-serif;direction:rtl;';
        reportEl.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #EF4444;padding-bottom:20px"><h1 style="color:#EF4444;font-size:22px;margin-bottom:8px">⚠️ تقرير الطلاب المتعثرين</h1><p style="color:#64748B;font-size:14px">عدد الطلاب: ${weakStudents.length} من أصل ${students.length}</p></div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
                <thead><tr style="background:#FEE2E2"><th style="padding:10px;text-align:right;color:#991B1B;border:1px solid #E2E8F0">الطالب</th><th style="padding:10px;text-align:center;color:#991B1B;border:1px solid #E2E8F0">المجموع</th><th style="padding:10px;text-align:center;color:#991B1B;border:1px solid #E2E8F0">الاتجاه</th><th style="padding:10px;text-align:center;color:#991B1B;border:1px solid #E2E8F0">التوصية</th></tr></thead>
                <tbody>${weakStudents.map(s => { const trend = Analyzer.getStudentTrend(s.grades); const rec = trend.trend === 'declining' ? 'تدخل عاجل' : trend.trend === 'improving' ? 'متابعة' : 'خطة دعم'; return `<tr><td style="padding:8px;text-align:right;border:1px solid #E2E8F0;font-weight:600">${s.name}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:#EF4444;font-weight:700">${s.latestPercentage}%</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${trend.icon} ${trend.label}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;font-size:12px">${rec}</td></tr>`; }).join('')}</tbody>
            </table>`;
        document.body.appendChild(reportEl);
        try {
            const canvas = await html2canvas(reportEl, { scale: 2, backgroundColor: '#ffffff' });
            document.body.removeChild(reportEl);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
            pdf.save(`تقرير_المتعثرين_${new Date().toLocaleDateString('ar-SA')}.pdf`);
            showToast('تم تحميل التقرير', 'success');
        } catch (err) { if (reportEl.parentNode) document.body.removeChild(reportEl); showToast('خطأ', 'error'); }
        hideLoading();
    },

    // ============================
    // GROUP REPORT — New Feature ✨
    // ============================
    async showGroupReportPicker() {
        const clId = getCurrentClassLevelId();
        const groups = await getAllGroups(clId);
        const students = await buildStudentRecords(clId);
        if (groups.length === 0) {
            showToast('لا توجد مجموعات. أنشئ مجموعة أولاً', 'warning');
            return;
        }
        const ranked = Analyzer.rankStudents(students);
        const dialogHtml = `<div class="dialog-overlay" id="groupReportDialog">
            <div class="dialog-content" style="max-height:80vh;overflow-y:auto">
                <div class="dialog-title">اختر المجموعة</div>
                <div class="group-select-list">${groups.map(g => {
                    const gs = students.filter(s => s.groupId === g.id);
                    const gRanked = gs.map(s => ranked.find(r => r.id === s.id)).filter(s => s);
                    const avg = gRanked.length > 0 ? (gRanked.reduce((a, b) => a + b.latestPercentage, 0) / gRanked.length).toFixed(1) : '-';
                    return `<div class="group-select-item" onclick="Reports.generateGroupReport(${g.id})">
                        <div class="group-color" style="background:${g.color};width:14px;height:14px"></div>
                        <div style="flex:1"><div style="font-size:13px;font-weight:600">${g.name}</div>
                        <div style="font-size:11px;color:var(--text-muted)">${gs.length} طالب | المتوسط: ${avg}%</div></div>
                    </div>`;
                }).join('')}</div>
                <div class="dialog-actions mt-12"><button class="btn btn-outline btn-block" onclick="closeDialog('groupReportDialog')">إلغاء</button></div>
            </div></div>`;
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
    },

    async generateGroupReport(groupId) {
        closeDialog('groupReportDialog');
        showLoading('جارٍ إنشاء تقرير المجموعة...');
        const clId = getCurrentClassLevelId();
        const students = await buildStudentRecords(clId);
        const files = await getAllFiles(clId);
        const groups = await getAllGroups(clId);
        const group = groups.find(g => g.id === groupId);
        if (!group) { hideLoading(); showToast('لم يتم العثور على المجموعة', 'error'); return; }

        const allRanked = Analyzer.rankStudents(students);
        const groupStudents = allRanked.filter(s => s.groupId === groupId);
        if (groupStudents.length === 0) { hideLoading(); showToast('لا يوجد طلاب في هذه المجموعة', 'warning'); return; }

        const latestGrades = groupStudents.map(s => s.latestPercentage);
        const stats = Analyzer.calculateStats(latestGrades.map(Number));
        const latestFile = files[files.length - 1];
        const breakdownStats = latestFile ? Analyzer.calculateBreakdownStats(students, latestFile.id) : null;

        const reportEl = document.createElement('div');
        reportEl.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Tajawal,sans-serif;direction:rtl;';

        reportEl.innerHTML = `
            <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid ${group.color};padding-bottom:20px">
                <div style="font-size:14px;color:${group.color};font-weight:700;margin-bottom:4px">${group.name}</div>
                <h1 style="color:#1E293B;font-size:22px;margin-bottom:8px">📊 تقرير أداء المجموعة</h1>
                <p style="color:#64748B;font-size:14px">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
                <p style="color:#64748B;font-size:14px">عدد الطلاب: ${groupStudents.length} من أصل ${students.length}</p>
            </div>
            <div style="display:flex;justify-content:space-around;margin-bottom:30px">
                <div style="text-align:center;padding:15px;background:#EEF2FF;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:#4F46E5">${stats.avg}%</div><div style="font-size:12px;color:#64748B">المتوسط</div></div>
                <div style="text-align:center;padding:15px;background:#D1FAE5;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:#10B981">${stats.max}%</div><div style="font-size:12px;color:#64748B">أعلى درجة</div></div>
                <div style="text-align:center;padding:15px;background:#FEE2E2;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:#EF4444">${stats.min}%</div><div style="font-size:12px;color:#64748B">أدنى درجة</div></div>
                <div style="text-align:center;padding:15px;background:#FEF3C7;border-radius:12px;min-width:100px"><div style="font-size:24px;font-weight:800;color:#F59E0B">${stats.median}%</div><div style="font-size:12px;color:#64748B">الوسيط</div></div>
            </div>
            <h2 style="color:#1E293B;font-size:18px;margin-bottom:15px">📋 قائمة الطلاب — ${group.name}</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
                <thead><tr style="background:${group.color}15">
                    <th style="padding:10px;text-align:right;color:${group.color};border:1px solid #E2E8F0">الترتيب</th>
                    <th style="padding:10px;text-align:right;color:${group.color};border:1px solid #E2E8F0">اسم الطالب</th>
                    <th style="padding:10px;text-align:center;color:${group.color};border:1px solid #E2E8F0">تحريري</th>
                    <th style="padding:10px;text-align:center;color:${group.color};border:1px solid #E2E8F0">واجبات</th>
                    <th style="padding:10px;text-align:center;color:${group.color};border:1px solid #E2E8F0">شفوي</th>
                    <th style="padding:10px;text-align:center;color:${group.color};border:1px solid #E2E8F0">مواظبة</th>
                    <th style="padding:10px;text-align:center;color:${group.color};border:1px solid #E2E8F0">المجموع</th>
                    <th style="padding:10px;text-align:center;color:${group.color};border:1px solid #E2E8F0">التقدير</th>
                </tr></thead>
                <tbody>${groupStudents.map(s => { const cl = Analyzer.getGradeClassification(s.latestPercentage); const bd = s.latestBreakdown; return `<tr><td style="padding:8px;text-align:right;border:1px solid #E2E8F0">${s.rank}</td><td style="padding:8px;text-align:right;border:1px solid #E2E8F0;font-weight:600">${s.name}</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.written.score : '-'}/50</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.homework.score : '-'}/20</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.oral.score : '-'}/20</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0">${bd ? bd.attendance.score : '-'}/10</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;font-weight:700">${s.latestRawGrade}/100</td><td style="padding:8px;text-align:center;border:1px solid #E2E8F0;color:${cl.color};font-weight:700">${cl.label}</td></tr>`; }).join('')}</tbody>
            </table>
            ${breakdownStats ? `<h2 style="color:#1E293B;font-size:16px;margin-bottom:12px">📈 متوسط مكونات المجموعة</h2>
            <div style="display:flex;justify-content:space-around;margin-bottom:20px">
                ${Object.keys(breakdownStats).map(k => { const color = k === 'written' ? '#6366F1' : k === 'homework' ? '#10B981' : k === 'oral' ? '#F59E0B' : '#EC4899'; return `<div style="text-align:center;padding:12px;background:${color}15;border-radius:8px;min-width:80px"><div style="font-size:18px;font-weight:800;color:${color}">${breakdownStats[k]}%</div><div style="font-size:10px;color:#64748B">${Analyzer.getBreakdownLabel(k)}</div></div>`; }).join('')}
            </div>` : ''}
            <div style="margin-top:20px;text-align:center;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:15px">محلل الطالب الذكي - إصدار المعلم المحمول</div>`;

        document.body.appendChild(reportEl);
        try {
            const canvas = await html2canvas(reportEl, { scale: 2, backgroundColor: '#ffffff' });
            document.body.removeChild(reportEl);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pw = pdf.internal.pageSize.getWidth();
            const ph = (canvas.height * pw) / canvas.width;
            let hl = ph, pos = 0;
            const pageH = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, pos, pw, ph);
            hl -= pageH;
            while (hl > 0) { pos = hl - ph; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, pos, pw, ph); hl -= pageH; }
            pdf.save(`تقرير_${group.name}_${new Date().toLocaleDateString('ar-SA')}.pdf`);
            showToast(`تم تحميل تقرير ${group.name} بنجاح`, 'success');
        } catch (err) { if (reportEl.parentNode) document.body.removeChild(reportEl); showToast('خطأ في إنشاء التقرير', 'error'); }
        hideLoading();
    },

    // ============================================================
    //  CERTIFICATE ENGINE — Fully Redesigned
    //  FIXED: getSetting/saveSetting → getGlobalSetting/setGlobalSetting
    // ============================================================

    // Default certificate settings
    DEFAULT_CERT: {
        schoolName:     'المدرسة النموذجية',
        teacherName:    '',
        subjectName:    '',
        className:      '',
        certTitle:      'شهادة تفوق وتقدير',
        bodyLine1:      'يسر معلم مادة {{المادة}} للصف {{الصف}} أن يمنح هذه الشهادة للطالب/ة',
        studentLine:    '{{الطالب}}',
        bodyLine2:      'وذلك لتفوقه و{{السبب}}',
        statsLine:      'حيث حصل على المرتبة {{الترتيب}} على الصف بمعدل {{النسبة}}',
        closingLine:    'سائلين المولى عز وجل له دوام التوفيق والنجاح',
        footerLine:     'مع أطيب الأمنيات بمزيد من التقدم والتفوق',
        reason:         'تميزه في المادة وحسن اجتهاده ومواظبته',
        borderColor:    '#D97706',
        threshold:      90
    },

    /**
     * Process template — replace {{...}} placeholders
     */
    processTemplate(text, student) {
        const s = this._certSettings || this.DEFAULT_CERT;
        return text
            .replace(/\{\{المدرسة\}\}/g, s.schoolName)
            .replace(/\{\{المعلم\}\}/g, s.teacherName || '................')
            .replace(/\{\{المادة\}\}/g, s.subjectName || '................')
            .replace(/\{\{الصف\}\}/g, s.className || '................')
            .replace(/\{\{السبب\}\}/g, s.reason)
            .replace(/\{\{الطالب\}\}/g, student.name || 'اسم الطالب')
            .replace(/\{\{الترتيب\}\}/g, getArabicOrdinal(student.rank || 1))
            .replace(/\{\{النسبة\}\}/g, (student.latestPercentage || 95) + '%')
            .replace(/\{\{المجموع\}\}/g, (student.latestRawGrade || 95) + '/100')
            .replace(/\{\{التاريخ\}\}/g, new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }));
    },

    /**
     * Build the certificate HTML from template settings
     */
    buildCertHTML(student, s) {
        const proc = (t) => this.processTemplate(t, student);
        const bc = s.borderColor;
        return `
        <div style="background:#FFFBF0;border:${s.certBorderWidth || 4}px solid ${bc};border-radius:12px;padding:28px 24px;position:relative;font-family:Tajawal,sans-serif;direction:rtl;text-align:center;overflow:hidden">
            <!-- Watermark pattern -->
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:120px;font-weight:900;opacity:0.03;color:${bc};pointer-events:none;white-space:nowrap">شهادة تفوق</div>

            <!-- Corner ornaments -->
            <div style="position:absolute;top:10px;right:10px;width:35px;height:35px;border-top:3px solid ${bc};border-right:3px solid ${bc};border-radius:0 8px 0 0;opacity:0.4"></div>
            <div style="position:absolute;top:10px;left:10px;width:35px;height:35px;border-top:3px solid ${bc};border-left:3px solid ${bc};border-radius:8px 0 0 0;opacity:0.4"></div>
            <div style="position:absolute;bottom:10px;right:10px;width:35px;height:35px;border-bottom:3px solid ${bc};border-right:3px solid ${bc};border-radius:0 0 8px 0;opacity:0.4"></div>
            <div style="position:absolute;bottom:10px;left:10px;width:35px;height:35px;border-bottom:3px solid ${bc};border-left:3px solid ${bc};border-radius:0 0 0 8px;opacity:0.4"></div>

            <!-- Medal -->
            <div style="margin-bottom:10px">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="${bc}" stroke-width="1.5">
                    <circle cx="12" cy="9" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                    <path d="M10 8l1.5 2L14 7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>

            <!-- School name -->
            <div style="font-size:13px;color:${bc};font-weight:700;margin-bottom:2px;letter-spacing:0.5px">${s.schoolName}</div>

            <!-- Separator -->
            <div style="height:2px;background:linear-gradient(90deg,transparent,${bc},transparent);margin:8px auto;width:65%"></div>

            <!-- Title -->
            <h2 style="font-size:22px;font-weight:800;color:#92400E;margin:10px 0">${s.certTitle}</h2>

            <!-- Body -->
            <p style="font-size:14px;color:#475569;margin:10px 0;line-height:1.8">${proc(s.bodyLine1)}</p>

            <!-- Student name (prominent) -->
            <div style="font-size:28px;font-weight:800;color:${bc};margin:10px 0;padding:6px 16px;border-bottom:3px solid ${bc};border-top:3px solid ${bc};display:inline-block;min-width:180px;background:linear-gradient(180deg,transparent 60%,${bc}10 100%)">${proc(s.studentLine)}</div>

            <!-- Reason & stats -->
            <p style="font-size:14px;color:#475569;margin:10px 0;line-height:1.8">${proc(s.bodyLine2)}</p>
            <p style="font-size:14px;color:#475569;margin:6px 0;line-height:1.8">${proc(s.statsLine)}</p>

            <!-- Closing -->
            <div style="height:1px;background:linear-gradient(90deg,transparent,${bc},transparent);margin:14px auto;width:55%"></div>
            <p style="font-size:13px;color:#64748B;margin:4px 0">${proc(s.closingLine)}</p>
            <p style="font-size:12px;color:#94A3B8;margin:4px 0">${proc(s.footerLine)}</p>

            <!-- Date & Signature -->
            <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:11px;color:#94A3B8">
                <div>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
                ${s.teacherName ? `<div>المعلم/ة: ${s.teacherName}</div>` : '<div>توقيع المعلم/ة: ........................</div>'}
            </div>
        </div>`;
    },

    /**
     * Certificate page — the main editing UI
     */
    async showCertificatePage() {
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const ranked = Analyzer.rankStudents(students);

        // FIXED: Use getGlobalSetting instead of getSetting
        const saved = await getGlobalSetting('certificateSettings');
        const s = { ...this.DEFAULT_CERT, ...(saved ? JSON.parse(saved) : {}) };
        this._certSettings = s;

        const excellent = ranked.filter(st => st.latestPercentage >= s.threshold);
        // تخزين طلاب المعاينة مباشرة لمنع انهيار النافذة
        this._previewStudents = excellent; 

        const html = `
        <div class="page">
            <div class="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                شهادات التفوق
            </div>

            <!-- ===== Eligible Students ===== -->
            <div class="card cert-editor-card">
                <div class="cert-field-header" onclick="toggleCollapse('eligibleSection')">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:18px">🏅</span>
                        <div><div class="cert-field-label">الطلاب المستحقون</div>
                        <div class="cert-field-hint">${excellent.length} طالب بنسبة ${s.threshold}% أو أعلى</div></div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" id="eligibleSection-arrow"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div id="eligibleSection" class="cert-collapsible open">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                        <label style="font-size:12px;white-space:nowrap">الحد الأدنى:</label>
                        <input type="range" min="50" max="100" value="${s.threshold}" id="certThreshold"
                            style="flex:1;accent-color:var(--primary)" oninput="document.getElementById('threshVal').textContent=this.value+'%';Reports._liveUpdate()">
                        <span id="threshVal" style="font-size:13px;font-weight:700;color:var(--primary);min-width:36px">${s.threshold}%</span>
                    </div>
                    <div id="eligibleList" style="max-height:160px;overflow-y:auto">
                        ${excellent.length === 0 ? '<p class="text-muted fs-12 text-center" style="padding:10px">لا يوجد طلاب مستحقون حالياً</p>' :
                        excellent.map((st, i) => `
                        <div style="display:flex;align-items:center;gap:8px;padding:5px 0;${i < excellent.length - 1 ? 'border-bottom:1px solid var(--border-light)' : ''}">
                            <div class="student-avatar" style="width:26px;height:26px;font-size:10px;background:#FEF3C7;color:#D97706">${st.name.charAt(0)}</div>
                            <div style="flex:1;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${st.name}</div>
                            <div style="display:flex;gap:4px;align-items:center">
                                <span style="font-size:10px;color:var(--text-muted)">#${st.rank}</span>
                                <span class="grade-badge grade-excellent" style="font-size:10px;padding:1px 6px">${st.latestPercentage}%</span>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- ===== Identity Fields ===== -->
            <div class="card cert-editor-card">
                <div class="cert-field-header" onclick="toggleCollapse('identitySection')">
                    <div style="display:flex;align-items:center;gap:8px">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <div><div class="cert-field-label">بيانات المدرسة والمعلم</div></div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div id="identitySection" class="cert-collapsible open">
                    ${this._field('اسم المدرسة', 'schoolName', s.schoolName, 'مثال: المتوسطة الأولى')}
                    ${this._field('اسم المعلم/ة', 'teacherName', s.teacherName, 'يظهر في التوقيع')}
                    ${this._field('المادة الدراسية', 'subjectName', s.subjectName, 'مثال: الرياضيات — يظهر في صيغة الشهادة')}
                    ${this._field('الصف / الفصل', 'className', s.className, 'مثال: الثاني المتوسط — يظهر في صيغة الشهادة')}
                </div>
            </div>

            <!-- ===== Certificate Text ===== -->
            <div class="card cert-editor-card">
                <div class="cert-field-header" onclick="toggleCollapse('textSection')">
                    <div style="display:flex;align-items:center;gap:8px">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <div><div class="cert-field-label">صيغة الشهادة (قابلة للتعديل بالكامل)</div></div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div id="textSection" class="cert-collapsible open">
                    ${this._field('عنوان الشهادة', 'certTitle', s.certTitle, '')}

                    <div style="margin-bottom:10px">
                        <div class="cert-field-label" style="margin-bottom:4px">السطر الأول (المقدمة)</div>
                        <textarea class="cert-textarea" id="cert_bodyLine1" oninput="Reports._liveUpdate()">${s.bodyLine1}</textarea>
                        <div class="cert-field-hint">استخدم: {{المادة}} {{الصف}} — تُستبدل تلقائياً</div>
                    </div>

                    <div style="margin-bottom:10px">
                        <div class="cert-field-label" style="margin-bottom:4px">سطر اسم الطالب</div>
                        <input type="text" class="cert-textinput" id="cert_studentLine" value="${s.studentLine}" oninput="Reports._liveUpdate()">
                        <div class="cert-field-hint">استخدم: {{الطالب}}</div>
                    </div>

                    <div style="margin-bottom:10px">
                        <div class="cert-field-label" style="margin-bottom:4px">السبب</div>
                        <input type="text" class="cert-textinput" id="cert_reason" value="${s.reason}" oninput="Reports._liveUpdate()">
                        <div class="cert-field-hint">يظهر مكان {{السبب}} — مثال: تميزه في المادة وحسن اجتهاده</div>
                    </div>

                    <div style="margin-bottom:10px">
                        <div class="cert-field-label" style="margin-bottom:4px">سطر السبب</div>
                        <textarea class="cert-textarea" id="cert_bodyLine2" oninput="Reports._liveUpdate()">${s.bodyLine2}</textarea>
                        <div class="cert-field-hint">استخدم: {{السبب}}</div>
                    </div>

                    <div style="margin-bottom:10px">
                        <div class="cert-field-label" style="margin-bottom:4px">سطر الإحصائيات</div>
                        <textarea class="cert-textarea" id="cert_statsLine" oninput="Reports._liveUpdate()">${s.statsLine}</textarea>
                        <div class="cert-field-hint">استخدم: {{الترتيب}} {{النسبة}} {{المجموع}}</div>
                    </div>

                    ${this._field('سطر الدعاء', 'closingLine', s.closingLine, '')}
                    ${this._field('سطر الختام', 'footerLine', s.footerLine, '')}

                    <!-- Placeholders reference -->
                    <div style="background:var(--primary-bg);padding:10px 12px;border-radius:8px;margin-top:6px">
                        <div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:4px">📋 المتغيرات المتاحة (تنسخ وتلصق):</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.8;font-family:monospace;direction:ltr;text-align:left">
                            {{المدرسة}} &nbsp; {{المعلم}} &nbsp; {{المادة}} &nbsp; {{الصف}} &nbsp; {{الطالب}} &nbsp; {{السبب}} &nbsp; {{الترتيب}} &nbsp; {{النسبة}} &nbsp; {{المجموع}} &nbsp; {{التاريخ}}
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== Design ===== -->
            <div class="card cert-editor-card">
                <div class="cert-field-header" onclick="toggleCollapse('designSection')">
                    <div style="display:flex;align-items:center;gap:8px">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17.5 10.5a2.5 2.5 0 1 0 0-5"/><path d="M6 3v7"/><path d="M6 14v7"/><circle cx="6" cy="10.5" r="3"/><circle cx="6" cy="17.5" r="3"/></svg>
                        <div><div class="cert-field-label">التصميم والألوان</div></div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div id="designSection" class="cert-collapsible open">
                    <div style="margin-bottom:10px">
                        <div class="cert-field-label" style="margin-bottom:6px">لون الإطار والميدالية</div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap" id="certColorPicker">
                            ${['#D97706', '#6366F1', '#10B981', '#059669', '#8B5CF6', '#1E293B', '#0F766E', '#BE185D', '#DC2626', '#2563EB'].map(c =>
                                `<div class="color-option ${c === s.borderColor ? 'selected' : ''}" style="background:${c};width:30px;height:30px;border-radius:50%" data-color="${c}" onclick="selectColor(this);Reports._liveUpdate()"></div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== Preview ===== -->
            <div class="card cert-editor-card" style="border:2px solid var(--warning)">
                <div class="cert-field-header">
                    <div style="display:flex;align-items:center;gap:8px">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <div><div class="cert-field-label">معاينة مباشرة</div>
                        <div class="cert-field-hint">تتحدث تلقائياً مع أي تعديل</div></div>
                    </div>
                    <!-- Preview student selector -->
                    <select id="certPreviewStudent" onchange="Reports._renderPreview()" style="padding:4px 8px;border:1px solid var(--border);border-radius:8px;font-family:var(--font);font-size:11px;background:var(--bg)">
                        ${excellent.length > 0 ? excellent.map((st, i) => `<option value="${i}">${st.name}</option>`).join('') : '<option value="-1">نموذج تجريبي</option>'}
                    </select>
                </div>
                <div id="certPreviewContainer" style="overflow-x:auto;transition:all 0.2s"></div>
            </div>

            <!-- ===== Actions ===== -->
            <div style="display:flex;gap:8px;margin-top:14px;padding-bottom:20px">
                <button class="btn btn-primary" style="flex:2" onclick="Reports.generateAllCertificates()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    تحميل جميع الشهادات PDF
                </button>
                <button class="btn btn-outline" style="flex:1" onclick="Reports._resetDefaults()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    استعادة الافتراضي
                </button>
            </div>
        </div>`;

        document.getElementById('contentArea').innerHTML = html;

        // Initial preview
        this._renderPreview();
    },

    /** Helper: render a single text input field */
    _field(label, id, value, hint) {
        return `<div style="margin-bottom:10px">
            <div class="cert-field-label" style="margin-bottom:3px">${label}</div>
            <input type="text" class="cert-textinput" id="cert_${id}" value="${value}" oninput="Reports._liveUpdate()">
            ${hint ? `<div class="cert-field-hint">${hint}</div>` : ''}
        </div>`;
    },

    /** Read all fields from the form into a settings object */
    _readSettings() {
        const s = {};
        const fields = ['schoolName','teacherName','subjectName','className','certTitle','bodyLine1','studentLine','bodyLine2','statsLine','closingLine','footerLine','reason'];
        fields.forEach(f => {
            const el = document.getElementById('cert_' + f);
            if (el) s[f] = el.value;
        });
        const threshEl = document.getElementById('certThreshold');
        s.threshold = threshEl ? parseInt(threshEl.value) : 90;
        const colorEl = document.querySelector('#certColorPicker .color-option.selected');
        s.borderColor = colorEl ? colorEl.dataset.color : (this._certSettings?.borderColor || '#D97706');
        return s;
    },

    /** Live update: save + re-render preview (debounced) */
    _liveTimer: null,
    _liveUpdate() {
        clearTimeout(this._liveTimer);
        this._liveTimer = setTimeout(() => {
            this._certSettings = this._readSettings();

            // FIXED: Use setGlobalSetting instead of saveSetting
            setGlobalSetting('certificateSettings', JSON.stringify(this._certSettings));
            this._renderPreview();
        }, 120);
    },

    /** Render the live preview */
    _renderPreview() {
        const container = document.getElementById('certPreviewContainer');
        if (!container) return;

        const s = this._readSettings();
        this._certSettings = s;

        // Determine which student to preview
        const sel = document.getElementById('certPreviewStudent');
        const idx = sel ? parseInt(sel.value) : -1;

        // We need to get students — use cached if available
        let student;
        if (idx >= 0 && this._previewStudents && this._previewStudents[idx]) {
            student = this._previewStudents[idx];
        } else {
            student = { name: 'أحمد محمد علي', rank: 1, latestPercentage: 95, latestRawGrade: 95 };
        }

        container.innerHTML = `<div style="min-width:300px;transition:opacity 0.15s">${this.buildCertHTML(student, s)}</div>`;
    },

    /** Reset to defaults */
    async _resetDefaults() {
        if (!confirm('سيتم استعادة النصوص الافتراضية. هل أنت متأكد؟')) return;
        this._certSettings = { ...this.DEFAULT_CERT };

        // FIXED: Use setGlobalSetting instead of saveSetting
        await setGlobalSetting('certificateSettings', JSON.stringify(this._certSettings));
        showToast('تم استعادة الافتراضي', 'success');
        this.showCertificatePage(); // Re-render the whole page
    },

    /** Generate all certificates as PDF */
    async generateAllCertificates() {
        const s = this._readSettings();

        // FIXED: Use setGlobalSetting instead of saveSetting
        await setGlobalSetting('certificateSettings', JSON.stringify(s));

        const students = await buildStudentRecords(getCurrentClassLevelId());
        const ranked = Analyzer.rankStudents(students);
        const excellent = ranked.filter(st => st.latestPercentage >= s.threshold);

        if (excellent.length === 0) {
            showToast('لا يوجد طلاب مستحقون للشهادة', 'warning');
            return;
        }

        showLoading(`جارٍ إنشاء ${excellent.length} شهادة...`);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4');

            for (let i = 0; i < excellent.length; i++) {
                if (i > 0) pdf.addPage();

                const certEl = document.createElement('div');
                certEl.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:600px;font-family:Tajawal,sans-serif;direction:rtl;';
                certEl.innerHTML = `<div style="width:900px;height:600px;display:flex;align-items:center;justify-content:center;background:white;padding:30px">${this.buildCertHTML(excellent[i], s)}</div>`;
                document.body.appendChild(certEl);

                const canvas = await html2canvas(certEl, { scale: 2, backgroundColor: '#ffffff', width: 900, height: 600 });
                document.body.removeChild(certEl);

                const pw = pdf.internal.pageSize.getWidth();
                const ph = pdf.internal.pageSize.getHeight();
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pw, ph);
            }

            pdf.save(`شهادات_التفوق_${new Date().toLocaleDateString('ar-SA')}.pdf`);
            showToast(`تم إنشاء ${excellent.length} شهادة بنجاح! 🏅`, 'success');
        } catch (err) {
            console.error(err);
            showToast('خطأ في إنشاء الشهادات', 'error');
        }

        hideLoading();
    },

    // ============================
    // CSV Export (unchanged)
    // ============================
    async exportCSV() {
        const students = await buildStudentRecords(getCurrentClassLevelId());
        const files = await getAllFiles(getCurrentClassLevelId());
        const ranked = Analyzer.rankStudents(students);
        if (students.length === 0) { showToast('لا توجد بيانات', 'warning'); return; }

        const headers = ['الترتيب', 'اسم الطالب', 'المجموعة', ...files.map(f => f.name + ' (مجموع)'), ...files.map(f => f.name + ' (تحريري)'), ...files.map(f => f.name + ' (واجبات)'), ...files.map(f => f.name + ' (شفوي)'), ...files.map(f => f.name + ' (مواظبة)'), 'المتوسط'];
        const csvRows = [headers.join(',')];

        ranked.forEach(student => {
            const row = [student.rank, `\"${student.name}\"`, student.groupNames?.join('، ') || ''];
            files.forEach(f => { const g = student.grades.find(g => g.fileId === f.id); row.push(g ? g.percentage : ''); });
            files.forEach(f => { const g = student.grades.find(g => g.fileId === f.id); row.push(g?.breakdown?.written?.score ?? ''); });
            files.forEach(f => { const g = student.grades.find(g => g.fileId === f.id); row.push(g?.breakdown?.homework?.score ?? ''); });
            files.forEach(f => { const g = student.grades.find(g => g.fileId === f.id); row.push(g?.breakdown?.oral?.score ?? ''); });
            files.forEach(f => { const g = student.grades.find(g => g.fileId === f.id); row.push(g?.breakdown?.attendance?.score ?? ''); });
            const avg = student.grades.length > 0 ? (student.grades.reduce((s, g) => s + parseFloat(g.percentage), 0) / student.grades.length).toFixed(1) : '';
            row.push(avg);
            csvRows.push(row.join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `بيانات_الطلاب_${new Date().toLocaleDateString('ar-SA')}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('تم التصدير بنجاح', 'success');
    }
};

// Helper: Arabic ordinal
function getArabicOrdinal(n) {
    const ordinals = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
        'الحادية عشرة', 'الثانية عشرة', 'الثالثة عشرة', 'الرابعة عشرة', 'الخامسة عشرة',
        'السادسة عشرة', 'السابعة عشرة', 'الثامنة عشرة', 'التاسعة عشرة', 'العشرين'];
    if (n >= 1 && n < ordinals.length) return ordinals[n];
    return `الـ${n}`;
}

/** Toggle collapsible sections */
function toggleCollapse(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('open');
}

// Report header helper with logo & teacher
Reports._reportHeader = async function(title) {
    const school = await getSchoolSettings();
    const cl = await getCurrentClassLevel();
    const teacher = cl?.teacherName || school.teacherName || '';
    return `
        ${school.schoolLogo ? `<div style="text-align:center;margin-bottom:12px"><img src="${school.schoolLogo}" style="height:50px;object-fit:contain"></div>` : ''}
        <div style="text-align:center;margin-bottom:6px;font-size:15px;font-weight:700;color:#1E293B">${school.schoolName}</div>
        ${cl ? `<div style="text-align:center;font-size:13px;color:#64748B">${cl.name}${teacher ? ' — '+teacher : ''}</div>` : ''}
        <div style="text-align:center;margin-bottom:16px"><h1 style="font-size:22px;font-weight:800;color:#4F46E5;margin-top:8px">${title}</h1></div>`;
};