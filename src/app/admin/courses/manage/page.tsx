'use client';
import CourseLayout from '../CourseLayout';
import Link from 'next/link';

export default function ManageCourseInvoices() {
    return (
        <CourseLayout>
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: 'Manrope', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Manage/Edit Invoices</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Modify or cancel existing course distribution records</p>
                </div>

                <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 24, padding: 40, textAlign: 'center', border: '2px dashed var(--surface-container-high)', boxShadow: '0 4px 16px rgba(25,28,29,0.03)' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <span className="material-icons" style={{ fontSize: 40, color: 'var(--on-secondary-container)' }}>construction</span>
                    </div>
                    <h2 style={{ fontFamily: 'Manrope', fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>Under Implementation</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
                        The editing and deletion module for course invoices is being refined to ensure inventory integrity.
                    </p>
                    <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '12px 32px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Manrope', fontWeight: 700, cursor: 'pointer' }}>
                            Go Back to Dashboard
                        </button>
                    </Link>
                </div>
            </div>
        </CourseLayout>
    );
}
