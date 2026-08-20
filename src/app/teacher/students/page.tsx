'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

type Teacher = { id: string; full_name: string; };
type Student = { id: string; student_id: string; full_name: string; guardian_name: string; contact_number: string; gender: string; status: string; grade: string; };

export default function TeacherStudents() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (selectedTeacher) fetchAssignedStudents();
    }, [selectedTeacher]);

    const init = async () => {
        const { data } = await supabase.from('teachers').select('id, full_name');
        if (data) {
            setTeachers(data);
            if (data.length > 0) setSelectedTeacher(data[0]);
        }
        setLoading(false);
    };

    const fetchAssignedStudents = async () => {
        // 1. Get assigned classes for this teacher
        const { data: classData } = await supabase.from('classes').select('*');
        if (!classData) return;

        const myClasses = classData.filter((c: any) => 
            c.teacher === selectedTeacher?.full_name || 
            (c.assistant_teachers && c.assistant_teachers.includes(selectedTeacher?.full_name))
        ).map((c: any) => c.grade);

        if (myClasses.length === 0) {
            setStudents([]);
            return;
        }

        // 2. Fetch students in those classes
        const { data: studentData } = await supabase.from('students')
            .select('*')
            .in('grade', myClasses)
            .eq('status', 'active');
        
        setStudents(studentData || []);
    };

    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(search.toLowerCase()) || 
        s.student_id.toLowerCase().includes(search.toLowerCase()) ||
        s.guardian_name.toLowerCase().includes(search.toLowerCase()) ||
        s.grade.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Portal...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar role="teacher" userName={selectedTeacher?.full_name || 'Teacher'} userSubtitle="Faculty Portal" />

            <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>My Students</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>Complete directory of students in your assigned classes.</p>
                    </div>
                    <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Current Teacher</div>
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

                <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ background: '#eff6ff', padding: '12px 20px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Total Students</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af' }}>{students.length}</div>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '12px 20px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Active Classes</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>{[...new Set(students.map(s => s.grade))].length}</div>
                            </div>
                        </div>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
                            <input 
                                placeholder="Search by name, ID, class or guardian..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '12px 16px 12px 40px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '100%', outline: 'none', background: '#f8fafc', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Student Detail</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Class / Grade</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Guardian Name</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Contact</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ padding: '16px', background: '#f8fafc', borderRadius: '20px 0 0 20px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ 
                                                    width: '44px', height: '44px', borderRadius: '14px', 
                                                    background: s.gender === 'Female' ? '#fdf2f8' : '#eff6ff', 
                                                    color: s.gender === 'Female' ? '#db2777' : '#2563eb', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                    fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                                }}>
                                                    {s.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{s.full_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>ID: {s.student_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '6px 12px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>
                                                {s.grade}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{s.guardian_name}</div>
                                        </td>
                                        <td style={{ padding: '16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderLeft: 'none', borderRight: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                                                <span className="material-icons" style={{ fontSize: '16px', color: '#10b981' }}>call</span>
                                                {s.contact_number}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', background: '#f8fafc', borderRadius: '0 20px 20px 0', border: '1px solid #f1f5f9', borderLeft: 'none' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#2563eb' }}>visibility</span>
                                                </button>
                                                <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: '#10b981' }}>message</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            No students found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
