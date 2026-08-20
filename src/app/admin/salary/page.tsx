'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type SalaryRecord = { 
    id: string; 
    employee_id: string; 
    name: string; 
    role: string; 
    base_salary: number; 
    bonus: number; 
    deductions: number; 
    net_pay: number; 
    status: 'paid' | 'pending' | 'processing'; 
    month: string;
    year: string;
    paid_date?: string;
    late_count?: number;
    absent_count?: number;
    weekend_absent_count?: number;
    custom_deduction?: number;
};

type Employee = {
    id: string;
    employee_id: string;
    name: string;
    role: string;
    base_salary: number;
    type: 'Teacher' | 'Staff';
};

const DEFAULT_RULES = {
    workingDays: 26,
    latePenalty: 200,
    absentPenalty: 500,
    sandwichPenalty: 1000, // Extra deduction if absent before/after weekend
    enableSandwich: true
};

export default function AdvancedPayrollSystem() {
    const [activeTab, setActiveTab] = useState<'directory' | 'payroll'>('directory');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
    
    // Global State
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState('2026');
    const [isExecuting, setIsExecuting] = useState(false);

    // Rules
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [showRulesModal, setShowRulesModal] = useState(false);

    // Add Staff Modal
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({ name: '', role: '', salary: 0, id: '' });

    // Payment/Edit Modal
    const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);

    useEffect(() => {
        const savedRules = localStorage.getItem('payroll_rules');
        if (savedRules) {
            try { setRules(JSON.parse(savedRules)); } catch(e) {}
        }
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Teachers
            const { data: tData } = await supabase.from('teachers').select('*');
            const teachers: Employee[] = (tData || []).map(t => ({
                id: t.id, employee_id: t.teacher_id || `TCH-${t.id.substring(0,4)}`,
                name: t.full_name, role: t.contract || 'Teacher', 
                base_salary: t.base_salary || 0, type: 'Teacher'
            }));

            // 2. Fetch Staff
            const { data: sData } = await supabase.from('staff_members').select('*');
            const staff: Employee[] = (sData || []).map(s => ({
                id: s.id, employee_id: s.employee_id,
                name: s.full_name, role: s.role, 
                base_salary: s.base_salary || 0, type: 'Staff'
            }));

            setEmployees([...teachers, ...staff]);

            // 3. Fetch Salaries for month/year
            const { data: salData } = await supabase.from('salaries')
                .select('*')
                .eq('month', selectedMonth)
                .eq('year', selectedYear);
            
            setSalaries(salData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveRules = () => {
        localStorage.setItem('payroll_rules', JSON.stringify(rules));
        setShowRulesModal(false);
        // Optionally recalculate all pending salaries based on new rules
        alert("Rules Updated! New rules will apply when you modify a salary record.");
    };

    const executePayrollCycle = async () => {
        setIsExecuting(true);
        try {
            let added = 0;
            for (const emp of employees) {
                const existing = salaries.find(s => s.employee_id === emp.employee_id);
                if (!existing) {
                    await supabase.from('salaries').insert([{
                        employee_id: emp.employee_id,
                        name: emp.name,
                        role: emp.role,
                        base_salary: emp.base_salary,
                        bonus: 0,
                        deductions: 0,
                        net_pay: emp.base_salary,
                        status: 'pending',
                        month: selectedMonth,
                        year: selectedYear,
                        late_count: 0,
                        absent_count: 0,
                        weekend_absent_count: 0,
                        custom_deduction: 0
                    }]);
                    added++;
                }
            }
            await fetchData();
            alert(`Payroll cycle executed! ${added} new records generated for ${selectedMonth} ${selectedYear}.`);
            setActiveTab('payroll');
        } catch (err: any) {
            alert('Execution Error: ' + err.message);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleAddStaff = async () => {
        if (!staffForm.name || !staffForm.id) return alert('Name and ID required');
        const { error } = await supabase.from('staff_members').insert([{
            employee_id: staffForm.id, full_name: staffForm.name,
            role: staffForm.role, base_salary: staffForm.salary
        }]);
        if (error) alert(error.message);
        else {
            setShowStaffModal(false);
            setStaffForm({ name: '', role: '', salary: 0, id: '' });
            fetchData();
        }
    };

    const computeNetPay = (record: SalaryRecord, late: number, absent: number, weekend: number, custom: number, bonus: number) => {
        const lateDed = late * rules.latePenalty;
        const absentDed = absent * rules.absentPenalty;
        const weekendDed = rules.enableSandwich ? (weekend * rules.sandwichPenalty) : 0;
        
        const totalDed = lateDed + absentDed + weekendDed + custom;
        const net = record.base_salary + bonus - totalDed;
        return { totalDed, net };
    };

    const updateSalaryRecord = async (record: SalaryRecord, updates: Partial<SalaryRecord>) => {
        const merged = { ...record, ...updates };
        const { totalDed, net } = computeNetPay(
            merged, 
            merged.late_count || 0, 
            merged.absent_count || 0, 
            merged.weekend_absent_count || 0, 
            merged.custom_deduction || 0,
            merged.bonus || 0
        );

        const { error } = await supabase.from('salaries').update({
            ...updates,
            deductions: totalDed,
            net_pay: net
        }).eq('id', record.id);

        if (!error) {
            fetchData();
            if (selectedSalary && selectedSalary.id === record.id) {
                setSelectedSalary({ ...merged, deductions: totalDed, net_pay: net } as SalaryRecord);
            }
        }
    };

    const markAsPaid = async (id: string) => {
        if (!confirm("Confirm payment?")) return;
        await supabase.from('salaries').update({ status: 'paid', paid_date: new Date().toISOString() }).eq('id', id);
        fetchData();
        setSelectedSalary(null);
    };

    // KPIs
    const totalPayroll = salaries.reduce((acc, s) => acc + (s.net_pay || 0), 0);
    const pendingCount = salaries.filter(s => s.status !== 'paid').length;
    const avgAttendance = salaries.length ? 
        (salaries.reduce((acc, s) => acc + (rules.workingDays - (s.absent_count||0) - (s.weekend_absent_count||0)), 0) / (salaries.length * rules.workingDays)) * 100 
        : 100;

    const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.employee_id.toLowerCase().includes(search.toLowerCase()));
    const filteredSalaries = salaries.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.employee_id.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
                {/* Header Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
                            Staff & Payroll Master
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
                            Manage personnel, define robust payroll rules, and process compensations.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setShowRulesModal(true)} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>settings</span> Payroll Rules
                        </button>
                        <button onClick={executePayrollCycle} disabled={isExecuting} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isExecuting ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>autorenew</span> {isExecuting ? 'Generating...' : 'Generate Cycle'}
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons" style={{ fontSize: '16px', color: '#3b82f6' }}>people</span> Total Active Staff
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{employees.length}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons" style={{ fontSize: '16px', color: '#10b981' }}>account_balance_wallet</span> Cycle Payroll
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Rs {totalPayroll.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons" style={{ fontSize: '16px', color: '#f59e0b' }}>pending_actions</span> Pending Disbursal
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{pendingCount} Staff</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-icons" style={{ fontSize: '16px', color: '#8b5cf6' }}>query_stats</span> Cycle Attendance
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{avgAttendance.toFixed(1)}%</div>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: 4, borderRadius: '12px' }}>
                        <button onClick={() => setActiveTab('directory')} style={{ padding: '8px 24px', background: activeTab === 'directory' ? '#fff' : 'transparent', color: activeTab === 'directory' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'directory' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                            Staff Directory
                        </button>
                        <button onClick={() => setActiveTab('payroll')} style={{ padding: '8px 24px', background: activeTab === 'payroll' ? '#fff' : 'transparent', color: activeTab === 'payroll' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'payroll' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                            Payroll Processing
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <span className="material-icons" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: '10px 16px 10px 38px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.8rem', width: '200px' }} />
                        </div>
                        {activeTab === 'payroll' && (
                            <>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.8rem', fontWeight: 700, background: '#fff' }}>
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                                </select>
                                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.8rem', fontWeight: 700, background: '#fff' }}>
                                    <option>2026</option>
                                    <option>2025</option>
                                </select>
                            </>
                        )}
                        {activeTab === 'directory' && (
                            <button onClick={() => setShowStaffModal(true)} style={{ padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                + Add Staff
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading Data...</div>
                    ) : activeTab === 'directory' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Employee</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Type / Role</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Base Salary</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Current M. Attendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No employees found.</td></tr>
                                ) : filteredEmployees.map(emp => {
                                    // Find salary record to show attendance
                                    const sal = salaries.find(s => s.employee_id === emp.employee_id);
                                    const presents = sal ? (rules.workingDays - (sal.absent_count||0) - (sal.weekend_absent_count||0)) : '-';
                                    const attPerc = sal ? Math.round((presents as number / rules.workingDays) * 100) : 0;
                                    
                                    return (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: '10px', background: emp.type === 'Teacher' ? '#eff6ff' : '#f0fdf4', color: emp.type === 'Teacher' ? '#3b82f6' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{emp.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {emp.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>{emp.type}</span>
                                            <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, marginTop: 4 }}>{emp.role}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                            Rs {emp.base_salary.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {sal ? (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{ width: `${attPerc}%`, height: '100%', background: attPerc >= 85 ? '#10b981' : attPerc >= 70 ? '#f59e0b' : '#ef4444' }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>{attPerc}%</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{presents} / {rules.workingDays} Days Present</div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Not in current cycle</span>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    ) : (
                        // Payroll Processing Tab
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Employee</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Attendance & Penalty</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Deductions</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Net Pay</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSalaries.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No payroll records. Generate cycle first.</td></tr>
                                ) : filteredSalaries.map(s => {
                                    const presents = rules.workingDays - (s.absent_count||0) - (s.weekend_absent_count||0);
                                    return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.role} &bull; {s.employee_id}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ background: '#f0fdf4', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#166534', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                                                    {presents} P
                                                </div>
                                                {(s.absent_count||0) > 0 && <div style={{ background: '#fef2f2', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#991b1b', fontWeight: 700, border: '1px solid #fecaca' }}>
                                                    {s.absent_count} A
                                                </div>}
                                                {(s.late_count||0) > 0 && <div style={{ background: '#fffbeb', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }}>
                                                    {s.late_count} L
                                                </div>}
                                                {(s.weekend_absent_count||0) > 0 && <div style={{ background: '#fef2f2', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#991b1b', fontWeight: 700, border: '1px solid #fecaca' }}>
                                                    {s.weekend_absent_count} SW
                                                </div>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: 800, color: '#ef4444', fontSize: '0.85rem' }}>
                                            - Rs {Number(s.deductions).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1.05rem' }}>Rs {Number(s.net_pay).toLocaleString()}</div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: s.status === 'paid' ? '#3b82f6' : '#f59e0b' }}>
                                                {s.status.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button onClick={() => setSelectedSalary(s)} style={{ padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#334155' }}>
                                                Adjust / Pay
                                            </button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Adjust / Pay Modal */}
                {selectedSalary && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Process Salary</h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{selectedSalary.name} ({selectedSalary.employee_id})</p>
                                </div>
                                <button onClick={() => setSelectedSalary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><span className="material-icons">close</span></button>
                            </div>

                            <div style={{ padding: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Absent Days</label>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
                                            <input type="number" min="0" value={selectedSalary.absent_count||0} onChange={e => updateSalaryRecord(selectedSalary, { absent_count: parseInt(e.target.value)||0 })} style={{ border: 'none', outline: 'none', width: '100%', fontWeight: 800 }} />
                                            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>x Rs{rules.absentPenalty}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Late Days</label>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
                                            <input type="number" min="0" value={selectedSalary.late_count||0} onChange={e => updateSalaryRecord(selectedSalary, { late_count: parseInt(e.target.value)||0 })} style={{ border: 'none', outline: 'none', width: '100%', fontWeight: 800 }} />
                                            <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>x Rs{rules.latePenalty}</span>
                                        </div>
                                    </div>
                                    {rules.enableSandwich && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Sandwich Absents (Weekend)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
                                                <input type="number" min="0" value={selectedSalary.weekend_absent_count||0} onChange={e => updateSalaryRecord(selectedSalary, { weekend_absent_count: parseInt(e.target.value)||0 })} style={{ border: 'none', outline: 'none', width: '100%', fontWeight: 800 }} />
                                                <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>x Rs{rules.sandwichPenalty}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Custom Deduction / Loan</label>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
                                            <input type="number" min="0" value={selectedSalary.custom_deduction||0} onChange={e => updateSalaryRecord(selectedSalary, { custom_deduction: parseInt(e.target.value)||0 })} style={{ border: 'none', outline: 'none', width: '100%', fontWeight: 800 }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                                        <span style={{ color: '#64748b', fontWeight: 600 }}>Base Salary</span>
                                        <span style={{ fontWeight: 800, color: '#0f172a' }}>Rs {selectedSalary.base_salary.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
                                        <span style={{ color: '#ef4444', fontWeight: 600 }}>Total Deductions</span>
                                        <span style={{ fontWeight: 800, color: '#ef4444' }}>- Rs {selectedSalary.deductions.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                        <span style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.1rem' }}>Final Net Pay</span>
                                        <span style={{ fontWeight: 900, color: '#10b981', fontSize: '1.4rem' }}>Rs {selectedSalary.net_pay.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                    {selectedSalary.status !== 'paid' ? (
                                        <button onClick={() => markAsPaid(selectedSalary.id)} style={{ flex: 1, padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                                            MARK AS PAID
                                        </button>
                                    ) : (
                                        <div style={{ flex: 1, padding: '14px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>
                                            ALREADY PAID
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rules Modal */}
                {showRulesModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '450px', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <h2 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Global Payroll Rules</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Standard Working Days / Month</label>
                                    <input type="number" value={rules.workingDays} onChange={e => setRules({...rules, workingDays: parseInt(e.target.value)||0})} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Absent Penalty (Rs / Day)</label>
                                    <input type="number" value={rules.absentPenalty} onChange={e => setRules({...rules, absentPenalty: parseInt(e.target.value)||0})} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Late Penalty (Rs / Day)</label>
                                    <input type="number" value={rules.latePenalty} onChange={e => setRules({...rules, latePenalty: parseInt(e.target.value)||0})} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                </div>
                                
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <input type="checkbox" checked={rules.enableSandwich} onChange={e => setRules({...rules, enableSandwich: e.target.checked})} style={{ width: 18, height: 18 }} />
                                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Enable Sandwich Rule</label>
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 12px 30px' }}>If an employee is absent before and after a weekend, deduct extra for the weekend days.</p>
                                    {rules.enableSandwich && (
                                        <div style={{ marginLeft: 30, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Sandwich Penalty (Rs)</label>
                                            <input type="number" value={rules.sandwichPenalty} onChange={e => setRules({...rules, sandwichPenalty: parseInt(e.target.value)||0})} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                <button onClick={() => setShowRulesModal(false)} style={{ flex: 1, padding: '12px', border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={saveRules} style={{ flex: 1, padding: '12px', border: 'none', background: '#0f172a', color: '#fff', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Save Rules</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Staff Modal */}
                {showStaffModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '400px', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <h2 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Add New Staff</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>Full Name</label>
                                    <input value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} placeholder="e.g. John Doe" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>Employee ID</label>
                                    <input value={staffForm.id} onChange={e => setStaffForm({...staffForm, id: e.target.value})} placeholder="e.g. STF-001" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>Designation</label>
                                    <input value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} placeholder="e.g. Security Guard" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>Monthly Base Salary</label>
                                    <input type="number" value={staffForm.salary} onChange={e => setStaffForm({...staffForm, salary: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 800 }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                <button onClick={() => setShowStaffModal(false)} style={{ flex: 1, padding: 12, border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleAddStaff} style={{ flex: 2, padding: 12, border: 'none', background: '#3b82f6', color: '#fff', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Enroll Staff</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
