'use client';
import { useState, useMemo } from 'react';

type StudentItem = {
    id: string;
    student_id: string;
    full_name: string;
    father_name: string;
    grade: string;
    gender?: string;
    contact_number?: string;
    raw?: any;
};

interface ClassRosterPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: StudentItem[];
    classes: string[];
    defaultClass?: string;
}

// Female name indicators for accurate gender assignment fallback
const FEMALE_NAMES = new Set([
    'anabia', 'ayzal', 'hiba', 'khadija', 'mahas', 'eshal', 'fatima', 'fatimah', 'ayesha', 
    'zainab', 'maryam', 'marium', 'minahil', 'noor', 'sara', 'sarah', 'dua', 'zoya', 'hoorain', 
    'bareera', 'inaya', 'manha', 'alveena', 'hafsa', 'aiman', 'amina', 'laiba', 'bushra', 'arfa', 
    'eman', 'haniya', 'kinza', 'mehak', 'alishba', 'sadia', 'samina', 'hira', 'sidra', 'rida', 
    'mahnoor', 'aymen', 'bisma', 'zara', 'hadia', 'hoor', 'iman', 'iqra', 'jannat', 'kashaf', 
    'marwa', 'rumaisa', 'saadia', 'sumayya', 'tuba', 'urooj', 'wajeeha', 'yumna', 'zoha', 'syeda', 
    'bano', 'kiran', 'anam', 'nida', 'sania', 'fizza', 'shanza', 'maria', 'meerab', 'malaika',
    'shiza', 'aleena', 'alina', 'amna', 'areesha', 'armeen', 'ayra', 'danio', 'eimaan', 'falak',
    'hareem', 'insha', 'ifra', 'jawairia', 'liba', 'muntaha', 'natasha', 'parveen', 'rabia', 'rabiya',
    'saba', 'sahar', 'sehar', 'sobia', 'tania', 'uzma', 'warda', 'yusra', 'zarish', 'momina',
    'nimra', 'maham', 'komal', 'sawera', 'tehreem', 'wajiha', 'javaria', 'samra', 'anum',
    'mahrukh', 'ayelen', 'mirha', 'aylah', 'ayla', 'areeba', 'mehwish', 'nargis', 'shazia',
    'naseem', 'yasmeen', 'gul', 'faryal', 'kinzat', 'farah', 'nazia', 'faiza', 'farhat',
    'shehnaz', 'humaira', 'madiha', 'kalsoom', 'kulsoom', 'bilqees', 'rukhsana', 'tahira',
    'shabana', 'samreen', 'farzana', 'fouzia', 'fozia', 'shabnam', 'tasneem', 'nuzhat',
    'naheed', 'shaheen', 'surayya', 'talat', 'farhat', 'tanzeela', 'sultana', 'begum',
    'khatoon', 'bibi', 'janat', 'muskan', 'aqsa', 'huma', 'naila', 'asfa', 'afshan'
]);

export const isFemaleStudent = (student: StudentItem, overrides?: Record<string, 'girl' | 'boy'>): boolean => {
    if (overrides && overrides[student.id]) {
        return overrides[student.id] === 'girl';
    }
    const rawGender = (student.gender || student.raw?.gender || student.raw?.sex || '').toLowerCase().trim();
    if (rawGender === 'female' || rawGender === 'girl' || rawGender === 'f' || rawGender === 'daughter') return true;
    if (rawGender === 'male' || rawGender === 'boy' || rawGender === 'm' || rawGender === 'son') return false;

    const name = (student.full_name || '').toLowerCase().trim();
    const words = name.split(/[\s.]+/);
    return words.some(w => FEMALE_NAMES.has(w));
};

interface PageSection {
    type: 'girls' | 'boys';
    title: string;
    students: { student: StudentItem; displayIndex: number }[];
    blankCount: number;
}

interface ClassPageData {
    className: string;
    pageNumber: number;
    totalPages: number;
    sections: PageSection[];
}

export default function ClassRosterPDFModal({
    isOpen,
    onClose,
    students,
    classes,
    defaultClass = 'all'
}: ClassRosterPDFModalProps) {
    const [selectedClasses, setSelectedClasses] = useState<string[]>(() => {
        if (defaultClass && defaultClass !== 'all' && classes.includes(defaultClass)) {
            return [defaultClass];
        }
        return classes.length > 0 ? [classes[0]] : [];
    });
    const [previewClass, setPreviewClass] = useState<string>(() => {
        if (defaultClass && defaultClass !== 'all' && classes.includes(defaultClass)) {
            return defaultClass;
        }
        return classes[0] || '';
    });
    const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(20);
    const [sectionOrder, setSectionOrder] = useState<'girls-first' | 'boys-first'>('girls-first');
    const [numberingMode, setNumberingMode] = useState<'sectional' | 'continuous'>('sectional');
    const [sortOption, setSortOption] = useState<'name-asc' | 'id-asc' | 'original'>('name-asc');
    
    // Custom Student Management States
    const [customAddedStudents, setCustomAddedStudents] = useState<StudentItem[]>([]);
    const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);
    const [genderOverrides, setGenderOverrides] = useState<Record<string, 'girl' | 'boy'>>({});
    const [editedStudentDetails, setEditedStudentDetails] = useState<Record<string, { full_name?: string; father_name?: string }>>({});
    
    // Student Manager Modal States
    const [showStudentManager, setShowStudentManager] = useState<boolean>(false);
    const [managerTab, setManagerTab] = useState<'all' | 'girls' | 'boys' | 'excluded' | 'add'>('all');
    const [managerSearch, setManagerSearch] = useState<string>('');
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingForm, setEditingForm] = useState<{ full_name: string; father_name: string }>({ full_name: '', father_name: '' });
    
    // Add Student Form State
    const [newStudentForm, setNewStudentForm] = useState<{
        full_name: string;
        father_name: string;
        gender: 'girl' | 'boy';
        grade: string;
        student_id: string;
    }>({
        full_name: '',
        father_name: '',
        gender: 'girl',
        grade: previewClass || (classes[0] || ''),
        student_id: ''
    });

    // Interactive Mode toggle on preview table
    const [isTableInteractive, setIsTableInteractive] = useState<boolean>(false);

    // Synchronize newStudentForm default grade when previewClass changes
    const handleSelectPreviewClass = (cls: string) => {
        setPreviewClass(cls);
        setPreviewPageIndex(0);
        setNewStudentForm(prev => ({ ...prev, grade: cls }));
    };

    // Toggle student gender override
    const handleToggleGender = (studentId: string, currentIsFemale: boolean) => {
        setGenderOverrides(prev => ({
            ...prev,
            [studentId]: currentIsFemale ? 'boy' : 'girl'
        }));
    };

    // Exclude / Remove student from roster
    const handleExcludeStudent = (studentId: string) => {
        setExcludedStudentIds(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
    };

    // Restore excluded student back into roster
    const handleRestoreStudent = (studentId: string) => {
        setExcludedStudentIds(prev => prev.filter(id => id !== studentId));
    };

    // Add new student to roster
    const handleAddNewStudent = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newStudentForm.full_name.trim()) {
            alert('Please enter the student\'s full name.');
            return;
        }

        const targetGrade = newStudentForm.grade || previewClass || classes[0] || 'General';
        const newId = `custom-std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const createdStudent: StudentItem = {
            id: newId,
            student_id: newStudentForm.student_id.trim() || `STD-${Math.floor(1000 + Math.random() * 9000)}`,
            full_name: newStudentForm.full_name.trim(),
            father_name: newStudentForm.father_name.trim(),
            grade: targetGrade,
            gender: newStudentForm.gender
        };

        setCustomAddedStudents(prev => [...prev, createdStudent]);
        setGenderOverrides(prev => ({ ...prev, [newId]: newStudentForm.gender }));
        
        // Reset form
        setNewStudentForm({
            full_name: '',
            father_name: '',
            gender: newStudentForm.gender,
            grade: targetGrade,
            student_id: ''
        });
        setManagerTab('all');
    };

    // Start inline editing student
    const handleStartEdit = (student: StudentItem) => {
        setEditingStudentId(student.id);
        setEditingForm({
            full_name: student.full_name,
            father_name: student.father_name || student.raw?.guardian_name || student.raw?.father_name || ''
        });
    };

    // Save inline editing student
    const handleSaveEdit = (studentId: string) => {
        if (!editingForm.full_name.trim()) return;
        setEditedStudentDetails(prev => ({
            ...prev,
            [studentId]: {
                full_name: editingForm.full_name.trim(),
                father_name: editingForm.father_name.trim()
            }
        }));
        setEditingStudentId(null);
    };

    // Reset all overrides & custom modifications for current class
    const handleResetClass = (cls: string) => {
        if (confirm(`Reset all customizations (added students, excluded students, and gender switches) for ${cls}?`)) {
            // Remove custom added students for this class
            setCustomAddedStudents(prev => prev.filter(s => s.grade !== cls));
            
            // Remove exclusions for this class
            const originalClassStdIds = students.filter(s => s.grade === cls).map(s => s.id);
            setExcludedStudentIds(prev => prev.filter(id => !originalClassStdIds.includes(id)));
            
            // Reset gender overrides
            setGenderOverrides(prev => {
                const next = { ...prev };
                originalClassStdIds.forEach(id => delete next[id]);
                return next;
            });

            // Reset name edits
            setEditedStudentDetails(prev => {
                const next = { ...prev };
                originalClassStdIds.forEach(id => delete next[id]);
                return next;
            });
        }
    };

    // Combined all effective students (original + custom added with edited names)
    const allEffectiveStudents = useMemo(() => {
        return [...students, ...customAddedStudents].map(s => {
            const edited = editedStudentDetails[s.id];
            if (edited) {
                return {
                    ...s,
                    full_name: edited.full_name !== undefined ? edited.full_name : s.full_name,
                    father_name: edited.father_name !== undefined ? edited.father_name : s.father_name
                };
            }
            return s;
        });
    }, [students, customAddedStudents, editedStudentDetails]);

    // Active roster students (excluding excluded ones)
    const activeRosterStudents = useMemo(() => {
        return allEffectiveStudents.filter(s => !excludedStudentIds.includes(s.id));
    }, [allEffectiveStudents, excludedStudentIds]);

    // Group students by class and gender with active sorting & overrides
    const classStudentsMap = useMemo(() => {
        const map: Record<string, { girls: StudentItem[]; boys: StudentItem[] }> = {};
        
        classes.forEach(cls => {
            map[cls] = { girls: [], boys: [] };
        });

        activeRosterStudents.forEach(s => {
            const grade = s.grade || 'General';
            if (!map[grade]) {
                map[grade] = { girls: [], boys: [] };
            }
            if (isFemaleStudent(s, genderOverrides)) {
                map[grade].girls.push(s);
            } else {
                map[grade].boys.push(s);
            }
        });

        // Sort inside each class according to sortOption
        Object.keys(map).forEach(cls => {
            if (sortOption === 'name-asc') {
                map[cls].girls.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
                map[cls].boys.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            } else if (sortOption === 'id-asc') {
                map[cls].girls.sort((a, b) => (a.student_id || '').localeCompare(b.student_id || '', undefined, { numeric: true }));
                map[cls].boys.sort((a, b) => (a.student_id || '').localeCompare(b.student_id || '', undefined, { numeric: true }));
            }
        });

        return map;
    }, [activeRosterStudents, classes, genderOverrides, sortOption]);

    // Build paginated pages with exactly rowsPerPage (20) student/entry rows per page
    const classPagesMap = useMemo(() => {
        const pagesMap: Record<string, ClassPageData[]> = {};

        classes.forEach(cls => {
            const data = classStudentsMap[cls] || { girls: [], boys: [] };
            
            // Primary and Secondary groups according to sectionOrder
            const primaryIsGirls = sectionOrder === 'girls-first';
            const firstRaw = primaryIsGirls ? data.girls : data.boys;
            const secondRaw = primaryIsGirls ? data.boys : data.girls;
            const firstTitle = primaryIsGirls ? 'Girls' : 'Boys';
            const secondTitle = primaryIsGirls ? 'Boys' : 'Girls';
            const firstType: 'girls' | 'boys' = primaryIsGirls ? 'girls' : 'boys';
            const secondType: 'girls' | 'boys' = primaryIsGirls ? 'boys' : 'girls';

            // Assign numbering (Sectional 01..N or Continuous 01..Total)
            let firstList: { student: StudentItem; displayIndex: number }[] = [];
            let secondList: { student: StudentItem; displayIndex: number }[] = [];

            if (numberingMode === 'sectional') {
                firstList = firstRaw.map((s, idx) => ({ student: s, displayIndex: idx + 1 }));
                secondList = secondRaw.map((s, idx) => ({ student: s, displayIndex: idx + 1 }));
            } else {
                firstList = firstRaw.map((s, idx) => ({ student: s, displayIndex: idx + 1 }));
                const offset = firstList.length;
                secondList = secondRaw.map((s, idx) => ({ student: s, displayIndex: offset + idx + 1 }));
            }

            const totalStudents = firstList.length + secondList.length;
            const pages: ClassPageData[] = [];

            // If class fits on 1 page (<= rowsPerPage total students)
            if (totalStudents <= rowsPerPage) {
                const remainingSlots = rowsPerPage - totalStudents;
                const sections: PageSection[] = [];

                if (firstList.length > 0 || secondList.length > 0) {
                    if (firstList.length > 0 && secondList.length > 0) {
                        const blankFirst = Math.ceil(remainingSlots / 2);
                        const blankSecond = Math.floor(remainingSlots / 2);

                        sections.push({
                            type: firstType,
                            title: firstTitle,
                            students: firstList,
                            blankCount: blankFirst
                        });
                        sections.push({
                            type: secondType,
                            title: secondTitle,
                            students: secondList,
                            blankCount: blankSecond
                        });
                    } else if (firstList.length > 0) {
                        sections.push({
                            type: firstType,
                            title: firstTitle,
                            students: firstList,
                            blankCount: remainingSlots
                        });
                    } else {
                        sections.push({
                            type: secondType,
                            title: secondTitle,
                            students: secondList,
                            blankCount: remainingSlots
                        });
                    }
                } else {
                    // Empty class: split blank rows between sections
                    sections.push({
                        type: firstType,
                        title: firstTitle,
                        students: [],
                        blankCount: Math.ceil(rowsPerPage / 2)
                    });
                    sections.push({
                        type: secondType,
                        title: secondTitle,
                        students: [],
                        blankCount: Math.floor(rowsPerPage / 2)
                    });
                }

                pages.push({
                    className: cls,
                    pageNumber: 1,
                    totalPages: 1,
                    sections
                });
            } else {
                // Multi-page class pagination (rowsPerPage slots per page)
                let fIndex = 0;
                let sIndex = 0;

                while (fIndex < firstList.length || sIndex < secondList.length) {
                    let pageRemainingSlots = rowsPerPage;
                    const sections: PageSection[] = [];

                    // Fill first section if available
                    if (fIndex < firstList.length) {
                        const canTakeF = Math.min(pageRemainingSlots, firstList.length - fIndex);
                        const fSlice = firstList.slice(fIndex, fIndex + canTakeF);
                        fIndex += canTakeF;
                        pageRemainingSlots -= canTakeF;

                        sections.push({
                            type: firstType,
                            title: fIndex > canTakeF ? `${firstTitle} (Cont.)` : firstTitle,
                            students: fSlice,
                            blankCount: 0
                        });
                    }

                    // Fill second section if slots remain
                    if (pageRemainingSlots > 0 && sIndex < secondList.length) {
                        const canTakeS = Math.min(pageRemainingSlots, secondList.length - sIndex);
                        const sSlice = secondList.slice(sIndex, sIndex + canTakeS);
                        sIndex += canTakeS;
                        pageRemainingSlots -= canTakeS;

                        sections.push({
                            type: secondType,
                            title: sIndex > canTakeS ? `${secondTitle} (Cont.)` : secondTitle,
                            students: sSlice,
                            blankCount: 0
                        });
                    }

                    // Pad remaining slots with blanks on final page
                    if (pageRemainingSlots > 0) {
                        if (sections.length > 0) {
                            sections[sections.length - 1].blankCount += pageRemainingSlots;
                        }
                    }

                    pages.push({
                        className: cls,
                        pageNumber: pages.length + 1,
                        totalPages: 1,
                        sections
                    });
                }

                // Update totalPages count
                pages.forEach(p => {
                    p.totalPages = pages.length;
                });
            }

            pagesMap[cls] = pages;
        });

        return pagesMap;
    }, [classStudentsMap, classes, rowsPerPage, sectionOrder, numberingMode]);

    if (!isOpen) return null;

    const activeClassesToPrint = selectedClasses.length > 0 ? selectedClasses : classes;

    // Generate HTML for printing with exactly 20 rows per page and NO border around the page
    const handlePrintOrDownloadPDF = () => {
        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('Please allow pop-ups in your browser to view and download the PDF.');
            return;
        }

        // Collect all pages across all selected classes
        const allPagesHtml: string[] = [];

        activeClassesToPrint.forEach(cls => {
            const pages = classPagesMap[cls] || [];
            const formattedClassName = cls.toUpperCase().startsWith('CLASS') 
                ? cls.toUpperCase() 
                : `CLASS ${cls.toUpperCase()}`;

            pages.forEach(p => {
                let tableRowsHtml = '';

                p.sections.forEach(section => {
                    // Section Banner
                    tableRowsHtml += `
                        <tr class="section-row">
                            <td colspan="3">
                                <div class="section-badge">
                                    <span class="sub-line"></span>
                                    <span class="sub-diamond">◆</span>
                                    <span class="script-title">${section.title}</span>
                                    <span class="sub-diamond">◆</span>
                                    <span class="sub-line"></span>
                                </div>
                            </td>
                        </tr>
                    `;

                    // Real Student Rows
                    section.students.forEach(item => {
                        const sNo = String(item.displayIndex).padStart(2, '0') + '.';
                        const sName = item.student.full_name || '';
                        const fName = item.student.father_name || item.student.raw?.guardian_name || item.student.raw?.father_name || '';
                        tableRowsHtml += `
                            <tr>
                                <td class="col-sno">${sNo}</td>
                                <td class="col-name">${sName}</td>
                                <td class="col-father">${fName}</td>
                            </tr>
                        `;
                    });

                    // Blank Ruled Rows
                    for (let i = 0; i < section.blankCount; i++) {
                        tableRowsHtml += `
                            <tr class="blank-row">
                                <td class="col-sno">&nbsp;</td>
                                <td class="col-name">&nbsp;</td>
                                <td class="col-father">&nbsp;</td>
                            </tr>
                        `;
                    }
                });

                const pageHtml = `
                    <div class="a4-page">
                        <!-- Header Title -->
                        <div class="class-header">
                            <div class="flourish-left">
                                <svg viewBox="0 0 60 24" width="54" height="20" fill="#08213d">
                                    <path d="M50,12 C40,4 25,6 18,14 C14,18 8,18 4,14 C2,12 0,14 0,16 C0,19 6,22 12,18 C18,14 26,12 34,16 C40,19 46,18 50,12 Z M22,10 C26,6 36,4 46,8 C40,12 30,12 22,10 Z"/>
                                    <circle cx="56" cy="12" r="2.5"/>
                                    <circle cx="8" cy="14" r="1.5"/>
                                </svg>
                            </div>
                            <h1 class="class-title">${formattedClassName}</h1>
                            <div class="flourish-right">
                                <svg viewBox="0 0 60 24" width="54" height="20" fill="#08213d" style="transform: scaleX(-1);">
                                    <path d="M50,12 C40,4 25,6 18,14 C14,18 8,18 4,14 C2,12 0,14 0,16 C0,19 6,22 12,18 C18,14 26,12 34,16 C40,19 46,18 50,12 Z M22,10 C26,6 36,4 46,8 C40,12 30,12 22,10 Z"/>
                                    <circle cx="56" cy="12" r="2.5"/>
                                    <circle cx="8" cy="14" r="1.5"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Header Diamond Underline -->
                        <div class="header-divider">
                            <span class="div-line"></span>
                            <span class="div-diamond">♦</span>
                            <span class="div-line"></span>
                        </div>

                        <!-- Main Data Table (Exactly 20 student/entry rows per page) -->
                        <table class="roster-table">
                            <thead>
                                <tr>
                                    <th class="col-sno">S. NO.</th>
                                    <th class="col-name">STUDENT'S NAME</th>
                                    <th class="col-father">FATHER'S NAME</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                    </div>
                `;

                allPagesHtml.push(pageHtml);
            });
        });

        const fullDocument = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Class Student Rosters - Wisdom House Education</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Great+Vibes&family=Playfair+Display:ital,wght@1,600;1,700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #f1f5f9;
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        color: #0f172a;
                    }
                    
                    @media print {
                        body {
                            background: transparent;
                        }
                        .a4-page {
                            box-shadow: none !important;
                            margin: 0 !important;
                            page-break-after: always;
                            break-after: page;
                        }
                        .a4-page:last-child {
                            page-break-after: avoid;
                            break-after: avoid;
                        }
                    }

                    /* Clean borderless A4 container with standard print margins */
                    .a4-page {
                        width: 210mm;
                        height: 297mm;
                        max-height: 297mm;
                        padding: 12mm 14mm;
                        margin: 10mm auto;
                        background: #ffffff;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    .class-header {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 16px;
                        margin-top: 2px;
                        margin-bottom: 2px;
                    }

                    .class-title {
                        font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
                        font-size: 25pt;
                        font-weight: 800;
                        color: #08213d;
                        letter-spacing: 2px;
                        margin: 0;
                        text-align: center;
                        text-transform: uppercase;
                    }

                    .header-divider {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        margin-top: 2px;
                        margin-bottom: 12px;
                    }

                    .div-line {
                        height: 1px;
                        background: #08213d;
                        width: 90px;
                    }

                    .div-diamond {
                        font-size: 8pt;
                        color: #08213d;
                        line-height: 1;
                    }

                    /* Table Styling */
                    .roster-table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1.5px solid #08213d;
                        table-layout: fixed;
                    }

                    .roster-table thead tr {
                        background-color: #08213d !important;
                        color: #ffffff !important;
                    }

                    .roster-table th {
                        background-color: #08213d !important;
                        color: #ffffff !important;
                        font-family: 'Inter', sans-serif;
                        font-size: 10.5pt;
                        font-weight: 800;
                        letter-spacing: 0.8px;
                        padding: 7px 8px;
                        border: 1px solid #08213d;
                        text-align: center;
                    }

                    .col-sno {
                        width: 14%;
                        text-align: center !important;
                    }

                    .col-name {
                        width: 43%;
                        text-align: left;
                        padding-left: 14px !important;
                    }

                    .col-father {
                        width: 43%;
                        text-align: left;
                        padding-left: 14px !important;
                    }

                    /* Section Row (Girls / Boys) */
                    .section-row td {
                        padding: 4px 0 !important;
                        background: #ffffff !important;
                        border-top: 1px solid #7a94b5;
                        border-bottom: 1px solid #7a94b5;
                        border-left: 1.5px solid #08213d;
                        border-right: 1.5px solid #08213d;
                        text-align: center;
                    }

                    .section-badge {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        width: 100%;
                    }

                    .sub-line {
                        height: 1px;
                        background: #08213d;
                        width: 80px;
                    }

                    .sub-diamond {
                        font-size: 7pt;
                        color: #08213d;
                    }

                    .script-title {
                        font-family: 'Great Vibes', 'Playfair Display', cursive;
                        font-size: 22pt;
                        font-weight: 400;
                        color: #08213d;
                        line-height: 1;
                        padding: 0 4px;
                    }

                    /* Table Cells - calibrated for exactly 20 rows on A4 */
                    .roster-table tbody tr td {
                        border: 1px solid #7a94b5;
                        padding: 5.5px 10px;
                        font-size: 10pt;
                        font-weight: 500;
                        color: #0f172a;
                        height: 31.5px;
                        box-sizing: border-box;
                    }

                    .roster-table tbody tr.blank-row td {
                        height: 31.5px;
                    }

                    .roster-table tbody tr:not(.section-row):not(.blank-row) td.col-sno {
                        font-weight: 600;
                        color: #08213d;
                        text-align: center;
                    }

                    .roster-table tbody tr:not(.section-row):not(.blank-row) td.col-name {
                        font-weight: 600;
                        color: #0f172a;
                    }

                    .roster-table tbody tr:not(.section-row):not(.blank-row) td.col-father {
                        font-weight: 500;
                        color: #1e293b;
                    }
                </style>
            </head>
            <body>
                ${allPagesHtml.join('')}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWin.document.open();
        printWin.document.write(fullDocument);
        printWin.document.close();
    };

    const currentClassPages = classPagesMap[previewClass] || [];
    const activePreviewPage = currentClassPages[previewPageIndex] || currentClassPages[0] || {
        className: previewClass,
        pageNumber: 1,
        totalPages: 1,
        sections: []
    };

    const formattedPreviewClassName = previewClass.toUpperCase().startsWith('CLASS') 
        ? previewClass.toUpperCase() 
        : `CLASS ${previewClass.toUpperCase()}`;

    // Total page count for export
    const totalPagesToExport = activeClassesToPrint.reduce((acc, c) => acc + (classPagesMap[c]?.length || 1), 0);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1200,
            padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '1200px',
                height: '92vh',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                
                {/* Modal Top Action Bar */}
                <div style={{
                    padding: '16px 24px',
                    background: '#08213d',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-icons" style={{ color: '#60a5fa', fontSize: '22px' }}>picture_as_pdf</span>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.02em' }}>
                                Class Student Roster — Official A4 PDF Generator
                            </h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                Standard A4 layout &bull; Borderless sheet &bull; 20 Student rows per page &bull; Real student registry
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={handlePrintOrDownloadPDF}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: '#2563eb',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>download</span>
                            Download / Print PDF ({totalPagesToExport} {totalPagesToExport === 1 ? 'Page' : 'Pages'})
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                border: 'none',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                borderRadius: '12px',
                                width: '38px',
                                height: '38px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Main Body: Configuration Sidebar (Left) + Interactive Live A4 Preview (Right) */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8fafc' }}>
                    
                    {/* Left Settings Sidebar */}
                    <div style={{
                        width: '320px',
                        borderRight: '1px solid #e2e8f0',
                        background: '#ffffff',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        overflowY: 'auto'
                    }}>
                        {/* Scope Selection */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                Classes to Include in PDF
                            </label>
                            
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                <button
                                    onClick={() => setSelectedClasses([...classes])}
                                    style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: selectedClasses.length === classes.length ? '#08213d' : '#f8fafc',
                                        color: selectedClasses.length === classes.length ? '#fff' : '#475569',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Select All ({classes.length})
                                </button>
                                <button
                                    onClick={() => setSelectedClasses(previewClass ? [previewClass] : [])}
                                    style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#475569',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Current Only
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                maxHeight: '220px',
                                overflowY: 'auto',
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                background: '#f8fafc'
                            }}>
                                {classes.map(c => {
                                    const count = students.filter(s => s.grade === c).length;
                                    const pagesCount = classPagesMap[c]?.length || 1;
                                    const isChecked = selectedClasses.includes(c);
                                    return (
                                        <label
                                            key={c}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                background: isChecked ? '#eff6ff' : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: isChecked ? 700 : 500,
                                                color: isChecked ? '#1e40af' : '#334155'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setSelectedClasses(prev => [...prev, c]);
                                                        } else {
                                                            setSelectedClasses(prev => prev.filter(x => x !== c));
                                                        }
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span>{c}</span>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                                {count} std ({pagesCount} pg)
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Girls & Boys Arrangement Card */}
                        <div style={{
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                                    Gender Arrangement
                                </label>
                                <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    Every Class
                                </span>
                            </div>

                            {/* Section Order */}
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                    Section Order
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <button
                                        onClick={() => setSectionOrder('girls-first')}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: sectionOrder === 'girls-first' ? '#08213d' : '#ffffff',
                                            color: sectionOrder === 'girls-first' ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        👧 Girls First
                                    </button>
                                    <button
                                        onClick={() => setSectionOrder('boys-first')}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: sectionOrder === 'boys-first' ? '#08213d' : '#ffffff',
                                            color: sectionOrder === 'boys-first' ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        👦 Boys First
                                    </button>
                                </div>
                            </div>

                            {/* Numbering Mode */}
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                    Serial Numbering (S.No)
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <button
                                        onClick={() => setNumberingMode('sectional')}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: numberingMode === 'sectional' ? '#08213d' : '#ffffff',
                                            color: numberingMode === 'sectional' ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        01, 02.. per Section
                                    </button>
                                    <button
                                        onClick={() => setNumberingMode('continuous')}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: numberingMode === 'continuous' ? '#08213d' : '#ffffff',
                                            color: numberingMode === 'continuous' ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        01..N Continuous
                                    </button>
                                </div>
                            </div>

                            {/* Sort Mode */}
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                    Sorting within Section
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <button
                                        onClick={() => setSortOption('name-asc')}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: sortOption === 'name-asc' ? '#08213d' : '#ffffff',
                                            color: sortOption === 'name-asc' ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Name (A-Z)
                                    </button>
                                    <button
                                        onClick={() => setSortOption('id-asc')}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: sortOption === 'id-asc' ? '#08213d' : '#ffffff',
                                            color: sortOption === 'id-asc' ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Student ID / Roll
                                    </button>
                                </div>
                            </div>

                            {/* Button to open Student Manager */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                <button
                                    onClick={() => {
                                        setManagerTab('all');
                                        setShowStudentManager(true);
                                    }}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid #93c5fd',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        boxShadow: '0 1px 3px rgba(37,99,235,0.1)'
                                    }}
                                >
                                    <span>👥</span> Manage Students & Gender ({previewClass})
                                </button>
                                <button
                                    onClick={() => {
                                        setManagerTab('add');
                                        setNewStudentForm(prev => ({ ...prev, grade: previewClass }));
                                        setShowStudentManager(true);
                                    }}
                                    style={{
                                        padding: '7px 10px',
                                        borderRadius: '8px',
                                        border: '1px dashed #cbd5e1',
                                        background: '#ffffff',
                                        color: '#0f172a',
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <span>➕</span> Add Student to {previewClass}
                                </button>
                            </div>
                        </div>

                        {/* Page Capacity Configuration */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                                    Rows Per A4 Page
                                </label>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb' }}>
                                    {rowsPerPage} Rows
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                {[18, 20, 22].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setRowsPerPage(num)}
                                        style={{
                                            padding: '7px 4px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: rowsPerPage === num ? '#08213d' : '#ffffff',
                                            color: rowsPerPage === num ? '#ffffff' : '#334155',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {num} rows {num === 20 ? '(Standard)' : ''}
                                    </button>
                                ))}
                            </div>
                            <p style={{ margin: '6px 0 0 0', fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>
                                Each A4 page is populated with exactly {rowsPerPage} rows according to available students and blank ruled ledger lines.
                            </p>
                        </div>

                        {/* Summary Box */}
                        <div style={{
                            padding: '14px',
                            background: '#f1f5f9',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            marginTop: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '2px' }}>
                                Roster Summary
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                                <span>Total A4 Pages:</span>
                                <span style={{ fontWeight: 800, color: '#2563eb' }}>{totalPagesToExport} Page{totalPagesToExport === 1 ? '' : 's'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                                <span>Active Students:</span>
                                <span style={{ fontWeight: 700 }}>
                                    {activeRosterStudents.filter(s => activeClassesToPrint.includes(s.grade)).length} Enrolled
                                </span>
                            </div>
                            {customAddedStudents.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
                                    <span>Custom Added:</span>
                                    <span>+{customAddedStudents.length} Students</span>
                                </div>
                            )}
                            {excludedStudentIds.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                                    <span>Excluded / Removed:</span>
                                    <span>-{excludedStudentIds.length} Students</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Live Interactive A4 Preview */}
                    <div style={{
                        flex: 1,
                        padding: '20px 24px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '14px',
                        background: '#e2e8f0',
                        position: 'relative'
                    }}>
                        {/* Class Preview Selector & Action Bar */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '740px',
                            gap: '10px'
                        }}>
                            {/* Class Tabs Bar */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff',
                                padding: '8px 12px',
                                borderRadius: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', paddingRight: '4px' }}>
                                        Class:
                                    </span>
                                    {classes.map(cls => {
                                        const count = (classStudentsMap[cls]?.girls.length || 0) + (classStudentsMap[cls]?.boys.length || 0);
                                        return (
                                            <button
                                                key={cls}
                                                onClick={() => handleSelectPreviewClass(cls)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: previewClass === cls ? '#08213d' : '#f1f5f9',
                                                    color: previewClass === cls ? '#ffffff' : '#475569',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <span>{cls}</span>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: previewClass === cls ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                                    padding: '1px 5px',
                                                    borderRadius: '10px'
                                                }}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Page switcher if class has > 1 page */}
                                {currentClassPages.length > 1 && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: '#f8fafc',
                                        padding: '4px 8px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                                            Pg {previewPageIndex + 1}/{currentClassPages.length}
                                        </span>
                                        <button
                                            disabled={previewPageIndex === 0}
                                            onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))}
                                            style={{
                                                border: '1px solid #cbd5e1',
                                                background: '#ffffff',
                                                borderRadius: '6px',
                                                cursor: previewPageIndex === 0 ? 'not-allowed' : 'pointer',
                                                opacity: previewPageIndex === 0 ? 0.4 : 1,
                                                padding: '2px 5px',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            ◀
                                        </button>
                                        <button
                                            disabled={previewPageIndex >= currentClassPages.length - 1}
                                            onClick={() => setPreviewPageIndex(p => Math.min(currentClassPages.length - 1, p + 1))}
                                            style={{
                                                border: '1px solid #cbd5e1',
                                                background: '#ffffff',
                                                borderRadius: '6px',
                                                cursor: previewPageIndex >= currentClassPages.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: previewPageIndex >= currentClassPages.length - 1 ? 0.4 : 1,
                                                padding: '2px 5px',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            ▶
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Secondary Quick Action Bar */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: '#f8fafc',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.72rem',
                                        fontWeight: 700
                                    }}>
                                        <span style={{ color: '#ec4899', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            👧 {classStudentsMap[previewClass]?.girls.length || 0} Girls
                                        </span>
                                        <span style={{ color: '#cbd5e1' }}>|</span>
                                        <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            👦 {classStudentsMap[previewClass]?.boys.length || 0} Boys
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setManagerTab('add');
                                            setNewStudentForm(prev => ({ ...prev, grade: previewClass }));
                                            setShowStudentManager(true);
                                        }}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                            color: '#0f172a',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>➕</span> Add Student
                                    </button>

                                    <button
                                        onClick={() => {
                                            setManagerTab('all');
                                            setShowStudentManager(true);
                                        }}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '8px',
                                            border: '1px solid #93c5fd',
                                            background: '#eff6ff',
                                            color: '#1d4ed8',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>👥</span> Manage Students & Gender
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                        onClick={() => setIsTableInteractive(prev => !prev)}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '8px',
                                            border: isTableInteractive ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                            background: isTableInteractive ? '#f0fdf4' : '#ffffff',
                                            color: isTableInteractive ? '#15803d' : '#475569',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        title="Enable quick action buttons directly on the preview table"
                                    >
                                        <span>{isTableInteractive ? '✓ Table Actions Active' : '✏️ Quick Edit Rows'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleResetClass(previewClass)}
                                        style={{
                                            padding: '5px 8px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: '#ffffff',
                                            color: '#64748b',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                        title="Reset this class to original database data"
                                    >
                                        ↻ Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Clean Borderless Scaled A4 Sheet Rendering */}
                        <div style={{
                            width: '740px',
                            background: '#ffffff',
                            boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
                            padding: '36px 40px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '1000px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                            
                            {/* Class Header with Flourishes */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '2px' }}>
                                <svg viewBox="0 0 60 24" width="48" height="18" fill="#08213d">
                                    <path d="M50,12 C40,4 25,6 18,14 C14,18 8,18 4,14 C2,12 0,14 0,16 C0,19 6,22 12,18 C18,14 26,12 34,16 C40,19 46,18 50,12 Z M22,10 C26,6 36,4 46,8 C40,12 30,12 22,10 Z"/>
                                    <circle cx="56" cy="12" r="2.5"/>
                                    <circle cx="8" cy="14" r="1.5"/>
                                </svg>
                                <h1 style={{
                                    margin: 0,
                                    fontFamily: 'serif',
                                    fontSize: '1.85rem',
                                    fontWeight: 900,
                                    color: '#08213d',
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase'
                                }}>
                                    {formattedPreviewClassName}
                                </h1>
                                <svg viewBox="0 0 60 24" width="48" height="18" fill="#08213d" style={{ transform: 'scaleX(-1)' }}>
                                    <path d="M50,12 C40,4 25,6 18,14 C14,18 8,18 4,14 C2,12 0,14 0,16 C0,19 6,22 12,18 C18,14 26,12 34,16 C40,19 46,18 50,12 Z M22,10 C26,6 36,4 46,8 C40,12 30,12 22,10 Z"/>
                                    <circle cx="56" cy="12" r="2.5"/>
                                    <circle cx="8" cy="14" r="1.5"/>
                                </svg>
                            </div>

                            {/* Diamond Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '2px', marginBottom: '14px' }}>
                                <div style={{ height: '1px', background: '#08213d', width: '80px' }} />
                                <span style={{ fontSize: '9px', color: '#08213d' }}>♦</span>
                                <div style={{ height: '1px', background: '#08213d', width: '80px' }} />
                            </div>

                            {/* Roster Table (Exactly 20 student/entry rows per page) */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #08213d', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ background: '#08213d', color: '#ffffff' }}>
                                        <th style={{ padding: '8px', fontSize: '0.8rem', fontWeight: 800, width: '14%', border: '1px solid #08213d', textAlign: 'center' }}>S. NO.</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, width: '43%', border: '1px solid #08213d', textAlign: 'center' }}>STUDENT'S NAME</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, width: '43%', border: '1px solid #08213d', textAlign: 'center' }}>FATHER'S NAME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activePreviewPage.sections.map((sec, sIdx) => (
                                        <div key={`section-frag-${sIdx}`} style={{ display: 'contents' }}>
                                            {/* Section Banner */}
                                            <tr>
                                                <td colSpan={3} style={{ padding: '4px 0', textAlign: 'center', border: '1px solid #7a94b5', borderLeft: '1.5px solid #08213d', borderRight: '1.5px solid #08213d' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                        <div style={{ height: '1px', background: '#08213d', width: '60px' }} />
                                                        <span style={{ fontSize: '8px', color: '#08213d' }}>◆</span>
                                                        <span style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#08213d', padding: '0 4px' }}>{sec.title}</span>
                                                        <span style={{ fontSize: '8px', color: '#08213d' }}>◆</span>
                                                        <div style={{ height: '1px', background: '#08213d', width: '60px' }} />
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Student Rows */}
                                            {sec.students.map((item, idx) => {
                                                const isGirl = sec.type === 'girls';
                                                return (
                                                    <tr key={`std-${item.student.id || idx}`} style={{ position: 'relative' }}>
                                                        <td style={{ padding: '5.5px 8px', fontSize: '0.85rem', fontWeight: 600, color: '#08213d', textAlign: 'center', border: '1px solid #7a94b5', height: '31.5px' }}>
                                                            {String(item.displayIndex).padStart(2, '0')}.
                                                        </td>
                                                        <td style={{ padding: '5.5px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', border: '1px solid #7a94b5', height: '31.5px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span>{item.student.full_name}</span>
                                                                {isTableInteractive && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <button
                                                                            onClick={() => handleToggleGender(item.student.id, isGirl)}
                                                                            style={{
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                border: 'none',
                                                                                background: isGirl ? '#fce7f3' : '#dbeafe',
                                                                                color: isGirl ? '#be185d' : '#1d4ed8',
                                                                                fontSize: '0.65rem',
                                                                                fontWeight: 700,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            title="Switch Gender"
                                                                        >
                                                                            {isGirl ? '👧→👦' : '👦→👧'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcludeStudent(item.student.id)}
                                                                            style={{
                                                                                padding: '2px 5px',
                                                                                borderRadius: '4px',
                                                                                border: 'none',
                                                                                background: '#fee2e2',
                                                                                color: '#b91c1c',
                                                                                fontSize: '0.65rem',
                                                                                fontWeight: 700,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            title="Exclude/Remove student from roster"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '5.5px 12px', fontSize: '0.85rem', fontWeight: 500, color: '#334155', border: '1px solid #7a94b5', height: '31.5px' }}>
                                                            {item.student.father_name || item.student.raw?.guardian_name || item.student.raw?.father_name || ''}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Blank Rows */}
                                            {Array.from({ length: sec.blankCount }).map((_, bIdx) => (
                                                <tr key={`blank-${sIdx}-${bIdx}`}>
                                                    <td style={{ padding: '5.5px 8px', height: '31.5px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                    <td style={{ padding: '5.5px 12px', height: '31.5px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                    <td style={{ padding: '5.5px 12px', height: '31.5px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                </tr>
                                            ))}
                                        </div>
                                    ))}
                                </tbody>
                            </table>

                        </div>

                        {/* Student Manager & Gender Arranger Modal */}
                        {showStudentManager && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(15, 23, 42, 0.65)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 100000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px'
                            }}>
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '20px',
                                    width: '680px',
                                    maxWidth: '95vw',
                                    maxHeight: '90vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Modal Header */}
                                    <div style={{
                                        padding: '16px 22px',
                                        background: '#08213d',
                                        color: '#ffffff',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>👥</span> Manage Roster Students: <span style={{ color: '#60a5fa' }}>{previewClass}</span>
                                            </h3>
                                            <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#93c5fd' }}>
                                                Add or remove students, switch between Girl 👧 and Boy 👦, or edit names for clean printing.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowStudentManager(false)}
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                border: 'none',
                                                color: '#ffffff',
                                                fontSize: '1rem',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Navigation Tabs */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '6px',
                                        padding: '10px 20px',
                                        background: '#f8fafc',
                                        borderBottom: '1px solid #e2e8f0',
                                        overflowX: 'auto'
                                    }}>
                                        {[
                                            { id: 'all', label: `All Active (${(classStudentsMap[previewClass]?.girls.length || 0) + (classStudentsMap[previewClass]?.boys.length || 0)})`, icon: 'view_list' },
                                            { id: 'girls', label: `Girls 👧 (${classStudentsMap[previewClass]?.girls.length || 0})`, icon: 'female' },
                                            { id: 'boys', label: `Boys 👦 (${classStudentsMap[previewClass]?.boys.length || 0})`, icon: 'male' },
                                            { id: 'add', label: '➕ Add New Student', icon: 'person_add' },
                                            { id: 'excluded', label: `Excluded (${excludedStudentIds.filter(id => allEffectiveStudents.find(s => s.id === id)?.grade === previewClass).length})`, icon: 'delete_outline' }
                                        ].map(tab => {
                                            const isActive = managerTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setManagerTab(tab.id as any)}
                                                    style={{
                                                        padding: '7px 12px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: isActive ? '#08213d' : '#e2e8f0',
                                                        color: isActive ? '#ffffff' : '#334155',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Search / Filter Bar (when not in Add tab) */}
                                    {managerTab !== 'add' && (
                                        <div style={{
                                            padding: '10px 20px',
                                            background: '#ffffff',
                                            borderBottom: '1px solid #f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <input
                                                type="text"
                                                placeholder="Search student by name, father's name or ID..."
                                                value={managerSearch}
                                                onChange={e => setManagerSearch(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #cbd5e1',
                                                    fontSize: '0.8rem',
                                                    outline: 'none'
                                                }}
                                            />
                                            {managerSearch && (
                                                <button
                                                    onClick={() => setManagerSearch('')}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        background: '#f8fafc',
                                                        fontSize: '0.7rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab 1: ADD NEW STUDENT FORM */}
                                    {managerTab === 'add' && (
                                        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, background: '#ffffff' }}>
                                            <div style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '14px',
                                                padding: '20px'
                                            }}>
                                                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span>➕</span> Add New Student to {previewClass} Roster
                                                </h4>
                                                
                                                <form onSubmit={handleAddNewStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                                            Student Full Name <span style={{ color: '#dc2626' }}>*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Fatima Zahra / Muhammad Ali"
                                                            value={newStudentForm.full_name}
                                                            onChange={e => setNewStudentForm(prev => ({ ...prev, full_name: e.target.value }))}
                                                            required
                                                            style={{
                                                                width: '100%',
                                                                padding: '9px 12px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #cbd5e1',
                                                                fontSize: '0.85rem',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                                                Father / Guardian Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Muhammad Zahid"
                                                                value={newStudentForm.father_name}
                                                                onChange={e => setNewStudentForm(prev => ({ ...prev, father_name: e.target.value }))}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '9px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #cbd5e1',
                                                                    fontSize: '0.85rem',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                                                Student ID / Roll No (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. STD-1045"
                                                                value={newStudentForm.student_id}
                                                                onChange={e => setNewStudentForm(prev => ({ ...prev, student_id: e.target.value }))}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '9px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #cbd5e1',
                                                                    fontSize: '0.85rem',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                                                Assigned Class / Grade
                                                            </label>
                                                            <select
                                                                value={newStudentForm.grade}
                                                                onChange={e => setNewStudentForm(prev => ({ ...prev, grade: e.target.value }))}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '9px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #cbd5e1',
                                                                    fontSize: '0.85rem',
                                                                    background: '#ffffff',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            >
                                                                {classes.map(c => (
                                                                    <option key={c} value={c}>{c}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                                                Student Gender
                                                            </label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewStudentForm(prev => ({ ...prev, gender: 'girl' }))}
                                                                    style={{
                                                                        padding: '9px 6px',
                                                                        borderRadius: '8px',
                                                                        border: newStudentForm.gender === 'girl' ? '2px solid #db2777' : '1px solid #cbd5e1',
                                                                        background: newStudentForm.gender === 'girl' ? '#fdf2f8' : '#ffffff',
                                                                        color: newStudentForm.gender === 'girl' ? '#be185d' : '#475569',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    👧 Girl
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewStudentForm(prev => ({ ...prev, gender: 'boy' }))}
                                                                    style={{
                                                                        padding: '9px 6px',
                                                                        borderRadius: '8px',
                                                                        border: newStudentForm.gender === 'boy' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                                                        background: newStudentForm.gender === 'boy' ? '#eff6ff' : '#ffffff',
                                                                        color: newStudentForm.gender === 'boy' ? '#1d4ed8' : '#475569',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    👦 Boy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                                        <button
                                                            type="submit"
                                                            style={{
                                                                flex: 1,
                                                                padding: '11px',
                                                                borderRadius: '10px',
                                                                border: 'none',
                                                                background: '#2563eb',
                                                                color: '#ffffff',
                                                                fontWeight: 800,
                                                                fontSize: '0.85rem',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                                            }}
                                                        >
                                                            ✓ Add Student to Roster
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setManagerTab('all')}
                                                            style={{
                                                                padding: '11px 16px',
                                                                borderRadius: '10px',
                                                                border: '1px solid #cbd5e1',
                                                                background: '#ffffff',
                                                                color: '#475569',
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 2: EXCLUDED STUDENTS */}
                                    {managerTab === 'excluded' && (
                                        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {(() => {
                                                const excludedInClass = allEffectiveStudents
                                                    .filter(s => s.grade === previewClass && excludedStudentIds.includes(s.id))
                                                    .filter(s => !managerSearch || (s.full_name || '').toLowerCase().includes(managerSearch.toLowerCase()) || (s.father_name || '').toLowerCase().includes(managerSearch.toLowerCase()));

                                                if (excludedInClass.length === 0) {
                                                    return (
                                                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✓</div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>No Excluded Students</div>
                                                            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>All students in {previewClass} are currently included in the roster.</div>
                                                        </div>
                                                    );
                                                }

                                                return excludedInClass.map(s => {
                                                    const isGirl = isFemaleStudent(s, genderOverrides);
                                                    return (
                                                        <div
                                                            key={s.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '10px 14px',
                                                                borderRadius: '10px',
                                                                background: '#fef2f2',
                                                                border: '1px solid #fecaca'
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', textDecoration: 'line-through' }}>
                                                                    {s.full_name}
                                                                </div>
                                                                <div style={{ fontSize: '0.7rem', color: '#7f1d1d' }}>
                                                                    Father: {s.father_name || s.raw?.guardian_name || s.raw?.father_name || 'N/A'} {s.student_id ? `• ID: ${s.student_id}` : ''}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: isGirl ? '#fce7f3' : '#dbeafe', color: isGirl ? '#be185d' : '#1d4ed8', fontWeight: 700 }}>
                                                                    {isGirl ? '👧 Girl' : '👦 Boy'}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleRestoreStudent(s.id)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: '#16a34a',
                                                                        color: '#ffffff',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.75rem',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    ↩ Restore to Roster
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}

                                    {/* Tab 3: ACTIVE STUDENTS LIST (All / Girls / Boys) */}
                                    {managerTab !== 'add' && managerTab !== 'excluded' && (
                                        <div style={{
                                            padding: '16px 20px',
                                            overflowY: 'auto',
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}>
                                            {(() => {
                                                let classStudents = activeRosterStudents.filter(s => s.grade === previewClass);
                                                
                                                if (managerTab === 'girls') {
                                                    classStudents = classStudents.filter(s => isFemaleStudent(s, genderOverrides));
                                                } else if (managerTab === 'boys') {
                                                    classStudents = classStudents.filter(s => !isFemaleStudent(s, genderOverrides));
                                                }

                                                if (managerSearch) {
                                                    const q = managerSearch.toLowerCase();
                                                    classStudents = classStudents.filter(s => 
                                                        (s.full_name || '').toLowerCase().includes(q) ||
                                                        (s.father_name || '').toLowerCase().includes(q) ||
                                                        (s.student_id || '').toLowerCase().includes(q)
                                                    );
                                                }

                                                if (classStudents.length === 0) {
                                                    return (
                                                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>No students found matching your criteria.</div>
                                                            <button
                                                                onClick={() => {
                                                                    setManagerTab('add');
                                                                    setNewStudentForm(prev => ({ ...prev, grade: previewClass }));
                                                                }}
                                                                style={{
                                                                    marginTop: '10px',
                                                                    padding: '7px 14px',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    background: '#2563eb',
                                                                    color: '#ffffff',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ➕ Add a Student Now
                                                            </button>
                                                        </div>
                                                    );
                                                }

                                                return classStudents.map((s, idx) => {
                                                    const isGirl = isFemaleStudent(s, genderOverrides);
                                                    const isOverridden = Boolean(genderOverrides[s.id]);
                                                    const isCustomAdded = customAddedStudents.some(c => c.id === s.id);
                                                    const isEditing = editingStudentId === s.id;

                                                    return (
                                                        <div
                                                            key={s.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '10px 14px',
                                                                borderRadius: '10px',
                                                                background: isGirl ? '#fdf2f8' : '#eff6ff',
                                                                border: isGirl ? '1px solid #fbcfe8' : '1px solid #bfdbfe',
                                                                gap: '12px'
                                                            }}
                                                        >
                                                            {/* Left: Info or Inline Edit */}
                                                            <div style={{ flex: 1 }}>
                                                                {isEditing ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={editingForm.full_name}
                                                                            onChange={e => setEditingForm(prev => ({ ...prev, full_name: e.target.value }))}
                                                                            placeholder="Student Name"
                                                                            style={{
                                                                                padding: '5px 8px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid #cbd5e1',
                                                                                fontSize: '0.8rem',
                                                                                fontWeight: 700
                                                                            }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={editingForm.father_name}
                                                                            onChange={e => setEditingForm(prev => ({ ...prev, father_name: e.target.value }))}
                                                                            placeholder="Father's Name"
                                                                            style={{
                                                                                padding: '5px 8px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid #cbd5e1',
                                                                                fontSize: '0.75rem'
                                                                            }}
                                                                        />
                                                                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                                                            <button
                                                                                onClick={() => handleSaveEdit(s.id)}
                                                                                style={{
                                                                                    padding: '4px 10px',
                                                                                    borderRadius: '6px',
                                                                                    border: 'none',
                                                                                    background: '#16a34a',
                                                                                    color: '#ffffff',
                                                                                    fontSize: '0.7rem',
                                                                                    fontWeight: 800,
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setEditingStudentId(null)}
                                                                                style={{
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '6px',
                                                                                    border: '1px solid #cbd5e1',
                                                                                    background: '#ffffff',
                                                                                    fontSize: '0.7rem',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
                                                                                #{idx + 1}
                                                                            </span>
                                                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                                                                                {s.full_name}
                                                                            </span>
                                                                            {isCustomAdded && (
                                                                                <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                                                                    + Added
                                                                                </span>
                                                                            )}
                                                                            {isOverridden && (
                                                                                <span style={{ fontSize: '0.62rem', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                                                                    ⚙ Switched
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                                                                            Father: <span style={{ fontWeight: 600 }}>{s.father_name || s.raw?.guardian_name || s.raw?.father_name || '—'}</span>
                                                                            {s.student_id ? ` • ID: ${s.student_id}` : ''}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Right: Actions */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                {/* Gender Toggle Button */}
                                                                <button
                                                                    onClick={() => handleToggleGender(s.id, isGirl)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        borderRadius: '20px',
                                                                        border: 'none',
                                                                        background: isGirl ? '#db2777' : '#2563eb',
                                                                        color: '#ffffff',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.75rem',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        boxShadow: isGirl ? '0 2px 6px rgba(219,39,119,0.3)' : '0 2px 6px rgba(37,99,235,0.3)'
                                                                    }}
                                                                    title={`Click to switch to ${isGirl ? 'Boy' : 'Girl'}`}
                                                                >
                                                                    {isGirl ? '👧 Girl' : '👦 Boy'}
                                                                </button>

                                                                {/* Edit Name Button */}
                                                                {!isEditing && (
                                                                    <button
                                                                        onClick={() => handleStartEdit(s)}
                                                                        style={{
                                                                            padding: '6px 8px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #cbd5e1',
                                                                            background: '#ffffff',
                                                                            color: '#334155',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 700,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Edit student or father name"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                )}

                                                                {/* Exclude / Remove Button */}
                                                                <button
                                                                    onClick={() => handleExcludeStudent(s.id)}
                                                                    style={{
                                                                        padding: '6px 8px',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid #fecaca',
                                                                        background: '#fef2f2',
                                                                        color: '#dc2626',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 800,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Remove / Exclude from Roster"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}

                                    {/* Modal Footer */}
                                    <div style={{
                                        padding: '12px 20px',
                                        background: '#f8fafc',
                                        borderTop: '1px solid #e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <button
                                            onClick={() => handleResetClass(previewClass)}
                                            style={{
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                background: '#ffffff',
                                                color: '#64748b',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ↻ Reset Class Defaults
                                        </button>

                                        <button
                                            onClick={() => setShowStudentManager(false)}
                                            style={{
                                                padding: '8px 22px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: '#08213d',
                                                color: '#ffffff',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(8,33,61,0.25)'
                                            }}
                                        >
                                            Done & Preview Roster
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
