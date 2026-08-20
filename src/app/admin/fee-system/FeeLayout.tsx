'use client';
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const feeSystemNav = [
    { name: 'Dashboard', href: '/admin/fee-system/dashboard', icon: 'space_dashboard' },
    { name: 'Student Data', href: '/admin/fee-system/students', icon: 'groups' },
    { name: 'Assign Fee', href: '/admin/fee-system/assign', icon: 'assignment_ind' },
    { name: 'Vouchers', href: '/admin/fee-system/vouchers', icon: 'receipt_long' },
    { name: 'Collect Fee', href: '/admin/fee-system/collect', icon: 'payments' },
    { name: 'Settings', href: '/admin/fee-system/settings', icon: 'settings' },
];

export default function FeeLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Internal Navigation Header */}
                <div style={{ 
                    padding: '12px 24px', 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>account_balance_wallet</span>
                        </div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', margin: 0 }}>
                            Fee Management
                        </h1>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                            {feeSystemNav.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        background: isActive ? '#fff' : 'transparent',
                                        color: isActive ? '#0f172a' : '#64748b',
                                        fontWeight: isActive ? 700 : 600,
                                        fontSize: '0.75rem',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        whiteSpace: 'nowrap',
                                        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                        textDecoration: 'none'
                                    }}>
                                        <span className="material-icons" style={{ fontSize: '16px' }}>{item.icon}</span>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => {
                                document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                                window.location.href = '/admin-auth';
                            }}
                            style={{ 
                                background: '#fee2e2', color: '#b91c1c', border: 'none', 
                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                fontWeight: 700, fontSize: '0.75rem'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '16px' }}>logout</span>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
