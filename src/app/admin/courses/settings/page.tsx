'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import CourseLayout from '../CourseLayout';

export const dynamic = 'force-dynamic';
const supabase = createClient();
const CLASSES = ['Mont', 'Nursery', 'Prep I', 'Prep II', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class Matric'];

export default function CourseSettings() {
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [books, setBooks] = useState<{name: string, stock: number}[]>([{ name: '', stock: 0 }]);
    const [copies, setCopies] = useState<{name: string, qty: number, stock: number}[]>([{ name: '', qty: 1, stock: 0 }]);
    const [fullCourseAmount, setFullCourseAmount] = useState(0);
    const [fullCopiesAmount, setFullCopiesAmount] = useState(0);
    
    // Global Settings
    const [startInvoiceNo, setStartInvoiceNo] = useState(1001);
    const [invoicePrefix, setInvoicePrefix] = useState('CRS-');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [selectedClass]);

    const fetchSettings = async () => {
        setLoading(true);
        // Fetch Global Settings
        const { data: globalData } = await supabase.from('course_global_settings').select('*').single();
        if (globalData) {
            setStartInvoiceNo(globalData.next_invoice_number);
            setInvoicePrefix(globalData.invoice_prefix);
        }

        // Fetch Class Specific Settings
        const { data: classData } = await supabase
            .from('course_assignments')
            .select('*')
            .eq('class_name', selectedClass)
            .single();

        if (classData) {
            // Migration: Ensure items are objects and have stock field
            const formattedBooks = (classData.books || []).map((b: any) => {
                if (typeof b === 'string') return { name: b, stock: 0 };
                return { name: b.name || '', stock: Number(b.stock) || 0 };
            });
            setBooks(formattedBooks.length > 0 ? formattedBooks : [{ name: '', stock: 0 }]);
            
            const formattedCopies = (classData.copies || []).map((c: any) => ({
                name: c.name || '',
                qty: Number(c.qty) || 1,
                stock: Number(c.stock) || 0
            }));
            setCopies(formattedCopies.length > 0 ? formattedCopies : [{ name: '', qty: 1, stock: 0 }]);
            
            setFullCourseAmount(classData.full_course_amount || 0);
            setFullCopiesAmount(classData.full_copies_amount || 0);
        } else {
            // Reset if no data
            setBooks([{ name: '', stock: 0 }]);
            setCopies([{ name: '', qty: 1, stock: 0 }]);
            setFullCourseAmount(0);
            setFullCopiesAmount(0);
        }
        setLoading(false);
    };

    const handleSaveGlobal = async () => {
        setSaving(true);
        try {
            const { data: global } = await supabase.from('course_global_settings').select('id').single();
            if (!global) throw new Error('Settings record not found');

            const { error } = await supabase
                .from('course_global_settings')
                .update({ 
                    next_invoice_number: startInvoiceNo,
                    invoice_prefix: invoicePrefix,
                    updated_at: new Date().toISOString()
                })
                .eq('id', global.id);
            
            if (error) alert('Error saving global settings: ' + error.message);
            else alert('Global settings updated!');
        } catch (err: any) {
            alert('Failed to update: ' + err.message);
        }
        setSaving(false);
    };

    const handleSaveClass = async () => {
        setSaving(true);
        const updateData = {
            class_name: selectedClass,
            books: books.filter(b => b.name.trim() !== ''),
            copies: copies.filter(c => c.name.trim() !== ''),
            full_course_amount: fullCourseAmount,
            full_copies_amount: fullCopiesAmount,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('course_assignments')
            .upsert(updateData, { onConflict: 'class_name' });

        if (error) alert('Error saving class settings: ' + error.message);
        else alert(`Settings for ${selectedClass} updated!`);
        setSaving(false);
    };

    const addBookRow = () => setBooks([...books, { name: '', stock: 0 }]);
    const removeBookRow = (idx: number) => setBooks(books.filter((_, i) => i !== idx));
    const updateBook = (idx: number, field: 'name'|'stock', val: any) => {
        const newBooks = [...books];
        newBooks[idx] = { ...newBooks[idx], [field]: val };
        setBooks(newBooks);
    };

    const addCopyRow = () => setCopies([...copies, { name: '', qty: 1, stock: 0 }]);
    const removeCopyRow = (idx: number) => setCopies(copies.filter((_, i) => i !== idx));
    const updateCopy = (idx: number, field: 'name'|'qty'|'stock', val: any) => {
        const newCopies = [...copies];
        newCopies[idx] = { ...newCopies[idx], [field]: val };
        setCopies(newCopies);
    };

    return (
        <CourseLayout>
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Course Curriculum Settings</h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Set class-wise course lists, copies, and global billing rules</p>
                    </div>
                </div>

                {/* Global Settings Section */}
                <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 24, padding: '24px 32px', marginBottom: 32, boxShadow: '0 8px 32px rgba(11,25,60,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 40 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, marginBottom: 8, textTransform: 'uppercase' }}>Invoice Prefix</label>
                            <input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 16px', color: '#fff', fontWeight: 700, width: 120 }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, marginBottom: 8, textTransform: 'uppercase' }}>Next Invoice Number</label>
                            <input type="number" value={startInvoiceNo} onChange={e => setStartInvoiceNo(parseInt(e.target.value) || 0)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 16px', color: '#fff', fontWeight: 700, width: 140 }} />
                        </div>
                    </div>
                    <button onClick={handleSaveGlobal} style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Update Global Settings</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
                    {/* Class List */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 24, padding: 20, boxShadow: '0 4px 16px rgba(25,28,29,0.04)', alignSelf: 'start' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 16, textTransform: 'uppercase' }}>Select Level</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {CLASSES.map(cls => (
                                <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                                    padding: '12px 16px', borderRadius: 12, border: 'none', textAlign: 'left', cursor: 'pointer',
                                    background: selectedClass === cls ? 'var(--primary)' : 'transparent',
                                    color: selectedClass === cls ? '#fff' : 'var(--on-surface)',
                                    fontWeight: selectedClass === cls ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.2s'
                                }}>
                                    {cls}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 28, padding: 32, boxShadow: '0 8px 32px rgba(25,28,29,0.06)', opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderBottom: '1px solid var(--surface-container)', paddingBottom: 20 }}>
                            <div>
                                <h2 style={{ fontFamily: 'Manrope', fontSize: '1.3rem', fontWeight: 800 }}>{selectedClass} Package Configuration</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Define standard resources and fixed package pricing</p>
                            </div>
                        </div>

                        {/* Pricing Configuration */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40, background: 'var(--surface-container-low)', padding: 24, borderRadius: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 10, textTransform: 'uppercase' }}>Full Books Package Price (Rs)</label>
                                <input type="number" value={fullCourseAmount} onChange={e => setFullCourseAmount(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: '2px solid var(--surface-container-high)', fontSize: '1.1rem', fontWeight: 800, background: '#fff' }} />
                                <p style={{ fontSize: '0.65rem', marginTop: 6, color: 'var(--on-surface-variant)' }}>Set the fixed total price for the full books set</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: 10, textTransform: 'uppercase' }}>Full Copies Package Price (Rs)</label>
                                <input type="number" value={fullCopiesAmount} onChange={e => setFullCopiesAmount(parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: '2px solid var(--surface-container-high)', fontSize: '1.1rem', fontWeight: 800, background: '#fff' }} />
                                <p style={{ fontSize: '0.65rem', marginTop: 6, color: 'var(--on-surface-variant)' }}>Set the fixed total price for the full copies set</p>
                            </div>
                        </div>

                        {/* Resource Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                            {/* Books List */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Course Books & Stock</h3>
                                    <button onClick={addBookRow} style={{ border: 'none', background: 'var(--primary)', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                                        <span className="material-icons" style={{ fontSize: 16 }}>add</span> Add Book
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: 10, padding: '0 10px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>BOOK TITLE</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>AVAILABLE STOCK</span>
                                        <span></span>
                                    </div>
                                    {books.map((book, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: 10 }}>
                                            <input value={book.name ?? ''} onChange={e => updateBook(idx, 'name', e.target.value)} placeholder="Enter Book Title" style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--surface-container-high)', fontSize: '0.88rem' }} />
                                            <input type="number" value={book.stock ?? 0} onChange={e => updateBook(idx, 'stock', parseInt(e.target.value) || 0)} placeholder="Stock Qty" style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--surface-container-high)', fontSize: '0.88rem' }} />
                                            <button onClick={() => removeBookRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                                                <span className="material-icons">delete_outline</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Copies List */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Stationery Copies & Stock</h3>
                                    <button onClick={addCopyRow} style={{ border: 'none', background: 'var(--secondary)', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                                        <span className="material-icons" style={{ fontSize: 16 }}>add</span> Add Copy
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 40px', gap: 10, padding: '0 10px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>COPY TYPE NAME</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>QTY/SET</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>TOTAL STOCK</span>
                                        <span></span>
                                    </div>
                                    {copies.map((copy, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 40px', gap: 10 }}>
                                            <input value={copy.name ?? ''} onChange={e => updateCopy(idx, 'name', e.target.value)} placeholder="Enter Copy Name" style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--surface-container-high)', fontSize: '0.88rem' }} />
                                            <input type="number" value={copy.qty ?? 1} onChange={e => updateCopy(idx, 'qty', parseInt(e.target.value) || 0)} style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid var(--surface-container-high)', textAlign: 'center', fontSize: '0.88rem' }} />
                                            <input type="number" value={copy.stock ?? 0} onChange={e => updateCopy(idx, 'stock', parseInt(e.target.value) || 0)} placeholder="Stock" style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--surface-container-high)', fontSize: '0.88rem' }} />
                                            <button onClick={() => removeCopyRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                                                <span className="material-icons">delete_outline</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--surface-container)' }}>
                            <button onClick={handleSaveClass} disabled={saving} style={{ padding: '16px 48px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 16, fontFamily: 'Manrope', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                {saving ? <span className="material-icons animate-spin">sync</span> : <span className="material-icons">save</span>}
                                {saving ? 'Saving...' : 'Update Class Curriculum'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </CourseLayout>
    );
}
