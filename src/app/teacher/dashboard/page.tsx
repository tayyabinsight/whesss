'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type Teacher = {
    id: string;
    full_name: string;
};

type ClassData = {
    id: string;
    grade: string;
    section: string;
    room: string;
    teacher: string;
    assistant_teachers: string[];
};

type Student = {
    id: string;
    student_id: string;
    full_name: string;
    grade: string;
};

export default function TeacherDashboard() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [assignedClasses, setAssignedClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState<'Attendance' | 'Assignments' | 'Announcements' | 'Results' | 'Students'>('Attendance');
    
    // Feature States
    const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    // Assignments State
    const [assignments, setAssignments] = useState<any[]>([]);
    const [showNewAssignment, setShowNewAssignment] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '', due_date: '' });

    // Announcements State
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

    useEffect(() => {
        initPortal();
    }, []);

    useEffect(() => {
        if (selectedTeacher) fetchAssignedClasses();
    }, [selectedTeacher]);

    useEffect(() => {
        if (selectedClass) {
            fetchClassStudents();
            fetchClassData();
        }
    }, [selectedClass, activeTab]);

    const initPortal = async () => {
        const { data } = await supabase.from('teachers').select('id, full_name');
        if (data) {
            setTeachers(data);
            // Default to first teacher for demo purposes if none selected
            if (data.length > 0) setSelectedTeacher(data[0]);
        }
        setLoading(false);
    };

    const fetchAssignedClasses = async () => {
        if (!selectedTeacher) return;
        const { data } = await supabase.from('classes').select('*');
        if (data) {
            const filtered = data.filter((c: ClassData) => 
                c.teacher === selectedTeacher.full_name || 
                (c.assistant_teachers && c.assistant_teachers.includes(selectedTeacher.full_name))
            );
            setAssignedClasses(filtered);
            if (filtered.length > 0) setSelectedClass(filtered[0]);
            else setSelectedClass(null);
        }
    };

    const fetchClassStudents = async () => {
        if (!selectedClass) return;
        const { data } = await supabase.from('students')
            .select('id, student_id, full_name, grade, guardian_name, status')
            .eq('grade', selectedClass.grade);
        
        if (data) {
            setStudents(data);
            // Fetch today's attendance
            const today = new Date().toISOString().split('T')[0];
            const { data: attData } = await supabase.from('student_attendance').select('*').eq('class_name', selectedClass.grade).eq('date', today);
            const attMap: any = {};
            data.forEach(s => attMap[s.id] = 'Present'); // Default
            attData?.forEach(a => attMap[a.student_id] = a.status);
            setAttendance(attMap);
        }
    };

    const fetchClassData = async () => {
        if (!selectedClass) return;
        if (activeTab === 'Assignments') {
            const { data } = await supabase.from('assignments').select('*').eq('class_name', selectedClass.grade).order('created_at', { ascending: false });
            setAssignments(data || []);
        } else if (activeTab === 'Announcements') {
            const { data } = await supabase.from('announcements').select('*').or(`class_name.eq.${selectedClass.grade},class_name.is.null`).order('created_at', { ascending: false });
            setAnnouncements(data || []);
        }
    };

    const handleSaveAttendance = async () => {
        if (!selectedClass || !selectedTeacher) return;
        setIsSaving(true);
        const today = new Date().toISOString().split('T')[0];
        const inserts = Object.entries(attendance).map(([sId, status]) => ({
            student_id: sId,
            class_name: selectedClass.grade,
            date: today,
            status: status,
            recorded_by: selectedTeacher.full_name
        }));

        const { error } = await supabase.from('student_attendance').upsert(inserts, { onConflict: 'student_id,date' });
        setIsSaving(false);
        if (error) alert(error.message);
        else alert('Attendance synced successfully!');
    };

    const handlePostAssignment = async () => {
        if (!selectedClass || !selectedTeacher) return;
        const { error } = await supabase.from('assignments').insert([{
            class_name: selectedClass.grade,
            teacher_name: selectedTeacher.full_name,
            title: newAssignment.title,
            description: newAssignment.description,
            due_date: newAssignment.due_date || null
        }]);
        if (error) alert(error.message);
        else {
            setShowNewAssignment(false);
            setNewAssignment({ title: '', description: '', due_date: '' });
            fetchClassData();
        }
    };

    const handlePostAnnouncement = async () => {
        if (!selectedClass || !selectedTeacher) return;
        const { error } = await supabase.from('announcements').insert([{
            class_name: selectedClass.grade,
            author_name: selectedTeacher.full_name,
            title: newAnnouncement.title,
            content: newAnnouncement.content
        }]);
        if (error) alert(error.message);
        else {
            setNewAnnouncement({ title: '', content: '' });
            fetchClassData();
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Portal...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar role="teacher" userName={selectedTeacher?.full_name || 'Teacher'} userSubtitle="Faculty Portal" />

            <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                {/* Header with Teacher Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Teacher Workspace
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Live Classroom Control & Academic Management</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Session: {selectedTeacher?.full_name}</div>
                        <select 
                            value={selectedTeacher?.id} 
                            onChange={(e) => setSelectedTeacher(teachers.find(t => t.id === e.target.value) || null)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
                        >
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                    </div>
                </div>

                {assignedClasses.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                        <span className="material-icons" style={{ fontSize: '48px', color: '#94a3b8' }}>sentiment_dissatisfied</span>
                        <h3 style={{ marginTop: '16px', color: '#1e293b' }}>No classes assigned to you yet.</h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Please contact administration to link your profile to a class.</p>
                    </div>
                ) : (
                    <>
                        {/* Class Selector Tabs */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                            {assignedClasses.map(cls => (
                                <button 
                                    key={cls.id} 
                                    onClick={() => setSelectedClass(cls)}
                                    style={{
                                        padding: '12px 20px', borderRadius: '16px', border: '1px solid',
                                        borderColor: selectedClass?.id === cls.id ? '#0f172a' : '#e2e8f0',
                                        background: selectedClass?.id === cls.id ? '#0f172a' : '#fff',
                                        color: selectedClass?.id === cls.id ? '#fff' : '#64748b',
                                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                                        whiteSpace: 'nowrap', transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>
                                        {cls.teacher === selectedTeacher?.full_name ? 'workspace_premium' : 'groups'}
                                    </span>
                                    {cls.grade} {cls.section && `(${cls.section})`}
                                    {cls.teacher === selectedTeacher?.full_name && <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>(Head)</span>}
                                </button>
                            ))}
                        </div>

                        {selectedClass && (
                            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
                                {/* Left Menu */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { id: 'Students', icon: 'group' },
                                        { id: 'Attendance', icon: 'how_to_reg' },
                                        { id: 'Assignments', icon: 'assignment' },
                                        { id: 'Announcements', icon: 'campaign' },
                                        { id: 'Results', icon: 'grade' }
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            style={{
                                                padding: '12px 16px', borderRadius: '12px', border: 'none',
                                                background: activeTab === tab.id ? '#fff' : 'transparent',
                                                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                                                fontWeight: 700, fontSize: '0.85rem', textAlign: 'left',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '20px' }}>{tab.icon}</span>
                                            {tab.id}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                    {activeTab === 'Students' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ margin: 0, fontWeight: 800 }}>Class Roster: {selectedClass.grade}</h3>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{students.length} Total Students</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {students.map(s => (
                                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#0f172a' }}>
                                                                {s.full_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.full_name}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ID: {s.student_id}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '16px' }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>PARENT</div>
                                                                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{ (s as any).guardian_name || 'N/A' }</div>
                                                            </div>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                                <span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>info</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Attendance' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ margin: 0, fontWeight: 800 }}>Daily Attendance: {new Date().toLocaleDateString()}</h3>
                                                <button 
                                                    onClick={handleSaveAttendance}
                                                    disabled={isSaving || selectedClass.teacher !== selectedTeacher?.full_name}
                                                    style={{ 
                                                        padding: '10px 20px', borderRadius: '12px', border: 'none', 
                                                        background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer',
                                                        opacity: selectedClass.teacher !== selectedTeacher?.full_name ? 0.5 : 1
                                                    }}
                                                >
                                                    {isSaving ? 'Saving...' : 'Sync Attendance'}
                                                </button>
                                            </div>
                                            {selectedClass.teacher !== selectedTeacher?.full_name && (
                                                <div style={{ padding: '10px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', color: '#9a3412', fontSize: '0.75rem', fontWeight: 600, marginBottom: '16px' }}>
                                                    Only the Class Teacher (Head) can record student attendance.
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {students.map(s => (
                                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>
                                                                {s.full_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.full_name}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ID: {s.student_id}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {['Present', 'Absent', 'Late'].map(status => (
                                                                <button 
                                                                    key={status}
                                                                    disabled={selectedClass.teacher !== selectedTeacher?.full_name}
                                                                    onClick={() => setAttendance(prev => ({ ...prev, [s.id]: status as any }))}
                                                                    style={{
                                                                        padding: '6px 12px', borderRadius: '8px', border: '1px solid',
                                                                        borderColor: attendance[s.id] === status ? (status === 'Present' ? '#10b981' : (status === 'Absent' ? '#ef4444' : '#f59e0b')) : '#e2e8f0',
                                                                        background: attendance[s.id] === status ? (status === 'Present' ? '#f0fdf4' : (status === 'Absent' ? '#fef2f2' : '#fffbeb')) : '#fff',
                                                                        color: attendance[s.id] === status ? (status === 'Present' ? '#166534' : (status === 'Absent' ? '#991b1b' : '#92400e')) : '#64748b',
                                                                        fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Assignments' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ margin: 0, fontWeight: 800 }}>Class Assignments</h3>
                                                <button onClick={() => setShowNewAssignment(true)} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>+ New Assignment</button>
                                            </div>

                                            {showNewAssignment && (
                                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <input placeholder="Assignment Title" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                                    <textarea placeholder="Description / Instructions" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '80px' }} />
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        <input type="date" value={newAssignment.due_date} onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                        <button onClick={handlePostAssignment} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Post</button>
                                                        <button onClick={() => setShowNewAssignment(false)} style={{ padding: '10px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700 }}>Cancel</button>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {assignments.map(a => (
                                                    <div key={a.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <h4 style={{ margin: '0 0 4px 0', fontWeight: 800 }}>{a.title}</h4>
                                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{a.description}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Due Date</div>
                                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Deadline'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Announcements' && (
                                        <div>
                                            <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>Post Announcement</h3>
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <input placeholder="Announcement Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                                <textarea placeholder="Write your message..." value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '100px' }} />
                                                <button onClick={handlePostAnnouncement} style={{ alignSelf: 'flex-end', padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Share Announcement</button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {announcements.map(a => (
                                                    <div key={a.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <h4 style={{ margin: 0, fontWeight: 800 }}>{a.title}</h4>
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>{a.content}</p>
                                                        <div style={{ marginTop: '8px', fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6' }}>— {a.author_name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'Results' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ margin: 0, fontWeight: 800 }}>Post Student Results</h3>
                                                <button 
                                                    onClick={async () => {
                                                        if (!selectedClass || !selectedTeacher) return;
                                                        setIsSaving(true);
                                                        const results = students.map(s => ({
                                                            student_id: s.id,
                                                            subject: (document.getElementById('res-subject') as HTMLInputElement).value || 'General',
                                                            marks_obtained: Number((document.getElementById(`marks-${s.id}`) as HTMLInputElement).value) || 0,
                                                            total_marks: Number((document.getElementById('res-total') as HTMLInputElement).value) || 100,
                                                            term: (document.getElementById('res-term') as HTMLInputElement).value || 'Unit Test',
                                                            grade_label: (document.getElementById(`grade-${s.id}`) as HTMLInputElement).value || '-'
                                                        }));
                                                        const { error } = await supabase.from('student_results').insert(results);
                                                        setIsSaving(false);
                                                        if (error) alert(error.message);
                                                        else alert('Results published successfully!');
                                                    }}
                                                    disabled={isSaving}
                                                    style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    {isSaving ? 'Publishing...' : 'Publish Results'}
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Subject</label>
                                                    <input id="res-subject" defaultValue="Mathematics" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Total Marks</label>
                                                    <input id="res-total" type="number" defaultValue="100" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Assessment / Term</label>
                                                    <input id="res-term" defaultValue="Mid-Term Exam" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                </div>
                                            </div>

                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                                            <th style={{ padding: '12px', fontSize: '0.8rem', color: '#64748b' }}>Student Name</th>
                                                            <th style={{ padding: '12px', fontSize: '0.8rem', color: '#64748b' }}>Marks Obtained</th>
                                                            <th style={{ padding: '12px', fontSize: '0.8rem', color: '#64748b' }}>Grade / Note</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {students.map(s => (
                                                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 600 }}>{s.full_name}</td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <input id={`marks-${s.id}`} type="number" defaultValue="0" style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <input id={`grade-${s.id}`} placeholder="A, B, C..." style={{ width: '100px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
