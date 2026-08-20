'use client';
import { useState, useEffect } from 'react';
import FeeLayout from '../FeeLayout';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type Student = {
    id: string;
    student_id: string;
    full_name: string;
    guardian_name: string;
    grade: string;
    base_fee: number;
};

type FeeCategory = {
    id: string;
    name: string;
    default_amount: number;
    selected: boolean;
    custom_amount: number;
    is_custom?: boolean;
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getClassOrder = (className: string) => {
    const order = [
        'mont', 'nursery', 'prep i', 'prep ii',
        'class 1', 'class 2', 'class 3', 'class 4', 'class 5',
        'class 6', 'class 7', 'class 8', 'class 9', 'class matric', 'class 10'
    ];
    const index = order.indexOf(className.toLowerCase().trim());
    return index === -1 ? 999 : index;
};

export default function AssignFee() {
    const [assignmentMode, setAssignmentMode] = useState<'class' | 'student' | 'all'>('student');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    
    // Form States
    const [selectedClass, setSelectedClass] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [foundStudents, setFoundStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    
    // Multi-month state
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [targetYear, setTargetYear] = useState(new Date().getFullYear());
    const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        
        // 1. Fetch Students with base_fee
        const { data: stdData } = await supabase.from('students').select('id, student_id, full_name, guardian_name, grade, base_fee');
        if (stdData) {
            setStudents(stdData);
            const uniqueClasses = Array.from(new Set(stdData.map(s => s.grade))).filter(Boolean) as string[];
            uniqueClasses.sort((a, b) => getClassOrder(a) - getClassOrder(b));
            setClasses(uniqueClasses);
            if (uniqueClasses.length > 0) setSelectedClass(uniqueClasses[0]);
        }

        // 2. Fetch Fee Categories
        const { data: catData } = await supabase.from('fee_categories').select('*').eq('is_active', true);
        if (catData) {
            setCategories(catData.map(c => ({
                ...c,
                // All categories should be unselected by default. 
                // Tuition is auto-added only when months are selected in the calendar.
                selected: false, 
                custom_amount: c.default_amount
            })));
        }
        
        setLoading(false);
    };

    const handleStudentSearch = (val: string) => {
        setStudentSearch(val);
        if (val.length > 1) {
            const matches = students.filter(s => 
                (s.full_name || '').toLowerCase().includes(val.toLowerCase()) || 
                (s.student_id || '').toLowerCase().includes(val.toLowerCase()) ||
                (s.guardian_name || '').toLowerCase().includes(val.toLowerCase())
            );
            setFoundStudents(matches);
        } else {
            setFoundStudents([]);
        }
    };

    const selectStudent = (s: Student) => {
        setSelectedStudentId(s.id);
        setStudentSearch(s.full_name + ' (' + s.student_id + ')');
        setFoundStudents([]);
        
        // Set Tuition/Monthly fee to student's specific base_fee from management
        setCategories(prev => prev.map(c => {
            if (c.name.toLowerCase().includes('tuition') || c.name.toLowerCase().includes('monthly')) {
                return { ...c, custom_amount: s.base_fee || c.default_amount };
            }
            return c;
        }));
    };

    const toggleMonth = (m: string) => {
        const fullMonth = `${m} ${targetYear}`;
        setSelectedMonths(prev => 
            prev.includes(fullMonth) ? prev.filter(x => x !== fullMonth) : [...prev, fullMonth]
        );
    };

    const addCustomFeeEntry = () => {
        const name = prompt('Enter name for custom fee item:');
        if (!name) return;
        const amount = prompt('Enter amount:', '0');
        
        const newCat: FeeCategory = {
            id: 'temp-' + Date.now(),
            name,
            default_amount: Number(amount),
            custom_amount: Number(amount),
            selected: true,
            is_custom: true
        };
        setCategories([...categories, newCat]);
    };

    const toggleCategory = (id: string) => {
        setCategories(prev => prev.map(c => 
            c.id === id ? { ...c, selected: !c.selected } : c
        ));
    };

    const updateAmount = (id: string, amt: number) => {
        setCategories(prev => prev.map(c => 
            c.id === id ? { ...c, custom_amount: amt } : c
        ));
    };

    const assignFee = async () => {
        // Find if a Tuition category exists in DB
        const tuitionCat = categories.find(c => c.name.toLowerCase().includes('tuition') || c.name.toLowerCase().includes('monthly'));
        
        // Checklist selections
        let selectedCats = categories.filter(c => c.selected);
        
        // If months are selected on the calendar, we automatically include the Tuition fee category
        if (selectedMonths.length > 0) {
            const alreadyHasTuition = selectedCats.some(c => c.name.toLowerCase().includes('tuition') || c.name.toLowerCase().includes('monthly'));
            if (!alreadyHasTuition) {
                if (tuitionCat) {
                    selectedCats = [tuitionCat, ...selectedCats];
                } else {
                    // Fallback for missing category
                    selectedCats = [{
                        id: 'virtual-tuition',
                        name: 'Monthly Tuition Fee',
                        default_amount: 0,
                        is_custom: true,
                        selected: true,
                        custom_amount: 0
                    }, ...selectedCats];
                }
            }
        }

        // Define the months to process
        // If user selected months on calendar, use them.
        // If not, but they selected a category (like Admission), use the CURRENT month as fallback.
        let monthsToProcess = [...selectedMonths];
        if (monthsToProcess.length === 0 && selectedCats.length > 0) {
            const now = new Date();
            const fallbackMonth = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
            monthsToProcess = [fallbackMonth];
        }

        if (selectedCats.length === 0) {
            return alert('Please select at least one fee category or select months for tuition.');
        }

        if (monthsToProcess.length === 0) {
            return alert('No months or categories selected for assignment.');
        }

        if (assignmentMode === 'student' && !selectedStudentId) {
            return alert('Please search and select a student first.');
        }

        setSaving(true);
        try {
            let targets: Student[] = [];

            if (assignmentMode === 'all') {
                targets = students;
                if (targets.length === 0) throw new Error('No students found in the database.');
            } else if (assignmentMode === 'class') {
                targets = students.filter(s => s.grade === selectedClass);
                if (targets.length === 0) throw new Error(`No students found in class ${selectedClass}.`);
            } else {
                const s = students.find(x => x.id === selectedStudentId);
                if (s) targets = [s];
                else throw new Error('Selected student not found in current list.');
            }

            const insertData = [];
            const skippedList = [];

            // DUPLICATE CHECK: Fetch existing fees for these students and months
            const { data: existingFees } = await supabase
                .from('student_fees')
                .select('student_id, fee_category_id, month')
                .in('student_id', targets.map(t => t.id))
                .in('month', monthsToProcess);

            for (const target of targets) {
                for (const monthItem of monthsToProcess) {
                    for (const cat of selectedCats) {
                        let finalAmount = cat.custom_amount;
                        const catId = cat.is_custom ? null : cat.id;
                        
                        // Check if this specific fee already exists
                        const isDuplicate = existingFees?.some(ef => 
                            ef.student_id === target.id && 
                            ef.fee_category_id === catId && 
                            ef.month === monthItem
                        );

                        if (isDuplicate) {
                            skippedList.push(`${target.full_name} (${monthItem})`);
                            continue;
                        }

                        // Intelligent Amount Selection
                        if (cat.name.toLowerCase().includes('tuition') || cat.name.toLowerCase().includes('monthly')) {
                            finalAmount = target.base_fee || cat.default_amount;
                        }

                        insertData.push({
                            student_id: target.id,
                            class_name: target.grade,
                            fee_category_id: catId,
                            amount: finalAmount,
                            month: monthItem,
                            is_assigned: true,
                            issue_date: assignmentDate
                        });
                    }
                }
            }

            if (insertData.length === 0) {
                if (skippedList.length > 0) {
                    return alert('⚠️ All selected fees have already been assigned for these months. No new records created.');
                }
                throw new Error('No records to generate.');
            }

            const { error } = await supabase.from('student_fees').insert(insertData);
            
            if (error) throw error;

            let successMsg = `✅ Success! Generated ${insertData.length} new fee records.`;
            if (skippedList.length > 0) {
                successMsg += `\n\nℹ️ Note: ${skippedList.length} records were skipped because they were already assigned.`;
            }
            alert(successMsg);
            
            // Post-success cleanup
            if (assignmentMode === 'student') {
                setSelectedStudentId('');
                setStudentSearch('');
            }
            setSelectedMonths([]);

        } catch (err: any) {
            alert('Assignment Failed: ' + err.message);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <FeeLayout>
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <span className="material-icons animate-spin" style={{ fontSize: 48, color: 'var(--primary)' }}>sync_problem</span>
                <p style={{ marginTop: '16px', fontWeight: 800 }}>Preparing Advanced Financial Layer...</p>
            </div>
        </FeeLayout>
    );

    return (
        <FeeLayout>
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', maxWidth: '950px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Fee Assignment</h2>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>Bulk or individual fee mapping with automation.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                        <button onClick={() => setAssignmentMode('student')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: assignmentMode === 'student' ? '#fff' : 'transparent', color: assignmentMode === 'student' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.7rem', boxShadow: assignmentMode === 'student' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}>Student-Wise</button>
                        <button onClick={() => setAssignmentMode('class')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: assignmentMode === 'class' ? '#fff' : 'transparent', color: assignmentMode === 'class' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.7rem', boxShadow: assignmentMode === 'class' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}>Class-Wise</button>
                        <button onClick={() => setAssignmentMode('all')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: assignmentMode === 'all' ? '#fff' : 'transparent', color: assignmentMode === 'all' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.7rem', boxShadow: assignmentMode === 'all' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}>All Students</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
                    {/* Left: Target & Fees */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Selector Area */}
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                            {assignmentMode === 'all' ? (
                                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1px solid #dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '20px' }}>groups</span>
                                    Targeting All Students ({students.length})
                                </div>
                            ) : assignmentMode === 'class' ? (
                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Target Class</label>
                                    <select 
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Search Student</label>
                                    <input 
                                        placeholder="Name or ID..." 
                                        value={studentSearch}
                                        onChange={(e) => handleStudentSearch(e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', fontWeight: 700, fontSize: '0.9rem' }} 
                                    />
                                    {foundStudents.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden' }}>
                                            {foundStudents.map(s => (
                                                <div key={s.id} onClick={() => selectStudent(s)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{s.full_name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>S/O: {s.guardian_name || 'N/A'} &bull; {s.grade}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>Rs {s.base_fee}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date & Fees Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
                                    <span className="material-icons" style={{ fontSize: '14px' }}>calendar_today</span> Posting Date
                                </label>
                                <input 
                                    type="date"
                                    value={assignmentDate}
                                    onChange={(e) => setAssignmentDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }} 
                                />
                            </div>
                            <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Auto-Base Fee</div>
                                <div style={{ fontSize: '0.75rem', color: '#0c4a6e', fontWeight: 600 }}>Tuition fees pull student Base Fees.</div>
                            </div>
                        </div>                        {/* Fee Structure */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Fee Structure Breakdown</label>
                            
                            {/* Monthly Recurring */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem' }}>
                                    <span className="material-icons" style={{ fontSize: '16px', color: '#0284c7' }}>event_repeat</span> MONTHLY TUITION
                                </div>
                                
                                {selectedMonths.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>
                                        Select months from calendar.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {selectedMonths.map(month => (
                                            <div key={month} style={{ padding: '6px 10px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-icons" style={{ fontSize: '12px', color: '#10b981' }}>check_circle</span>
                                                {month}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Institutional Fees */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Institutional Charges</label>
                                    <button onClick={addCustomFeeEntry} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                                        <span className="material-icons" style={{ fontSize: '14px' }}>add</span> CUSTOM
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {categories.filter(c => !(c.name.toLowerCase().includes('tuition') || c.name.toLowerCase().includes('monthly'))).map((cat) => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '14px', border: '1px solid', borderColor: cat.selected ? '#0f172a' : '#e2e8f0', background: cat.selected ? '#fff' : '#f8fafc', transition: 'all 0.2s' }}>
                                            <div onClick={() => toggleCategory(cat.id)} style={{ width: 18, height: 18, borderRadius: '5px', border: '2px solid', borderColor: cat.selected ? '#0f172a' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', cursor: 'pointer', background: cat.selected ? '#0f172a' : 'transparent' }}>
                                                {cat.selected && <span className="material-icons" style={{ fontSize: '12px', color: '#fff' }}>check</span>}
                                            </div>
                                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleCategory(cat.id)}>
                                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: cat.selected ? '#0f172a' : '#64748b' }}>{cat.name}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>Rs</span>
                                                <input 
                                                    type="number" 
                                                    value={cat.custom_amount} 
                                                    disabled={!cat.selected}
                                                    onChange={(e) => updateAmount(cat.id, Number(e.target.value))}
                                                    style={{ border: 'none', width: '60px', textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', outline: 'none', background: 'transparent' }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={assignFee}
                            disabled={saving}
                            style={{ padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                            {saving ? <span className="material-icons spinning" style={{ fontSize: '20px' }}>refresh</span> : <span className="material-icons" style={{ fontSize: '20px' }}>task_alt</span>}
                            {saving ? 'Processing...' : 'Finalize Assignment'}
                        </button>
                    </div>

                    {/* Right: Calendar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Months Calendar</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button onClick={() => setTargetYear(prev => prev - 1)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><span className="material-icons" style={{ fontSize: '14px' }}>chevron_left</span></button>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{targetYear}</span>
                                <button onClick={() => setTargetYear(prev => prev + 1)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><span className="material-icons" style={{ fontSize: '14px' }}>chevron_right</span></button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {MONTHS.map(m => {
                                const fullMonth = `${m} ${targetYear}`;
                                const active = selectedMonths.includes(fullMonth);
                                return (
                                    <button 
                                        key={m} 
                                        onClick={() => toggleMonth(m)}
                                        style={{ padding: '10px 4px', borderRadius: '10px', border: '1px solid', borderColor: active ? '#0f172a' : '#e2e8f0', background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? '0 2px 6px rgba(0,0,0,0.1)' : 'none' }}>
                                        {m}
                                    </button>
                                );
                            })}
                        </div>

                        {selectedMonths.length > 0 && (
                            <div style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #ffedd5' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9a3412', marginBottom: '4px', textTransform: 'uppercase' }}>Selection Summary</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c2410c', lineHeight: 1.4 }}>
                                    {selectedMonths.length} months selected for tuition assignment.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spin 1s linear infinite; }
            `}</style>
        </FeeLayout>
    );
}
