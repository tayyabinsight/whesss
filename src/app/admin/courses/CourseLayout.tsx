'use client';
import Sidebar from '@/components/Sidebar';
import { ReactNode } from 'react';

export default function CourseLayout({ children }: { children: ReactNode }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-container-low)' }}>
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
