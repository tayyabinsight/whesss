'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AttendanceLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'attend@whes' && password === '123@whes') {
            localStorage.setItem('attendance_auth', 'true');
            router.push('/attendance-portal');
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            fontFamily: "'Inter', sans-serif",
            padding: '20px'
        }}>
            <div style={{ 
                background: '#fff', 
                padding: '40px', 
                borderRadius: '32px', 
                width: '100%', 
                maxWidth: '450px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <div style={{ 
                    width: '70px', 
                    height: '70px', 
                    background: '#f1f5f9', 
                    borderRadius: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px',
                    color: '#0f172a'
                }}>
                    <span className="material-icons" style={{ fontSize: '36px' }}>fingerprint</span>
                </div>
                
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Attendance Portal</h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '32px', fontWeight: 500 }}>Secure access for teacher attendance management.</p>

                {error && (
                    <div style={{ 
                        background: '#fef2f2', 
                        color: '#ef4444', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        marginBottom: '24px',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                        <input 
                            type="text" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="attend@whes"
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px 18px', 
                                borderRadius: '14px', 
                                border: '2px solid #f1f5f9', 
                                outline: 'none', 
                                fontSize: '1rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }} 
                            onFocus={(e) => e.target.style.borderColor = '#0f172a'}
                            onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px 18px', 
                                borderRadius: '14px', 
                                border: '2px solid #f1f5f9', 
                                outline: 'none', 
                                fontSize: '1rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }} 
                            onFocus={(e) => e.target.style.borderColor = '#0f172a'}
                            onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={{ 
                            width: '100%', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            border: 'none', 
                            background: '#0f172a', 
                            color: '#fff', 
                            fontSize: '1rem', 
                            fontWeight: 800, 
                            cursor: 'pointer',
                            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
                            transition: 'transform 0.2s, background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Login to Portal
                    </button>
                </form>

                <div style={{ marginTop: '32px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                    &copy; 2026 Wisdom House English School
                </div>
            </div>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
            `}</style>
        </div>
    );
}
