'use client';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface StubProps {
    role: 'admin' | 'teacher' | 'student';
    userName: string;
    userSubtitle: string;
    title: string;
    icon: string;
    description: string;
}

export function StubPage({ role, userName, userSubtitle, title, icon, description }: StubProps) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[var(--surface-container-low)]">
            <Sidebar role={role} userName={userName} userSubtitle={userSubtitle} />
            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                <div style={{ textAlign: 'center', maxWidth: '440px', animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px',
                        background: 'linear-gradient(135deg, var(--primary-fixed), var(--primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span className="material-icons" style={{ fontSize: '36px', color: 'var(--on-primary)' }}>{icon}</span>
                    </div>
                    <h1 style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                        {title}
                    </h1>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '28px' }}>
                        {description}
                    </p>
                    <div style={{
                        padding: '16px 24px', background: 'var(--surface-container-lowest)',
                        borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                        boxShadow: '0 4px 20px rgba(25,28,29,0.06)',
                    }}>
                        <span className="material-icons" style={{ fontSize: '18px', color: 'var(--secondary)' }}>construction</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                            Full implementation ready — data layer to connect
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}
