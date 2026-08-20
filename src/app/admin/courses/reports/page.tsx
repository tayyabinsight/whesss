'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import CourseLayout from '../CourseLayout';

export const dynamic = 'force-dynamic';
const supabase = createClient();

export default function CoursePendingList() {
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('course_invoices')
            .select('*')
            .gt('remaining_balance', 0)
            .order('remaining_balance', { ascending: false });
        
        if (data) setPendingInvoices(data);
        setLoading(false);
    };

    return (
        <CourseLayout>
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.027em', marginBottom: 4, color: 'var(--error)' }}>Course Arrears Registry</h1>
                        <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)' }}>Listing students with outstanding course and stationary payments</p>
                    </div>
                </div>

                <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 28, padding: 32, boxShadow: '0 12px 48px -12px rgba(25,28,29,0.06)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                        <div style={{ padding: '12px 24px', borderRadius: 16, background: 'var(--error-container)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="material-icons">warning</span>
                            <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>{pendingInvoices.length} Outstanding Accounts</div>
                        </div>
                        <div style={{ padding: '12px 24px', borderRadius: 16, background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="material-icons">payments</span>
                            <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>Total Arrearage: Rs {pendingInvoices.reduce((s, p) => s + (p.remaining_balance || 0), 0).toLocaleString()}</div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '80px 0', textAlign: 'center' }}><span className="material-icons animate-spin">sync</span></div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-container-low)', textAlign: 'left' }}>
                                    {['Student Identity', 'Invoiced Level', 'Invoice ID', 'Charge', 'residual Balance', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '16px 20px', fontSize: '0.68rem', fontWeight: 900, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pendingInvoices.map((p, i) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-container)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{p.student_name}</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Father: {p.father_name || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700 }}>{p.class_name}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)' }}>{p.invoice_no}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 900, fontFamily: 'Manrope' }}>Rs {p.total_amount?.toLocaleString()}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--error)', fontFamily: 'Manrope' }}>Rs {p.remaining_balance?.toLocaleString()}</div>
                                            <div style={{ height: 4, width: '100%', background: 'var(--surface-container-high)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                                                <div style={{ height: '100%', width: `${((p.paid_amount || 0)/(p.total_amount || 1))*100}%`, background: '#2e7d32', borderRadius: 2 }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <button style={{ padding: '8px 16px', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span className="material-icons" style={{ fontSize: 16 }}>mail</span> Remind
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '64px', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>No outstanding course balances reported.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </CourseLayout>
    );
}
