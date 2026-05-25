/* ============================
   excel.js - Excel File Processing
   Updated: Multi-column support with auto-grouping
   ============================ */

const ExcelProcessor = {
    COLUMN_MAP: {
        group:     ['المجموعة', 'مجموعة', 'الشعبة', 'الشعبه', 'group', 'section', 'الفصل'],
        name:      ['اسم الطالب', 'الاسم', 'اسم', 'الطالب', 'طالب', 'student', 'name', 'الاسم الكامل', 'اسم الطالب الثلاثي والأربعة'],
        written:   ['تحريري', 'التحريري', 'الاختبار التحريري', 'مكتوب', 'written', 'exam'],
        homework:  ['واجبات', 'الواجبات', 'واجب', 'home work', 'homework', 'hw', 'تكليفات'],
        oral:      ['شفوي', 'الشفوي', 'شفهي', 'الشفهي', 'oral', 'speaking'],
        attendance:['مواظبة', 'المواظبة', 'سلوك', 'السلوك', 'attendance', 'behavior', 'behaviour']
    },

    MAX_GRADES: { written: 50, homework: 20, oral: 20, attendance: 10, total: 100 },

    parseFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) { reject(new Error('لم يتم اختيار ملف')); return; }

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        reject(new Error('الملف فارغ'));
                        return;
                    }

                    const data = new Uint8Array(arrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: true, cellText: false });

                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        reject(new Error('لا توجد أوراق في الملف'));
                        return;
                    }

                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (!jsonData || jsonData.length === 0) {
                        reject(new Error('الملف فارغ أو لا يحتوي على بيانات'));
                        return;
                    }

                    const columns = Object.keys(jsonData[0]);

                    resolve({
                        data: jsonData,
                        columns: columns,
                        sheetName: sheetName,
                        rowCount: jsonData.length
                    });
                } catch (err) {
                    reject(new Error('خطأ في قراءة الملف: ' + (err.message || 'خطأ غير معروف')));
                }
            };

            reader.onerror = () => reject(new Error('خطأ في قراءة الملف — تأكد أن الملف غير تالف'));
            reader.readAsArrayBuffer(file);
        });
    },

    detectColumns(columns, sampleData) {
        const mapping = { group: null, name: null, written: null, homework: null, oral: null, attendance: null };

        // Keyword matching — each column can only match once
        for (const [type, keywords] of Object.entries(this.COLUMN_MAP)) {
            for (const col of columns) {
                if (Object.values(mapping).includes(col)) continue; // already taken
                const colLower = col.toString().toLowerCase().trim();
                if (keywords.some(k => colLower.includes(k.toLowerCase()))) {
                    mapping[type] = col;
                    break; // found for this type, move to next type
                }
            }
        }

        // Fallback: first non-matched string column = name
        if (!mapping.name && sampleData.length > 0) {
            for (const col of columns) {
                if (Object.values(mapping).includes(col)) continue;
                const val = sampleData[0][col];
                if (typeof val === 'string' && val.trim().length > 1 && isNaN(Number(val))) {
                    mapping.name = col;
                    break;
                }
            }
        }

        // Fallback: next non-matched string column = group
        if (!mapping.group && sampleData.length > 0) {
            for (const col of columns) {
                if (Object.values(mapping).includes(col)) continue;
                const val = sampleData[0][col];
                if (typeof val === 'string' && val.trim().length > 0 && isNaN(Number(val))) {
                    mapping.group = col;
                    break;
                }
            }
        }

        // Fallback: remaining numeric columns
        const numericCols = columns.filter(col => {
            if (Object.values(mapping).includes(col)) return false;
            const val = sampleData[0][col];
            const num = Number(val);
            return !isNaN(num);
        });

        if (!mapping.written && numericCols.length > 0) mapping.written = numericCols.shift();
        if (!mapping.homework && numericCols.length > 0) mapping.homework = numericCols.shift();
        if (!mapping.oral && numericCols.length > 0) mapping.oral = numericCols.shift();
        if (!mapping.attendance && numericCols.length > 0) mapping.attendance = numericCols.shift();

        if (!mapping.name && columns.length > 0) mapping.name = columns[0];

        return mapping;
    },

    extractStudents(parsedData, mapping) {
        const students = [];
        const foundGroups = new Set();
        const MG = this.MAX_GRADES;

        parsedData.data.forEach(row => {
            const name = (mapping.name && row[mapping.name] != null) ? String(row[mapping.name]).trim() : '';
            if (!name) return;

            const group = (mapping.group && row[mapping.group] != null) ? String(row[mapping.group]).trim() : '';

            // Safe number extraction — treat missing/invalid as 0
            const safeNum = (col) => {
                if (!col || row[col] == null || row[col] === '') return 0;
                const n = Number(row[col]);
                return isNaN(n) ? 0 : Math.max(0, n); // never negative
            };

            const written    = safeNum(mapping.written);
            const homework   = safeNum(mapping.homework);
            const oral       = safeNum(mapping.oral);
            const attendance = safeNum(mapping.attendance);
            const total      = written + homework + oral + attendance;

            if (group) foundGroups.add(group);

            students.push({
                name,
                group,
                grade: total,
                breakdown: {
                    written:    { score: written,    max: MG.written },
                    homework:   { score: homework,   max: MG.homework },
                    oral:       { score: oral,       max: MG.oral },
                    attendance: { score: attendance, max: MG.attendance }
                }
            });
        });

        return { students, foundGroups: [...foundGroups], maxGrade: MG.total };
    },

    suggestFileName(existingFiles) {
        const now = new Date();
        const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        if (existingFiles.length === 0) return `اختبار - ${dateStr}`;
        const ord = ['ثاني','ثالث','رابع','خامس','سادس','سابع','ثامن','تاسع','عاشر'];
        return `اختبار ${ord[Math.min(existingFiles.length, ord.length) - 1]} - ${dateStr}`;
    }
};
