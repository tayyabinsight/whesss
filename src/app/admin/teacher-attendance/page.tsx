'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type Teacher = {
    id: string;
    teacher_id: string;
    full_name: string;
    subject: string;
    phone: string;
};

type AttendanceRecord = {
    id: string;
    teacher_id: string;
    date: string;
    status: 'Present' | 'Absent';
    time_recorded: string;
    month: string;
    year: string;
};

export default function TeacherAttendanceOverview() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [dailyRecords, setDailyRecords] = useState<Record<string, AttendanceRecord>>({});
    
    // For overall %
    const [monthlyStats, setMonthlyStats] = useState<Record<string, { present: number, total: number }>>({});
    
    // View state
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // History Modal State
    const [showHistory, setShowHistory] = useState<Teacher | null>(null);
    const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
    const [historyMonth, setHistoryMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        fetchDailyData();
    }, [selectedDate]);

    useEffect(() => {
        if (showHistory) {
            fetchHistoryData(showHistory.teacher_id, historyMonth, historyYear);
        }
    }, [showHistory, historyMonth, historyYear]);

    const fetchDailyData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Teachers
            const { data: tData } = await supabase.from('teachers').select('*');
            const teacherList = (tData || []).map((t: any) => ({
                ...t,
                teacher_id: t.teacher_id || `TCH-${t.id.substring(0,4)}`
            }));
            setTeachers(teacherList);

            // 2. Fetch Today's Attendance
            const { data: aData, error: dbErr } = await supabase
                .from('teacher_attendance')
                .select('*')
                .eq('date', selectedDate);

            if (dbErr) {
                if (dbErr.code === '42P01') setError("Table 'teacher_attendance' not found. Run SQL script.");
                else throw dbErr;
            } else {
                const recMap: Record<string, AttendanceRecord> = {};
                aData?.forEach(r => recMap[r.teacher_id] = r);
                setDailyRecords(recMap);
            }

            // 3. Fetch current month aggregate for all teachers (for % calculation)
            const currentM = new Date(selectedDate).toLocaleString('default', { month: 'long' });
            const currentY = new Date(selectedDate).getFullYear().toString();

            const { data: allData } = await supabase
                .from('teacher_attendance')
                .select('teacher_id, status')
                .eq('month', currentM)
                .eq('year', currentY);

            const stMap: Record<string, { present: number, total: number }> = {};
            teacherList.forEach(t => stMap[t.teacher_id] = { present: 0, total: 0 });

            allData?.forEach(r => {
                if (!stMap[r.teacher_id]) stMap[r.teacher_id] = { present: 0, total: 0 };
                stMap[r.teacher_id].total++;
                if (r.status === 'Present') stMap[r.teacher_id].present++;
            });
            setMonthlyStats(stMap);

        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoryData = async (teacher_id: string, month: string, year: string) => {
        const { data, error } = await supabase
            .from('teacher_attendance')
            .select('*')
            .eq('teacher_id', teacher_id)
            .eq('month', month)
            .eq('year', year)
            .order('date', { ascending: false });
        
        if (!error) setHistoryRecords(data || []);
    };

    const isLate = (rec: AttendanceRecord) => {
        if (rec.status !== 'Present') return false;
        const d = new Date(rec.time_recorded);
        return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 0);
    };

    const markAttendance = async (teacher: Teacher, status: 'Present' | 'Absent') => {
        if (error) return alert(error);

        const d = new Date(selectedDate);
        const month = d.toLocaleString('default', { month: 'long' });
        const year = d.getFullYear().toString();

        const existing = dailyRecords[teacher.teacher_id];

        // Optimistic UI
        setDailyRecords(prev => ({
            ...prev,
            [teacher.teacher_id]: {
                id: existing?.id || 'temp',
                teacher_id: teacher.teacher_id,
                date: selectedDate,
                status,
                time_recorded: new Date().toISOString(),
                month, year
            }
        }));

        try {
            if (existing) {
                const { error } = await supabase.from('teacher_attendance').update({ status, time_recorded: new Date().toISOString() }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('teacher_attendance').insert([{
                    teacher_id: teacher.teacher_id,
                    teacher_name: teacher.full_name || 'Unknown',
                    date: selectedDate,
                    status, month, year
                }]);
                if (error) throw error;
            }
            fetchDailyData(); // Sync cleanly
        } catch (err: any) {
            alert('Failed: ' + err.message);
            fetchDailyData(); // revert
        }
    };

    const deleteRecord = async (id: string) => {
        if (!confirm("Are you sure you want to delete this day's attendance?")) return;
        
        const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            // Remove from local history state immediately
            setHistoryRecords(prev => prev.filter(r => r.id !== id));
            // Also refresh daily dashboard if it's the selected date
            fetchDailyData();
        }
    };

    // Calculate Dashboard KPIs
    let countPresent = 0;
    let countAbsent = 0;
    let countLate = 0;

    Object.values(dailyRecords).forEach(rec => {
        if (rec.status === 'Present') {
            countPresent++;
            if (isLate(rec)) countLate++;
        }
        if (rec.status === 'Absent') countAbsent++;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                            Teacher Attendance Overview
                        </h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Track daily presence, late arrivals, and view history.</p>
                    </div>
                    <div>
                        <input 
                            type="date" 
                            value={selectedDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => setSelectedDate(e.target.value)}
                            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', fontFamily: 'Manrope', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#b91c1c', fontWeight: 600 }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-icons" style={{ fontSize: 18 }}>group</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Staff</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{teachers.length}</div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-icons" style={{ fontSize: 18 }}>how_to_reg</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Today Present</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{countPresent}</div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-icons" style={{ fontSize: 18 }}>person_off</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Today Absent</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>{countAbsent}</div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-icons" style={{ fontSize: 18 }}>watch_later</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Late Comers (&gt; 8 AM)</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{countLate}</div>
                    </div>
                </div>

                {/* Main List */}
                <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Teacher Details</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Monthly Rate</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Today's Status</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Mark Attendance</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading Data...</td></tr>
                            ) : teachers.map(t => {
                                const rec = dailyRecords[t.teacher_id];
                                const st = monthlyStats[t.teacher_id] || { present: 0, total: 0 };
                                const perc = st.total === 0 ? 0 : Math.round((st.present / st.total) * 100);
                                
                                const isP = rec?.status === 'Present';
                                const isA = rec?.status === 'Absent';
                                const late = rec && isLate(rec);

                                return (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#475569' }}>
                                                    {t.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{t.full_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{t.teacher_id} &bull; {t.subject || 'General'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: perc >= 85 ? '#10b981' : perc >= 70 ? '#f59e0b' : '#ef4444' }}>
                                                {perc}% <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({st.present}/{st.total})</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {!rec ? (
                                                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>PENDING</span>
                                            ) : isA ? (
                                                <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>ABSENT</span>
                                            ) : late ? (
                                                <span style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>LATE</span>
                                            ) : (
                                                <span style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>PRESENT</span>
                                            )}
                                            {rec && (
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>
                                                    @ {new Date(rec.time_recorded).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => markAttendance(t, 'Absent')} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #fecaca', background: isA ? '#ef4444' : '#fff', color: isA ? '#fff' : '#ef4444', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Mark Absent">
                                                    <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                                                </button>
                                                <button onClick={() => markAttendance(t, 'Present')} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #a7f3d0', background: isP ? '#10b981' : '#fff', color: isP ? '#fff' : '#10b981', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Mark Present">
                                                    <span className="material-icons" style={{ fontSize: 16 }}>check</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button 
                                                onClick={() => setShowHistory(t)}
                                                style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                Details <span className="material-icons" style={{ fontSize: 14 }}>arrow_forward</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* History Details Modal */}
                {showHistory && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '700px', height: '80vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{showHistory.full_name}'s Attendance</h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>History and record management</p>
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <select value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, fontSize: '0.8rem' }}>
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                                    </select>
                                    <select value={historyYear} onChange={e => setHistoryYear(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, fontSize: '0.8rem' }}>
                                        <option>2026</option>
                                        <option>2025</option>
                                    </select>
                                    <button onClick={() => setShowHistory(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                                        <span className="material-icons" style={{ fontSize: 18 }}>close</span>
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                            <th style={{ padding: '12px 32px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                            <th style={{ padding: '12px 32px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Time Recorded</th>
                                            <th style={{ padding: '12px 32px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '12px 32px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyRecords.length === 0 ? (
                                            <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records found for {historyMonth} {historyYear}.</td></tr>
                                        ) : historyRecords.map(r => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px 32px', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{r.date}</td>
                                                <td style={{ padding: '16px 32px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    {new Date(r.time_recorded).toLocaleTimeString()}
                                                </td>
                                                <td style={{ padding: '16px 32px' }}>
                                                    {r.status === 'Present' ? (
                                                        isLate(r) ? (
                                                            <span style={{ background: '#fffbeb', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #fde68a' }}>LATE</span>
                                                        ) : (
                                                            <span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #a7f3d0' }}>PRESENT</span>
                                                        )
                                                    ) : (
                                                        <span style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #fecaca' }}>ABSENT</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                                                    <button 
                                                        onClick={() => deleteRecord(r.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, borderRadius: 6, transition: '0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        title="Delete Record"
                                                    >
                                                        <span className="material-icons" style={{ fontSize: 18 }}>delete_outline</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
