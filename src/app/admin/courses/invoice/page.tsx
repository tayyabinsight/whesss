'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import CourseLayout from '../CourseLayout';
import { useSearchParams } from 'next/navigation';

const supabase = createClient();
const CLASSES = ['Mont', 'Nursery', 'Prep I', 'Prep II', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class Matric'];

function InvoiceForm() {
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);

    // Explicit Identity Fields
    const [studentName, setStudentName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [studentType, setStudentType] = useState<'Existing Student' | 'New Admission'>('Existing Student');

    const [searchQuery, setSearchQuery] = useState('');

    // Curriculum Data from Settings
    const [curriculum, setCurriculum] = useState<any>(null);

    // Selection for invoice
    const [invoiceType, setInvoiceType] = useState<'Full Course' | 'Only Copies'>('Full Course');
    const [booksGiven, setBooksGiven] = useState<string[]>([]);
    const [copiesGiven, setCopiesGiven] = useState<any[]>([]); // { name, qty }

    // Financials
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);

    // Invoice Settings
    const [invoiceNo, setInvoiceNo] = useState('');

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchCurriculum();
        }
    }, [selectedClass]);

    const fetchInitialData = async () => {
        setLoading(true);
        const { data: stdData } = await supabase.from('students').select('*');
        if (stdData) setStudents(stdData);

        if (editId) {
            const { data: invData } = await supabase.from('course_invoices').select('*').eq('id', editId).single();
            if (invData) {
                setInvoiceNo(invData.invoice_no);
                setStudentName(invData.student_name);
                setFatherName(invData.father_name);
                setSelectedClass(invData.class_name);
                setStudentType(invData.student_type || 'Existing Student');
                setInvoiceType(invData.invoice_type as any);
                setBooksGiven(invData.books_given || []);
                setCopiesGiven(invData.copies_given || []);
                setDiscount(invData.discount_amount || 0);
                setPaidAmount(invData.paid_amount || 0);
                if (invData.student_id) {
                    const matched = stdData?.find(s => s.id === invData.student_id);
                    if (matched) setSelectedStudent(matched);
                }
            }
        } else {
            const { data: globalData } = await supabase.from('course_global_settings').select('*').single();
            if (globalData) {
                setInvoiceNo(`${globalData.invoice_prefix}${globalData.next_invoice_number}`);
            }
        }
        setLoading(false);
    };

    const fetchCurriculum = async () => {
        const { data } = await supabase.from('course_assignments').select('*').eq('class_name', selectedClass).single();
        if (data) {
            setCurriculum(data);
            if (!editId) {
                // If books is array of objects, extract names. If it's still string array, use as is.
                const bookNames = (data.books || []).map((b: any) => typeof b === 'string' ? b : b.name);
                setBooksGiven(bookNames);
                setCopiesGiven(data.copies || []);
            }
        } else {
            setCurriculum(null);
            if (!editId) {
                setBooksGiven([]);
                setCopiesGiven([]);
            }
        }
    };

    const handleSelectStudent = (s: any) => {
        setSelectedStudent(s);
        setStudentName(s.full_name);
        setFatherName(s.guardian_name || '');
        setStudentType('Existing Student');
        setSearchQuery('');
    };

    const toggleBook = (book: string) => {
        setBooksGiven(prev => prev.includes(book) ? prev.filter(b => b !== book) : [...prev, book]);
    };

    const updateCopyQty = (copyName: string, qty: number) => {
        const newCopies = [...copiesGiven];
        const idx = newCopies.findIndex(c => c.name === copyName);
        if (idx >= 0) {
            if (qty <= 0) newCopies.splice(idx, 1);
            else newCopies[idx].qty = qty;
        } else if (qty > 0) {
            newCopies.push({ name: copyName, qty });
        }
        setCopiesGiven(newCopies);
    };

    const subtotal = curriculum ? (invoiceType === 'Full Course' ? curriculum.full_course_amount : curriculum.full_copies_amount) : 0;
    const totalAmount = Math.max(0, subtotal - discount);
    const remainingBalance = totalAmount - paidAmount;

    const handleGenerate = async () => {
        if (!studentName) return alert('Please enter or select a student');

        setGenerating(true);
        try {
            const invoiceData = {
                invoice_no: invoiceNo,
                student_id: selectedStudent?.id || null,
                student_name: studentName,
                father_name: fatherName,
                class_name: selectedClass,
                student_type: studentType,
                invoice_type: invoiceType,
                books_given: booksGiven,
                copies_given: copiesGiven,
                subtotal_amount: subtotal,
                discount_amount: discount,
                total_amount: totalAmount,
                paid_amount: paidAmount,
                remaining_balance: remainingBalance,
                status: remainingBalance <= 0 ? 'paid' : 'pending'
            };

            if (editId) {
                const { error: invError } = await supabase.from('course_invoices').update(invoiceData).eq('id', editId);
                if (invError) throw invError;
                alert('Invoice Updated Successfully!');
            } else {
                const { error: invError } = await supabase.from('course_invoices').insert([invoiceData]);
                if (invError) throw invError;

                const { data: vSettings } = await supabase.from('course_global_settings').select('id, next_invoice_number').single();
                if (vSettings) {
                    await supabase.from('course_global_settings')
                        .update({ next_invoice_number: vSettings.next_invoice_number + 1 })
                        .eq('id', vSettings.id);
                }
                alert('Invoice Generated Successfully!');
            }
            window.location.href = '/admin/courses';
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setGenerating(false);
    };

    const filteredStudents = searchQuery.length > 1
        ? students.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_id?.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontFamily: 'Manrope', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>{editId ? 'Manage' : 'Generate'} Course Invoice</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{editId ? `Editing existing record for ${invoiceNo}` : 'Create billing for course sets and stationery distribution'}</p>
                </div>
                {editId && (
                    <div style={{ padding: '8px 16px', background: remainingBalance <= 0 ? '#e8f5e9' : '#fff3e0', border: '1px solid currentColor', color: remainingBalance <= 0 ? '#2e7d32' : '#ef6c00', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-icons" style={{ fontSize: 18 }}>account_balance_wallet</span>
                        Current Status: {remainingBalance <= 0 ? 'Fully Paid' : 'Partial / Pending'}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 380px', gap: 32 }}>
                {/* Left Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, marginBottom: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>Select Level / Class</label>
                                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: '100%', padding: '12px 18px', borderRadius: 12, border: '1.5px solid var(--surface-container-high)', fontSize: '0.9rem', background: 'var(--surface-container-lowest)' }}>
                                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                                </select>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>Lookup Existing Student</label>
                                <div style={{ position: 'relative' }}>
                                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Type name or ID to search..." style={{ width: '100%', padding: '12px 18px', borderRadius: 12, border: '1.5px solid var(--surface-container-high)', fontSize: '0.9rem' }} />
                                    <span className="material-icons" style={{ position: 'absolute', right: 12, top: 12, color: 'var(--on-surface-variant)', fontSize: 20 }}>search</span>
                                </div>
                                {filteredStudents.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--surface-container-high)', borderRadius: '0 0 12px 12px', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto' }}>
                                        {filteredStudents.map(s => (
                                            <div key={s.id} onClick={() => handleSelectStudent(s)} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--surface-container-low)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container-low)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{s.full_name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>Father: {s.guardian_name} · Grade: {s.grade}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24, padding: 20, background: 'var(--surface-container-low)', borderRadius: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 6, textTransform: 'uppercase' }}>Student Name</label>
                                <input value={studentName} onChange={e => { setStudentName(e.target.value); if (selectedStudent) setSelectedStudent(null); }} placeholder="Enter Name" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--surface-container-high)', fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 6, textTransform: 'uppercase' }}>Father's Name</label>
                                <input value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder="Enter Father Name" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--surface-container-high)', fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 6, textTransform: 'uppercase' }}>Student Type</label>
                                <select value={studentType} onChange={e => setStudentType(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--surface-container-high)', fontSize: '0.85rem', background: '#fff' }}>
                                    <option value="Existing Student">Existing Student</option>
                                    <option value="New Admission">New Admission</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: 4, borderRadius: 12, gap: 4 }}>
                            <button onClick={() => setInvoiceType('Full Course')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 10, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', background: invoiceType === 'Full Course' ? 'var(--primary)' : 'transparent', color: invoiceType === 'Full Course' ? '#fff' : 'var(--on-surface-variant)' }}>Full Course Package</button>
                            <button onClick={() => setInvoiceType('Only Copies')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 10, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', background: invoiceType === 'Only Copies' ? 'var(--secondary)' : 'transparent', color: invoiceType === 'Only Copies' ? '#fff' : 'var(--on-surface-variant)' }}>Stationery / Copies Only</button>
                        </div>
                    </div>

                    {/* Inventory Tracking */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="material-icons" style={{ color: 'var(--secondary)' }}>inventory_2</span> Inventory Verification & Stock
                            </h3>
                            <button onClick={() => {
                                const bookNames = (curriculum?.books || []).map((b: any) => typeof b === 'string' ? b : b.name);
                                setBooksGiven(bookNames);
                                setCopiesGiven(curriculum?.copies || []);
                            }} style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>Handed Over All Items</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 16 }}>Class Books</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {curriculum?.books?.map((b: any) => {
                                        const bName = typeof b === 'string' ? b : b.name;
                                        const bStock = typeof b === 'string' ? null : b.stock;
                                        const isGiven = booksGiven.includes(bName);
                                        return (
                                            <div key={bName} onClick={() => toggleBook(bName)} style={{
                                                padding: '12px 16px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                                                border: '1.5px solid ' + (isGiven ? 'var(--primary)' : 'var(--surface-container-high)'),
                                                background: isGiven ? 'var(--primary-container)' : 'transparent',
                                                color: isGiven ? '#fff' : 'var(--on-surface)',
                                                position: 'relative'
                                            }}>
                                                <span className="material-icons" style={{ fontSize: 20, color: isGiven ? '#fff' : 'var(--surface-container-highest)' }}>
                                                    {isGiven ? 'check_box' : 'check_box_outline_blank'}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: isGiven ? 800 : 500 }}>{bName}</div>
                                                    {bStock !== null && (
                                                        <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Stock: {bStock}</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) || <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>No books configured</div>}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 16 }}>Stationery & Notebooks</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {curriculum?.copies?.map((c: any) => {
                                        const given = copiesGiven.find(g => g.name === c.name)?.qty || 0;
                                        const isMissing = given < c.qty;
                                        const cStock = c.stock || 0;
                                        return (
                                            <div key={c.name} style={{ background: 'var(--surface-container-low)', padding: '14px', borderRadius: 14, border: isMissing ? '1px dashed var(--error)' : '1px solid transparent' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{c.name}</span>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>Stock: {cStock}</div>
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: 6 }}>Target: {c.qty}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <button onClick={() => updateCopyQty(c.name, given - 1)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--surface-container-highest)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span className="material-icons" style={{ fontSize: 18 }}>remove</span>
                                                    </button>
                                                    <span style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: isMissing ? 'var(--error)' : 'var(--primary)' }}>{given} Issued</span>
                                                    <button onClick={() => updateCopyQty(c.name, given + 1)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--surface-container-highest)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span className="material-icons" style={{ fontSize: 18 }}>add</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }) || <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>No stationery configured</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
                    <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 28, padding: 32, boxShadow: '0 20px 48px -12px rgba(27,47,110,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 28 }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Billed Summary</h3>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 4 }}>Academic Session 2024-25</p>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 900, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 10, height: 'fit-content' }}>{invoiceNo}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.75, fontSize: '0.85rem', fontWeight: 500 }}>
                                <span>Sub-total (Set Price)</span>
                                <span>Rs {subtotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ opacity: 0.75, fontSize: '0.85rem', fontWeight: 500 }}>Apply Discount (Rs)</span>
                                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 10, padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 700 }}>Net Total Due</span>
                                <span style={{ fontSize: '1.7rem', fontWeight: 950, color: 'var(--secondary-container)' }}>Rs {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: 36 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cash Collected (Rs.)</label>
                                {editId && remainingBalance > 0 && (
                                    <button onClick={() => setPaidAmount(totalAmount)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>Pay Full Balance</button>
                                )}
                            </div>
                            <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} style={{ width: '100%', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '20px', color: '#fff', fontSize: '1.7rem', fontWeight: 950, textAlign: 'center' }} />
                            {editId && (
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 8, textAlign: 'center' }}>
                                    Adjusting total paid amount for this invoice.
                                </p>
                            )}
                        </div>

                        {remainingBalance > 0 && (
                            <div style={{ background: 'rgba(255,180,171,0.18)', padding: '20px', borderRadius: 20, border: '1.5px solid rgba(255,180,171,0.35)', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#ffb4ab', textTransform: 'uppercase' }}>{remainingBalance >= 0 ? 'Remaining Balance' : 'Overpaid / Change'}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffb4ab' }}>Carried to profile</div>
                                </div>
                                <span style={{ fontSize: '1.4rem', fontWeight: 950, color: '#ffb4ab' }}>Rs {Math.abs(remainingBalance).toLocaleString()}</span>
                            </div>
                        )}

                        <button onClick={handleGenerate} disabled={generating} style={{ width: '100%', padding: '24px', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', border: 'none', borderRadius: 20, fontSize: '1.15rem', fontWeight: 950, cursor: 'pointer', transition: 'transform 0.2s, background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                            {generating ? <span className="material-icons animate-spin">refresh</span> : <span className="material-icons">save</span>}
                            {generating ? 'Processing Updates...' : (editId ? 'Save & Sync Changes' : 'Finalize & Save Invoice')}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function GenerateCourseInvoice() {
    return (
        <CourseLayout>
            <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Syncing Form...</div>}>
                <InvoiceForm />
            </Suspense>
        </CourseLayout>
    );
}
