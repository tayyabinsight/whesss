'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type Teacher = {
    id: string;
    teacher_id: string;
    full_name: string;
    subject: string;
};

type AttendanceRecord = {
    id: string;
    teacher_id: string;
    status: 'Present' | 'Absent';
    time_recorded: string;
};

export default function AttendancePortal() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [dailyRecords, setDailyRecords] = useState<Record<string, AttendanceRecord>>({});
    const [searchQuery, setSearchQuery] = useState('');
    
    // Settings
    const [showSettings, setShowSettings] = useState(false);
    const [startTime, setStartTime] = useState('07:00');
    const [endTime, setEndTime] = useState('09:00');

    useEffect(() => {
        const auth = localStorage.getItem('attendance_auth');
        if (!auth) {
            router.push('/attendance-login');
            return;
        }
        
        // Load settings from local storage
        const savedStart = localStorage.getItem('attendance_start_time');
        const savedEnd = localStorage.getItem('attendance_end_time');
        if (savedStart) setStartTime(savedStart);
        if (savedEnd) setEndTime(savedEnd);

        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Fetch Teachers
            const { data: tData } = await supabase.from('teachers').select('id, teacher_id, full_name, subject');
            setTeachers(tData || []);

            // 2. Fetch Today's Attendance
            const { data: aData } = await supabase
                .from('teacher_attendance')
                .select('*')
                .eq('date', today);

            const recMap: Record<string, AttendanceRecord> = {};
            aData?.forEach(r => recMap[r.teacher_id] = r);
            setDailyRecords(recMap);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = () => {
        localStorage.setItem('attendance_start_time', startTime);
        localStorage.setItem('attendance_end_time', endTime);
        setShowSettings(false);
    };

    const markAttendance = async (teacher: Teacher, status: 'Present' | 'Absent') => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const month = today.toLocaleString('default', { month: 'long' });
        const year = today.getFullYear().toString();
        const timeRecorded = new Date().toISOString();

        const existing = dailyRecords[teacher.teacher_id];

        // Optimistic UI
        setDailyRecords(prev => ({
            ...prev,
            [teacher.teacher_id]: {
                id: existing?.id || 'temp',
                teacher_id: teacher.teacher_id,
                status,
                time_recorded: timeRecorded
            }
        }));

        try {
            if (existing && existing.id !== 'temp') {
                await supabase.from('teacher_attendance').update({ status, time_recorded: timeRecorded }).eq('id', existing.id);
            } else {
                await supabase.from('teacher_attendance').insert([{
                    teacher_id: teacher.teacher_id,
                    teacher_name: teacher.full_name,
                    date: dateStr,
                    status, month, year,
                    time_recorded: timeRecorded
                }]);
            }
            fetchData();
        } catch (err) {
            alert('Failed to mark attendance');
            fetchData();
        }
    };

    const isLate = (timeStr: string) => {
        if (!timeStr) return false;
        const recorded = new Date(timeStr);
        const hours = recorded.getHours();
        const minutes = recorded.getMinutes();
        const recordedTimeInMinutes = hours * 60 + minutes;

        const [endH, endM] = endTime.split(':').map(Number);
        const endTimeInMinutes = endH * 60 + endM;

        return recordedTimeInMinutes > endTimeInMinutes;
    };

    const filteredTeachers = teachers.filter(t => 
        t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.teacher_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const logout = () => {
        localStorage.removeItem('attendance_auth');
        router.push('/attendance-login');
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <header style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <span className="material-icons" style={{ fontSize: '24px' }}>how_to_reg</span>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Attendance</h1>
                        <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, margin: 0 }}>{new Date().toDateString()}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowSettings(true)} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                        <span className="material-icons" style={{ fontSize: '20px' }}>settings</span>
                    </button>
                    <button onClick={logout} style={{ background: '#fef2f2', border: 'none', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                        <span className="material-icons" style={{ fontSize: '20px' }}>logout</span>
                    </button>
                </div>
            </header>

            <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                {/* Search */}
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <span className="material-icons" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
                    <input 
                        type="text" 
                        placeholder="Search teacher name or ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', fontSize: '0.95rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                    />
                </div>

                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '4px' }}>Present</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#065f46' }}>{Object.values(dailyRecords).filter(r => r.status === 'Present').length}</div>
                    </div>
                    <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '20px', border: '1px solid #fecaca' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: '4px' }}>Absent</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#991b1b' }}>{Object.values(dailyRecords).filter(r => r.status === 'Absent').length}</div>
                    </div>
                </div>

                {/* Teacher List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredTeachers.map(t => {
                        const rec = dailyRecords[t.teacher_id];
                        const isPresent = rec?.status === 'Present';
                        const isAbsent = rec?.status === 'Absent';
                        const late = isPresent && isLate(rec.time_recorded);

                        return (
                            <div key={t.id} style={{ background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#475569', fontSize: '1.2rem' }}>
                                            {t.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{t.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t.teacher_id} &bull; {t.subject}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {isPresent ? (
                                            <span style={{ 
                                                background: late ? '#fffbeb' : '#ecfdf5', 
                                                color: late ? '#f59e0b' : '#10b981', 
                                                padding: '4px 8px', 
                                                borderRadius: '6px', 
                                                fontSize: '0.65rem', 
                                                fontWeight: 800,
                                                border: '1px solid',
                                                borderColor: late ? '#fde68a' : '#a7f3d0'
                                            }}>
                                                {late ? 'LATE' : 'PRESENT'}
                                            </span>
                                        ) : isAbsent ? (
                                            <span style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, border: '1px solid #fecaca' }}>ABSENT</span>
                                        ) : (
                                            <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>PENDING</span>
                                        )}
                                        {rec && (
                                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px', fontWeight: 700 }}>
                                                {new Date(rec.time_recorded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button 
                                        onClick={() => markAttendance(t, 'Absent')}
                                        style={{ 
                                            padding: '12px', 
                                            borderRadius: '12px', 
                                            border: '1px solid',
                                            borderColor: isAbsent ? '#ef4444' : '#e2e8f0',
                                            background: isAbsent ? '#ef4444' : '#fff',
                                            color: isAbsent ? '#fff' : '#ef4444',
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>close</span> Absent
                                    </button>
                                    <button 
                                        onClick={() => markAttendance(t, 'Present')}
                                        style={{ 
                                            padding: '12px', 
                                            borderRadius: '12px', 
                                            border: '1px solid',
                                            borderColor: isPresent ? '#10b981' : '#e2e8f0',
                                            background: isPresent ? '#10b981' : '#fff',
                                            color: isPresent ? '#fff' : '#10b981',
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>check</span> Present
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Portal Settings</h2>
                            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Late Arrival Threshold</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>Normal Starts</span>
                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }} />
                                </div>
                                <span style={{ marginTop: '18px', fontWeight: 800, color: '#cbd5e1' }}>to</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>Late Starts At</span>
                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }} />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>Example: If set to 09:00, anyone marking attendance after 9 AM will be marked as LATE.</p>
                        </div>

                        <button 
                            onClick={saveSettings}
                            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
