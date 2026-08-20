'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type Expense = { 
    id: string; 
    date: string; 
    description: string; 
    category: string; 
    vendor: string; 
    amount: number; 
    status: 'paid' | 'pending'; 
    ref?: string;
    created_at?: string;
};

const CATEGORIES = ['All', 'Utility Bills', 'Infrastructure', 'Vendor Payments', 'Maintenance', 'Salaries', 'Supplies', 'Other'];
const ACC = '#e65100'; // Deep burnt orange for a premium financial look

export default function ExpenseManagement() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [showAdd, setShowAdd] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Add Expense Form
    const [form, setForm] = useState({
        description: '',
        amount: '',
        vendor: '',
        category: 'Utility Bills',
        status: 'paid' as 'paid' | 'pending',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        setError(null);
        try {
            // Sorting by date first, then created_at (most recent top)
            const { data, error: dbError } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (dbError) {
                if (dbError.code === 'PGRST205') {
                    setError("DATABASE_MISSING");
                } else {
                    throw dbError;
                }
            } else {
                setExpenses(data || []);
            }
        } catch (err: any) {
            console.error('Fetch Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExpense = async () => {
        if (!form.description || !form.amount) return alert('Description and Amount are required.');
        setIsSaving(true);
        try {
            const { error: saveError } = await supabase.from('expenses').insert([{
                date: form.date,
                description: form.description,
                category: form.category,
                vendor: form.vendor,
                amount: Number(form.amount),
                status: form.status,
                ref: `EXP-${Date.now().toString().slice(-4)}`
            }]);

            if (saveError) throw saveError;
            
            setShowAdd(false);
            setForm({ description: '', amount: '', vendor: '', category: 'Utility Bills', status: 'paid', date: new Date().toISOString().split('T')[0] });
            fetchExpenses();
        } catch (err: any) {
            alert('Error saving expense: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = expenses.filter(e => {
        const mCat = catFilter === 'All' || e.category === catFilter;
        const mSearch = e.description.toLowerCase().includes(search.toLowerCase()) || 
                       e.vendor.toLowerCase().includes(search.toLowerCase()) || 
                       e.id?.toLowerCase().includes(search.toLowerCase());
        return mCat && mSearch;
    });

    const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const pendingAmount = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const monthlyTotal = expenses.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-1px', color: '#1a1c1e', margin: 0 }}>Expense Intelligence</h1>
                        <p style={{ fontSize: '0.95rem', color: '#666', fontWeight: 600, marginTop: 8 }}>Track, analyze, and manage institutional outflow in real-time.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={fetchExpenses} style={{ padding: '14px 24px', background: '#fff', color: '#1a1c1e', border: '1.5px solid #eee', borderRadius: '16px', fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-icons" style={{ fontSize: 20 }}>refresh</span> Refresh
                        </button>
                        <button onClick={() => setShowAdd(true)} style={{ padding: '14px 32px', background: '#1a1c1e', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                            <span className="material-icons">add_box</span> Record Expense
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                    {[
                        { label: 'Total Outflow', val: `Rs ${totalExpense.toLocaleString()}`, icon: 'payments', color: '#1a1c1e', bg: '#fff' },
                        { label: 'Pending Dues', val: `Rs ${pendingAmount.toLocaleString()}`, icon: 'pending', color: '#c62828', bg: '#fff' },
                        { label: 'This Month', val: `Rs ${monthlyTotal.toLocaleString()}`, icon: 'calendar_today', color: '#e65100', bg: '#fff' },
                        { label: 'Active Vendors', val: new Set(expenses.map(e => e.vendor)).size, icon: 'business', color: '#2e7d32', bg: '#fff' }
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, padding: '28px', borderRadius: '32px', border: '1.5px solid #eee', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '14px', background: s.color + '10', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <span className="material-icons">{s.icon}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 850, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#1a1c1e', marginTop: 8 }}>{s.val}</div>
                        </div>
                    ))}
                </div>

                {/* Filter Bar */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span className="material-icons" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses by vendor, description, or reference..." style={{ width: '100%', padding: '16px 16px 16px 52px', background: '#fff', border: '1.5px solid #eee', borderRadius: '20px', outline: 'none', fontWeight: 700, fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', background: '#eee', padding: '6px', borderRadius: '20px', gap: '4px' }}>
                        {CATEGORIES.slice(0, 5).map(c => (
                            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '10px 20px', borderRadius: '16px', border: 'none', background: catFilter === c ? '#1a1c1e' : 'transparent', color: catFilter === c ? '#fff' : '#666', fontWeight: 850, fontSize: '0.8rem', cursor: 'pointer', transition: '0.3s' }}>{c}</button>
                        ))}
                    </div>
                </div>

                {/* Data Table */}
                <div style={{ background: '#fff', borderRadius: '40px', border: '1.5px solid #eee', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                    {error === "DATABASE_MISSING" ? (
                        <div style={{ padding: '100px', textAlign: 'center' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#fff1f0', color: '#cf1322', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <span className="material-icons" style={{ fontSize: 40 }}>database_off</span>
                            </div>
                            <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: 12 }}>Expense Table Not Found</h3>
                            <p style={{ color: '#666', maxWidth: 400, margin: '0 auto 32px', fontWeight: 600 }}>Please create the "expenses" table in your Supabase dashboard to start tracking real data.</p>
                            <button onClick={() => setExpenses([])} style={{ padding: '14px 32px', background: '#1a1c1e', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 900, cursor: 'pointer' }}>Use Mock Data Mode</button>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                                    <th style={{ padding: '24px 32px', fontSize: '0.75rem', fontWeight: 950, color: '#aaa', textTransform: 'uppercase' }}>Expense Detail</th>
                                    <th style={{ padding: '24px 32px', fontSize: '0.75rem', fontWeight: 950, color: '#aaa', textTransform: 'uppercase' }}>Category</th>
                                    <th style={{ padding: '24px 32px', fontSize: '0.75rem', fontWeight: 950, color: '#aaa', textTransform: 'uppercase' }}>Payee / Vendor</th>
                                    <th style={{ padding: '24px 32px', fontSize: '0.75rem', fontWeight: 950, color: '#aaa', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '24px 32px', fontSize: '0.75rem', fontWeight: 950, color: '#aaa', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ padding: 100, textAlign: 'center' }}><span className="material-icons spinning">sync</span></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: 100, textAlign: 'center', color: '#ccc', fontWeight: 800 }}>No institutional expenses recorded yet.</td></tr>
                                ) : filtered.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid #f8f8f8', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1a1c1e' }}>{e.description}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600, marginTop: 4 }}>Date: {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; Ref: {e.ref || '---'}</div>
                                        </td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <span style={{ padding: '6px 12px', borderRadius: '10px', background: '#f5f5f5', fontSize: '0.7rem', fontWeight: 850, color: '#666', textTransform: 'uppercase' }}>{e.category}</span>
                                        </td>
                                        <td style={{ padding: '20px 32px', fontWeight: 800, color: '#1a1c1e' }}>{e.vendor}</td>
                                        <td style={{ padding: '20px 32px', fontWeight: 950, fontSize: '1.1rem', color: '#1a1c1e' }}>Rs {Number(e.amount).toLocaleString()}</td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <span style={{ 
                                                padding: '6px 14px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 950, 
                                                background: e.status === 'paid' ? '#e6fffa' : '#fff1f0', 
                                                color: e.status === 'paid' ? '#047481' : '#cf1322' 
                                            }}>{e.status?.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Add Expense Modal */}
                {showAdd && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', borderRadius: '40px', width: '95%', maxWidth: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '32px 48px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Record New Expense</h2>
                                    <p style={{ margin: '4px 0 0 0', color: '#888', fontWeight: 600 }}>Log institutional outflow or vendor payment.</p>
                                </div>
                                <button onClick={() => setShowAdd(false)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '18px', width: 44, height: 44, cursor: 'pointer' }}><span className="material-icons">close</span></button>
                            </div>

                            <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 950, marginBottom: 8, display: 'block', color: '#aaa' }}>EXPENSE DESCRIPTION</label>
                                    <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. Science Lab Supplies" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #eee', outline: 'none', fontWeight: 700, fontSize: '1rem' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 950, marginBottom: 8, display: 'block', color: '#aaa' }}>AMOUNT (RS)</label>
                                        <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #eee', outline: 'none', fontWeight: 900, fontSize: '1.1rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 950, marginBottom: 8, display: 'block', color: '#aaa' }}>CATEGORY</label>
                                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #eee', outline: 'none', fontWeight: 800 }}>
                                            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 950, marginBottom: 8, display: 'block', color: '#aaa' }}>VENDOR / PAYEE</label>
                                        <input value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} placeholder="e.g. City Electric" style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #eee', outline: 'none', fontWeight: 700 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 950, marginBottom: 8, display: 'block', color: '#aaa' }}>DATE</label>
                                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #eee', outline: 'none', fontWeight: 800 }} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: '32px 48px', background: '#fafafa', borderTop: '1px solid #eee', display: 'flex', gap: 16 }}>
                                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 18, background: '#eee', color: '#666', border: 'none', borderRadius: '20px', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleSaveExpense} disabled={isSaving} style={{ flex: 2, padding: 18, background: '#1a1c1e', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 950, cursor: 'pointer' }}>
                                    {isSaving ? 'Processing...' : 'Save Institutional Expense'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </div>
    );
}
