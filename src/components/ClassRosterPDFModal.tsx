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
    'anabia', 'ayzal', 'hiba', 'khadija', 'mahas', 'eshal', 'fatima', 'fatimah', 'ayesha', 'ayesha', 
    'zainab', 'maryam', 'marium', 'minahil', 'noor', 'sara', 'sarah', 'dua', 'zoya', 'hoorain', 
    'bareera', 'inaya', 'manha', 'alveena', 'hafsa', 'aiman', 'amina', 'laiba', 'bushra', 'arfa', 
    'eman', 'haniya', 'kinza', 'mehak', 'alishba', 'sadia', 'samina', 'hira', 'sidra', 'rida', 
    'mahnoor', 'aymen', 'bisma', 'zara', 'hadia', 'hoor', 'iman', 'iqra', 'jannat', 'kashaf', 
    'marwa', 'rumaisa', 'saadia', 'sumayya', 'tuba', 'urooj', 'wajeeha', 'yumna', 'zoha', 'syeda', 
    'bano', 'kiran', 'anam', 'nida', 'sania', 'fizza', 'shanza', 'maria', 'meerab', 'malaika',
    'shiza', 'aleena', 'alina', 'amna', 'areesha', 'armeen', 'ayra', 'danio', 'eimaan', 'falak',
    'hareem', 'insha', 'ifra', 'jawairia', 'liba', 'muntaha', 'natasha', 'parveen', 'rabia', 'rabiya',
    'saba', 'sahar', 'sehar', 'sobia', 'tania', 'uzma', 'warda', 'yusra', 'zarish', 'momina'
]);

export const isFemaleStudent = (student: StudentItem): boolean => {
    const rawGender = (student.gender || student.raw?.gender || '').toLowerCase().trim();
    if (rawGender === 'female' || rawGender === 'girl' || rawGender === 'f' || rawGender === 'daughter') return true;
    if (rawGender === 'male' || rawGender === 'boy' || rawGender === 'm' || rawGender === 'son') return false;

    const name = (student.full_name || '').toLowerCase().trim();
    const words = name.split(/[\s.]+/);
    return words.some(w => FEMALE_NAMES.has(w));
};

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
    const [blankRowsCount, setBlankRowsCount] = useState<number>(4);

    // Group students by class and gender
    const classDataMap = useMemo(() => {
        const map: Record<string, { girls: StudentItem[]; boys: StudentItem[] }> = {};
        
        classes.forEach(cls => {
            map[cls] = { girls: [], boys: [] };
        });

        students.forEach(s => {
            const grade = s.grade || 'General';
            if (!map[grade]) {
                map[grade] = { girls: [], boys: [] };
            }
            if (isFemaleStudent(s)) {
                map[grade].girls.push(s);
            } else {
                map[grade].boys.push(s);
            }
        });

        // Sort alphabetically inside each class
        Object.keys(map).forEach(cls => {
            map[cls].girls.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            map[cls].boys.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        });

        return map;
    }, [students, classes]);

    if (!isOpen) return null;

    const activeClassesToPrint = selectedClasses.length > 0 ? selectedClasses : classes;

    // Generate HTML for printing
    const handlePrintOrDownloadPDF = () => {
        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert('Please allow pop-ups in your browser to view and download the PDF.');
            return;
        }

        const pagesHtml = activeClassesToPrint.map(cls => {
            const data = classDataMap[cls] || { girls: [], boys: [] };
            const formattedClassName = cls.toUpperCase().startsWith('CLASS') 
                ? cls.toUpperCase() 
                : `CLASS ${cls.toUpperCase()}`;

            // Build Girls Rows
            const girlsRowsHtml = data.girls.map((g, idx) => {
                const sNo = String(idx + 1).padStart(2, '0') + '.';
                const sName = g.full_name || '';
                const fName = g.father_name || g.raw?.guardian_name || g.raw?.father_name || '';
                return `
                    <tr>
                        <td class="col-sno">${sNo}</td>
                        <td class="col-name">${sName}</td>
                        <td class="col-father">${fName}</td>
                    </tr>
                `;
            }).join('');

            // Build Blank Girls Rows
            const blankGirlsRowsHtml = Array.from({ length: blankRowsCount }).map(() => `
                <tr class="blank-row">
                    <td class="col-sno">&nbsp;</td>
                    <td class="col-name">&nbsp;</td>
                    <td class="col-father">&nbsp;</td>
                </tr>
            `).join('');

            // Build Boys Rows
            const boysRowsHtml = data.boys.map((b, idx) => {
                const sNo = String(idx + 1).padStart(2, '0') + '.';
                const sName = b.full_name || '';
                const fName = b.father_name || b.raw?.guardian_name || b.raw?.father_name || '';
                return `
                    <tr>
                        <td class="col-sno">${sNo}</td>
                        <td class="col-name">${sName}</td>
                        <td class="col-father">${fName}</td>
                    </tr>
                `;
            }).join('');

            // Build Blank Boys Rows
            const blankBoysRowsHtml = Array.from({ length: blankRowsCount }).map(() => `
                <tr class="blank-row">
                    <td class="col-sno">&nbsp;</td>
                    <td class="col-name">&nbsp;</td>
                    <td class="col-father">&nbsp;</td>
                </tr>
            `).join('');

            return `
                <div class="a4-page">
                    <div class="outer-border">
                        <div class="inner-border">
                            
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

                            <!-- Main Data Table -->
                            <table class="roster-table">
                                <thead>
                                    <tr>
                                        <th class="col-sno">S. NO.</th>
                                        <th class="col-name">STUDENT'S NAME</th>
                                        <th class="col-father">FATHER'S NAME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Girls Section Heading -->
                                    <tr class="section-row">
                                        <td colspan="3">
                                            <div class="section-badge">
                                                <span class="sub-line"></span>
                                                <span class="sub-diamond">◆</span>
                                                <span class="script-title">Girls</span>
                                                <span class="sub-diamond">◆</span>
                                                <span class="sub-line"></span>
                                            </div>
                                        </td>
                                    </tr>
                                    ${girlsRowsHtml}
                                    ${blankGirlsRowsHtml}

                                    <!-- Boys Section Heading -->
                                    <tr class="section-row">
                                        <td colspan="3">
                                            <div class="section-badge">
                                                <span class="sub-line"></span>
                                                <span class="sub-diamond">◆</span>
                                                <span class="script-title">Boys</span>
                                                <span class="sub-diamond">◆</span>
                                                <span class="sub-line"></span>
                                            </div>
                                        </td>
                                    </tr>
                                    ${boysRowsHtml}
                                    ${blankBoysRowsHtml}
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>
            `;
        }).join('');

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

                    .a4-page {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 8mm;
                        margin: 10mm auto;
                        background: #ffffff;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        position: relative;
                        display: flex;
                        flex-direction: column;
                    }

                    .outer-border {
                        border: 2px solid #08213d;
                        padding: 4mm;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }

                    .inner-border {
                        border: 1px solid #08213d;
                        padding: 5mm 6mm;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    }

                    .class-header {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 16px;
                        margin-top: 4px;
                        margin-bottom: 2px;
                    }

                    .class-title {
                        font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
                        font-size: 26pt;
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
                        margin-bottom: 14px;
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
                        padding: 9px 8px;
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
                        padding: 6px 0 !important;
                        background: #ffffff !important;
                        border-top: 1px solid #7a94b5;
                        border-bottom: 1px solid #7a94b5;
                        border-left: 1px solid #08213d;
                        border-right: 1px solid #08213d;
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
                        font-size: 24pt;
                        font-weight: 400;
                        color: #08213d;
                        line-height: 1;
                        padding: 0 4px;
                    }

                    /* Table Cells */
                    .roster-table tbody tr td {
                        border: 1px solid #7a94b5;
                        padding: 7px 10px;
                        font-size: 10.5pt;
                        font-weight: 500;
                        color: #0f172a;
                    }

                    .roster-table tbody tr.blank-row td {
                        height: 31px;
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
                ${pagesHtml}
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

    const currentPreviewData = classDataMap[previewClass] || { girls: [], boys: [] };
    const formattedPreviewClassName = previewClass.toUpperCase().startsWith('CLASS') 
        ? previewClass.toUpperCase() 
        : `CLASS ${previewClass.toUpperCase()}`;

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
                                Standard A4 layout &bull; Real student registry &bull; Distinct Girls & Boys sections with empty ruled rows
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
                            Download / Print PDF ({activeClassesToPrint.length} {activeClassesToPrint.length === 1 ? 'Class' : 'Classes'})
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
                                                {count} std
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Blank Ruled Rows Slider */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                                    Blank Ruled Rows
                                </label>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb' }}>
                                    {blankRowsCount} lines
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={10}
                                value={blankRowsCount}
                                onChange={e => setBlankRowsCount(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>
                                Extra blank lines appended after student records to fill the page cleanly.
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
                                <span>Pages (A4):</span>
                                <span>{activeClassesToPrint.length} Page{activeClassesToPrint.length === 1 ? '' : 's'}</span>
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
                        background: '#e2e8f0'
                    }}>
                        {/* Class Preview Selector Tabs */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            maxWidth: '100%',
                            overflowX: 'auto'
                        }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', paddingRight: '6px' }}>
                                Previewing Class:
                            </span>
                            {classes.map(cls => (
                                <button
                                    key={cls}
                                    onClick={() => setPreviewClass(cls)}
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

                        {/* Accurate Scaled A4 Sheet Rendering */}
                        <div style={{
                            width: '740px',
                            background: '#ffffff',
                            boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
                            padding: '24px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '1000px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                            {/* Outer Navy Border */}
                            <div style={{
                                border: '2.5px solid #08213d',
                                padding: '12px',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Inner Fine Navy Border */}
                                <div style={{
                                    border: '1px solid #08213d',
                                    padding: '16px 18px',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    
                                    {/* Class Header with Flourishes */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '4px' }}>
                                        <svg viewBox="0 0 60 24" width="48" height="18" fill="#08213d">
                                            <path d="M50,12 C40,4 25,6 18,14 C14,18 8,18 4,14 C2,12 0,14 0,16 C0,19 6,22 12,18 C18,14 26,12 34,16 C40,19 46,18 50,12 Z M22,10 C26,6 36,4 46,8 C40,12 30,12 22,10 Z"/>
                                            <circle cx="56" cy="12" r="2.5"/>
                                            <circle cx="8" cy="14" r="1.5"/>
                                        </svg>
                                        <h1 style={{
                                            margin: 0,
                                            fontFamily: 'serif',
                                            fontSize: '1.75rem',
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

                                    {/* Roster Table */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #08213d' }}>
                                        <thead>
                                            <tr style={{ background: '#08213d', color: '#ffffff' }}>
                                                <th style={{ padding: '8px', fontSize: '0.8rem', fontWeight: 800, width: '14%', border: '1px solid #08213d', textAlign: 'center' }}>S. NO.</th>
                                                <th style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, width: '43%', border: '1px solid #08213d', textAlign: 'center' }}>STUDENT'S NAME</th>
                                                <th style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, width: '43%', border: '1px solid #08213d', textAlign: 'center' }}>FATHER'S NAME</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Girls Section */}
                                            <tr>
                                                <td colSpan={3} style={{ padding: '4px 0', textAlign: 'center', border: '1px solid #7a94b5', borderLeft: '1.5px solid #08213d', borderRight: '1.5px solid #08213d' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                        <div style={{ height: '1px', background: '#08213d', width: '60px' }} />
                                                        <span style={{ fontSize: '8px', color: '#08213d' }}>◆</span>
                                                        <span style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#08213d', padding: '0 4px' }}>Girls</span>
                                                        <span style={{ fontSize: '8px', color: '#08213d' }}>◆</span>
                                                        <div style={{ height: '1px', background: '#08213d', width: '60px' }} />
                                                    </div>
                                                </td>
                                            </tr>
                                            {currentPreviewData.girls.map((g, idx) => (
                                                <tr key={g.id || idx}>
                                                    <td style={{ padding: '6px 8px', fontSize: '0.85rem', fontWeight: 600, color: '#08213d', textAlign: 'center', border: '1px solid #7a94b5' }}>
                                                        {String(idx + 1).padStart(2, '0')}.
                                                    </td>
                                                    <td style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', border: '1px solid #7a94b5' }}>
                                                        {g.full_name}
                                                    </td>
                                                    <td style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 500, color: '#334155', border: '1px solid #7a94b5' }}>
                                                        {g.father_name || g.raw?.guardian_name || g.raw?.father_name || ''}
                                                    </td>
                                                </tr>
                                            ))}
                                            {Array.from({ length: blankRowsCount }).map((_, bIdx) => (
                                                <tr key={`bg-${bIdx}`}>
                                                    <td style={{ padding: '6px 8px', height: '24px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                    <td style={{ padding: '6px 12px', height: '24px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                    <td style={{ padding: '6px 12px', height: '24px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                </tr>
                                            ))}

                                            {/* Boys Section */}
                                            <tr>
                                                <td colSpan={3} style={{ padding: '4px 0', textAlign: 'center', border: '1px solid #7a94b5', borderLeft: '1.5px solid #08213d', borderRight: '1.5px solid #08213d' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                        <div style={{ height: '1px', background: '#08213d', width: '60px' }} />
                                                        <span style={{ fontSize: '8px', color: '#08213d' }}>◆</span>
                                                        <span style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#08213d', padding: '0 4px' }}>Boys</span>
                                                        <span style={{ fontSize: '8px', color: '#08213d' }}>◆</span>
                                                        <div style={{ height: '1px', background: '#08213d', width: '60px' }} />
                                                    </div>
                                                </td>
                                            </tr>
                                            {currentPreviewData.boys.map((b, idx) => (
                                                <tr key={b.id || idx}>
                                                    <td style={{ padding: '6px 8px', fontSize: '0.85rem', fontWeight: 600, color: '#08213d', textAlign: 'center', border: '1px solid #7a94b5' }}>
                                                        {String(idx + 1).padStart(2, '0')}.
                                                    </td>
                                                    <td style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', border: '1px solid #7a94b5' }}>
                                                        {b.full_name}
                                                    </td>
                                                    <td style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 500, color: '#334155', border: '1px solid #7a94b5' }}>
                                                        {b.father_name || b.raw?.guardian_name || b.raw?.father_name || ''}
                                                    </td>
                                                </tr>
                                            ))}
                                            {Array.from({ length: blankRowsCount }).map((_, bIdx) => (
                                                <tr key={`bb-${bIdx}`}>
                                                    <td style={{ padding: '6px 8px', height: '24px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                    <td style={{ padding: '6px 12px', height: '24px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                    <td style={{ padding: '6px 12px', height: '24px', border: '1px solid #7a94b5' }}>&nbsp;</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
