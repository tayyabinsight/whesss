'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export default function StudentSettings() {
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            // Simulate logged-in student (fetch first active one)
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('status', 'active')
                .limit(1);

            if (error) throw error;
            
            if (data && data.length > 0) {
                setStudent(data[0]);
                setPassword(data[0].password || '123456'); // Fallback if no password set
            }
        } catch (error: any) {
            console.error('Error fetching student:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePassword = async () => {
        if (!student) return;
        if (password.length < 4) {
            setMessage('Password must be at least 4 characters.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('students')
                .update({ password })
                .eq('id', student.id);

            if (error) throw error;
            setMessage('Password updated successfully!');
        } catch (error: any) {
            console.error('Error saving password:', error);
            setMessage('Failed to update password.');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[var(--surface-container-low)]">
            <Sidebar 
                role="student" 
                userName={student ? student.full_name : 'Loading...'} 
                userSubtitle={student ? `Grade: ${student.grade} | ID: ${student.student_id.split('@')[0]}` : ''} 
            />

            <main className="flex-1 p-4 md:p-8 overflow-auto w-full">
                <div className="mb-8">
                    <h1 className="font-['Manrope'] text-2xl md:text-3xl font-bold tracking-tight mb-2">Account Settings</h1>
                    <p className="text-[var(--on-surface-variant)] text-sm md:text-base">View your profile details and manage your security credentials.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !student ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[var(--outline-variant)]">
                        <span className="material-icons text-5xl text-[var(--outline)] mb-4">account_circle</span>
                        <h2 className="font-['Manrope'] text-xl font-bold mb-2">No Profile Found</h2>
                        <p className="text-[var(--on-surface-variant)]">Could not load your student profile.</p>
                    </div>
                ) : (
                    <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {/* Profile Info (2 Columns on Desktop) */}
                        <div className="md:col-span-2 flex flex-col gap-6">
                            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[var(--outline-variant)]">
                                <h2 className="font-['Manrope'] text-xl font-bold mb-6 flex items-center gap-2">
                                    <span className="material-icons text-[var(--primary)]">badge</span>
                                    Student Profile
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Full Name</label>
                                        <div className="font-semibold text-lg text-[var(--on-surface)]">{student.full_name}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Student ID (Login)</label>
                                        <div className="font-semibold text-lg text-[var(--on-surface)] bg-[var(--surface-container-low)] inline-block px-3 py-1 rounded-lg border border-[var(--outline-variant)]">
                                            {student.student_id}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Grade / Class</label>
                                        <div className="font-semibold text-lg text-[var(--on-surface)]">{student.grade}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Admission Date</label>
                                        <div className="font-semibold text-lg text-[var(--on-surface)]">
                                            {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2 pt-4 border-t border-[var(--outline-variant)]">
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Guardian Name</label>
                                        <div className="font-semibold text-lg text-[var(--on-surface)]">{student.guardian_name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Contact Number</label>
                                        <div className="font-semibold text-lg text-[var(--on-surface)]">{student.contact_number || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Secondary Phone</label>
                                        <div className="font-semibold text-[var(--on-surface-variant)]">{student.secondary_phone || 'N/A'}</div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-1">Home Address</label>
                                        <div className="font-semibold text-[var(--on-surface)]">{student.home_address || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security & Password (1 Column on Desktop) */}
                        <div className="md:col-span-1">
                            <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-6 shadow-sm border border-[var(--outline-variant)] sticky top-24">
                                <h2 className="font-['Manrope'] text-lg font-bold mb-6 flex items-center gap-2">
                                    <span className="material-icons text-[var(--secondary)]">security</span>
                                    Security Settings
                                </h2>

                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-[var(--on-surface-variant)] mb-2">Current Password</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 font-mono text-lg text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                            placeholder="Enter password"
                                        />
                                        <span className="material-icons absolute right-3 top-3.5 text-[var(--outline)]">visibility</span>
                                    </div>
                                    <p className="text-xs text-[var(--on-surface-variant)] mt-2 leading-relaxed">
                                        Your password is shown in plain text. You can edit the text above to change it.
                                    </p>
                                </div>

                                {message && (
                                    <div className={`p-3 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 ${message.includes('success') ? 'bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]' : 'bg-[var(--error-container)] text-[var(--error)] border border-[#ffdad6]'}`}>
                                        <span className="material-icons text-[18px]">{message.includes('success') ? 'check_circle' : 'error'}</span>
                                        {message}
                                    </div>
                                )}

                                <button 
                                    onClick={handleSavePassword}
                                    disabled={saving}
                                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <span className="material-icons animate-spin text-[20px]">refresh</span>
                                    ) : (
                                        <span className="material-icons text-[20px]">save</span>
                                    )}
                                    {saving ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
