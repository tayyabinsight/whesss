'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

const CLASSES = ['All', 'Mont', 'Nursery', 'Prep I', 'Prep II', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class Matric'];

type Student = {
    id?: string;
    student_id: string;
    full_name: string;
    grade: string;
    guardian_name: string;
    contact_number: string;
    secondary_phone: string;
    home_address: string;
    status: 'active' | 'suspended' | 'left';
    base_fee: number;
    fee_type: string;
    password?: string;
    fee_total?: number;
    admission_date?: string;
    leaving_date?: string;
};

export default function StudentManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState('All');
    const [search, setSearch] = useState('');
    const [dbError, setDbError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    
    const [form, setForm] = useState({
        full_name: '', grade: 'Mont', guardian_name: '', contact_number: '', 
        secondary_phone: '', home_address: '', base_fee: 3500, fee_type: 'Monthly', 
        password: '', status: 'active' as 'active' | 'suspended' | 'left'
    });

    const [generatedEmail, setGeneratedEmail] = useState('');
    const [emailStatus, setEmailStatus] = useState<'checking' | 'unique' | 'exists' | 'idle'>('idle');

    useEffect(() => {
        fetchStudents();
        const channel = supabase.channel('realtime_students')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
                fetchStudents();
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (error) {
            setDbError("Database error. Using mock data.");
            setStudents([{ student_id: 'ali@whes.students.com', full_name: 'Ali Khan', grade: 'Class 5', guardian_name: 'Mr. Khan', contact_number: '0300-1234567', secondary_phone: '', home_address: '123 Street', status: 'active', base_fee: 4500, fee_type: 'Monthly', password: 'password123', fee_total: 9500 }]);
        } else {
            setDbError(null);
            setStudents(data || []);
        }
        setLoading(false);
    };

    const checkEmailUniqueness = async (email: string) => {
        if (!email || isEditing) return;
        setEmailStatus('checking');
        const { data, error } = await supabase.from('students').select('id').eq('student_id', email).maybeSingle();
        if (data) {
            setEmailStatus('exists');
        } else {
            setEmailStatus('unique');
        }
    };

    // Auto-generation logic
    useEffect(() => {
        if (form.full_name && !isEditing) {
            const first = form.full_name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            const random = Math.floor(100 + Math.random() * 900);
            const email = `${first}.${random}@whes.edu`;
            setGeneratedEmail(email);
        }
    }, [form.full_name, isEditing]);

    // Uniqueness check logic (debounced via useEffect)
    useEffect(() => {
        if (!generatedEmail || isEditing) return;
        
        const timer = setTimeout(() => {
            checkEmailUniqueness(generatedEmail);
        }, 800);

        return () => clearTimeout(timer);
    }, [generatedEmail, isEditing]);

    const handleSaveStudent = async () => {
        if (!form.full_name || !form.grade) return alert('Full Name and Grade are required.');
        if (emailStatus === 'exists' && !isEditing) return alert('This Portal ID is already taken. Please choose a unique one.');

        const studentData: any = {
            student_id: generatedEmail,
            full_name: form.full_name,
            grade: form.grade,
            guardian_name: form.guardian_name,
            contact_number: form.contact_number,
            secondary_phone: form.secondary_phone,
            home_address: form.home_address,
            base_fee: form.base_fee,
            fee_type: form.fee_type,
            password: form.password,
            status: form.status
        };

        setLoading(true);
        try {
            if (isEditing && selectedStudentId) {
                const { error } = await supabase.from('students').update(studentData).eq('id', selectedStudentId);
                if (error) throw error;
                alert('Student profile updated.');
            } else {
                const { error } = await supabase.from('students').insert([studentData]);
                if (error) throw error;
                
                // If password provided, handle Auth (Optional/Background)
                if (form.password) {
                    await supabase.auth.signUp({
                        email: generatedEmail,
                        password: form.password,
                        options: { data: { role: 'student', full_name: form.full_name } }
                    });
                }
                alert('New student enrolled successfully.');
            }
            fetchStudents();
            closeModal();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };

    const handleEdit = (s: Student) => {
        setIsEditing(true);
        setSelectedStudentId(s.id || null);
        setGeneratedEmail(s.student_id);
        setEmailStatus('idle');
        setForm({
            full_name: s.full_name || '',
            grade: s.grade || 'Nursery',
            guardian_name: s.guardian_name || '',
            contact_number: s.contact_number || '',
            secondary_phone: s.secondary_phone || '',
            home_address: s.home_address || '',
            base_fee: s.base_fee || 0,
            fee_type: s.fee_type || 'Monthly',
            password: s.password || '',
            status: s.status || 'active'
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you absolutely sure you want to remove ${name}?`)) return;
        setLoading(true);
        try {
            await supabase.from('fee_payments').delete().eq('student_id', id);
            await supabase.from('student_fees').delete().eq('student_id', id);
            await supabase.from('fee_vouchers').delete().eq('student_id', id);
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;
            alert('Record deleted.');
            fetchStudents();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setSelectedStudentId(null);
        setForm({ full_name: '', grade: 'Mont', guardian_name: '', contact_number: '', secondary_phone: '', home_address: '', base_fee: 3500, fee_type: 'Monthly', password: '', status: 'active' });
        setGeneratedEmail('');
        setEmailStatus('idle');
    };

    const filtered = students.filter(s => {
        const mClass = filterClass === 'All' || s.grade === filterClass || (filterClass === 'Free' && Number(s.base_fee) === 0);
        const mSearch = (s.full_name || '').toLowerCase().includes(search.toLowerCase()) || (s.student_id || '').toLowerCase().includes(search.toLowerCase());
        return mClass && mSearch;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#1a1c1e' }}>Student Management</h1>
                        <p style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>Enroll, audit, and manage student credentials.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                                printWindow.document.write(`
                                    <html>
                                        <head>
                                            <title>Class List - ${filterClass}</title>
                                            <style>
                                                body { font-family: 'Inter', sans-serif; padding: 40px; }
                                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
                                                th { background-color: #f2f2f2; font-weight: bold; }
                                                h1 { font-family: 'Manrope', sans-serif; text-align: center; margin-bottom: 0; }
                                                .header-info { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
                                            </style>
                                        </head>
                                        <body>
                                            <h1>WISDOM HOUSE ELEMENTARY SCHOOL</h1>
                                            <div class="header-info">Class: ${filterClass} | Date: ${new Date().toLocaleDateString()}</div>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th style="width: 50px">Sr.</th>
                                                        <th>Student Name</th>
                                                        <th>Guardian Name</th>
                                                        <th>Contact Number</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${filtered.map((s, i) => `
                                                        <tr>
                                                            <td>${i + 1}</td>
                                                            <td>${s.full_name}</td>
                                                            <td>${s.guardian_name}</td>
                                                            <td>${s.contact_number}</td>
                                                            <td>${s.status.toUpperCase()}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </body>
                                    </html>
                                `);
                                printWindow.document.close();
                                printWindow.print();
                            }
                        }} style={{ padding: '10px 20px', background: '#fff', color: '#1a1c1e', border: '1.5px solid #eee', borderRadius: 16, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-icons" style={{ fontSize: 18 }}>print</span> Print ${filterClass} List
                        </button>
                        <button onClick={() => { setIsEditing(false); setShowModal(true); }} style={{ padding: '10px 24px', background: '#1a1c1e', color: '#fff', border: 'none', borderRadius: 16, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 850, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <span className="material-icons" style={{ fontSize: 18 }}>person_add</span> Enrol Student
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ position: 'relative', flexShrink: 0, width: 320 }}>
                        <span className="material-icons" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 22, color: '#aaa' }}>search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID or Name..." style={{ width: '100%', padding: '14px 16px 14px 48px', background: '#fff', border: '1.5px solid #eee', borderRadius: 16, outline: 'none', fontFamily: 'Inter', fontSize: '0.9rem', fontWeight: 600 }} />
                    </div>
                    <div style={{ display: 'flex', background: '#eee', borderRadius: 16, padding: 3, overflowX: 'auto', flex: 1, whiteSpace: 'nowrap' }}>
                        {CLASSES.map(c => (
                            <button key={c} onClick={() => setFilterClass(c)} style={{ padding: '8px 16px', background: filterClass === c ? '#fff' : 'transparent', color: filterClass === c ? '#1a1c1e' : '#666', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', transition: '0.3s' }}>{c}</button>
                        ))}
                        <button onClick={() => setFilterClass('Free')} style={{ padding: '8px 16px', background: filterClass === 'Free' ? '#1a1c1e' : 'transparent', color: filterClass === 'Free' ? '#fff' : '#cf1322', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 900, fontSize: '0.75rem', transition: '0.3s' }}>FREE</button>
                    </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 32, border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #eee' }}>
                                {['Student', 'Grade', 'Portal Access', 'Guardian', 'Fee', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !students.length ? (
                                <tr><td colSpan={7} style={{ padding: 100, textAlign: 'center' }}><span className="material-icons spinning">sync</span></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: 100, textAlign: 'center', color: '#ccc', fontWeight: 800 }}>No students found.</td></tr>
                            ) : filtered.map((s, i) => (
                                <tr key={s.id || s.student_id} style={{ borderBottom: '1px solid #f8f8f8', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '0.85rem' }}>{s.full_name.charAt(0)}</div>
                                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{s.full_name}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 20px', fontSize: '0.8rem', fontWeight: 800 }}>{s.grade}</td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#1a1c1e', fontWeight: 800 }}>{s.student_id}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>PWD: {s.password || '---'}</div>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{s.guardian_name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600 }}>{s.contact_number}</div>
                                    </td>
                                    <td style={{ padding: '12px 20px', fontWeight: 900, color: '#2e7d32', fontSize: '0.85rem' }}>Rs {s.base_fee}</td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <span style={{ padding: '4px 10px', background: s.status === 'active' ? '#e6fffa' : (s.status === 'left' ? '#fff7e6' : '#fff1f0'), color: s.status === 'active' ? '#047481' : (s.status === 'left' ? '#d46b08' : '#cf1322'), borderRadius: 10, fontSize: '0.65rem', fontWeight: 950 }}>{s.status?.toUpperCase()}</span>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleEdit(s)} style={{ padding: '8px', background: '#f0f0f0', border: 'none', borderRadius: 10, cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: 18 }}>edit</span></button>
                                            <button onClick={() => handleDelete(s.id!, s.full_name)} style={{ padding: '8px', background: '#fff1f0', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#cf1322' }}><span className="material-icons" style={{ fontSize: 18 }}>delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', borderRadius: 40, width: '95%', maxWidth: 900, height: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '32px 48px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>{isEditing ? 'Modify Student' : 'Enrol New Student'}</h2>
                                    <p style={{ margin: '4px 0 0 0', color: '#888', fontWeight: 600 }}>Fill in the academic and institutional details.</p>
                                </div>
                                <button onClick={closeModal} style={{ border: 'none', background: '#f5f5f5', borderRadius: '18px', width: 44, height: 44, cursor: 'pointer' }}><span className="material-icons">close</span></button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <h4 style={{ margin: 0, fontWeight: 950, fontSize: '0.8rem', textTransform: 'uppercase', color: '#aaa', letterSpacing: '1px' }}>1. Basic Information</h4>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: 6, display: 'block' }}>FULL NAME</label>
                                            <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Ali Khan" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontWeight: 700, fontSize: '0.9rem' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: 6, display: 'block' }}>CLASS GRADE</label>
                                                <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {CLASSES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: 6, display: 'block' }}>STUDENT STATUS</label>
                                                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    <option value="active">Active (Enrolled)</option>
                                                    <option value="left">Left (Withdrawn)</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: 6, display: 'block' }}>GUARDIAN</label>
                                                <input value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontWeight: 700, fontSize: '0.9rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: 6, display: 'block' }}>CONTACT</label>
                                                <input value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontWeight: 700, fontSize: '0.9rem' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <h4 style={{ margin: 0, fontWeight: 950, fontSize: '0.8rem', textTransform: 'uppercase', color: '#aaa', letterSpacing: '1px' }}>2. Authentication & Financials</h4>
                                        <div style={{ background: '#f8f9ff', padding: '16px', borderRadius: '16px', border: '1.5px solid #e0e4ff' }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 950, color: '#3f51b5' }}>PORTAL ID / EMAIL</label>
                                                    {emailStatus !== 'idle' && (
                                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: emailStatus === 'unique' ? '#2e7d32' : (emailStatus === 'exists' ? '#cf1322' : '#888'), textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            {emailStatus === 'checking' && <span className="material-icons spinning" style={{ fontSize: 10 }}>sync</span>}
                                                            {emailStatus === 'unique' ? 'Available' : (emailStatus === 'exists' ? 'Taken' : 'Checking')}
                                                        </span>
                                                    )}
                                                </div>
                                                <input 
                                                    value={generatedEmail} 
                                                    onChange={e => setGeneratedEmail(e.target.value)}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: emailStatus === 'exists' ? '2px solid #ffccc7' : '1.5px solid #d0d7ff', background: '#fff', outline: 'none', fontWeight: 800, color: emailStatus === 'exists' ? '#cf1322' : '#111', fontSize: '0.9rem' }} 
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 950, color: '#3f51b5', marginBottom: 6, display: 'block' }}>ACCESS PASSWORD</label>
                                                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="WHES#2026" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #d0d7ff', outline: 'none', fontWeight: 800, fontSize: '0.9rem' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 950, color: '#cf1322', marginBottom: 6, display: 'block' }}>BASE FEE (Rs)</label>
                                                <input type="number" value={form.base_fee} onChange={e => setForm({...form, base_fee: Number(e.target.value)})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ffa39e', outline: 'none', fontWeight: 950, color: '#cf1322', fontSize: '0.9rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 950, color: '#cf1322', marginBottom: 6, display: 'block' }}>FEE TYPE</label>
                                                <select value={form.fee_type} onChange={e => setForm({...form, fee_type: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #ffa39e', outline: 'none', fontWeight: 800, color: '#cf1322', fontSize: '0.9rem' }}>
                                                    <option value="Monthly">Monthly Paid</option>
                                                    <option value="Free">Free (Full Scholarship)</option>
                                                    <option value="Scholarship">Partial Scholarship</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600, margin: 0 }}>* Students with a 0 Base Fee will be automatically categorized as "Free" in reports.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: '32px 48px', background: '#fafafa', borderTop: '1px solid #eee', display: 'flex', gap: 16 }}>
                                <button onClick={closeModal} style={{ flex: 1, padding: 18, background: '#eee', color: '#666', border: 'none', borderRadius: '20px', fontWeight: 900, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleSaveStudent} disabled={emailStatus === 'exists' && !isEditing} style={{ flex: 2, padding: 18, background: emailStatus === 'exists' && !isEditing ? '#ccc' : '#1a1c1e', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 950, cursor: 'pointer' }}>
                                    {isEditing ? 'Update Profile' : 'Complete Enrolment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </div>
    );
}
