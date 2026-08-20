'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
    icon: string;
    label: string;
    href: string;
}

interface SidebarProps {
    role: 'admin' | 'teacher' | 'student';
    userName: string;
    userSubtitle: string;
}

const adminNav: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
    { icon: 'account_balance', label: 'Fee System', href: '/admin/fee-system/dashboard' },
    { icon: 'school', label: 'Classes', href: '/admin/classes' },
    { icon: 'group', label: 'Student Management', href: '/admin/students' },
    { icon: 'co_present', label: 'Teacher Management', href: '/admin/teachers' },
    { icon: 'account_balance_wallet', label: 'Salary System', href: '/admin/salary' },
    { icon: 'how_to_reg', label: 'Teacher Attendance', href: '/admin/teacher-attendance' },
    { icon: 'receipt_long', label: 'Expenses', href: '/admin/expenses' },
    { icon: 'library_books', label: 'Courses', href: '/admin/courses' },
    { icon: 'help', label: 'Support', href: '/admin/support' },
    { icon: 'fingerprint', label: 'Attendance Portal', href: '/attendance-login' },
];

const teacherNav: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', href: '/teacher/dashboard' },
    { icon: 'school', label: 'Classes', href: '/teacher/classes' },
    { icon: 'group', label: 'Students', href: '/teacher/students' },
    { icon: 'assignment', label: 'Assignments', href: '/teacher/assignments' },
    { icon: 'campaign', label: 'Announcements', href: '/teacher/announcements' },
];

const studentNav: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', href: '/student/dashboard' },
    { icon: 'menu_book', label: 'Academics', href: '/student/academics' },
    { icon: 'payments', label: 'Fees', href: '/student/fees' },
    { icon: 'assignment', label: 'Assignments', href: '/student/assignments' },
    { icon: 'event', label: 'Schedule', href: '/student/schedule' },
    { icon: 'settings', label: 'Settings', href: '/student/settings' },
];

const navByRole = { admin: adminNav, teacher: teacherNav, student: studentNav };

export default function Sidebar({ role, userName, userSubtitle }: SidebarProps) {
    const pathname = usePathname();
    const navItems = navByRole[role];
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[var(--primary)] text-white sticky top-0 z-30 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--secondary-container)] to-[var(--tertiary-container)] flex items-center justify-center font-bold text-[var(--primary)] text-sm">
                        {userName.charAt(0)}
                    </div>
                    <div>
                        <div className="font-['Manrope'] font-bold text-[1rem] leading-none">Wisdom House</div>
                    </div>
                </div>
                <button onClick={() => setMobileOpen(true)} className="p-1 rounded-md bg-white/10 flex items-center justify-center">
                    <span className="material-icons">menu</span>
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
                    onClick={() => setMobileOpen(false)} 
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--primary)] transition-all duration-300 ease-in-out md:sticky md:top-0 h-[100dvh] overflow-hidden ${
                    mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'
                }`}
                style={{ width: !mobileOpen ? (collapsed ? '72px' : '256px') : undefined }}
            >
            {/* Logo */}
            <div style={{
                padding: '24px 20px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: collapsed ? 'center' : 'space-between',
            }}>
                {!collapsed && (
                    <div>
                        <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>
                            Wisdom House
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>
                            Academic Atelier
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.7)',
                        flexShrink: 0,
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                    <span className="material-icons" style={{ fontSize: '18px' }}>
                        {collapsed ? 'menu_open' : 'menu'}
                    </span>
                </button>
            </div>

            {/* User card */}
            {!collapsed && (
                <div style={{
                    margin: '16px 12px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}>
                    <div style={{
                        width: '38px', height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--secondary-container), var(--tertiary-container))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.9rem',
                        color: 'var(--primary)', flexShrink: 0,
                    }}>
                        {userName.charAt(0)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {userName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{userSubtitle}</div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: collapsed ? '10px 0' : '10px 12px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                borderRadius: '10px',
                                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 600 : 400,
                                fontFamily: 'Inter',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                                    (e.currentTarget as HTMLElement).style.color = '#fff';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                                }
                            }}
                        >
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '3px',
                                    height: '60%',
                                    background: 'var(--secondary-container)',
                                    borderRadius: '0 3px 3px 0',
                                }} />
                            )}
                            <span className="material-icons" style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Link
                    href="/"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: collapsed ? '10px 0' : '10px 12px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: '10px',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.875rem',
                        fontFamily: 'Inter',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(186,26,26,0.15)';
                        (e.currentTarget as HTMLElement).style.color = '#ff8a80';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                    }}
                >
                    <span className="material-icons" style={{ fontSize: '20px' }}>logout</span>
                    {!collapsed && <span>Logout</span>}
                </Link>
            </div>
        </aside>
        </>
    );
}
