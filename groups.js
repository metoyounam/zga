/* groups.js - Group Management (scoped by class level) */
const GROUP_COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

const Groups = {
    async renderPage() {
        const clId = getCurrentClassLevelId();
        if (!clId) { navigateTo('levels'); return; }
        const students = await buildStudentRecords(clId);
        const groups = await getAllGroups(clId);
        const files = await getAllFiles(clId);

        let html = `<div class="section-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> المجموعات</div>`;

        if (!students.length) {
            html += `<div class="empty-state"><h3>لا بيانات</h3><p>استورد ملفاً أولاً</p></div>`;
        } else {
            if (groups.length) {
                groups.forEach(g => {
                    const gs = students.filter(s=>s.groupId===g.id);
                    const lg = gs.map(s=>s.grades.length>0?parseFloat(s.grades[s.grades.length-1].percentage):null).filter(x=>x!==null);
                    const avg = lg.length?(lg.reduce((a,b)=>a+b,0)/lg.length).toFixed(1):'-';

                    // FIXED: Removed student names from group card (group-members div removed)
                    html += `<div class="group-card"><div class="group-header">
                        <div class="group-name"><div class="group-color" style="background:${g.color}"></div>${g.name}</div>
                        <div style="display:flex;gap:4px"><button class="btn btn-sm btn-outline" onclick="Groups.editGroup(${g.id})">تعديل</button>
                        <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="Groups.removeGroup(${g.id})">حذف</button></div></div>
                        <div class="group-stats">الطلاب: <span>${gs.length}</span> | المتوسط: <span>${avg}%</span></div>
                        </div>`;
                });
                if (files.length>=2&&groups.length>=2) html += `<div class="card mt-16"><div class="card-header"><div class="card-title">مقارنة المجموعات</div></div><div class="group-comparison-chart"><canvas id="groupComparisonChart"></canvas></div></div>`;
            }
            html += `<button class="add-group-btn mt-12" onclick="Groups.showAddDialog()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> مجموعة جديدة</button>`;
            if (groups.length) html += `<div class="card mt-16"><div class="card-header"><div class="card-title">تعيين الطلاب</div></div><div id="studentGroupAssignment"></div></div>`;
        }

        document.getElementById('contentArea').innerHTML = `<div class="page">${html}</div>`;
        if (files.length>=2&&groups.length>=2) setTimeout(()=>Charts.createGroupComparisonChart('groupComparisonChart',groups,files,students),100);
        if (groups.length) this.renderAssignment(students,groups);
    },

    renderAssignment(students,groups) {
        const c = document.getElementById('studentGroupAssignment');
        if (!c) return;
        const ranked = Analyzer.rankStudents(students);
        c.innerHTML = ranked.map(s=>`<div class="group-select-item" onclick="Groups.showAssign('${escapeHtml(s.id)}')">
            <div class="student-avatar">${s.name.charAt(0)}</div>
            <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${s.latestPercentage}% | #${s.rank}</div></div>
            ${s.groupId?`<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:var(--primary-bg);color:var(--primary)">${groups.find(g=>g.id===s.groupId)?.name||''}</span>`:'<span style="font-size:11px;color:var(--text-muted)">—</span>'}
        </div>`).join('');
    },

    showAddDialog() {
        const d = `<div class="dialog-overlay" id="addGroupDlg"><div class="dialog-content">
            <div class="dialog-title">مجموعة جديدة</div>
            <input type="text" class="dialog-input" id="newGroupName" placeholder="اسم المجموعة" autofocus>
            <div class="color-options">${GROUP_COLORS.map((c,i)=>`<div class="color-option ${i===0?'selected':''}" style="background:${c}" data-color="${c}" onclick="selectColor(this)"></div>`).join('')}</div>
            <div class="dialog-actions"><button class="btn btn-outline" onclick="closeDialog('addGroupDlg')\">إلغاء</button><button class="btn btn-primary" onclick="Groups.createGroup()">إنشاء</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', d);
    },

    async createGroup() {
        const name = document.getElementById('newGroupName').value.trim();
        if (!name) { document.getElementById('newGroupName').style.borderColor='var(--danger)'; return; }
        const sel = document.querySelector('#addGroupDlg .color-option.selected');
        const color = sel?sel.dataset.color:GROUP_COLORS[0];
        await saveGroup({ name, color, classLevelId: getCurrentClassLevelId(), createdAt: new Date().toISOString() });
        closeDialog('addGroupDlg');
        showToast('تم الإنشاء', 'success');
        this.renderPage();
    },

    async editGroup(id) {
        const groups = await getAllGroups(getCurrentClassLevelId());
        const g = groups.find(x=>x.id===id);
        if (!g) return;
        const d = `<div class="dialog-overlay" id="editGroupDlg"><div class="dialog-content">
            <div class="dialog-title">تعديل المجموعة</div>
            <input type="text" class="dialog-input" id="editGroupName" value="${g.name}">
            <div class="color-options">${GROUP_COLORS.map(c=>`<div class="color-option ${c===g.color?'selected':''}" style="background:${c}" data-color="${c}" onclick="selectColor(this)"></div>`).join('')}</div>
            <div class="dialog-actions"><button class="btn btn-outline" onclick="closeDialog('editGroupDlg')\">إلغاء</button><button class="btn btn-primary" onclick="Groups.saveEdit(${id})">حفظ</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', d);
    },

    async saveEdit(id) {
        const name = document.getElementById('editGroupName').value.trim();
        const sel = document.querySelector('#editGroupDlg .color-option.selected');
        await updateGroup({ id, name, color: sel?sel.dataset.color:GROUP_COLORS[0], classLevelId: getCurrentClassLevelId() });
        closeDialog('editGroupDlg');
        showToast('تم التحديث', 'success');
        this.renderPage();
    },

    async removeGroup(id) {
        if (!confirm('حذف المجموعة؟')) return;
        const clId = getCurrentClassLevelId();
        const students = await buildStudentRecords(clId);
        for (const s of students) { if (s.groupId===id) await updateStudentGroup(s.id,null,clId); }
        await deleteGroup(id);
        showToast('تم الحذف', 'success');
        this.renderPage();
    },

    async showAssign(sid) {
        const clId = getCurrentClassLevelId();
        const groups = await getAllGroups(clId);
        const students = await buildStudentRecords(clId);
        const student = students.find(s=>s.id===sid);
        if (!student) return;
        const d = `<div class="dialog-overlay" id="assignDlg"><div class="dialog-content">
            <div class="dialog-title">تعيين ${student.name}</div>
            <div class="group-select-list">
                <div class="group-select-item" onclick="Groups.assign('${escapeHtml(sid)}',null)">
                    <div class="group-checkbox ${!student.groupId?'checked':''}">${!student.groupId?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>
                    <span style="font-size:14px">بدون مجموعة</span></div>
                ${groups.map(g=>`<div class="group-select-item" onclick="Groups.assign('${escapeHtml(sid)}',${g.id})">
                    <div class="group-checkbox ${student.groupId===g.id?'checked':''}" style="${student.groupId===g.id?'background:'+g.color+';border-color:'+g.color:''}">${student.groupId===g.id?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>
                    <div class="group-color" style="background:${g.color}"></div><span style="font-size:14px">${g.name}</span></div>`).join('')}
            </div>
            <div class="dialog-actions mt-12"><button class="btn btn-outline btn-block" onclick="closeDialog('assignDlg')\">إغلاق</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', d);
    },

    async assign(sid, gid) {
        await updateStudentGroup(sid, gid, getCurrentClassLevelId());
        closeDialog('assignDlg');
        showToast('تم التعيين', 'success');
        this.renderPage();
    }
};

function selectColor(el) { el.parentElement.querySelectorAll('.color-option').forEach(o=>o.classList.remove('selected')); el.classList.add('selected'); }