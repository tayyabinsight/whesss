'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

const mockAnnouncements = [
  { 
    id: 1, title: 'Midterm Strategy Session', targetClass: 'AP History (10-A)', 
    date: 'Today, 09:30 AM', isPinned: true, color: '#f12711',
    body: 'We will be holding a review session for the upcoming midterm tomorrow at 3 PM in Room 201. It is highly recommended to attend if you want a refresher on Chapters 1 through 4 before the test.' 
  },
  { 
    id: 2, title: 'Project Deadlines Extended', targetClass: 'Intro to CS (10-C)', 
    date: 'Yesterday, 04:15 PM', isPinned: false, color: '#00c6ff',
    body: 'Due to the school-wide server outage earlier this week, all final project submission deadlines have been officially extended by 48 hours. Please check the updated calendar.' 
  },
  { 
    id: 3, title: 'Field Trip Permission Slips', targetClass: 'Civics 101 (9-C)', 
    date: 'Mon, Oct 5', isPinned: false, color: '#f953c6',
    body: 'Please remind your parents to sign the digital permission slips for our visit to the City Hall next Friday. Students without signed slips will have to remain in the study hall.' 
  }
];

export default function TeacherAnnouncements() {
  const [mounted, setMounted] = useState(false);
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState('All Classes');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;

    const newPost = {
      id: Date.now(),
      title: newTitle,
      targetClass: newClass,
      date: 'Just now',
      isPinned: false,
      color: '#3a7bd5',
      body: newMessage
    };

    setAnnouncements([newPost, ...announcements]);
    setNewTitle('');
    setNewMessage('');
    setNewClass('All Classes');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-container-low)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar role="teacher" userName="Mr. Smith" userSubtitle="Teacher View" />

      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div className={`content-wrapper ${mounted ? 'active' : ''}`} style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(350px, 1.2fr) 2fr', gap: '32px' }}>
          
          {/* Header & Composer (Left Column) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header Section */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
                borderRadius: '20px',
                padding: '28px 32px',
                position: 'relative',
                overflow: 'hidden'
            }} className="fade-in-up">
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <span className="material-icons" style={{ fontSize: '32px', color: '#fff' }}>campaign</span>
                    <h1 style={{ fontFamily: 'Manrope', fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                        Announcements
                    </h1>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                      Post notices and announcements to your classes. Updates appear on student dashboards immediately.
                  </p>
                </div>
            </div>

            {/* Composer Card */}
            <div className="composer-card fade-in-up delay-1">
              <h2 style={{ fontFamily: 'Manrope', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--on-surface)' }}>Create a New Update</h2>
              <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="input-field">
                  <span className="material-icons icon">title</span>
                  <input 
                    type="text" 
                    placeholder="Announcement Title" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-field">
                  <span className="material-icons icon">groups</span>
                  <select value={newClass} onChange={(e) => setNewClass(e.target.value)} required>
                    <option value="All Classes">Broadcast to All Classes</option>
                    <option value="AP History (10-A)">AP History (10-A)</option>
                    <option value="AP Calculus (12-B)">AP Calculus (12-B)</option>
                    <option value="Intro to CS (10-C)">Intro to CS (10-C)</option>
                    <option value="Civics 101 (9-C)">Civics 101 (9-C)</option>
                  </select>
                </div>

                <div className="textarea-field">
                  <textarea 
                    placeholder="Type your important update or notice here..." 
                    rows={6}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="submit" className="action-button primary" disabled={!newTitle || !newMessage}>
                    <span className="material-icons">send</span> Post Announcement
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column: Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }} className="fade-in-up delay-2">
              <h3 style={{ fontFamily: 'Inter', fontSize: '1.1rem', fontWeight: 600, color: 'var(--on-surface-variant)', margin: 0 }}>Recent Broadcasts</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', background: 'var(--surface-container)', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                {announcements.length} Active Posts
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in-up delay-2">
              {announcements.map((post) => (
                <div key={post.id} className="announcement-card">
                  
                  {/* Pin indicator */}
                  {post.isPinned && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--secondary)' }}>
                      <span className="material-icons" style={{ fontSize: '20px', transform: 'rotate(45deg)' }}>push_pin</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div className="author-avatar">
                      <span className="material-icons">campaign</span>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="class-badge" style={{ color: post.color, backgroundColor: `${post.color}22` }}>
                          {post.targetClass}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                          • {post.date}
                        </span>
                      </div>
                      
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Manrope', paddingRight: '24px' }}>
                        {post.title}
                      </h3>
                      
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                        {post.body}
                      </p>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--surface-container-high)' }}>
                         <button className="interaction-btn"><span className="material-icons">visibility</span> 45 Seen</button>
                         <button className="interaction-btn"><span className="material-icons">edit</span> Edit</button>
                         <button className="interaction-btn" style={{ marginLeft: 'auto' }}><span className="material-icons">delete_outline</span> Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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

        .composer-card {
          background: var(--surface-container-lowest);
          border: 1px solid var(--surface-container-low);
          padding: 28px;
          border-radius: 20px;
          box-shadow: 0 4px 25px rgba(25,28,29,0.05);
        }

        .input-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-field .icon {
          position: absolute;
          left: 14px;
          color: var(--on-surface-variant);
          font-size: 20px;
          pointer-events: none;
        }
        .input-field input, .input-field select {
          width: 100%;
          padding: 14px 14px 14px 44px;
          background: var(--surface-container);
          border: 1px solid transparent;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: var(--on-surface);
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
        }
        .input-field input:focus, .input-field select:focus {
          background: var(--surface-container-lowest);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-container);
        }

        .textarea-field textarea {
          width: 100%;
          padding: 16px;
          background: var(--surface-container);
          border: 1px solid transparent;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: var(--on-surface);
          outline: none;
          transition: all 0.2s ease;
          resize: vertical;
        }
        .textarea-field textarea:focus {
          background: var(--surface-container-lowest);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-container);
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-button:disabled {
          opacity: 0.5; cursor: not-allowed;
        }
        .action-button.primary {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.2);
        }
        .action-button.primary:hover:not(:disabled) {
          background: var(--primary-container);
          color: var(--on-primary-container);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.3);
        }
        .action-button .material-icons { fontSize: 18px; }

        .announcement-card {
          background: var(--surface-container-lowest);
          border: 1px solid var(--surface-container-low);
          padding: 24px;
          border-radius: 20px;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(25,28,29,0.03);
        }
        .announcement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(25,28,29,0.08);
          border-color: var(--surface-container-high);
        }

        .author-avatar {
          width: 48px; height: 48px;
          background: var(--primary-container);
          color: var(--primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .class-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .interaction-btn {
          background: transparent;
          border: none;
          color: var(--on-surface-variant);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'Inter';
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .interaction-btn:hover {
          background: var(--surface-container);
          color: var(--on-surface);
        }
        .interaction-btn .material-icons {
          font-size: 16px;
        }
      `}} />
    </div>
  );
}
