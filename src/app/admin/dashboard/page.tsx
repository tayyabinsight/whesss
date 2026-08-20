'use client';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

const monthlyData = [
    { month: 'Nov', income: 72, expense: 38 },
    { month: 'Dec', income: 65, expense: 42 },
    { month: 'Jan', income: 88, expense: 35 },
    { month: 'Feb', income: 92, expense: 45 },
    { month: 'Mar', income: 78, expense: 40 },
    { month: 'Apr', income: 85, expense: 32 },
];

export default function AdminDashboard() {
    const [sending, setSending] = useState(false);
    
    const [students, setStudents] = useState<any[]>([]);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            
            // 1. Fetch All Students
            let allStudents: any[] = [];
            let lastStudentId = null;
            let hasMoreStudents = true;
            while (hasMoreStudents && allStudents.length < 10000) {
                let query = supabase.from('students').select('*').order('id').limit(1000);
                if (lastStudentId) query = query.gt('id', lastStudentId);
                const { data } = await query;
                if (data && data.length > 0) {
                    allStudents = [...allStudents, ...data];
                    lastStudentId = data[data.length - 1].id;
                } else {
                    hasMoreStudents = false;
                }
            }
            setStudents(allStudents);

            // 2. Fetch All Vouchers
            let allVouchers: any[] = [];
            let lastVoucherId = null;
            let hasMoreVouchers = true;
            while (hasMoreVouchers && allVouchers.length < 50000) {
                let query = supabase.from('fee_vouchers').select('*').order('id').limit(1000);
                if (lastVoucherId) query = query.gt('id', lastVoucherId);
                const { data } = await query;
                if (data && data.length > 0) {
                    allVouchers = [...allVouchers, ...data];
                    lastVoucherId = data[data.length - 1].id;
                } else {
                    hasMoreVouchers = false;
                }
            }
            setVouchers(allVouchers);

            // 3. Fetch All Payments
            let allPayments: any[] = [];
            let lastPaymentId = null;
            let hasMorePayments = true;
            while (hasMorePayments && allPayments.length < 50000) {
                let query = supabase.from('fee_payments').select('*').order('id').limit(1000);
                if (lastPaymentId) query = query.gt('id', lastPaymentId);
                const { data } = await query;
                if (data && data.length > 0) {
                    allPayments = [...allPayments, ...data];
                    lastPaymentId = data[data.length - 1].id;
                } else {
                    hasMorePayments = false;
                }
            }
            setPayments(allPayments);

            // 4. Fetch All Fees (For accurate Pending Dues calculation)
            let allFees: any[] = [];
            let lastFeeId = null;
            let hasMoreFees = true;
            while (hasMoreFees && allFees.length < 50000) {
                let query = supabase.from('student_fees').select('*').order('id').limit(1000);
                if (lastFeeId) query = query.gt('id', lastFeeId);
                const { data } = await query;
                if (data && data.length > 0) {
                    allFees = [...allFees, ...data];
                    lastFeeId = data[data.length - 1].id;
                } else {
                    hasMoreFees = false;
                }
            }
            setFees(allFees);
            
            setLoading(false);
        };
        
        fetchDashboardData();
    }, []);

    const recentAdmissions = useMemo(() => {
        return students.slice(0, 4).map(s => {
            const avatar = s.full_name ? s.full_name.charAt(0).toUpperCase() : '?';
            const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent';
            return { name: s.full_name, grade: s.grade || s.class, avatar, date };
        });
    }, [students]);

    const feeDefaulters = useMemo(() => {
        const unpaid = vouchers.filter(v => v.status !== 'paid');
        return unpaid.slice(0, 4).map(v => {
            const student = students.find(s => s.id === v.student_id);
            return {
                name: student?.full_name || 'Unknown Student',
                amount: `Rs. ${v.total_amount?.toLocaleString() || 0}`,
                days: v.status === 'overdue' ? 'Overdue' : 'Unpaid',
                severity: v.status === 'overdue' ? 'high' : 'medium'
            };
        });
    }, [vouchers, students]);

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const active = students.filter(s => s.status === 'active');
        const free = active.filter(s => Number(s.base_fee) === 0);
        const left = students.filter(s => s.status === 'left');
        
        const leftThisMonth = left.filter(s => {
            const d = s.leaving_date ? new Date(s.leaving_date) : new Date(s.updated_at || s.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length;

        const leftThisYear = left.filter(s => {
            const d = s.leaving_date ? new Date(s.leaving_date) : new Date(s.updated_at || s.created_at);
            return d.getFullYear() === thisYear;
        }).length;

        const newEnrollThisMonth = students.filter(s => {
            const d = new Date(s.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length;

        const newEnrollThisYear = students.filter(s => {
            const d = new Date(s.created_at);
            return d.getFullYear() === thisYear;
        }).length;

        const netAmount = active
            .filter(s => Number(s.base_fee) > 0)
            .reduce((sum, s) => sum + (Number(s.base_fee) || 0), 0);

        const totalVouchers = vouchers.length;
        const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        
        // Accurate Financial Calculation: All Assigned Fees - All Payments
        const totalAssignedFees = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const totalPending = Math.max(0, totalAssignedFees - totalCollected);
        
        // Overdue still looks at vouchers as they have specific due dates
        let totalOverdue = 0;
        vouchers.forEach(v => {
            const balance = (Number(v.total_amount) || 0) - (Number(v.paid_amount) || 0);
            if (v.status !== 'paid') {
                if (v.due_date && new Date(v.due_date) < now) {
                    totalOverdue += balance;
                }
            }
        });

        // Today's Metrics
        const todayStr = now.toISOString().split('T')[0];
        const todayPayments = payments.filter(p => {
            const pDate = new Date(p.payment_date || p.created_at).toISOString().split('T')[0];
            return pDate === todayStr;
        });

        const todayRecieving = todayPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        const todayCash = todayPayments.filter(p => p.payment_mode === 'Cash').reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        const todayOnline = todayPayments.filter(p => p.payment_mode !== 'Cash').reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        
        // Advance logic fallback: payments where amount > voucher total (if we had that link)
        // or just a dedicated metric if available. Since not explicitly in schema, 
        // we'll set to 0 for now or calculate based on excess.
        const todayAdvance = 0; 

        return {
            totalActive: active.length,
            totalFree: free.length,
            totalLeft: left.length,
            leftThisMonth,
            leftThisYear,
            newEnrollThisMonth,
            newEnrollThisYear,
            netAmount,
            totalVouchers,
            totalCollected,
            totalPending,
            totalOverdue,
            todayRecieving,
            todayCash,
            todayOnline,
            todayAdvance
        };
    }, [students, vouchers, payments, fees]);



    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-container-low)' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />

            <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · Academic Year 2024–25
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button style={{
                            padding: '9px 16px', background: 'var(--surface-container-lowest)',
                            border: 'none', borderRadius: '10px', cursor: 'pointer',
                            fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 500,
                            color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 2px 8px rgba(25,28,29,0.06)',
                            transition: 'box-shadow 0.2s',
                        }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>notifications</span>
                            Alerts
                            <span style={{ background: 'var(--error)', color: '#fff', fontSize: '0.65rem', borderRadius: '9px', padding: '1px 6px', fontWeight: 700 }}>3</span>
                        </button>
                        <button style={{
                            padding: '9px 18px',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontFamily: 'Inter',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'opacity 0.2s',
                        }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                            New Admission
                        </button>
                    </div>
                </div>

                {/* Stats Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <StatCard icon="group" label="Total Students (Active)" value={loading ? "..." : stats.totalActive.toLocaleString()} trend="Active" trendUp accentColor="var(--primary)" />
                    <StatCard icon="volunteer_activism" label="Free Students" value={loading ? "..." : stats.totalFree.toLocaleString()} trend="Full Scholarship" trendUp accentColor="#2e7d32" />
                    <StatCard icon="person_remove" label="Left (This Month / Year)" value={loading ? "..." : `${stats.leftThisMonth} / ${stats.leftThisYear}`} trend="Withdrawn" trendUp={false} accentColor="var(--error)" />
                    <StatCard icon="person_add" label="New Enroll (Month / Year)" value={loading ? "..." : `${stats.newEnrollThisMonth} / ${stats.newEnrollThisYear}`} trend="New" trendUp accentColor="var(--secondary)" />
                </div>

                {/* Stats Row 2 (Financials) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                    <StatCard icon="pending_actions" label="Pending Dues" value={loading ? "..." : `Rs ${stats.totalPending.toLocaleString()}`} trend="To be Paid" trendUp={false} accentColor="#f57f17" />
                    <StatCard icon="warning" label="Overdue Amount" value={loading ? "..." : `Rs ${stats.totalOverdue.toLocaleString()}`} trend="Late" trendUp={false} accentColor="#c62828" />
                    <StatCard icon="receipt" label="Vouchers Issued" value={loading ? "..." : stats.totalVouchers.toLocaleString()} trend="All Time" trendUp accentColor="#1a237e" />
                    <StatCard icon="savings" label="Collected Amount" value={loading ? "..." : `Rs ${stats.totalCollected.toLocaleString()}`} trend="Total" trendUp accentColor="#2e7d32" />
                </div>

                {/* Separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ height: '1.5px', flex: 1, background: 'linear-gradient(90deg, transparent, var(--outline-variant), transparent)' }} />
                    <div style={{ fontFamily: 'Manrope', fontSize: '0.7rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Today's Receiving Summary</div>
                    <div style={{ height: '1.5px', flex: 1, background: 'linear-gradient(90deg, transparent, var(--outline-variant), transparent)' }} />
                </div>

                {/* Stats Row 3 (Today's Recovery) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                    <StatCard icon="payments" label="Net Today's Receiving" value={loading ? "..." : `Rs ${stats.todayRecieving.toLocaleString()}`} accentColor="#004d40" />
                    <StatCard icon="money" label="Cash Payment" value={loading ? "..." : `Rs ${stats.todayCash.toLocaleString()}`} accentColor="#2e7d32" />
                    <StatCard icon="account_balance" label="Online Amount" value={loading ? "..." : `Rs ${stats.todayOnline.toLocaleString()}`} accentColor="#01579b" />
                    <StatCard icon="event_repeat" label="Advance Amount" value={loading ? "..." : `Rs ${stats.todayAdvance.toLocaleString()}`} accentColor="#4a148c" />
                </div>

                {/* Legacy Stats Row (Optional or for other info) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                    <StatCard icon="account_balance_wallet" label="Projected Monthly" value={loading ? "..." : `Rs ${stats.netAmount.toLocaleString()}`} trend="Active Base" trendUp accentColor="#00796b" />
                    <StatCard icon="co_present" label="Total Teachers" value="24" accentColor="#455a64" />
                    <StatCard icon="receipt_long" label="Total Expenses" value="Rs 312,420" accentColor="var(--error)" />
                    <StatCard icon="analytics" label="Net Profit (Est)" value="Rs 1.2M" accentColor="var(--secondary)" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Chart */}
                    <div style={{
                        background: 'var(--surface-container-lowest)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 12px 32px -4px rgba(25,28,29,0.06)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700 }}>Financial Performance</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Income vs Expenses — Last 6 Months</p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary)', display: 'inline-block' }} />
                                    Income
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--secondary-container)', display: 'inline-block' }} />
                                    Expenses
                                </span>
                            </div>
                        </div>
                        {/* Bar chart */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', padding: '0 8px' }}>
                            {monthlyData.map(d => (
                                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '100%', display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                                        <div style={{
                                            width: '40%',
                                            height: `${d.income}%`,
                                            background: 'linear-gradient(to top, var(--primary), #3d4f7c)',
                                            borderRadius: '6px 6px 0 0',
                                            transition: 'height 1s ease',
                                        }} />
                                        <div style={{
                                            width: '40%',
                                            height: `${d.expense}%`,
                                            background: 'linear-gradient(to top, var(--secondary-container), #f0e68c)',
                                            borderRadius: '6px 6px 0 0',
                                            transition: 'height 1s ease',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Announcement */}
                    <div style={{
                        background: 'var(--surface-container-lowest)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 12px 32px -4px rgba(25,28,29,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ fontSize: '18px', color: 'var(--secondary)' }}>campaign</span>
                            Quick Actions
                        </h2>
                        <div style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, rgba(11,25,60,0.05), rgba(34,46,82,0.08))',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '16px',
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '8px' }}>
                                📢 Announcement
                            </div>
                            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--on-surface)' }}>
                                Mid-term examination schedule for Grade 8–12 has been published. Please ensure all faculty members are briefed on the new invigilation guidelines.
                            </p>
                        </div>
                        <button
                            onClick={() => { setSending(true); setTimeout(() => setSending(false), 1500); }}
                            style={{
                                padding: '10px', background: 'var(--primary)', color: '#fff',
                                border: 'none', borderRadius: '10px', cursor: 'pointer',
                                fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.85rem',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {sending ? '✓ Sent!' : 'Send Announcement'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Recent Admissions */}
                    <div style={{
                        background: 'var(--surface-container-lowest)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 12px 32px -4px rgba(25,28,29,0.06)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700 }}>Recent Student Admissions</h2>
                            <button style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                View all →
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentAdmissions.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'center', padding: '20px' }}>No recent admissions</div>
                            ) : recentAdmissions.map((s, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '10px', transition: 'background 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container-low)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, var(--primary-fixed), var(--primary))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)',
                                    }}>
                                        {s.avatar}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{s.grade}</div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{s.date}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fee Defaulters */}
                    <div style={{
                        background: 'var(--surface-container-lowest)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 12px 32px -4px rgba(25,28,29,0.06)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, color: 'var(--error)' }}>
                                <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>warning</span>
                                Fee Defaulters
                            </h2>
                            <button style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                Manage →
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {feeDefaulters.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'center', padding: '20px' }}>No fee defaulters found</div>
                            ) : feeDefaulters.map((f, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px', borderRadius: '10px',
                                    background: f.severity === 'high' ? 'rgba(186,26,26,0.06)' : f.severity === 'medium' ? 'rgba(116,91,0,0.05)' : 'var(--surface-container-low)',
                                }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                        background: f.severity === 'high' ? 'var(--error)' : f.severity === 'medium' ? 'var(--secondary)' : '#2e7d32',
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{f.days}</div>
                                    </div>
                                    <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.9rem', color: 'var(--error)' }}>{f.amount}</div>
                                    <button style={{
                                        padding: '5px 10px', background: 'var(--error)', color: '#fff',
                                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                                    }}>
                                        Remind
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
