'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import CourseLayout from './CourseLayout';
import StatCard from '@/components/StatCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
const supabase = createClient();

function EditInvoiceModal({ invoice, assignments, onClose, onSave }: any) {
    if (!invoice) return null;
    
    const [studentName, setStudentName] = useState(invoice.student_name);
    const [fatherName, setFatherName] = useState(invoice.father_name);
    const [className, setClassName] = useState(invoice.class_name);
    const [booksGiven, setBooksGiven] = useState<string[]>(invoice.books_given || []);
    const [copiesGiven, setCopiesGiven] = useState<any[]>(invoice.copies_given || []);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentTime, setPaymentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    const [saving, setSaving] = useState(false);

    const availableClasses = Array.from(new Set(assignments.map((a: any) => a.class_name)));

    const assign = assignments.find((a: any) => a.class_name === className);
    const expectedBooks = assign ? (assign.books || []).map((b: any) => typeof b === 'string' ? b : b.name) : [];
    const expectedCopies = assign ? (assign.copies || []) : [];

    const handleHandOverAll = () => {
        setBooksGiven(expectedBooks);
        setCopiesGiven(expectedCopies.map((c: any) => ({ name: c.name, qty: c.qty })));
    };

    const toggleBook = (b: string) => {
        setBooksGiven(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
    };

    const updateCopyQty = (name: string, qty: number) => {
        const newCopies = [...copiesGiven];
        const idx = newCopies.findIndex(c => c.name === name);
        if (idx >= 0) {
            if (qty <= 0) newCopies.splice(idx, 1);
            else newCopies[idx].qty = qty;
        } else if (qty > 0) {
            newCopies.push({ name, qty });
        }
        setCopiesGiven(newCopies);
    };

    const handleSave = async () => {
        setSaving(true);
        const totalPaid = Number(invoice.paid_amount) + Number(paymentAmount);
        const newRemaining = Math.max(0, Number(invoice.total_amount) - totalPaid);
        
        const updateData = {
            student_name: studentName,
            father_name: fatherName,
            class_name: className,
            books_given: booksGiven,
            copies_given: copiesGiven,
            paid_amount: totalPaid,
            remaining_balance: newRemaining,
            status: newRemaining <= 0 ? 'paid' : 'pending'
        };

        try {
            const { error } = await supabase.from('course_invoices').update(updateData).eq('id', invoice.id);
            if (error) throw error;
            onSave();
        } catch (err: any) {
            alert(err.message);
        }
        setSaving(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 12, 16, 0.45)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 32, width: '100%', maxWidth: 740, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px -12px rgba(0,0,0,0.2)', animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f2f2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Registry Command Center</div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Management Studio: {invoice.invoice_no}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <span className="material-icons" style={{ fontSize: 20 }}>close</span>
                    </button>
                </div>

                <div style={{ padding: 32 }}>
                    {/* Student Identity Card */}
                    <div style={{ background: 'var(--surface-container-low)', borderRadius: 24, padding: 24, marginBottom: 32, border: '1px solid var(--surface-container-high)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <span className="material-icons" style={{ color: 'var(--primary)' }}>person_outline</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.02em' }}>Identity Management</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 900, color: '#6e6e73', marginBottom: 8, display: 'block' }}>RECIPIENT FULL NAME</label>
                                <input value={studentName} onChange={e => setStudentName(e.target.value)} style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1.5px solid #e5e5e5', fontSize: '0.95rem', fontWeight: 600 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 900, color: '#6e6e73', marginBottom: 8, display: 'block' }}>GUARDIAN / FATHER NAME</label>
                                <input value={fatherName} onChange={e => setFatherName(e.target.value)} style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1.5px solid #e5e5e5', fontSize: '0.95rem', fontWeight: 600 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 900, color: '#6e6e73', marginBottom: 8, display: 'block' }}>ASSIGNED CLASS LEVEL</label>
                                <select value={className} onChange={e => setClassName(e.target.value)} style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1.5px solid #e5e5e5', fontSize: '0.95rem', fontWeight: 600, appearance: 'none', background: '#fff' }}>
                                    {availableClasses.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 32 }}>
                        {/* Provisioning Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className="material-icons" style={{ color: '#ef6c00' }}>inventory_2</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>Resource Provisioning</span>
                                </div>
                                <button onClick={handleHandOverAll} style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fff', background: '#ef6c00', border: 'none', padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }}>Assign All Items</button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#6e6e73', marginBottom: 12, borderBottom: '1.5px solid #f0f0f0', paddingBottom: 8 }}>CLASS BOOKS</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {expectedBooks.map((b: string) => {
                                            const active = booksGiven.includes(b);
                                            return (
                                                <div key={b} onClick={() => toggleBook(b)} style={{ 
                                                    padding: '10px 14px', borderRadius: 12, border: '1.4px solid ' + (active ? '#2e7d32' : '#eee'), 
                                                    background: active ? '#f1f8f3' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.1s' 
                                                }}>
                                                    <span className="material-icons" style={{ fontSize: 18, color: active ? '#2e7d32' : '#d1d1d6' }}>
                                                        {active ? 'check_circle' : 'circle'}
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? '#1b5e20' : '#1d1d1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#6e6e73', marginBottom: 12, borderBottom: '1.5px solid #f0f0f0', paddingBottom: 8 }}>STATIONERY SETS</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {expectedCopies.map((c: { name: string; qty: number }) => {
                                            const currentVal = copiesGiven.find(g => g.name === c.name)?.qty || 0;
                                            const complete = currentVal >= c.qty;
                                            return (
                                                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8f9fb', borderRadius: 14, border: '1px solid ' + (complete ? '#e8ecef' : '#ffebee') }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.name} <span style={{ opacity: 0.5, fontWeight: 500 }}>(Goal: {c.qty})</span></span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <button onClick={() => updateCopyQty(c.name, currentVal - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>-</button>
                                                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 950, color: complete ? '#2e7d32' : '#c62828' }}>{currentVal}</span>
                                                        <button onClick={() => updateCopyQty(c.name, currentVal + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financials Sticky Sidebar within modal */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ padding: 24, background: '#1c1c1e', borderRadius: 24, color: '#fff' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Ledger Adjustment</div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>COLLECT AMOUNT (RS)</label>
                                        <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '12px', color: '#fff', fontSize: '1.2rem', fontWeight: 900 }} />
                                        <button onClick={() => setPaymentAmount(invoice.remaining_balance)} style={{ marginTop: 8, width: '100%', padding: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Clear Residual (Rs {invoice.remaining_balance})</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>PAYMENT DATE</label>
                                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '8px', color: '#fff', fontSize: '0.75rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>TIME</label>
                                            <input type="time" value={paymentTime} onChange={e => setPaymentTime(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '8px', color: '#fff', fontSize: '0.75rem' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 24, border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.8rem' }}>
                                    <span style={{ color: '#666', fontWeight: 600 }}>Invoice Total</span>
                                    <span style={{ fontWeight: 800 }}>Rs {invoice.total_amount?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.8rem' }}>
                                    <span style={{ color: '#666', fontWeight: 600 }}>Previously Paid</span>
                                    <span style={{ fontWeight: 800, color: '#2e7d32' }}>Rs {invoice.paid_amount?.toLocaleString()}</span>
                                </div>
                                <div style={{ height: '1px', background: '#e5e5e5', margin: '12px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>Grand Residual</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 950, color: '#c62828' }}>Rs {Math.max(0, invoice.remaining_balance - paymentAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid #f2f2f2', display: 'flex', gap: 16, background: '#fff', position: 'sticky', bottom: 0 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '18px', borderRadius: 20, border: '1.5px solid #eee', background: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}>Dismiss</button>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '18px', borderRadius: 20, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 950, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        {saving ? <span className="material-icons animate-spin">refresh</span> : <span className="material-icons">save_alt</span>}
                        {saving ? 'Syncing with Server...' : 'Finalize & Record Updates'}
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes modalEntry { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}

export default function CourseOverview() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [editInvoice, setEditInvoice] = useState<any>(null);
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalInvoices: 0,
        amountCollected: 0,
        pendingBalance: 0,
        pendingDeliveries: 0
    });
    const [loading, setLoading] = useState(true);
    
    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('All');
    const [provisionFilter, setProvisionFilter] = useState('All'); // 'All', 'Pending'

    useEffect(() => {
        fetchData();
    }, []);

    const getPendingItems = (inv: any, assignList: any[]) => {
        const assign = assignList.find(a => a.class_name === inv.class_name);
        if (!assign) return [];
        
        const pending: string[] = [];
        
        // Check Books (Only if invoice_type is Full Course)
        if (inv.invoice_type === 'Full Course') {
            const expectedBooks = (assign.books || []).map((b: any) => typeof b === 'string' ? b : b.name);
            const booksGiven = inv.books_given || [];
            expectedBooks.forEach((b: string) => {
                if (!booksGiven.includes(b)) pending.push(b);
            });
        }
        
        // Check Copies
        const expectedCopies = assign.copies || [];
        const copiesGiven = inv.copies_given || [];
        expectedCopies.forEach((ec: any) => {
            const given = copiesGiven.find((gc: any) => gc.name === ec.name)?.qty || 0;
            if (given < ec.qty) {
                pending.push(`${ec.qty - given}x ${ec.name}`);
            }
        });
        
        return pending;
    };

    const fetchData = async () => {
        setLoading(true);
        // Fetch Assignments first for stat calculation
        const { data: assignData } = await supabase.from('course_assignments').select('*');
        const assignmentsRef = assignData || [];
        setAssignments(assignmentsRef);

        // Fetch Invoices
        const { data: invData } = await supabase.from('course_invoices').select('*').order('created_at', { ascending: false });
        if (invData) {
            setInvoices(invData);
            
            let pendingDeliveryCount = 0;
            invData.forEach(inv => {
                if (getPendingItems(inv, assignmentsRef).length > 0) {
                    pendingDeliveryCount++;
                }
            });

            setStats({
                totalCourses: (await supabase.from('course_assignments').select('id', { count: 'exact' })).count || 0,
                totalInvoices: invData.length,
                amountCollected: invData.reduce((s, i) => s + (i.paid_amount || 0), 0),
                pendingBalance: invData.reduce((s, i) => s + (i.remaining_balance || 0), 0),
                pendingDeliveries: pendingDeliveryCount
            });
        }
        setLoading(false);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const studentSearch = (inv.student_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const invoiceSearch = (inv.invoice_no || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSearch = studentSearch || invoiceSearch;

            const matchesClass = classFilter === 'All' || inv.class_name === classFilter;
            
            const pendingItems = getPendingItems(inv, assignments);
            const matchesProvision = provisionFilter === 'All' || 
                                    (provisionFilter === 'Pending' && pendingItems.length > 0);
            
            return matchesSearch && matchesClass && matchesProvision;
        });
    }, [invoices, searchQuery, classFilter, provisionFilter, assignments]);

    const availableClasses = useMemo(() => {
        const classes = assignments.map(a => a.class_name);
        return ['All', ...Array.from(new Set(classes))];
    }, [assignments]);

    const deleteInvoice = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        const { error } = await supabase.from('course_invoices').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchData();
    };

    return (
        <CourseLayout>
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.027em', marginBottom: 4 }}>Course Administration Dashboard</h1>
                        <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)' }}>Real-time inventory and billing metrics from SQL Database</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Link href="/admin/courses/settings">
                            <button style={{ padding: '12px 24px', background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: 'none', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <span className="material-icons">settings</span> Settings
                            </button>
                        </Link>
                        <Link href="/admin/courses/invoice">
                            <button style={{ padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <span className="material-icons">add_card</span> Create New Invoice
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Real-time Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                    <StatCard icon="receipt_long" label="Total Invoices" value={String(stats.totalInvoices)} accentColor="var(--primary)" />
                    <StatCard icon="inventory_2" label="Pending Courses" value={String(stats.pendingDeliveries)} accentColor="#ef6c00" trend="Delivery Required" />
                    <StatCard icon="account_balance_wallet" label="Total Arrears" value={`Rs ${stats.pendingBalance.toLocaleString()}`} accentColor="var(--error)" />
                    <StatCard icon="payments" label="Amount Collected" value={`Rs ${stats.amountCollected.toLocaleString()}`} accentColor="#2e7d32" trend="Live Sync" trendUp />
                </div>

                {/* Invoices List */}
                <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 28, padding: 32, boxShadow: '0 12px 48px -12px rgba(25,28,29,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1.2rem', fontWeight: 800 }}>Invoice Registry</h2>
                        <div style={{ padding: '8px 16px', background: 'var(--surface-container-low)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                            Showing {filteredInvoices.length} of {invoices.length} transactions
                        </div>
                    </div>

                    {/* Filter Suite */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative' }}>
                            <span className="material-icons" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: 20 }}>search</span>
                            <input 
                                placeholder="Search Student or Invoice #" 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 16, border: '1.5px solid var(--surface-container-high)', background: 'var(--surface-container-low)', fontSize: '0.9rem', fontWeight: 600, outline: 'none' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-container-low)', padding: '0 14px', borderRadius: 16, border: '1.5px solid var(--surface-container-high)' }}>
                            <span className="material-icons" style={{ fontSize: 20, color: 'var(--primary)' }}>school</span>
                            <select 
                                value={classFilter}
                                onChange={e => setClassFilter(e.target.value)}
                                style={{ flex: 1, padding: '14px 0', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                            >
                                {availableClasses.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-container-low)', padding: '0 14px', borderRadius: 16, border: '1.5px solid var(--surface-container-high)' }}>
                            <span className="material-icons" style={{ fontSize: 20, color: '#ef6c00' }}>inventory_2</span>
                            <select 
                                value={provisionFilter}
                                onChange={e => setProvisionFilter(e.target.value)}
                                style={{ flex: 1, padding: '14px 0', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                            >
                                <option value="All">All Invoices</option>
                                <option value="Pending">Pending Provision Only</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                            <span className="material-icons animate-spin" style={{ fontSize: 32 }}>sync</span>
                            <div style={{ marginTop: 12, fontWeight: 600 }}>Syncing with Database...</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-container-low)', textAlign: 'left' }}>
                                        {['Invoice', 'Recipient', 'Package', 'Net Amount', 'Paid', 'Residual', 'Status', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '16px 20px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((inv) => {
                                        const pendingItems = getPendingItems(inv, assignments);
                                        return (
                                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--surface-container)', transition: 'background 0.2s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container-lowest)')}>
                                                <td style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{inv.invoice_no}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{inv.student_name}</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Level: {inv.class_name}</div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800, background: inv.invoice_type === 'Full Course' ? 'var(--primary-fixed)' : 'var(--secondary-container)', color: inv.invoice_type === 'Full Course' ? 'var(--primary)' : 'var(--on-secondary-container)' }}>
                                                        {inv.invoice_type}
                                                    </span>
                                                    {pendingItems.length > 0 && (
                                                        <div style={{ fontSize: '0.7rem', color: '#c62828', marginTop: 8, fontWeight: 800, background: '#ffebee', padding: '4px 8px', borderRadius: 6, display: 'inline-block', lineHeight: 1.4 }}>
                                                            Missing: {pendingItems.join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'Manrope' }}>Rs {inv.total_amount?.toLocaleString()}</td>
                                                <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 800, color: '#2e7d32', fontFamily: 'Manrope' }}>Rs {inv.paid_amount?.toLocaleString()}</td>
                                                <td style={{ padding: '16px 20px', fontSize: '0.95rem', fontWeight: 900, color: inv.remaining_balance > 0 ? 'var(--error)' : '#2e7d32', fontFamily: 'Manrope' }}>Rs {inv.remaining_balance?.toLocaleString()}</td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, background: inv.status === 'paid' ? '#e8f5e9' : '#fff3e0', color: inv.status === 'paid' ? '#2e7d32' : '#ef6c00', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                                            {inv.status?.toUpperCase()}
                                                        </span>
                                                        {pendingItems.length > 0 && (
                                                            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, background: '#fce4ec', color: '#c2185b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                <span className="material-icons" style={{ fontSize: 12 }}>inventory_2</span>
                                                                PENDING COURSE
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button title="Preview" style={{ border: 'none', background: 'var(--surface-container)', color: 'var(--on-surface)', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span className="material-icons" style={{ fontSize: 18 }}>visibility</span>
                                                    </button>
                                                    <button onClick={() => setEditInvoice(inv)} title="Quick Edit" style={{ border: 'none', background: 'var(--surface-container)', color: 'var(--primary)', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span className="material-icons" style={{ fontSize: 18 }}>edit</span>
                                                    </button>
                                                    <button onClick={() => deleteInvoice(inv.id)} title="Void Invoice" style={{ border: 'none', background: 'var(--surface-container)', color: 'var(--error)', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span className="material-icons" style={{ fontSize: 18 }}>delete_sweep</span>
                                                    </button>
                                                </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                No matches found for your search criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Layer */}
            {editInvoice && (
                <EditInvoiceModal 
                    invoice={editInvoice} 
                    assignments={assignments} 
                    onClose={() => setEditInvoice(null)} 
                    onSave={() => {
                        setEditInvoice(null);
                        fetchData();
                    }} 
                />
            )}

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </CourseLayout>
    );
}
