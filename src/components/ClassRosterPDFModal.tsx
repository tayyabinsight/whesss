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
    const [genderOverrides, setGenderOverrides] = useState<Record<string, 'girl' | 'boy'>>({});
    const [showStudentArranger, setShowStudentArranger] = useState<boolean>(false);
    const [arrangerSearch, setArrangerSearch] = useState<string>('');

    // Toggle student gender override
    const handleToggleGender = (studentId: string, currentIsFemale: boolean) => {
        setGenderOverrides(prev => ({
            ...prev,
            [studentId]: currentIsFemale ? 'boy' : 'girl'
        }));
    };

    // Reset gender overrides for current class
    const handleResetClassOverrides = (cls: string) => {
        const classStudentIds = students.filter(s => s.grade === cls).map(s => s.id);
        setGenderOverrides(prev => {
            const next = { ...prev };
            classStudentIds.forEach(id => delete next[id]);
            return next;
        });
    };

    // Group students by class and gender with active sorting & overrides
    const classStudentsMap = useMemo(() => {
        const map: Record<string, { girls: StudentItem[]; boys: StudentItem[] }> = {};
        
        classes.forEach(cls => {
            map[cls] = { girls: [], boys: [] };
        });

        students.forEach(s => {
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
    }, [students, classes, genderOverrides, sortOption]);

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

                            {/* Button to open Student Gender Arranger */}
                            <button
                                onClick={() => setShowStudentArranger(true)}
                                style={{
                                    marginTop: '4px',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #93c5fd',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>👥</span> Arrange & Verify Students ({previewClass})
                            </button>
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
                            marginTop: 'auto'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Export Summary
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600, color: '#0f172a' }}>
                                <span>Total A4 Pages:</span>
                                <span style={{ fontWeight: 800, color: '#2563eb' }}>{totalPagesToExport} Page{totalPagesToExport === 1 ? '' : 's'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                                <span>Total Students:</span>
                                <span>
                                    {students.filter(s => activeClassesToPrint.includes(s.grade)).length} Enrolled
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Live Interactive A4 Preview */}
                    <div style={{
                        flex: 1,
                        padding: '24px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        background: '#e2e8f0',
                        position: 'relative'
                    }}>
                        {/* Class Preview Selector & Gender Stats Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '740px',
                            gap: '8px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#ffffff',
                                padding: '6px 12px',
                                borderRadius: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                overflowX: 'auto',
                                flex: 1
                            }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', paddingRight: '6px' }}>
                                    Class:
                                </span>
                                {classes.map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => {
                                            setPreviewClass(cls);
                                            setPreviewPageIndex(0);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: previewClass === cls ? '#08213d' : '#f1f5f9',
                                            color: previewClass === cls ? '#ffffff' : '#475569',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>

                            {/* Class Gender breakdown pill */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#ffffff',
                                padding: '6px 12px',
                                borderRadius: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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

                            {/* Page switcher if class has > 1 page */}
                            {currentClassPages.length > 1 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#ffffff',
                                    padding: '6px 10px',
                                    borderRadius: '14px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                                        Page {previewPageIndex + 1} of {currentClassPages.length}
                                    </span>
                                    <button
                                        disabled={previewPageIndex === 0}
                                        onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))}
                                        style={{
                                            border: '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                            borderRadius: '6px',
                                            cursor: previewPageIndex === 0 ? 'not-allowed' : 'pointer',
                                            opacity: previewPageIndex === 0 ? 0.4 : 1,
                                            padding: '2px 6px'
                                        }}
                                    >
                                        ◀
                                    </button>
                                    <button
                                        disabled={previewPageIndex >= currentClassPages.length - 1}
                                        onClick={() => setPreviewPageIndex(p => Math.min(currentClassPages.length - 1, p + 1))}
                                        style={{
                                            border: '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                            borderRadius: '6px',
                                            cursor: previewPageIndex >= currentClassPages.length - 1 ? 'not-allowed' : 'pointer',
                                            opacity: previewPageIndex >= currentClassPages.length - 1 ? 0.4 : 1,
                                            padding: '2px 6px'
                                        }}
                                    >
                                        ▶
                                    </button>
                                </div>
                            )}
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
                                            {sec.students.map((item, idx) => (
                                                <tr key={`std-${item.student.id || idx}`}>
                                                    <td style={{ padding: '5.5px 8px', fontSize: '0.85rem', fontWeight: 600, color: '#08213d', textAlign: 'center', border: '1px solid #7a94b5', height: '31.5px' }}>
                                                        {String(item.displayIndex).padStart(2, '0')}.
                                                    </td>
                                                    <td style={{ padding: '5.5px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', border: '1px solid #7a94b5', height: '31.5px' }}>
                                                        {item.student.full_name}
                                                    </td>
                                                    <td style={{ padding: '5.5px 12px', fontSize: '0.85rem', fontWeight: 500, color: '#334155', border: '1px solid #7a94b5', height: '31.5px' }}>
                                                        {item.student.father_name || item.student.raw?.guardian_name || item.student.raw?.father_name || ''}
                                                    </td>
                                                </tr>
                                            ))}

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

                        {/* Student Gender Arranger Modal / Drawer */}
                        {showStudentArranger && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 100000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px'
                            }}>
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    width: '600px',
                                    maxWidth: '95vw',
                                    maxHeight: '85vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                                    overflow: 'hidden'
                                }}>
                                    {/* Modal Header */}
                                    <div style={{
                                        padding: '16px 20px',
                                        background: '#08213d',
                                        color: '#ffffff',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                                                Arrange Students: {previewClass}
                                            </h3>
                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#93c5fd' }}>
                                                Click any badge to toggle between Girl (👧) and Boy (👦).
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowStudentArranger(false)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ffffff',
                                                fontSize: '1.25rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Modal Toolbar */}
                                    <div style={{
                                        padding: '12px 20px',
                                        background: '#f8fafc',
                                        borderBottom: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Search student in this class..."
                                            value={arrangerSearch}
                                            onChange={e => setArrangerSearch(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.8rem'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleResetClassOverrides(previewClass)}
                                            style={{
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                background: '#ffffff',
                                                color: '#475569',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Reset to Auto
                                        </button>
                                    </div>

                                    {/* Student List */}
                                    <div style={{
                                        padding: '12px 20px',
                                        overflowY: 'auto',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        {students
                                            .filter(s => s.grade === previewClass)
                                            .filter(s => !arrangerSearch || (s.full_name || '').toLowerCase().includes(arrangerSearch.toLowerCase()) || (s.father_name || '').toLowerCase().includes(arrangerSearch.toLowerCase()))
                                            .map(s => {
                                                const isGirl = isFemaleStudent(s, genderOverrides);
                                                const isOverridden = Boolean(genderOverrides[s.id]);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            background: isGirl ? '#fdf2f8' : '#eff6ff',
                                                            border: isGirl ? '1px solid #fbcfe8' : '1px solid #bfdbfe'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                                                                {s.full_name}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                S/O, D/O: {s.father_name || s.raw?.father_name || 'N/A'} {s.student_id ? `• ID: ${s.student_id}` : ''}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {isOverridden && (
                                                                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, background: '#fef3c7', padding: '2px 5px', borderRadius: '4px' }}>
                                                                    Custom
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => handleToggleGender(s.id, isGirl)}
                                                                style={{
                                                                    padding: '5px 12px',
                                                                    borderRadius: '20px',
                                                                    border: 'none',
                                                                    background: isGirl ? '#db2777' : '#2563eb',
                                                                    color: '#ffffff',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.75rem',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                {isGirl ? '👧 Girl' : '👦 Boy'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {/* Modal Footer */}
                                    <div style={{
                                        padding: '12px 20px',
                                        background: '#f8fafc',
                                        borderTop: '1px solid #e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'flex-end'
                                    }}>
                                        <button
                                            onClick={() => setShowStudentArranger(false)}
                                            style={{
                                                padding: '8px 18px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: '#08213d',
                                                color: '#ffffff',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Done
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
