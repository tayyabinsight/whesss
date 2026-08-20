'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type Teacher = { id: string; teacher_id: string; full_name: string; subject: string; qualification: string; phone: string; status: string; contract: string; performance: number; base_salary: number; };

const statusStyles: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    'active': { bg: '#e8f5e9', color: '#2e7d32', dot: '#2e7d32', label: 'Active' },
    'on leave': { bg: '#fff8e1', color: '#f57f17', dot: '#f57f17', label: 'On Leave' },
    'inactive': { bg: '#ffebee', color: '#c62828', dot: '#c62828', label: 'Inactive' },
};

const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--surface-container)', border: '1.5px solid var(--outline-variant)', borderRadius: 10, fontFamily: 'Inter', fontSize: '0.85rem', outline: 'none', color: 'var(--on-surface)', boxSizing: 'border-box' as const };
const labelStyle = { display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)' };

export default function TeacherManagement() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formQual, setFormQual] = useState('');
    const [formContact, setFormContact] = useState('');
    const [formSalary, setFormSalary] = useState(0);
    const [formContract, setFormContract] = useState('Full-Time');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchTeachers();
        const chan = supabase.channel('teachers_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, fetchTeachers).subscribe();
        return () => { supabase.removeChannel(chan); };
    }, []);

    const fetchTeachers = async () => {
        const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
        if (data) setTeachers(data);
    };

    const handleEmailAutoGenerate = (name: string) => {
        setFormName(name);
        if (name.trim().length > 0) {
            const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            setFormEmail(`${sanitized}@wisdom.faculty.com`);
        } else {
            setFormEmail('');
        }
    };

    const handleSave = async () => {
        if (!formName || !formEmail) {
            setErrorMsg('Name and ID (Email) are required.');
            return;
        }

        setProcessing(true);
        setErrorMsg('');

        try {
            if (!isEditing) {
                // Sign them up in Supabase Auth (Only for NEW teachers)
                const { error: authErr } = await supabase.auth.signUp({
                    email: formEmail,
                    password: formPassword || 'Wisdom#2026'
                });
                if (authErr) throw authErr;
            }

            const teacherData = {
                full_name: formName,
                teacher_id: formEmail,
                subject: formSubject || 'Assigned Pending',
                qualification: formQual || 'N/A',
                phone: formContact || 'N/A',
                contract: formContract,
                base_salary: formSalary,
                status: 'active',
                performance: 0.0
            };

            if (isEditing && selectedTeacherId) {
                const { error: updateErr } = await supabase.from('teachers').update(teacherData).eq('id', selectedTeacherId);
                if (updateErr) throw updateErr;
            } else {
                const { error: insertErr } = await supabase.from('teachers').insert([teacherData]);
                if (insertErr) throw insertErr;
            }

            setProcessing(false);
            setShowModal(false);
            resetForm();
            fetchTeachers();
        } catch (err: any) {
            setErrorMsg(err.message);
            setProcessing(false);
        }
    };

    const handleEdit = (t: Teacher) => {
        setIsEditing(true);
        setSelectedTeacherId(t.id);
        setFormName(t.full_name);
        setFormEmail(t.teacher_id);
        setFormSubject(t.subject);
        setFormQual(t.qualification);
        setFormContact(t.phone);
        setFormSalary(t.base_salary);
        setFormContract(t.contract);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormName(''); setFormEmail(''); setFormPassword(''); setFormSubject(''); 
        setFormQual(''); setFormContact(''); setFormSalary(0); setFormContract('Full-Time');
        setIsEditing(false); setSelectedTeacherId(null);
    };
    
    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to permanently remove this teacher record?")) {
            await supabase.from('teachers').delete().eq('id', id);
        }
    };

    const filtered = teachers.filter(t => {
        const mSearch = t.full_name.toLowerCase().includes(search.toLowerCase()) || (t.subject || '').toLowerCase().includes(search.toLowerCase()) || t.teacher_id.toLowerCase().includes(search.toLowerCase());
        const mFilter = filter === 'all' || t.status === filter;
        return mSearch && mFilter;
    });

    const stats = [
        { label: 'Total Faculty', value: teachers.length, icon: 'groups', color: '#0277bd', bg: '#e1f5fe' },
        { label: 'Active Staff', value: teachers.filter(t => t.status === 'active').length, icon: 'how_to_reg', color: '#2e7d32', bg: '#e8f5e9' },
        { label: 'On Leave', value: teachers.filter(t => t.status === 'on leave').length, icon: 'event_busy', color: '#f57f17', bg: '#fff8e1' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-container-lowest)' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            <main style={{ flex: 1, padding: '32px 40px', animation: 'fadeIn 0.3s ease-out', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Teacher Management</h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Live Database Hub: Automatically provision Faculty portal credentials.</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} style={{
                        padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none',
                        borderRadius: 10, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 800, fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <span className="material-icons" style={{ fontSize: 18 }}>person_add</span> Enrol Faculty Member
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                    {stats.map(s => (
                        <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                            <span className="material-icons" style={{ color: s.color, fontSize: 32 }}>{s.icon}</span>
                            <div>
                                <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.7rem', color: s.color, opacity: 0.8, fontWeight: 600 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span className="material-icons" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'var(--on-surface-variant)' }}>search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search DB by name, ID, or subject..."
                            style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'var(--surface-container-low)', border: '1.5px solid var(--outline-variant)', borderRadius: 12, outline: 'none', fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--on-surface)', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-container-lowest)', borderBottom: '1px solid var(--outline-variant)' }}>
                                {['Faculty Account', 'Subject', 'Contract', 'Base Salary', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>No faculty recorded in the database match your criteria.</td>
                                </tr>
                            ) : filtered.map((t, i) => {
                                const st = statusStyles[t.status] || statusStyles['active'];
                                return (
                                    <tr key={t.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--surface-container)' }}>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontFamily: 'Manrope', fontWeight: 800, fontSize: '1rem' }}>
                                                    {t.full_name ? t.full_name.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '0.85rem' }}>{t.full_name}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>ID: {t.teacher_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontWeight: 600 }}>{t.subject || '—'}</td>
                                        <td style={{ padding: '12px 20px', fontSize: '0.75rem' }}>{t.contract}</td>
                                        <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>Rs {t.base_salary?.toLocaleString() || 0}</td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ background: st.bg, color: st.color, padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} /> {st.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => handleEdit(t)} style={{ padding: '6px', background: 'var(--surface-container)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--on-surface-variant)' }}><span className="material-icons" style={{ fontSize: 16 }}>edit</span></button>
                                                <button onClick={() => handleDelete(t.id)} style={{ padding: '6px', background: '#ffebee', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#c62828' }}><span className="material-icons" style={{ fontSize: 16 }}>delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* DB Add Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(25,28,29,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 550, boxShadow: '0 32px 80px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div>
                                    <h2 style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{isEditing ? 'Update Faculty Member' : 'Add Faculty Member'}</h2>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{isEditing ? 'Modify existing teacher credentials.' : 'Creates their DB row AND assigns Auth portal access.'}</p>
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}><span className="material-icons">close</span></button>
                            </div>

                            {errorMsg && <div style={{ padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 8, fontSize: '0.8rem', marginBottom: 16, fontWeight: 600 }}>{errorMsg}</div>}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Full Name</label>
                                    <input type="text" value={formName} onChange={e => handleEmailAutoGenerate(e.target.value)} placeholder="e.g. Dr. Sarah Jenkins" style={inputStyle} />
                                </div>
                                
                                <div style={{ gridColumn: 'span 2', background: '#f5f5f5', padding: '16px', borderRadius: 12, border: '1px solid #e0e0e0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <span className="material-icons" style={{ color: '#1976d2' }}>lock_person</span>
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1976d2' }}>Portal Authentication Setup</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={labelStyle}>Generated Faculty ID (Email)</label>
                                            <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="auto-generated@wisdom.faculty.com" style={{ ...inputStyle, background: '#e3f2fd', borderColor: '#bbdefb' }} />
                                            <p style={{ fontSize: '0.65rem', color: '#1565c0', marginTop: 6 }}>Used to login to portal.</p>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Setup Secure Password</label>
                                            <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={isEditing ? 'Leave blank to keep current' : '••••••••'} style={{ ...inputStyle, background: '#e3f2fd', borderColor: '#bbdefb' }} />
                                            {!isEditing && <p style={{ fontSize: '0.65rem', color: '#1565c0', marginTop: 6 }}>Provide this to the teacher.</p>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label style={labelStyle}>Basic Monthly Salary (Rs)</label>
                                    <input type="number" value={formSalary} onChange={e => setFormSalary(parseInt(e.target.value))} placeholder="e.g. 45000" style={{ ...inputStyle, fontWeight: 900, color: '#1b5e20' }} />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label style={labelStyle}>Contract Type</label>
                                    <select value={formContract} onChange={e => setFormContract(e.target.value)} style={inputStyle}>
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Visiting Faculty">Visiting Faculty</option>
                                        <option value="Contractual">Contractual</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Subject Specialization</label>
                                    <input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="e.g. Physics, Mathematics" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Qualification</label>
                                    <input type="text" value={formQual} onChange={e => setFormQual(e.target.value)} placeholder="e.g. MS in Physics" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>External Phone #</label>
                                    <input type="text" value={formContact} onChange={e => setFormContact(e.target.value)} placeholder="+92 ..." style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: '14px', background: 'var(--surface-container-high)', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 800, color: 'var(--on-surface)' }}>Cancel</button>
                                <button onClick={handleSave} disabled={processing} style={{ flex: 2, padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 800 }}>
                                    {processing ? 'Processing DB...' : (isEditing ? 'Update Profile' : 'Confirm Enrollment')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <style dangerouslySetInnerHTML={{__html:`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}} />
            </main>
        </div>
    );
}
