'use client';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

const assignments = [
    { title: 'Chemistry Lab Report', subject: 'Chemistry', due: 'Tomorrow, 11:59 PM', status: 'pending', urgent: true },
    { title: 'Read Chapter 4: The Renaissance', subject: 'History', due: 'Friday, 9:00 AM', status: 'pending', urgent: false },
    { title: 'Calculus Problem Set #12', subject: 'Calculus II', due: 'Next Monday', status: 'pending', urgent: false },
    { title: 'Literature Essay Draft', subject: 'English Lit', due: 'Last Monday', status: 'submitted', urgent: false },
    { title: 'Physics Lab Safety Quiz', subject: 'Physics', due: 'Last Friday', status: 'graded', grade: '92%', urgent: false },
];

const grades = [
    { subject: 'Math', score: 88, grade: 'A-', trend: '+5%' },
    { subject: 'Science', score: 79, grade: 'B+', trend: '+2%' },
    { subject: 'English', score: 91, grade: 'A', trend: '+8%' },
    { subject: 'History', score: 74, grade: 'B', trend: '-1%' },
    { subject: 'Geography', score: 83, grade: 'B+', trend: '+3%' },
];

export default function StudentDashboard() {
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [paid, setPaid] = useState(false);

    const handlePay = () => {
        setPayModalOpen(false);
        setPaid(true);
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[var(--surface-container-low)]">
            <Sidebar role="student" userName="Eleanor Vance" userSubtitle="Student ID: 84920" />

            <main className="flex-1 p-4 md:p-8 overflow-auto w-full">
                {/* Welcome header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontFamily: 'Manrope', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                        Welcome back, Eleanor.
                    </h1>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
                        Here is your academic overview for the Fall Semester.
                    </p>
                </div>

                {/* Alert banner */}
                <div style={{
                    background: 'var(--error-container)',
                    borderRadius: '12px', padding: '14px 20px', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span className="material-icons" style={{ color: 'var(--error)', fontSize: '20px' }}>warning</span>
                    <div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#93000a' }}>Low Attendance Alert</span>
                        <span style={{ fontSize: '0.8rem', color: '#93000a', marginLeft: '8px' }}>Your attendance is 72%. Minimum required is 75%. Please see administration.</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Attendance */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(25,28,29,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Attendance</div>
                            <span className="material-icons" style={{ fontSize: '20px', color: 'var(--error)' }}>warning</span>
                        </div>
                        <div style={{ fontFamily: 'Manrope', fontSize: '2rem', fontWeight: 800, color: 'var(--error)', marginBottom: '8px' }}>72%</div>
                        <div style={{ height: '6px', background: 'var(--surface-container)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '72%', background: 'var(--error)', borderRadius: '3px' }} />
                        </div>
                    </div>

                    {/* Next class */}
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))', borderRadius: '16px', padding: '24px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>Next Class</div>
                        <div style={{ fontFamily: 'Manrope', fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Calculus II</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Room 304 · 2:00 PM</div>
                        <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px' }}>
                            <span className="material-icons" style={{ fontSize: '14px', color: 'var(--secondary-container)' }}>schedule</span>
                            <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>In 45 minutes</span>
                        </div>
                    </div>

                    {/* Average grade */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(25,28,29,0.05)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>Overall Average</div>
                        <div style={{ fontFamily: 'Manrope', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>85%</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600 }}>
                            <span className="material-icons" style={{ fontSize: '14px' }}>trending_up</span>
                            +5% vs last term
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    {/* Grades chart */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(25,28,29,0.05)' }}>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Latest Results</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '20px' }}>Core Subjects — Midterm Assessment</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {grades.map(g => (
                                <div key={g.subject}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{g.subject}</span>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: g.trend.startsWith('+') ? '#2e7d32' : '#c62828', fontWeight: 600 }}>{g.trend}</span>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '6px',
                                                background: g.score >= 85 ? 'var(--tertiary-container)' : 'var(--surface-container)',
                                                fontSize: '0.72rem', fontWeight: 700,
                                                color: g.score >= 85 ? 'var(--primary)' : 'var(--on-surface-variant)',
                                            }}>{g.grade}</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--surface-container)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${g.score}%`,
                                            background: g.score >= 85 ? 'var(--secondary)' : 'var(--primary-fixed-dim)',
                                            borderRadius: '4px', transition: 'width 1.2s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assignments */}
                    <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(25,28,29,0.05)' }}>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ fontSize: '18px', color: 'var(--secondary)' }}>assignment</span>
                            Homework & Assignments
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {assignments.map((a, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px', borderRadius: '10px',
                                    background: a.urgent ? 'rgba(186,26,26,0.05)' : 'var(--surface-container-low)',
                                }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                        background: a.status === 'graded' ? '#2e7d32' : a.status === 'submitted' ? 'var(--secondary)' : a.urgent ? 'var(--error)' : 'var(--outline)',
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{a.title}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{a.subject} · {a.due}</div>
                                    </div>
                                    {a.grade && <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.85rem', color: '#2e7d32' }}>{a.grade}</span>}
                                    {a.status === 'pending' && (
                                        <button style={{
                                            padding: '4px 10px', background: a.urgent ? 'var(--error)' : 'var(--primary)',
                                            color: '#fff', border: 'none', borderRadius: '7px',
                                            cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                                        }}>Submit</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fee + Advisor Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-1" style={{ background: 'var(--surface-container-lowest)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(25,28,29,0.05)' }}>
                        <h2 style={{ fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ fontSize: '18px', color: 'var(--secondary)' }}>payments</span>
                            Financial Overview
                        </h2>
                        {paid ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <span className="material-icons" style={{ fontSize: '48px', color: '#2e7d32', display: 'block', marginBottom: '10px' }}>check_circle</span>
                                <div style={{ fontFamily: 'Manrope', fontWeight: 700 }}>Payment Successful!</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontFamily: 'Manrope', fontSize: '1.5rem', fontWeight: 800, color: 'var(--error)', marginBottom: '4px' }}>$1,250.00</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
                                    <span className="material-icons" style={{ fontSize: '14px' }}>info</span>
                                    Pending Fees — Due by Oct 15th
                                </div>
                                <button onClick={() => setPayModalOpen(true)} style={{
                                    width: '100%', padding: '10px', background: 'var(--secondary-container)',
                                    color: 'var(--on-secondary-container)', border: 'none', borderRadius: '10px',
                                    cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.875rem',
                                }}>Pay Now</button>
                            </>
                        )}
                    </div>

                    <div className="md:col-span-2" style={{
                        background: 'linear-gradient(135deg, rgba(11,25,60,0.04), rgba(34,46,82,0.06))',
                        borderRadius: '16px', padding: '24px',
                        borderLeft: '4px solid var(--secondary)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span className="material-icons" style={{ fontSize: '18px', color: 'var(--secondary)' }}>lightbulb</span>
                            <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: '0.9rem' }}>Advisor Notes</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--on-surface)', marginBottom: '12px' }}>
                            Eleanor has shown remarkable improvement in Physics this semester. Continue to focus on practical lab applications.
                        </p>
                        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                            — Mr. Harrison, Academic Advisor
                        </div>
                        <blockquote style={{
                            marginTop: '16px', padding: '12px 16px',
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: '10px',
                            fontSize: '0.8rem', fontStyle: 'italic',
                            color: 'var(--on-surface-variant)', lineHeight: 1.6,
                        }}>
                            &ldquo;Education is not the learning of facts, but the training of the mind to think.&rdquo;
                        </blockquote>
                    </div>
                </div>

                {/* Pay modal */}
                {payModalOpen && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(25,28,29,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 999, backdropFilter: 'blur(4px)',
                    }} onClick={e => e.target === e.currentTarget && setPayModalOpen(false)}>
                        <div className="bg-[var(--surface-container-lowest)] rounded-[20px] p-6 md:p-8 w-[90%] md:w-full max-w-[400px] shadow-[0_32px_80px_rgba(25,28,29,0.2)] animate-fade-in mx-auto">
                            <h2 style={{ fontFamily: 'Manrope', fontWeight: 800, marginBottom: '6px' }}>Fee Payment</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '24px' }}>Wisdom House Education System</p>
                            <div style={{ padding: '16px', background: 'var(--surface-container)', borderRadius: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.825rem', color: 'var(--on-surface-variant)' }}>Tuition Fee (Q2)</span>
                                    <span style={{ fontWeight: 600 }}>$1,100.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.825rem', color: 'var(--on-surface-variant)' }}>Activity Fee</span>
                                    <span style={{ fontWeight: 600 }}>$150.00</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 700 }}>Total</span>
                                    <span style={{ fontFamily: 'Manrope', fontWeight: 800, color: 'var(--error)' }}>$1,250.00</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {['Card Number', 'Expiry / CVV'].map(f => (
                                    <input key={f} placeholder={f} style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-container-highest)', border: 'none', borderBottom: '2px solid var(--outline-variant)', borderRadius: '10px 10px 0 0', fontFamily: 'Inter', fontSize: '0.875rem', outline: 'none' }} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button onClick={() => setPayModalOpen(false)} style={{ flex: 1, padding: '11px', background: 'var(--surface-container)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Cancel</button>
                                <button onClick={handlePay} style={{ flex: 1, padding: '11px', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 700 }}>Pay $1,250</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
