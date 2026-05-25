/* ============================
   db.js - IndexedDB Storage Layer
   v3: Multi-class levels, school logo, teacher settings
   ============================ */

const DB_NAME = 'StudentAnalyzerDB';
const DB_VERSION = 5;
let db = null;

const STORES = {
    CLASS_LEVELS: 'class_levels',
    FILES: 'imported_files',
    STUDENTS: 'students',
    GROUPS: 'groups',
    SETTINGS: 'settings'
};

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.CLASS_LEVELS)) {
                const clStore = db.createObjectStore(STORES.CLASS_LEVELS, { keyPath: 'id', autoIncrement: true });
                clStore.createIndex('name', 'name', { unique: true });
            }
            if (!db.objectStoreNames.contains(STORES.FILES)) {
                const f = db.createObjectStore(STORES.FILES, { keyPath: 'id', autoIncrement: true });
                f.createIndex('classLevelId', 'classLevelId', { unique: false });
                f.createIndex('date', 'date', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
                const s = db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
                s.createIndex('classLevelId', 'classLevelId', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.GROUPS)) {
                const g = db.createObjectStore(STORES.GROUPS, { keyPath: 'id', autoIncrement: true });
                g.createIndex('classLevelId', 'classLevelId', { unique: false });
                g.createIndex('name', 'name', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject(e.target.error);
    });
}

function tx(store, mode = 'readonly') { return db.transaction(store, mode).objectStore(store); }
function dbGetAll(s) { return new Promise((res, rej) => { const r = tx(s).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbGet(s, k) { return new Promise((res, rej) => { const r = tx(s).get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbPut(s, d) { return new Promise((res, rej) => { const r = tx(s, 'readwrite').put(d); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbAdd(s, d) { return new Promise((res, rej) => { const r = tx(s, 'readwrite').add(d); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function dbDelete(s, k) { return new Promise((res, rej) => { const r = tx(s, 'readwrite').delete(k); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }
function dbClear(s) { return new Promise((res, rej) => { const r = tx(s, 'readwrite').clear(); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); }
function dbGetByIndex(s, idx, val) {
    return new Promise((res, rej) => {
        const r = tx(s).index(idx).getAll(val);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
}

// ============================
// Global Settings (school, teacher, logo)
// ============================
async function getGlobalSetting(key) {
    const r = await dbGet(STORES.SETTINGS, key);
    return r ? r.value : null;
}
async function setGlobalSetting(key, value) {
    return await dbPut(STORES.SETTINGS, { key, value });
}

async function getSchoolSettings() {
    const name = await getGlobalSetting('schoolName') || 'المدرسة النموذجية';
    const logo = await getGlobalSetting('schoolLogo') || null;
    const teacherName = await getGlobalSetting('teacherName') || '';
    return { schoolName: name, schoolLogo: logo, teacherName };
}

async function saveSchoolSettings(data) {
    if (data.schoolName !== undefined) await setGlobalSetting('schoolName', data.schoolName);
    if (data.schoolLogo !== undefined) await setGlobalSetting('schoolLogo', data.schoolLogo);
    if (data.teacherName !== undefined) await setGlobalSetting('teacherName', data.teacherName);
}

// ============================
// Class Levels CRUD
// ============================
let _currentClassLevelId = null;

async function getAllClassLevels() {
    const levels = await dbGetAll(STORES.CLASS_LEVELS);
    return levels.sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function addClassLevel(name, teacherName = '') {
    const existing = await getAllClassLevels();
    return await dbAdd(STORES.CLASS_LEVELS, {
        name, teacherName, order: existing.length, createdAt: new Date().toISOString()
    });
}

async function updateClassLevel(data) { return await dbPut(STORES.CLASS_LEVELS, data); }
async function deleteClassLevel(id) { return await dbDelete(STORES.CLASS_LEVELS, id); }

function getCurrentClassLevelId() { return _currentClassLevelId; }
function setCurrentClassLevelId(id) { _currentClassLevelId = id; }

async function getCurrentClassLevel() {
    if (!_currentClassLevelId) return null;
    return await dbGet(STORES.CLASS_LEVELS, _currentClassLevelId);
}

// ============================
// Files (scoped by classLevelId)
// ============================
async function saveImportedFile(fileData) {
    const rec = {
        classLevelId: fileData.classLevelId,
        name: fileData.name,
        date: fileData.date || new Date().toISOString(),
        studentCount: fileData.students.length,
        maxGrade: fileData.maxGrade || 100,
        students: fileData.students,
        createdAt: new Date().toISOString()
    };
    return await dbAdd(STORES.FILES, rec);
}

async function getAllFiles(classLevelId) {
    if (!classLevelId) return [];
    const files = await dbGetByIndex(STORES.FILES, 'classLevelId', classLevelId);
    return files.sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function deleteFile(fileId) { return await dbDelete(STORES.FILES, fileId); }

// ============================
// Build Student Records (scoped)
// ============================
async function buildStudentRecords(classLevelId) {
    if (!classLevelId) return [];
    const files = await getAllFiles(classLevelId);
    if (files.length === 0) return [];
    const studentMap = {};

    files.forEach(file => {
        (file.students || []).forEach(s => {
            const key = s.name.trim();
            if (!studentMap[key]) {
                studentMap[key] = { id: key, name: key, grades: [], groupNames: [], groupId: null, classLevelId };
            }
            if (s.group && !studentMap[key].groupNames.includes(s.group)) {
                studentMap[key].groupNames.push(s.group);
            }
            studentMap[key].grades.push({
                fileId: file.id, fileName: file.name, fileDate: file.date,
                grade: s.grade, maxGrade: file.maxGrade || 100,
                percentage: ((s.grade / (file.maxGrade || 100)) * 100).toFixed(1),
                breakdown: s.breakdown || null
            });
        });
    });

    // Load group assignments
    try {
        const allStudents = await dbGetByIndex(STORES.STUDENTS, 'classLevelId', classLevelId);
        allStudents.forEach(es => { if (studentMap[es.id]) studentMap[es.id].groupId = es.groupId; });
    } catch (e) {}

    return Object.values(studentMap);
}

async function updateStudentGroup(studentId, groupId, classLevelId) {
    const existing = await dbGet(STORES.STUDENTS, studentId);
    const data = { id: studentId, name: studentId, groupId, classLevelId };
    if (existing) Object.assign(data, existing, { groupId });
    await dbPut(STORES.STUDENTS, data);
}

// Auto-assign groups from Excel
async function autoAssignGroups(classLevelId, students, foundGroups) {
    if (!foundGroups || foundGroups.length === 0) return;
    const existingGroups = await getAllGroups(classLevelId);
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

    for (const groupName of foundGroups) {
        let group = existingGroups.find(g => g.name === groupName);
        if (!group) {
            group = { name: groupName, color: colors[existingGroups.length % colors.length], classLevelId, createdAt: new Date().toISOString(), autoCreated: true };
            const id = await dbAdd(STORES.GROUPS, group);
            group.id = id;
            existingGroups.push(group);
        }
        for (const student of students) {
            if (student.group === groupName) await updateStudentGroup(student.name, group.id, classLevelId);
        }
    }
}

// ============================
// Groups (scoped)
// ============================
async function getAllGroups(classLevelId) {
    if (!classLevelId) return [];
    return await dbGetByIndex(STORES.GROUPS, 'classLevelId', classLevelId);
}
async function saveGroup(group) { return await dbAdd(STORES.GROUPS, group); }
async function updateGroup(group) { return await dbPut(STORES.GROUPS, group); }
async function deleteGroup(groupId) { return await dbDelete(STORES.GROUPS, groupId); }

// ============================
// Backup & Restore
// ============================
async function exportBackup() {
    return JSON.stringify({
        version: DB_VERSION, exportDate: new Date().toISOString(),
        classLevels: await dbGetAll(STORES.CLASS_LEVELS),
        files: await dbGetAll(STORES.FILES),
        students: await dbGetAll(STORES.STUDENTS),
        groups: await dbGetAll(STORES.GROUPS),
        settings: await dbGetAll(STORES.SETTINGS)
    }, null, 2);
}

async function importBackup(json) {
    const data = JSON.parse(json);
    for (const s of Object.values(STORES)) await dbClear(s);
    for (const d of (data.classLevels || [])) await dbPut(STORES.CLASS_LEVELS, d);
    for (const d of (data.files || [])) await dbPut(STORES.FILES, d);
    for (const d of (data.students || [])) await dbPut(STORES.STUDENTS, d);
    for (const d of (data.groups || [])) await dbPut(STORES.GROUPS, d);
    for (const d of (data.settings || [])) await dbPut(STORES.SETTINGS, d);
    return data;
}

async function getDBStats(classLevelId) {
    const levels = await getAllClassLevels();
    const files = classLevelId ? await getAllFiles(classLevelId) : [];
    const students = classLevelId ? await buildStudentRecords(classLevelId) : [];
    const groups = classLevelId ? await getAllGroups(classLevelId) : [];
    return { levelCount: levels.length, fileCount: files.length, studentCount: students.length, groupCount: groups.length };
}
