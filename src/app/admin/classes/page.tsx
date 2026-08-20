'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type ClassData = {
    id: string;
    grade: string;
    section: string;
    room: string;
    teacher: string;
    assistant_teachers?: string[];
    subjects: number;
};

type Student = {
    id: string;
    student_id: string;
    full_name: string;
    grade: string;
};

export default function AdminClasses() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teachersList, setTeachersList] = useState<{id: string, full_name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ClassData>>({});
    
    const [showStudentsModal, setShowStudentsModal] = useState<ClassData | null>(null);
    
    // Promotion State
    const [showPromoteModal, setShowPromoteModal] = useState<ClassData | null>(null);
    const [promoteTargetGrade, setPromoteTargetGrade] = useState('');
    const [promoteSelectedStudents, setPromoteSelectedStudents] = useState<string[]>([]);
    const [isPromoting, setIsPromoting] = useState(false);

    useEffect(() => {
        fetchData();
        const chanClasses = supabase.channel('classes_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchData).subscribe();
        const chanStudents = supabase.channel('stu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchData).subscribe();
        return () => { supabase.removeChannel(chanClasses); supabase.removeChannel(chanStudents); };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [clsRes, stuRes, tchRes] = await Promise.all([
            supabase.from('classes').select('*').order('grade'),
            supabase.from('students').select('id, student_id, full_name, grade'),
            supabase.from('teachers').select('id, full_name')
        ]);
        
        let dbClasses = clsRes.data || [];
        let dbStudents = stuRes.data || [];
        
        const activeGrades = [...new Set(dbStudents.map(s => s.grade))].filter(Boolean);
        const mergedClasses = [...dbClasses];
        
        activeGrades.forEach(g => {
            if (!mergedClasses.find(c => c.grade === g)) {
                mergedClasses.push({
                    id: `draft-${g}`,
                    grade: g,
                    section: '',
                    room: '',
                    teacher: '',
                    subjects: 0
                });
            }
        });
        
        mergedClasses.sort((a,b) => a.grade.localeCompare(b.grade));
        
        setClasses(mergedClasses);
        setStudents(dbStudents);
        if (tchRes.data) setTeachersList(tchRes.data);
        setLoading(false);
    };

    const handleSave = async () => {
        let err = null;
        if (isEditing) {
            if (isEditing.startsWith('draft-')) {
                const { error } = await supabase.from('classes').insert([{
                    grade: editForm.grade, section: editForm.section, room: editForm.room,
                    teacher: editForm.teacher, assistant_teachers: editForm.assistant_teachers || [],
                    subjects: editForm.subjects || 0
                }]);
                err = error;
            } else {
                const { error } = await supabase.from('classes').update({
                    grade: editForm.grade, section: editForm.section, room: editForm.room,
                    teacher: editForm.teacher, assistant_teachers: editForm.assistant_teachers || [],
                    subjects: editForm.subjects || 0
                }).eq('id', isEditing);
                err = error;
            }
        } else {
            const { error } = await supabase.from('classes').insert([{
                grade: editForm.grade, section: editForm.section, room: editForm.room,
                teacher: editForm.teacher, assistant_teachers: editForm.assistant_teachers || [],
                subjects: editForm.subjects || 0
            }]);
            err = error;
        }

        if (err) {
            alert(`Database Error: ${err.message}\n(Ensure you created the classes table!)`);
        } else {
            setIsEditing(null);
            setEditForm({});
            fetchData();
        }
    };
    
    const handleDelete = async (cls: ClassData) => {
        if (cls.id.startsWith('draft-')) {
            alert("Draft classes can only be hidden by transferring all their associated students.");
            return;
        }
        if (confirm(`Are you sure you want to delete ${cls.grade} configuration?`)) {
            await supabase.from('classes').delete().eq('id', cls.id);
            fetchData();
        }
    };

    const handlePromote = async () => {
        if (!promoteTargetGrade.trim()) {
            alert("Please enter a target grade/class.");
            return;
        }
        if (promoteSelectedStudents.length === 0) {
            alert("Please select at least one student to promote.");
            return;
        }

        setIsPromoting(true);
        const { error } = await supabase
            .from('students')
            .update({ grade: promoteTargetGrade.trim() })
            .in('id', promoteSelectedStudents);

        setIsPromoting(false);
        if (error) {
            alert(`Failed to promote: ${error.message}`);
        } else {
            setShowPromoteModal(null);
            setPromoteTargetGrade('');
            setPromoteSelectedStudents([]);
            fetchData(); 
        }
    };

    const togglePromoteStudent = (id: string) => {
        setPromoteSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />

            <main style={{ flex: 1, padding: '24px', overflow: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                            Class Management
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Configure classes and manage student promotions elegantly.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons" style={{ fontSize: '20px' }}>class</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sections</div>
                            <div style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{classes.length}</div>
                        </div>
                    </div>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons" style={{ fontSize: '20px' }}>people</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students</div>
                            <div style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{students.length}</div>
                        </div>
                    </div>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons" style={{ fontSize: '20px' }}>meeting_room</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rooms</div>
                            <div style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{classes.filter(c => c.room && !c.id.startsWith('draft-')).length}</div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Loading schema...</div>
                ) : classes.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: '0.85rem', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>No students found to map classes. Enrol a student first.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {classes.map(cls => {
                            const myStudents = students.filter(s => s.grade === cls.grade);
                            const isDraft = cls.id.startsWith('draft-');
                            
                            return (
                                <div key={cls.id} style={{
                                    background: '#fff',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                    border: isDraft ? '1px dashed #f43f5e' : '1px solid #e2e8f0',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.04)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'; }}
                                >
                                    {isDraft && (
                                        <div style={{ background: '#fff1f2', color: '#e11d48', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: 6, display: 'inline-block', width: 'fit-content', border: '1px solid #ffe4e6' }}>
                                            ⚠️ Draft / Auto-Detected
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{cls.grade}</h2>
                                                {cls.section && (
                                                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>
                                                        Sec {cls.section}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.7rem', marginTop: '2px' }}>
                                                <span className="material-icons" style={{ fontSize: '12px' }}>meeting_room</span>
                                                {cls.room || 'No Room'}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => { setIsEditing(cls.id); setEditForm(cls); }} title="Edit Config" style={{ background: 'transparent', borderRadius: '6px', width: '28px', height: '28px', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                                                <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                                            </button>
                                            {!isDraft && (
                                                <button onClick={() => handleDelete(cls)} title="Delete Config" style={{ background: 'transparent', borderRadius: '6px', width: '28px', height: '28px', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                    <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                                                {cls.teacher ? cls.teacher.charAt(0) : '?'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Class Teacher (Head)</div>
                                                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>{cls.teacher || 'Not Assigned'}</div>
                                            </div>
                                        </div>
                                        {cls.assistant_teachers && cls.assistant_teachers.length > 0 && (
                                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {cls.assistant_teachers.map(t => (
                                                    <span key={t} style={{ fontSize: '0.6rem', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Enrolled</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {myStudents.length}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Subjects</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {cls.subjects}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                        <button onClick={() => setShowStudentsModal(cls)} style={{ flex: 1, padding: '8px', background: '#fff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                            <span className="material-icons" style={{ fontSize: '14px', color: '#64748b' }}>badge</span> Roster
                                        </button>
                                        <button onClick={() => {
                                            setShowPromoteModal(cls);
                                            setPromoteSelectedStudents(myStudents.map(s => s.id));
                                        }} style={{ flex: 1, padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#2563eb'} onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}>
                                            <span className="material-icons" style={{ fontSize: '14px' }}>upgrade</span> Promote
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Edit Modal */}
                {isEditing && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontFamily: 'Manrope', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                    Config: {editForm.grade}
                                </h2>
                                <button onClick={() => setIsEditing(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: '18px' }}>close</span></button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Section / Wing</label>
                                    <input type="text" value={editForm.section || ''} onChange={e => setEditForm({...editForm, section: e.target.value})} placeholder="e.g. Science, A" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.8rem' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Class Teacher (Head / Attendance)</label>
                                    <select value={editForm.teacher || ''} onChange={e => setEditForm({...editForm, teacher: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', fontSize: '0.8rem' }}>
                                        <option value="">— Select Head Teacher —</option>
                                        {teachersList.map((t, idx) => <option key={t.id || idx} value={t.full_name}>{t.full_name}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Assistant Teachers (Multiple)</label>
                                    <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#fff' }}>
                                        {teachersList.map(t => {
                                            const isSelected = (editForm.assistant_teachers || []).includes(t.full_name);
                                            return (
                                                <div key={t.id} onClick={() => {
                                                    const current = editForm.assistant_teachers || [];
                                                    const next = current.includes(t.full_name) 
                                                        ? current.filter(x => x !== t.full_name) 
                                                        : [...current, t.full_name];
                                                    setEditForm({...editForm, assistant_teachers: next});
                                                }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', cursor: 'pointer', background: isSelected ? '#f1f5f9' : 'transparent', borderRadius: '4px', marginBottom: '2px' }}>
                                                    <div style={{ width: '14px', height: '14px', border: '1px solid #cbd5e1', borderRadius: '3px', background: isSelected ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isSelected && <span className="material-icons" style={{ fontSize: '10px', color: '#fff' }}>check</span>}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>{t.full_name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Room</label>
                                        <input type="text" value={editForm.room || ''} onChange={e => setEditForm({...editForm, room: e.target.value})} placeholder="e.g. 101" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.8rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>Subjects</label>
                                        <input type="number" value={editForm.subjects || ''} onChange={e => setEditForm({...editForm, subjects: parseInt(e.target.value) || 0})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.8rem' }} />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSave} style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Save Changes</button>
                        </div>
                    </div>
                )}

                {/* Students Modal */}
                {showStudentsModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowStudentsModal(null)}>
                        <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontFamily: 'Manrope', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                    {showStudentsModal.grade} Roster
                                </h2>
                                <button onClick={() => setShowStudentsModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: '18px' }}>close</span></button>
                            </div>
                            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(() => {
                                    const linkedStudents = students.filter(s => s.grade === showStudentsModal.grade);
                                    if(linkedStudents.length === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>No students.</div>;
                                    return linkedStudents.map(stu => (
                                        <div key={stu.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                {stu.full_name ? stu.full_name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>{stu.full_name}</div>
                                                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ID: {stu.student_id}</div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Promote Modal */}
                {showPromoteModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowPromoteModal(null)}>
                        <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', borderRadius: '16px 16px 0 0' }}>
                                <div>
                                    <h2 style={{ fontFamily: 'Manrope', fontSize: '1.1rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>upgrade</span>
                                        Promote Class: {showPromoteModal.grade}
                                    </h2>
                                    <p style={{ fontSize: '0.7rem', color: '#15803d', marginTop: '2px' }}>Move students to the next grade</p>
                                </div>
                                <button onClick={() => setShowPromoteModal(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: '18px' }}>close</span></button>
                            </div>
                            
                            <div style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Target Grade / Class Name</label>
                                    <input 
                                        type="text" 
                                        value={promoteTargetGrade} 
                                        onChange={e => setPromoteTargetGrade(e.target.value)} 
                                        placeholder="e.g. Grade 2" 
                                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem', width: '100%' }} 
                                    />
                                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>If the grade doesn't exist, it will be auto-detected later.</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Select Students to Promote</span>
                                    <button 
                                        onClick={() => {
                                            const allIds = students.filter(s => s.grade === showPromoteModal.grade).map(s => s.id);
                                            if (promoteSelectedStudents.length === allIds.length) {
                                                setPromoteSelectedStudents([]);
                                            } else {
                                                setPromoteSelectedStudents(allIds);
                                            }
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {promoteSelectedStudents.length === students.filter(s => s.grade === showPromoteModal.grade).length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                                    {(() => {
                                        const myStudents = students.filter(s => s.grade === showPromoteModal.grade);
                                        if(myStudents.length === 0) return <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>No students available.</div>;
                                        
                                        return myStudents.map(stu => {
                                            const isSelected = promoteSelectedStudents.includes(stu.id);
                                            return (
                                                <div key={stu.id} onClick={() => togglePromoteStudent(stu.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isSelected ? '#f0fdf4' : '#fff', transition: 'background 0.2s' }}>
                                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isSelected ? '#22c55e' : '#cbd5e1'}`, background: isSelected ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isSelected && <span className="material-icons" style={{ fontSize: '14px', color: '#fff' }}>check</span>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? '#166534' : '#334155' }}>{stu.full_name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: isSelected ? '#15803d' : '#64748b' }}>ID: {stu.student_id}</div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                            
                            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                                <button onClick={() => setShowPromoteModal(null)} style={{ padding: '8px 16px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handlePromote} disabled={isPromoting || promoteSelectedStudents.length === 0} style={{ padding: '8px 20px', background: promoteSelectedStudents.length > 0 ? '#22c55e' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: promoteSelectedStudents.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {isPromoting ? 'Processing...' : `Promote ${promoteSelectedStudents.length} Student(s)`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
