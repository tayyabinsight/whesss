'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

const mockAssignments = [
  { 
    id: 1, title: 'Chapter 4 Essay: Industrial Revolution', class: 'AP History (10-A)', 
    type: 'Essay', due: 'Today, 11:59 PM', submitted: 18, total: 28, 
    status: 'urgent', graded: 0, color: '#f12711' 
  },
  { 
    id: 2, title: 'Weekly Conceptual Quiz 2', class: 'Civics 101 (9-C)', 
    type: 'Quiz', due: 'Tomorrow, 08:00 AM', submitted: 22, total: 30, 
    status: 'active', graded: 5, color: '#f953c6' 
  },
  { 
    id: 3, title: 'Primary Source Analysis', class: 'AP History (11-A)', 
    type: 'Homework', due: 'Friday, 11:59 PM', submitted: 5, total: 28, 
    status: 'active', graded: 0, color: '#3a7bd5' 
  },
  { 
    id: 4, title: 'Calculus Derivative Practice Set', class: 'AP Calculus (12-B)', 
    type: 'Homework', due: 'Oct 15, 05:00 PM', submitted: 0, total: 22, 
    status: 'upcoming', graded: 0, color: '#00c6ff' 
  },
  { 
    id: 5, title: 'Chapter 3 Thematic Essay', class: 'AP History (10-A)', 
    type: 'Essay', due: 'Last Week', submitted: 28, total: 28, 
    status: 'completed', graded: 28, color: '#8e2de2' 
  }
];

export default function TeacherAssignments() {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filters = ['All', 'Action Required', 'Upcoming', 'Completed'];

  const filteredAssignments = mockAssignments.filter(a => {
    if (activeFilter === 'Action Required') return a.status === 'urgent' || (a.status === 'active' && a.submitted > 0 && a.graded < a.submitted);
    if (activeFilter === 'Upcoming') return a.status === 'upcoming' || a.status === 'active';
    if (activeFilter === 'Completed') return a.status === 'completed';
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-container-low)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar role="teacher" userName="Mr. Smith" userSubtitle="Teacher View" />

      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div className={`content-wrapper ${mounted ? 'active' : ''}`} style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header Section */}
          <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
              borderRadius: '20px',
              padding: '28px 32px',
              marginBottom: '32px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
          }} className="fade-in-up">
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <span className="material-icons" style={{ fontSize: '32px', color: '#fff' }}>assignment</span>
                  <h1 style={{ fontFamily: 'Manrope', fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                      Assignments
                  </h1>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.5 }}>
                    Create and manage assignments, homework, and quizzes for your classes. Track submission status and provide grades.
                </p>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <button style={{ 
                  background: '#fff', color: 'var(--primary)', border: 'none', padding: '14px 24px', 
                  borderRadius: '12px', fontWeight: 700, fontFamily: 'Inter', fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }} className="hover-scale">
                  <span className="material-icons" style={{ fontSize: '20px' }}>add_task</span>
                  Create Assignment
                </button>
              </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }} className="fade-in-up delay-1">
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'var(--error-container)', color: 'var(--error)' }}><span className="material-icons">notification_important</span></div>
              <div className="metric-content">
                <div className="metric-value">4</div>
                <div className="metric-label">Needs Grading</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'var(--primary-container)', color: 'var(--primary)' }}><span className="material-icons">pending_actions</span></div>
              <div className="metric-content">
                <div className="metric-value">3</div>
                <div className="metric-label">Active Assignments</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'var(--secondary-container)', color: 'var(--secondary)' }}><span className="material-icons">task_alt</span></div>
              <div className="metric-content">
                <div className="metric-value">85%</div>
                <div className="metric-label">Avg. Submission Rate</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }} className="fade-in-up delay-2">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Assignments Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in-up delay-2">
            {filteredAssignments.map((assignment, index) => (
              <div key={assignment.id} className="assignment-card">
                
                {assignment.status === 'urgent' && <div className="urgent-indicator"></div>}
                
                <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                  
                  {/* Left: Info */}
                  <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <span className="type-badge" style={{ color: assignment.color, backgroundColor: `${assignment.color}22` }}>
                        {assignment.type}
                      </span>
                      {assignment.status === 'urgent' && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--error)', background: 'var(--error-container)', padding: '2px 8px', borderRadius: '6px' }}>DUE SOON</span>
                      )}
                    </div>
                    
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Manrope' }}>
                      {assignment.title}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-icons" style={{ fontSize: '16px', opacity: 0.8 }}>class</span> {assignment.class}
                      <span style={{ opacity: 0.3 }}>|</span>
                      <span className="material-icons" style={{ fontSize: '16px', opacity: 0.8 }}>schedule</span> Due: {assignment.due}
                    </div>
                  </div>

                  {/* Middle: Progress */}
                  <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--surface-container-high)', borderRight: '1px solid var(--surface-container-high)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--on-surface)' }}>Submissions</span>
                      <span style={{ color: 'var(--primary)' }}>{assignment.submitted} / {assignment.total}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-container-high)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                      <div style={{ 
                        height: '100%', width: `${(assignment.submitted / assignment.total) * 100}%`, 
                        background: 'var(--primary)', borderRadius: '4px' 
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--on-surface-variant)' }}>
                        <strong style={{ color: 'var(--on-surface)' }}>{assignment.graded}</strong> Graded
                      </div>
                      <div style={{ color: 'var(--on-surface-variant)' }}>
                        <strong style={{ color: assignment.submitted > assignment.graded ? 'var(--secondary)' : 'var(--on-surface)' }}>
                          {assignment.submitted - assignment.graded}
                        </strong> To Grade
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ width: '220px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                    <button className="action-row-btn primary">
                      <span className="material-icons"> grading </span>
                      Grade Submissions
                    </button>
                    <button className="action-row-btn secondary">
                      <span className="material-icons"> edit </span>
                      Edit Details
                    </button>
                  </div>

                </div>
              </div>
            ))}
            
            {filteredAssignments.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--on-surface-variant)', background: 'var(--surface-container-lowest)', borderRadius: '16px', border: '1px dashed var(--surface-container-high)' }}>
                <span className="material-icons" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>assignment_turned_in</span>
                <p style={{ margin: 0, fontSize: '1rem' }}>No assignments match your filter.</p>
              </div>
            )}
          </div>
          
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .content-wrapper {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .content-wrapper.active {
          opacity: 1;
          transform: translateY(0);
        }

        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }

        .metric-card {
          background: var(--surface-container-lowest);
          border: 1px solid var(--surface-container-low);
          padding: 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(25,28,29,0.05);
        }
        .metric-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .metric-icon .material-icons { fontSize: 28px; }
        .metric-value {
          font-family: 'Manrope'; font-weight: 800; font-size: 1.8rem; color: var(--on-surface); line-height: 1.2;
        }
        .metric-label {
          font-size: 0.85rem; color: var(--on-surface-variant); font-weight: 600;
        }

        .filter-chip {
          padding: 10px 20px;
          border-radius: 20px;
          border: 1px solid var(--surface-container-high);
          background: var(--surface-container-lowest);
          color: var(--on-surface-variant);
          font-weight: 600;
          font-size: 0.85rem;
          font-family: 'Inter';
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-chip:hover:not(.active) {
          background: var(--surface-container);
          color: var(--on-surface);
        }
        .filter-chip.active {
          background: var(--on-surface);
          color: var(--surface-container-lowest);
          border-color: var(--on-surface);
        }

        .assignment-card {
          background: var(--surface-container-lowest);
          border: 1px solid var(--surface-container-low);
          border-radius: 16px;
          display: flex;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(25,28,29,0.03);
        }
        .assignment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(25,28,29,0.08);
          border-color: var(--surface-container-high);
        }

        .urgent-indicator {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: var(--error);
        }

        .type-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .action-row-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          font-family: 'Inter';
          font-size: 0.85rem;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        .action-row-btn .material-icons { fontSize: 18px; }
        
        .action-row-btn.primary {
          background: var(--primary-container);
          color: var(--on-primary-container);
        }
        .action-row-btn.primary:hover {
          background: var(--primary);
          color: #fff;
        }
        
        .action-row-btn.secondary {
          background: transparent;
          color: var(--on-surface-variant);
          border: 1px solid var(--surface-container-high);
        }
        .action-row-btn.secondary:hover {
          background: var(--surface-container);
          color: var(--on-surface);
        }
      `}} />
    </div>
  );
}
