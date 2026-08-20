'use client';
import { useState, useEffect } from 'react';
import FeeLayout from '../FeeLayout';
import StatCard from '@/components/StatCard';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();


export default function FeeDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ collected: 0, pending: 0, overdue: 0, totalStudents: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Fetch Total Students
            const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
            
            // 2. Fetch All Data (Bypassing Limit for accurate stats)
            let vouchers: any[] = [];
            let lastVoucherId = null;
            let hasMoreVouchers = true;
            while (hasMoreVouchers && vouchers.length < 50000) {
                let query = supabase.from('fee_vouchers').select('total_amount, paid_amount, status, due_date, id').order('id').limit(1000);
                if (lastVoucherId) query = query.gt('id', lastVoucherId);
                const { data } = await query;
                if (data && data.length > 0) {
                    vouchers = [...vouchers, ...data];
                    lastVoucherId = data[data.length - 1].id;
                } else {
                    hasMoreVouchers = false;
                }
            }

            let feesData: any[] = [];
            let lastFeeId = null;
            let hasMoreFees = true;
            while (hasMoreFees && feesData.length < 50000) {
                let query = supabase.from('student_fees').select('amount, id').order('id').limit(1000);
                if (lastFeeId) query = query.gt('id', lastFeeId);
                const { data } = await query;
                if (data && data.length > 0) {
                    feesData = [...feesData, ...data];
                    lastFeeId = data[data.length - 1].id;
                } else {
                    hasMoreFees = false;
                }
            }

            let paymentsData: any[] = [];
            let lastPaymentId = null;
            let hasMorePayments = true;
            while (hasMorePayments && paymentsData.length < 50000) {
                let query = supabase.from('fee_payments').select('amount_paid, id').order('id').limit(1000);
                if (lastPaymentId) query = query.gt('id', lastPaymentId);
                const { data } = await query;
                if (data && data.length > 0) {
                    paymentsData = [...paymentsData, ...data];
                    lastPaymentId = data[data.length - 1].id;
                } else {
                    hasMorePayments = false;
                }
            }
            
            const totalAssigned = feesData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
            const totalCollected = paymentsData.reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0);
            const totalPending = Math.max(0, totalAssigned - totalCollected);
            
            let totalOverdue = 0;
            const now = new Date();

            vouchers.forEach(v => {
                const paid = Number(v.paid_amount || 0);
                const total = Number(v.total_amount || 0);
                const balance = total - paid;
                if (v.status !== 'paid') {
                    if (v.due_date && new Date(v.due_date) < now) {
                        totalOverdue += balance;
                    }
                }
            });

            setStats({
                collected: totalCollected,
                pending: totalPending,
                overdue: totalOverdue,
                totalStudents: studentCount || 0
            });

            // 3. Fetch Recent Payments
            const { data: payments } = await supabase
                .from('fee_payments')
                .select(`
                    id, 
                    amount_paid, 
                    payment_date, 
                    payment_mode,
                    students (full_name, grade)
                `)
                .order('payment_date', { ascending: false })
                .limit(5);

            if (payments) {
                setTransactions(payments.map(p => {
                    const student = Array.isArray(p.students) ? p.students[0] : p.students;
                    return {
                        id: p.id,
                        date: p.payment_date,
                        student: student?.full_name || 'Unknown',
                        class: student?.grade || '---',
                        mode: p.payment_mode,
                        amount: p.amount_paid
                    };
                }));
            }

            // 4. Fetch Analytics (Last 6 Months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const { data: analyticsData } = await supabase
                .from('fee_payments')
                .select('amount_paid, payment_date')
                .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0]);

            const monthlyAggregation: { [key: string]: number } = {};
            
            // Initialize last 6 months with 0
            for(let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const label = d.toLocaleString('default', { month: 'short' });
                monthlyAggregation[label] = 0;
            }

            if (analyticsData) {
                analyticsData.forEach(p => {
                    const label = new Date(p.payment_date).toLocaleString('default', { month: 'short' });
                    if (monthlyAggregation[label] !== undefined) {
                        monthlyAggregation[label] += Number(p.amount_paid);
                    }
                });
            }

            setMonthlyData(Object.entries(monthlyAggregation).map(([month, total]) => ({
                month,
                total
            })));

        } catch (err) {
            console.error('Dashboard Stats Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FeeLayout>
            <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '10px', color: '#166534' }}><span className="material-icons" style={{ fontSize: '20px' }}>account_balance_wallet</span></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Collected</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `Rs ${stats.collected.toLocaleString()}`}</div>
                        <div style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 700, marginTop: '4px' }}>↑ 15% vs last month</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', background: '#fff7ed', borderRadius: '10px', color: '#9a3412' }}><span className="material-icons" style={{ fontSize: '20px' }}>pending_actions</span></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pending</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `Rs ${stats.pending.toLocaleString()}`}</div>
                        <div style={{ fontSize: '0.65rem', color: '#9a3412', fontWeight: 700, marginTop: '4px' }}>5% decrease</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '10px', color: '#991b1b' }}><span className="material-icons" style={{ fontSize: '20px' }}>warning</span></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Overdue</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : `Rs ${stats.overdue.toLocaleString()}`}</div>
                        <div style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: 700, marginTop: '4px' }}>Attention required</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '10px', color: '#0f172a' }}><span className="material-icons" style={{ fontSize: '20px' }}>groups</span></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Students</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.totalStudents.toString()}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>Active enrollment</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                    {/* Charts */}
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>Collection Analytics</h2>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px' }}>
                            {monthlyData.map((d, i) => {
                                const max = Math.max(...monthlyData.map(x => x.total), 1);
                                const height = (d.total / max) * 100;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                                        <div style={{ width: '100%', display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                                            <div title={`Total: Rs ${d.total}`} style={{ width: '60%', height: `${height}%`, background: 'linear-gradient(to top, #0f172a, #334155)', borderRadius: '4px 4px 0 0', position: 'relative' }} />
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>{d.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#0f172a' }}/> Total Collected</span>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Recent Activity</h2>
                            <button style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' }}>View All</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.8rem' }}>Syncing data...</div> : transactions.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>receipt</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{t.student}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{t.class} &bull; {t.mode}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>Rs {t.amount}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(t.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </FeeLayout>
    );
}
