'use client';

interface StatCardProps {
    icon: string;
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    accentColor?: string;
}

export default function StatCard({ icon, label, value, trend, trendUp, accentColor }: StatCardProps) {
    return (
        <div
            style={{
                background: 'var(--surface-container-lowest)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 12px 32px -4px rgba(25,28,29,0.06)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                animation: 'fadeIn 0.4s ease-out forwards',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px -8px rgba(25,28,29,0.1)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px -4px rgba(25,28,29,0.06)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                    width: '44px', height: '44px',
                    borderRadius: '12px',
                    background: accentColor ? `${accentColor}18` : 'var(--primary-fixed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span className="material-icons" style={{ fontSize: '22px', color: accentColor || 'var(--primary)' }}>{icon}</span>
                </div>
                {trend && (
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: trendUp ? '#2e7d32' : '#c62828',
                        background: trendUp ? '#e8f5e9' : '#ffebee',
                        padding: '3px 8px',
                        borderRadius: '20px',
                    }}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
            <div style={{ fontFamily: 'Manrope', fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '4px', fontWeight: 500 }}>
                {label}
            </div>
        </div>
    );
}
