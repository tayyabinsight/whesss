'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

type Teacher = { id: string; full_name: string; };
type ClassData = { id: string; grade: string; section: string; teacher: string; assistant_teachers: string[]; room: string; };
type Student = { id: string; student_id: string; full_name: string; guardian_name: string; contact_number: string; gender: string; status: string; };

export default function TeacherClasses() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [assignedClasses, setAssignedClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (selectedTeacher) fetchAssignedClasses();
    }, [selectedTeacher]);

    useEffect(() => {
        if (selectedClass) fetchStudents();
    }, [selectedClass]);

    const init = async () => {
        const { data } = await supabase.from('teachers').select('id, full_name');
        if (data) {
            setTeachers(data);
            if (data.length > 0) setSelectedTeacher(data[0]);
        }
        setLoading(false);
    };

    const fetchAssignedClasses = async () => {
        const { data } = await supabase.from('classes').select('*');
        if (data) {
            const filtered = data.filter((c: any) => 
                c.teacher === selectedTeacher?.full_name || 
                (c.assistant_teachers && c.assistant_teachers.includes(selectedTeacher?.full_name))
            );
            setAssignedClasses(filtered);
            if (filtered.length > 0) setSelectedClass(filtered[0]);
            else setSelectedClass(null);
        }
    };

    const fetchStudents = async () => {
        if (!selectedClass) return;
        const { data } = await supabase.from('students')
            .select('*')
            .eq('grade', selectedClass.grade)
            .eq('status', 'active');
        setStudents(data || []);
    };

    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(search.toLowerCase()) || 
        s.student_id.toLowerCase().includes(search.toLowerCase()) ||
        s.guardian_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Portal...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar role="teacher" userName={selectedTeacher?.full_name || 'Teacher'} userSubtitle="Faculty Portal" />

            <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>My Assigned Classes</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>Overview of your classrooms and student rosters.</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Active Session</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedTeacher?.full_name}</div>
                        </div>
                        <select 
                            value={selectedTeacher?.id} 
                            onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value) || null)}
                            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                    </div>
                </div>

                {assignedClasses.length === 0 ? (
                    <div style={{ padding: '100px', textAlign: 'center', background: '#fff', borderRadius: '32px', border: '1px dashed #cbd5e1' }}>
                        <span className="material-icons" style={{ fontSize: '64px', color: '#cbd5e1' }}>visibility_off</span>
                        <h2 style={{ marginTop: '24px', color: '#1e293b' }}>No Classes Found</h2>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '12px auto' }}>You are not currently assigned to any classes as a head or assistant teacher.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Class Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {assignedClasses.map(cls => (
                                <div 
                                    key={cls.id} 
                                    onClick={() => setSelectedClass(cls)}
                                    style={{ 
                                        padding: '24px', borderRadius: '24px', background: '#fff', border: '2px solid',
                                        borderColor: selectedClass?.id === cls.id ? '#0f172a' : 'transparent',
                                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: selectedClass?.id === cls.id ? '0 20px 40px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
                                        position: 'relative', overflow: 'hidden'
                                    }}
                                >
                                    {selectedClass?.id === cls.id && (
                                        <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 0 16px' }}>
                                            <span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>check_circle</span>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        {cls.teacher === selectedTeacher?.full_name ? 'Head Class' : 'Assistant Support'}
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>{cls.grade}</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Section: {cls.section || 'General'}</p>
                                    
                                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-icons" style={{ color: '#64748b' }}>meeting_room</span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>LOCATION</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cls.room || 'TBD'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Student Roster for Selected Class */}
                        {selectedClass && (
                            <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Student Roster: {selectedClass.grade}</h2>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{students.length} Active Students found.</p>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
                                        <input 
                                            placeholder="Search by name, ID or guardian..." 
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            style={{ padding: '12px 16px 12px 40px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '300px', outline: 'none', background: '#f8fafc', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Student</th>
                                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Parent/Guardian</th>
                                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Contact</th>
                                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Gender</th>
                                                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(s => (
                                                <tr key={s.id} style={{ transition: 'all 0.2s' }}>
                                                    <td style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '16px 0 0 16px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.gender === 'Female' ? '#fdf2f8' : '#eff6ff', color: s.gender === 'Female' ? '#db2777' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                                                {s.full_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{s.full_name}</div>
                                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {s.student_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.guardian_name}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#475569' }}>
                                                            <span className="material-icons" style={{ fontSize: '14px', color: '#10b981' }}>call</span>
                                                            {s.contact_number}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', background: s.gender === 'Female' ? '#fdf2f8' : '#eff6ff', color: s.gender === 'Female' ? '#db2777' : '#2563eb' }}>
                                                            {s.gender}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRadius: '0 16px 16px 0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>{s.status}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
