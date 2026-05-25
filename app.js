/* ============================
   app.js — Main Controller
   v3: Multi-class, logo, teacher
   ============================ */
let currentPage = 'dashboard';
let cachedStudents = [];
let cachedFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await openDB();
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
            document.getElementById('main-app').classList.remove('hidden');
            initApp();
        }, 2200);
        if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register('sw.js'); } catch (e) {} }
    } catch (err) { showToast('خطأ في التهيئة', 'error'); }
});

async function initApp() {
    const levels = await getAllClassLevels();
    if (levels.length > 0) {
        setCurrentClassLevelId(levels[0].id);
    }
    await updateHeaderClassSelector();
    navigateTo(levels.length === 0 ? 'levels' : 'dashboard');
}

// ============================
// Navigation
// ============================
function navigateTo(page) {
    currentPage = page;
    Charts.destroyAll();
    document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.toggle('active', i.dataset.page === page));
    const titles = { dashboard: 'لوحة التحكم', students: 'قائمة الطلاب', import: 'استيراد ملفات', groups: 'المجموعات', reports: 'التقارير', settings: 'الإعدادات', levels: 'الصفوف الدراسية' };
    document.getElementById('headerTitle').textContent = titles[page] || '';
    closeSidebar();
    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'students': renderStudentsPage(); break;
        case 'import': renderImportPage(); break;
        case 'groups': Groups.renderPage(); break;
        case 'reports': Reports.renderPage(); break;
        case 'settings': renderSettingsPage(); break;
        case 'levels': renderLevelsPage(); break;
        default: renderDashboard();
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('hidden'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.add('hidden'); }

async function updateHeaderClassSelector() {
    const levels = await getAllClassLevels();
    const current = getCurrentClassLevelId();
    const wrap = document.getElementById('headerClassSelector');
    if (!wrap) return;
    if (levels.length === 0) {
        wrap.innerHTML = '<span class="header-class-empty" onclick="navigateTo(\'levels\')">+ إضافة صف</span>';
        return;
    }
    wrap.innerHTML = `<select id="headerClassSelect" onchange="switchClassLevel(this.value)">
        ${levels.map(l => `<option value="${l.id}" ${l.id === current ? 'selected' : ''}>${l.name}</option>`).join('')}
    </select>`;
}

async function switchClassLevel(id) {
    setCurrentClassLevelId(parseInt(id));
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'students') renderStudentsPage();
    else if (currentPage === 'groups') Groups.renderPage();
    else if (currentPage === 'import') renderImportPage();
    else if (currentPage === 'reports') Reports.renderPage();
}

// ============================
// Class Levels Management Page
// ============================
async function renderLevelsPage() {
    const levels = await getAllClassLevels();
    const school = await getSchoolSettings();
    let html = `<div class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        الصفوف الدراسية
    </div>
    <p class="fs-13 text-muted mb-12">كل صف مستقل تماماً ببياناته وطلابه ومجموعاته وتقاريره</p>`;

    if (levels.length === 0) {
        html += `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <h3>لم تُضف صفوف بعد</h3><p>أضف الصفوف الدراسية لبدء تنظيم البيانات</p></div>`;
    } else {
        for (const lv of levels) {
            const stats = await getDBStats(lv.id);
            html += `<div class="class-level-card" onclick="selectClassAndGo(${lv.id})">
                <div class="cl-color-bar" style="background:${['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'][lv.order % 6]}"></div>
                <div class="cl-body">
                    <div class="cl-name">${lv.name}</div>
                    <div class="cl-teacher">${lv.teacherName ? 'المعلم: ' + lv.teacherName : 'لم يُحدد معلم'}</div>
                    <div class="cl-stats">${stats.studentCount} طالب · ${stats.fileCount} ملف · ${stats.groupCount} مجموعة</div>
                </div>
                <div class="cl-actions">
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();editClassLevel(${lv.id})">تعديل</button>
                    <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="event.stopPropagation();removeClassLevel(${lv.id})">حذف</button>
                </div>
            </div>`;
        }
    }

    html += `<button class="add-group-btn mt-12" onclick="showAddClassLevelDialog()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        إضافة صف دراسي جديد
    </button>`;

    document.getElementById('contentArea').innerHTML = `<div class="page">${html}</div>`;
}

async function selectClassAndGo(id) {
    setCurrentClassLevelId(id);
    await updateHeaderClassSelector();
    navigateTo('dashboard');
}

function showAddClassLevelDialog() {
    const d = `<div class="dialog-overlay" id="addClassDlg"><div class="dialog-content">
        <div class="dialog-title">إضافة صف دراسي</div>
        <div class="mapping-field"><label>اسم الصف</label><input type="text" class="dialog-input" id="newLevelName" placeholder="مثال: الأول المتوسط" autofocus></div>
        <div class="mapping-field"><label>اسم المعلم (اختياري)</label><input type="text" class="dialog-input" id="newLevelTeacher" placeholder="مثال: أ. أحمد محمد"></div>
        <div class="dialog-actions">
            <button class="btn btn-outline" onclick="closeDialog('addClassDlg')">إلغاء</button>
            <button class="btn btn-primary" onclick="doAddClassLevel()">إضافة</button>
        </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', d);
}

async function doAddClassLevel() {
    const name = document.getElementById('newLevelName').value.trim();
    const teacher = document.getElementById('newLevelTeacher').value.trim();
    if (!name) { document.getElementById('newLevelName').style.borderColor = 'var(--danger)'; return; }
    await addClassLevel(name, teacher);
    closeDialog('addClassDlg');
    showToast('تم إضافة الصف', 'success');
    await updateHeaderClassSelector();
    renderLevelsPage();
}

async function editClassLevel(id) {
    const lv = await dbGet(STORES.CLASS_LEVELS, id);
    if (!lv) return;
    const d = `<div class="dialog-overlay" id="editClassDlg"><div class="dialog-content">
        <div class="dialog-title">تعديل الصف</div>
        <div class="mapping-field"><label>اسم الصف</label><input type="text" class="dialog-input" id="editLevelName" value="${lv.name}"></div>
        <div class="mapping-field"><label>اسم المعلم</label><input type="text" class="dialog-input" id="editLevelTeacher" value="${lv.teacherName || ''}"></div>
        <div class="dialog-actions">
            <button class="btn btn-outline" onclick="closeDialog('editClassDlg')">إلغاء</button>
            <button class="btn btn-primary" onclick="doEditClassLevel(${id})">حفظ</button>
        </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', d);
}

async function doEditClassLevel(id) {
    const lv = await dbGet(STORES.CLASS_LEVELS, id);
    lv.name = document.getElementById('editLevelName').value.trim();
    lv.teacherName = document.getElementById('editLevelTeacher').value.trim();
    await updateClassLevel(lv);
    closeDialog('editClassDlg');
    showToast('تم التحديث', 'success');
    await updateHeaderClassSelector();
    renderLevelsPage();
}

async function removeClassLevel(id) {
    if (!confirm('سيتم حذف الصف وكل بياناته (ملفات، طلاب، مجموعات). هل أنت متأكد؟')) return;
    // Delete all related data
    const files = await getAllFiles(id);
    for (const f of files) await deleteFile(f.id);
    const groups = await getAllGroups(id);
    for (const g of groups) await deleteGroup(g.id);
    // Delete student assignments
    const students = await dbGetByIndex(STORES.STUDENTS, 'classLevelId', id);
    for (const s of students) await dbDelete(STORES.STUDENTS, s.id);
    await deleteClassLevel(id);
    if (getCurrentClassLevelId() === id) {
        const levels = await getAllClassLevels();
        setCurrentClassLevelId(levels.length > 0 ? levels[0].id : null);
    }
    showToast('تم حذف الصف', 'success');
    await updateHeaderClassSelector();
    renderLevelsPage();
}

// ============================
// Dashboard
// ============================
async function renderDashboard() {
    const clId = getCurrentClassLevelId();
    if (!clId) { navigateTo('levels'); return; }

    cachedFiles = await getAllFiles(clId);
    cachedStudents = await buildStudentRecords(clId);
    const cl = await getCurrentClassLevel();
    const school = await getSchoolSettings();

    if (cachedFiles.length === 0) {
        document.getElementById('contentArea').innerHTML = `<div class="page">
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 120 120" fill="none"><rect rx="24" width="120" height="120" fill="#EEF2FF"/>
                    <path d="M35 40 L60 25 L85 40 L85 80 L35 80 Z" fill="none" stroke="#6366F1" stroke-width="3"/>
                    <circle cx="60" cy="55" r="12" fill="none" stroke="#6366F1" stroke-width="2.5"/>
                    <path d="M55 55 L58 58 L66 50" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>صف "${cl?.name || ''}" — لا توجد بيانات بعد</h3>
                <p>ابدأ باستيراد ملف إكسل بدرجات الطلاب</p>
                <button class="btn btn-primary" onclick="navigateTo('import')">استيراد ملف</button>
            </div></div>`;
        return;
    }

    const ranked = Analyzer.rankStudents(cachedStudents);
    const latestGrades = ranked.map(s => s.latestPercentage);
    const stats = Analyzer.calculateStats(latestGrades.map(Number));
    const alerts = Analyzer.detectPatterns(cachedStudents, cachedFiles);
    const latestFile = cachedFiles[cachedFiles.length - 1];
    const bStats = latestFile ? Analyzer.calculateBreakdownStats(cachedStudents, latestFile.id) : null;

    document.getElementById('contentArea').innerHTML = `<div class="page">
        <!-- Teacher & Class Info -->
        <div class="card" style="background:linear-gradient(135deg,var(--primary),var(--secondary));color:white;padding:14px 16px">
            <div style="display:flex;align-items:center;gap:10px">
                ${school.schoolLogo ? `<img src="${school.schoolLogo}" style="width:36px;height:36px;border-radius:8px;border:2px solid rgba(255,255,255,0.3);object-fit:cover">` : ''}
                <div style="flex:1"><div style="font-size:15px;font-weight:700">${school.schoolName}</div>
                <div style="font-size:12px;opacity:0.9">${cl?.name || ''}${cl?.teacherName ? ' — ' + cl.teacherName : ''}</div></div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card avg"><div class="stat-label">المتوسط</div><div class="stat-value">${stats.avg}%</div></div>
            <div class="stat-card high"><div class="stat-label">أعلى</div><div class="stat-value">${stats.max}%</div></div>
            <div class="stat-card low"><div class="stat-label">أدنى</div><div class="stat-value">${stats.min}%</div></div>
            <div class="stat-card median"><div class="stat-label">الوسيط</div><div class="stat-value">${stats.median}%</div></div>
        </div>

        ${bStats ? `<div class="card"><div class="card-header"><div class="card-title">متوسط المكونات</div><div class="card-subtitle">${latestFile.name}</div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                ${['written','homework','oral','attendance'].map(k => {
                    const v = bStats[k]; const mx = ExcelProcessor.MAX_GRADES[k];
                    const c = k==='written'?'#6366F1':k==='homework'?'#10B981':k==='oral'?'#F59E0B':'#EC4899';
                    return `<div style="display:flex;align-items:center;gap:8px;padding:10px;background:${c}12;border-radius:10px">
                        <div style="width:34px;height:34px;border-radius:8px;background:${c}20;display:flex;align-items:center;justify-content:center;color:${c}">${Analyzer.getBreakdownIcon(k)}</div>
                        <div><div style="font-size:10px;color:var(--text-muted)">${Analyzer.getBreakdownLabel(k)} (${mx})</div><div style="font-size:16px;font-weight:800;color:${c}">${v}%</div></div></div>`;
                }).join('')}
            </div></div>` : ''}

        <div class="card"><div class="card-header"><div class="card-title">توزيع التقديرات</div><div class="card-subtitle">${cachedStudents.length} طالب</div></div>
            <div class="chart-container" style="height:240px"><canvas id="dashDistChart"></canvas></div></div>

        ${cachedFiles.length >= 2 ? `<div class="card"><div class="card-header"><div class="card-title">تطور المتوسط</div></div>
            <div class="chart-container" style="height:190px"><canvas id="dashAvgChart"></canvas></div></div>` : ''}

        ${alerts.length > 0 ? `<div class="section-title mt-16"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg> تنبيهات</div>
            ${alerts.slice(0,4).map(a => `<div class="pattern-alert ${a.type}"><div class="pattern-alert-icon">${a.type==='danger'?'⚠':'✓'}</div><div class="pattern-alert-text"><div class="pattern-alert-title">${a.title}</div><div>${a.message}</div></div></div>`).join('')}` : ''}

        <div class="card mt-16"><div class="card-header"><div class="card-title">أفضل 5</div><button class="btn btn-sm btn-outline" onclick="navigateTo('students')">الكل</button></div>
            ${ranked.slice(0,5).map((s,i) => `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;${i<4?'border-bottom:1px solid var(--border-light)':''}" onclick="showStudentDetail('${escapeHtml(s.id)}')">
                <div style="width:22px;height:22px;border-radius:50%;background:${i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${i<3?'white':'var(--text-muted)'}">${s.rank}</div>
                <div style="flex:1;font-size:13px;font-weight:600">${s.name}</div>
                <div style="font-size:14px;font-weight:700;color:var(--primary)">${s.latestPercentage}%</div></div>`).join('')}</div>

        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="navigateTo('import')">استيراد</button>
            <button class="btn btn-outline btn-sm" onclick="navigateTo('reports')">تقارير</button>
        </div>
    </div>`;

    setTimeout(() => {
        Charts.createDistributionChart('dashDistChart', latestGrades.map(Number));
        if (cachedFiles.length >= 2) Charts.createClassAveragesChart('dashAvgChart', cachedFiles, cachedStudents);
    }, 100);
}

// ============================
// Students Page
// ============================
let studentsSortField = 'percentage', studentsSortOrder = 'desc', studentsFilter = 'all';

async function renderStudentsPage() {
    const clId = getCurrentClassLevelId();
    if (!clId) { navigateTo('levels'); return; }
    cachedFiles = await getAllFiles(clId);
    cachedStudents = await buildStudentRecords(clId);
    if (cachedStudents.length === 0) {
        document.getElementById('contentArea').innerHTML = `<div class="page"><div class="empty-state"><h3>لا يوجد طلاب</h3><p>قم باستيراد ملف إكسل</p></div></div>`;
        return;
    }
    const ranked = Analyzer.rankStudents(cachedStudents);
    const hasBd = ranked.some(s => s.latestBreakdown);
    document.getElementById('contentArea').innerHTML = `<div class="page">
        <div class="filter-bar">
            <button class="filter-chip ${studentsFilter==='all'?'active':''}" onclick="filterStudents('all')">الكل</button>
            <button class="filter-chip ${studentsFilter==='excellent'?'active':''}" onclick="filterStudents('excellent')">ممتاز</button>
            <button class="filter-chip ${studentsFilter==='very-good'?'active':''}" onclick="filterStudents('very-good')">جيد جداً</button>
            <button class="filter-chip ${studentsFilter==='good'?'active':''}" onclick="filterStudents('good')">جيد</button>
            <button class="filter-chip ${studentsFilter==='weak'?'active':''}" onclick="filterStudents('weak')">ضعيف</button>
        </div>
        <div class="table-container"><table class="data-table"><thead><tr>
            <th onclick="sortStudents('rank')">#</th>
            <th onclick="sortStudents('name')">الطالب</th>
            ${hasBd?'<th>ت</th><th>و</th><th>ش</th><th>م</th>':''}
            <th onclick="sortStudents('percentage')">المجموع</th>
            <th>الاتجاه</th>
        </tr></thead><tbody id="studentsTableBody"></tbody></table></div>
        <div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text-muted)" id="studentCountLabel"></div></div>`;
    renderStudentsTable(ranked);
}

function renderStudentsTable(ranked) {
    let f = [...ranked];
    if (studentsFilter !== 'all') f = f.filter(s => Analyzer.getGradeClassification(s.latestPercentage).class === studentsFilter);
    f.sort((a,b) => {
        let va,vb;
        if (studentsSortField==='name') { va=a.name; vb=b.name; }
        else if (studentsSortField==='rank') { va=a.rank; vb=b.rank; }
        else { va=a.latestPercentage; vb=b.latestPercentage; }
        if (typeof va==='string') return studentsSortOrder==='asc'?va.localeCompare(vb,'ar'):vb.localeCompare(va,'ar');
        return studentsSortOrder==='asc'?va-vb:vb-va;
    });
    const hasBd = ranked.some(s => s.latestBreakdown);
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = f.map(st => {
        const cl = Analyzer.getGradeClassification(st.latestPercentage);
        const t = Analyzer.getStudentTrend(st.grades);
        const tc = t.trend==='improving'?'trend-up':t.trend==='declining'?'trend-down':'trend-stable';
        const bd = st.latestBreakdown;
        return `<tr onclick="showStudentDetail('${escapeHtml(st.id)}')">
            <td style="font-weight:700;color:var(--text-muted)">${st.rank}</td>
            <td><div class="student-name-cell"><div class="student-avatar">${st.name.charAt(0)}</div><span style="font-weight:600">${st.name}</span></div></td>
            ${hasBd?`<td style="text-align:center;font-size:12px">${bd?bd.written.score:'-'}</td><td style="text-align:center;font-size:12px">${bd?bd.homework.score:'-'}</td><td style="text-align:center;font-size:12px">${bd?bd.oral.score:'-'}</td><td style="text-align:center;font-size:12px">${bd?bd.attendance.score:'-'}</td>`:''}
            <td><span class="grade-badge grade-${cl.class}">${st.latestPercentage}%</span></td>
            <td><span class="trend-arrow ${tc}">${t.icon}</span></td></tr>`;
    }).join('');
    const c = document.getElementById('studentCountLabel');
    if (c) c.textContent = `${f.length} من ${ranked.length}`;
}

function sortStudents(field) {
    if (studentsSortField===field) studentsSortOrder=studentsSortOrder==='asc'?'desc':'asc';
    else { studentsSortField=field; studentsSortOrder=field==='name'?'asc':'desc'; }
    renderStudentsTable(Analyzer.rankStudents(cachedStudents));
}
function filterStudents(filter) {
    studentsFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
    event.target.classList.add('active');
    renderStudentsTable(Analyzer.rankStudents(cachedStudents));
}

// ============================
// Student Detail Modal
// ============================
async function showStudentDetail(sid) {
    const clId = getCurrentClassLevelId();
    const students = await buildStudentRecords(clId);
    const ranked = Analyzer.rankStudents(students);
    const student = ranked.find(s => s.id === sid);
    const files = await getAllFiles(clId);
    if (!student) return;
    const trend = Analyzer.getStudentTrend(student.grades);
    const classification = Analyzer.getGradeClassification(student.latestPercentage);
    const avg = student.grades.length>0?(student.grades.reduce((s,g)=>s+parseFloat(g.percentage),0)/student.grades.length).toFixed(1):'0';
    const tc = trend.trend==='improving'?'improving':trend.trend==='declining'?'declining':'stable';
    const latestFile = files[files.length-1];
    const classAvg = latestFile?Analyzer.calculateBreakdownStats(students,latestFile.id):null;
    const bd = student.latestBreakdown;

    const modal = document.getElementById('studentModal');
    const content = document.getElementById('studentModalContent');
    content.innerHTML = `
        <div class="student-modal-header">
            <button class="student-modal-close" onclick="closeStudentModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div class="student-modal-name">${student.name}</div>
            <div class="student-modal-rank">الترتيب: ${student.rank} من ${ranked.length} | ${classification.label}</div>
        </div>
        <div class="student-modal-body">
            <div class="student-detail-stats">
                <div class="student-detail-stat"><div class="value">${student.latestPercentage}%</div><div class="label">المجموع</div></div>
                <div class="student-detail-stat"><div class="value">${student.rank}</div><div class="label">الترتيب</div></div>
                <div class="student-detail-stat"><div class="value">${avg}%</div><div class="label">المتوسط</div></div>
            </div>
            <div class="trend-indicator ${tc}"><span style="font-size:20px">${trend.icon}</span><span>${trend.label}</span></div>
            ${bd?`<div class="card" style="padding:12px"><div class="card-title mb-8">تفصيل الدرجات</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    ${['written','homework','oral','attendance'].map(k=>{const b=bd[k];const pct=b?((b.score/b.max)*100).toFixed(0):0;const c=k==='written'?'#6366F1':k==='homework'?'#10B981':k==='oral'?'#F59E0B':'#EC4899';const bg=k==='written'?'#EEF2FF':k==='homework'?'#D1FAE5':k==='oral'?'#FEF3C7':'#FCE7F3';
                    return `<div style="background:${bg};padding:10px;border-radius:10px;text-align:center"><div style="font-size:10px;color:var(--text-muted)">${Analyzer.getBreakdownLabel(k)}</div><div style="font-size:18px;font-weight:800;color:${c}">${b?b.score:'-'}/${b?b.max:''}</div><div style="font-size:10px">${pct}%</div></div>`;}).join('')}
                </div></div>`:''}
            ${bd&&classAvg?`<div class="card" style="padding:12px"><div class="card-title mb-8">مقارنة مع المتوسط</div><div class="chart-container" style="height:210px"><canvas id="studentRadarChart"></canvas></div></div>`:''}
            ${student.grades.length>=2?`<div class="card" style="padding:12px"><div class="card-title mb-8">تطور الأداء</div><div class="chart-container"><canvas id="studentDetailChart"></canvas></div></div>`:''}
            <div class="card" style="padding:12px"><div class="card-title mb-8">سجل الدرجات</div><div style="max-height:220px;overflow-y:auto">
                ${student.grades.map((g,i)=>{const gc=Analyzer.getGradeClassification(parseFloat(g.percentage));const prev=i>0?parseFloat(student.grades[i-1].percentage):null;const diff=prev!==null?(parseFloat(g.percentage)-prev).toFixed(1):null;const dc=diff!==null?(diff>0?'var(--success)':diff<0?'var(--danger)':'var(--text-muted)'):'';const di=diff>0?'↑':diff<0?'↓':'→';
                return `<div style="padding:7px 0;${i<student.grades.length-1?'border-bottom:1px solid var(--border-light)':''}"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:13px;font-weight:600">${g.fileName}</div><div style="display:flex;align-items:center;gap:6px">${diff!==null?`<span style="font-size:11px;color:${dc}">${di}${Math.abs(diff)}%</span>`:''}<span class="grade-badge grade-${gc.class}">${g.percentage}%</span></div></div></div>`;}).join('')}
            </div></div>
            <button class="btn btn-primary btn-sm btn-block" onclick="Reports.generateStudentReport('${escapeHtml(student.id)}')">تقرير PDF</button>
        </div>`;
    modal.classList.remove('hidden');
    setTimeout(()=>{
        if(student.grades.length>=2) Charts.createStudentTrendChart('studentDetailChart',student.grades);
        if(bd&&classAvg) Charts.createBreakdownRadar('studentRadarChart',bd,classAvg);
    },150);
}

function closeStudentModal() { document.getElementById('studentModal').classList.add('hidden'); }

// ============================
// Import Page
// ============================
async function renderImportPage() {
    const clId = getCurrentClassLevelId();
    if (!clId) { navigateTo('levels'); return; }
    cachedFiles = await getAllFiles(clId);
    document.getElementById('contentArea').innerHTML = `<div class="page">
        <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()">
            <div class="upload-zone-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
            <h3>رفع ملف إكسل</h3>
            <p>اضغط أو اسحب الملف (xlsx, xls)</p>
            <div style="margin-top:8px;background:var(--primary-bg);padding:6px 10px;border-radius:8px;font-size:10px;color:var(--primary)">
                الأعمدة: المجموعة · اسم الطالب · تحريري(50) · واجبات(20) · شفوي(20) · مواظبة(10)
            </div>
        </div>
        <input type="file" class="file-input-hidden" id="fileInput" accept=".xlsx,.xls,.csv" onchange="handleFileSelect(event)" multiple>
        ${cachedFiles.length>0?`<div class="section-title mt-16">الملفات المستوردة (${cachedFiles.length})</div>
        ${cachedFiles.map(f=>`<div class="imported-file-item">
            <div class="imported-file-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div class="imported-file-info"><div class="imported-file-name">${f.name}</div><div class="imported-file-meta">${f.studentCount} طالب · ${new Date(f.date).toLocaleDateString('ar-SA',{month:'short',day:'numeric'})}</div></div>
            <button class="imported-file-delete" onclick="deleteImportedFile(${f.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
        </div>`).join('')}`:''}</div>`;

    const zone = document.getElementById('uploadZone');
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover')});
    zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover');if(e.dataTransfer.files.length>0)processFile(e.dataTransfer.files[0])});
}

async function handleFileSelect(e) { for(let i=0;i<e.target.files.length;i++) await processFile(e.target.files[i]); e.target.value=''; }

async function processFile(file) {
    showLoading('جارٍ القراءة...');
    try {
        const parsed = await ExcelProcessor.parseFile(file);
        const mapping = ExcelProcessor.detectColumns(parsed.columns, parsed.data);
        hideLoading();
        showColumnMappingDialog(parsed, mapping, file.name);
    } catch (err) { hideLoading(); showToast(err.message, 'error'); }
}

function showColumnMappingDialog(parsed, mapping, fileName) {
    const suggestedName = ExcelProcessor.suggestFileName(cachedFiles);
    const d = `<div class="dialog-overlay" id="mappingDialog"><div class="dialog-content" style="max-height:85vh;overflow-y:auto">
        <div class="dialog-title">تأكيد الاستيراد</div>
        <div style="background:var(--primary-bg);padding:8px;border-radius:8px;text-align:center;margin-bottom:12px;font-size:12px;color:var(--primary);font-weight:600">${parsed.rowCount} صف</div>
        <div style="margin-bottom:10px"><label class="cert-field-label">اسم الاختبار</label><input type="text" class="cert-textinput" id="importFileName" value="${suggestedName}"></div>
        <div class="mapping-field"><label>المجموعة</label><select id="groupCol"><option value="">-- بدون --</option>${parsed.columns.map(c=>`<option value="${escapeHtml(c)}" ${c===mapping.group?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="mapping-field"><label>الاسم</label><select id="nameCol">${parsed.columns.map(c=>`<option value="${escapeHtml(c)}" ${c===mapping.name?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="mapping-field"><label>التحريري</label><select id="writtenCol"><option value="">--</option>${parsed.columns.map(c=>`<option value="${escapeHtml(c)}" ${c===mapping.written?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="mapping-field"><label>الواجبات</label><select id="hwCol"><option value="">--</option>${parsed.columns.map(c=>`<option value="${escapeHtml(c)}" ${c===mapping.homework?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="mapping-field"><label>الشفوي</label><select id="oralCol"><option value="">--</option>${parsed.columns.map(c=>`<option value="${escapeHtml(c)}" ${c===mapping.oral?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="mapping-field"><label>المواظبة</label><select id="attCol"><option value="">--</option>${parsed.columns.map(c=>`<option value="${escapeHtml(c)}" ${c===mapping.attendance?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="dialog-actions"><button class="btn btn-outline" onclick="closeDialog('mappingDialog')">إلغاء</button><button class="btn btn-primary" onclick="confirmImport()">استيراد</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', d);
    window._tempParsed = parsed;
}

async function confirmImport() {
    // Read ALL values BEFORE closing dialog (dialog removal destroys DOM elements)
    const nameCol = document.getElementById('nameCol').value;
    const fileName = document.getElementById('importFileName').value.trim();
    const groupCol = document.getElementById('groupCol').value || null;
    const writtenCol = document.getElementById('writtenCol').value || null;
    const hwCol = document.getElementById('hwCol').value || null;
    const oralCol = document.getElementById('oralCol').value || null;
    const attCol = document.getElementById('attCol').value || null;

    if (!fileName || !nameCol) { showToast('أكمل البيانات', 'warning'); return; }
    closeDialog('mappingDialog');
    showLoading('جارٍ الحفظ...');
    try {
        const mapping = { name: nameCol, group: groupCol, written: writtenCol, homework: hwCol, oral: oralCol, attendance: attCol };
        const { students, foundGroups, maxGrade } = ExcelProcessor.extractStudents(window._tempParsed, mapping);
        if (!students.length) { hideLoading(); showToast('لا بيانات', 'error'); return; }
        const clId = getCurrentClassLevelId();
        await saveImportedFile({ classLevelId: clId, name: fileName, date: new Date().toISOString(), students, maxGrade });
        if (foundGroups.length > 0) await autoAssignGroups(clId, students, foundGroups);
        delete window._tempParsed;
        hideLoading();
        showToast(`تم استيراد ${students.length} طالب!`, 'success');
        renderImportPage();
    } catch (err) { hideLoading(); showToast('خطأ: '+err.message, 'error'); }
}

async function deleteImportedFile(id) {
    if (!confirm('حذف هذا الملف؟')) return;
    await deleteFile(id);
    showToast('تم الحذف', 'success');
    renderImportPage();
}

// ============================
// Settings Page
// ============================
async function renderSettingsPage() {
    const school = await getSchoolSettings();
    const clId = getCurrentClassLevelId();
    const stats = await getDBStats(clId);

    document.getElementById('contentArea').innerHTML = `<div class="page">
        <div class="settings-section"><div class="settings-section-title">الصفوف الدراسية</div>
            <div class="settings-item" onclick="navigateTo('levels')"><div class="settings-item-right">
                <div class="settings-item-icon" style="background:var(--primary-bg)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                <div><div class="settings-item-label">إدارة الصفوف</div><div class="settings-item-desc">${stats.levelCount} صف دراسي</div></div>
            </div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>

        <div class="settings-section"><div class="settings-section-title">المدرسة والمعلم</div>
            <div style="padding:0 4px">
                <div style="margin-bottom:10px"><label class="cert-field-label">اسم المدرسة</label><input type="text" class="cert-textinput" id="settSchoolName" value="${school.schoolName}" onchange="saveSchoolSettings({schoolName:this.value})"></div>
                <div style="margin-bottom:10px"><label class="cert-field-label">اسم المعلم العام</label><input type="text" class="cert-textinput" id="settTeacherName" value="${school.teacherName}" onchange="saveSchoolSettings({teacherName:this.value})" placeholder="يظهر تلقائياً في التقارير والشهادات"></div>
                <div style="margin-bottom:10px">
                    <label class="cert-field-label">شعار المدرسة</label>
                    <div style="display:flex;align-items:center;gap:10px">
                        ${school.schoolLogo?`<img src="${school.schoolLogo}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid var(--border)">`:''
                        }<div>
                            <button class="btn btn-sm btn-outline" onclick="document.getElementById('logoInput').click()">اختيار صورة</button>
                            ${school.schoolLogo?`<button class="btn btn-sm btn-outline" style="color:var(--danger);margin-right:4px" onclick="saveSchoolSettings({schoolLogo:null});renderSettingsPage()">إزالة</button>`:''}
                        </div>
                    </div>
                    <input type="file" id="logoInput" accept="image/*" style="display:none" onchange="handleLogoUpload(this)">
                    <div class="cert-field-hint">يظهر في رأس التقارير والشهادات</div>
                </div>
            </div>
        </div>

        <div class="settings-section"><div class="settings-section-title">البيانات</div>
            <div class="settings-item" onclick="exportBackupData()"><div class="settings-item-right">
                <div class="settings-item-icon" style="background:var(--primary-bg)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
                <div><div class="settings-item-label">نسخ احتياطي</div></div>
            </div></div>
            <div class="settings-item" onclick="document.getElementById('restoreInput').click()"><div class="settings-item-right">
                <div class="settings-item-icon" style="background:var(--success-bg)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
                <div><div class="settings-item-label">استعادة نسخة</div></div>
            </div></div>
        </div>
        <input type="file" class="file-input-hidden" id="restoreInput" accept=".json" onchange="handleRestoreFile(event)">

        <div style="text-align:center;margin-top:16px;font-size:11px;color:var(--text-muted)">محلل الطالب الذكي v3.0 — ${clId?`${stats.studentCount} طالب | ${stats.fileCount} ملف`:''}</div>
    </div>`;
}

async function handleLogoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 500000) { showToast('الصورة كبيرة (أقصى 500KB)', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        await saveSchoolSettings({ schoolLogo: e.target.result });
        showToast('تم حفظ الشعار', 'success');
        renderSettingsPage();
    };
    reader.readAsDataURL(file);
}

async function exportBackupData() {
    showLoading('جارٍ الإنشاء...');
    try {
        const json = await exportBackup();
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `نسخة_احتياطية_${new Date().toLocaleDateString('ar-SA')}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        hideLoading(); showToast('تم التحميل', 'success');
    } catch (e) { hideLoading(); showToast('خطأ', 'error'); }
}

async function handleRestoreFile(event) {
    const file = event.target.files[0]; if (!file) return;
    if (!confirm('سيتم استبدال جميع البيانات')) { event.target.value=''; return; }
    showLoading('جارٍ الاستعادة...');
    try {
        await importBackup(await file.text());
        hideLoading(); showToast('تمت الاستعادة!', 'success');
        await updateHeaderClassSelector();
        const levels = await getAllClassLevels();
        if (levels.length > 0) setCurrentClassLevelId(levels[0].id);
        navigateTo('dashboard');
    } catch (e) { hideLoading(); showToast('خطأ', 'error'); }
    event.target.value = '';
}

// ============================
// Search
// ============================
function showSearch() {
    document.getElementById('searchModal').classList.remove('hidden');
    document.getElementById('searchInput').value='';
    document.getElementById('searchResults').innerHTML='';
    setTimeout(()=>document.getElementById('searchInput').focus(),100);
}
function hideSearch() { document.getElementById('searchModal').classList.add('hidden'); }

async function handleSearch(q) {
    const r = document.getElementById('searchResults');
    if (!q||q.trim().length<1) { r.innerHTML=''; return; }
    const clId = getCurrentClassLevelId();
    if (!clId) return;
    const students = await buildStudentRecords(clId);
    const ranked = Analyzer.rankStudents(students);
    const matches = ranked.filter(s=>s.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0,10);
    if (!matches.length) { r.innerHTML='<div class="text-center text-muted fs-13" style="padding:16px">لا نتائج</div>'; return; }
    r.innerHTML = matches.map(s=>{const cl=Analyzer.getGradeClassification(s.latestPercentage);
        return `<div class="search-result-item" onclick="hideSearch();showStudentDetail('${escapeHtml(s.id)}')">
            <div class="student-avatar">${s.name.charAt(0)}</div><div style="flex:1"><div class="search-result-name">${s.name}</div><div class="search-result-grade">${s.latestPercentage}% · ${cl.label} · #${s.rank}</div></div></div>`;}).join('');
}

// ============================
// Utilities
// ============================
function escapeHtml(s) { if(!s)return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML.replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

function showToast(msg, type='info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success:'✓', error:'✗', warning:'⚠', info:'ℹ' };
    t.innerHTML = `${icons[type]||''} ${msg}`;
    c.appendChild(t);
    setTimeout(()=>{ if(t.parentNode) t.parentNode.removeChild(t); }, 3000);
}

function showLoading(text='جارٍ التحميل...') {
    let o = document.getElementById('loadingOverlay');
    if (!o) { o=document.createElement('div'); o.id='loadingOverlay'; o.className='loading-overlay'; document.body.appendChild(o); }
    o.classList.remove('hidden');
    o.innerHTML = `<div class="spinner"></div><div class="loading-text">${text}</div>`;
}
function hideLoading() { const o=document.getElementById('loadingOverlay'); if(o) o.classList.add('hidden'); }
function closeDialog(id) { const d=document.getElementById(id); if(d) d.remove(); }
