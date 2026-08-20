'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import wisdomLogo from '@/wisdom.png';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (email === 'WHESLOGIN' && password === 'WISDOM@990') {
      // Establish session via cookie
      document.cookie = "admin_session=authorized; path=/; max-age=86400; SameSite=Strict";
      
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1500);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        alert('Invalid Administrator ID or Security Protocol');
      }, 1000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#030303',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Abstract dark gradients for the admin portal */}
      <div className="dynamic-glow dynamic-glow-1"></div>
      <div className="dynamic-glow dynamic-glow-2"></div>
      <div className="dynamic-glow dynamic-glow-3"></div>
      
      {/* Hexagon Pattern Background overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, opacity: 0.1,
        backgroundImage: 'radial-gradient(rgba(212, 175, 55, 0.2) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none',
      }} />

      {/* Admin Glass Container */}
      <div className={`admin-glass ${mounted ? 'fade-up-enter-active' : 'fade-up-enter'}`} style={{
        width: '100%',
        maxWidth: '460px',
        padding: '56px 48px',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Glow Effects */}
        <div className="admin-glow-border"></div>

        {/* Administration Header */}
        <div className="stagger-1" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          textAlign: 'center',
        }}>
          <div className="admin-logo-container">
            <Image 
              src={wisdomLogo} 
              alt="Wisdom House Logo" 
              width={100} 
              height={100} 
              className="admin-logo-img"
              priority
            />
          </div>
          <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '1.8rem', color: '#fff', letterSpacing: '0.02em', marginBottom: '8px', textTransform: 'uppercase' }}>
            System Access
          </h1>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            Wisdom House Administration
          </div>
          <div style={{ 
            marginTop: '20px', padding: '6px 14px', background: 'rgba(212, 175, 55, 0.08)', 
            border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '8px',
            color: '#d4af37', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.1) inset'
          }}>
            RESTRICTED PORTAL
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="stagger-2">
            <div className="admin-input-group">
              <span className="material-icons input-icon">admin_panel_settings</span>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder=" "
                required
                className="admin-input"
              />
              <label className="admin-input-label">Administrator ID</label>
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="stagger-3">
            <div className="admin-input-group">
              <span className="material-icons input-icon">security</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder=" "
                required
                className="admin-input"
              />
              <label className="admin-input-label">Security Protocol</label>
              <button type="button" onClick={() => setShowPass(!showPass)} className="show-pass-btn">
                <span className="material-icons" style={{ fontSize: '20px' }}>{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
              <div className="input-glow"></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`admin-submit-btn stagger-4 ${isLoading ? 'loading' : ''}`}
          >
            <div className="btn-shine"></div>
            {isLoading && <span className="material-icons" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>sync</span>}
            <span style={{ position: 'relative', zIndex: 2 }}>{isLoading ? 'VERIFYING CREDENTIALS...' : 'AUTHORIZE ACCESS'}</span>
          </button>
        </form>
        
        {/* Help footer */}
        <div className="stagger-5" style={{ marginTop: '36px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
             <button style={{
               fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', background: 'none', border: 'none',
               transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
               letterSpacing: '0.05em'
             }}
               onMouseEnter={e => { e.currentTarget.style.color = '#d4af37'; e.currentTarget.style.transform = 'translateY(-2px)' }}
               onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
             >
               <span className="material-icons" style={{ fontSize: '16px' }}>support_agent</span> Contact Systems Operation
             </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Staggered entry */
        .fade-up-enter { opacity: 0; transform: translateY(40px) scale(0.98); }
        .fade-up-enter-active { opacity: 1; transform: translateY(0) scale(1); transition: all 1s cubic-bezier(0.19, 1, 0.22, 1); }
        
        .stagger-1 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.1s forwards; }
        .stagger-2 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.2s forwards; }
        .stagger-3 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.3s forwards; }
        .stagger-4 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.4s forwards; }
        .stagger-5 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Dynamic Glow Background */
        .dynamic-glow {
          position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; z-index: 1; animation: drift 20s infinite alternate;
        }
        .dynamic-glow-1 { width: 500px; height: 500px; background: rgba(212, 175, 55, 0.15); top: -20%; left: -10%; animation-delay: 0s; }
        .dynamic-glow-2 { width: 600px; height: 600px; background: rgba(50, 50, 50, 0.4); bottom: -30%; right: -10%; animation-delay: -5s; }
        .dynamic-glow-3 { width: 400px; height: 400px; background: rgba(100, 80, 20, 0.1); top: 30%; right: 20%; animation-delay: -10s; }

        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 30px); }
        }

        /* Glass Container & Glowing details */
        .admin-glass {
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 16px;
          border: 1px solid rgba(80, 70, 40, 0.3);
          box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255, 255, 255, 0.05);
          position: relative;
        }
        .admin-glass::before {
          content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1px;
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.3), transparent 70%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; pointer-events: none;
        }

        .admin-logo-container {
          width: 90px; height: 90px;
          background: linear-gradient(135deg, rgba(20,20,20,1), rgba(0,0,0,1));
          border: 1px solid rgba(212, 175, 55, 0.6);
          border-radius: 20px;
          margin-bottom: 24px;
          display: flex; alignItems: center; justifyContent: center;
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(212, 175, 55, 0.1);
          transform: rotate(45deg);
          position: relative;
          overflow: hidden;
        }
        .admin-logo-img {
          transform: rotate(-45deg) scale(1.4);
          transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
          z-index: 2;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .admin-logo-container:hover .admin-logo-img {
          transform: rotate(-45deg) scale(1.5);
        }

        /* Inputs */
        .admin-input-group { position: relative; width: 100%; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 20px; color: rgba(255,255,255,0.25); font-size: 22px; transition: color 0.4s; z-index: 2; }
        
        .admin-input {
          width: 100%; padding: 22px 20px 10px 56px; height: 68px;
          background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; font-family: Inter, monospace; font-size: 1rem; color: #fff;
          outline: none; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
          letter-spacing: 0.05em;
        }
        .input-glow {
          position: absolute; inset: -1px; border-radius: 9px; pointer-events: none; opacity: 0;
          background: linear-gradient(90deg, rgba(212,175,55,0.5), transparent); z-index: -1;
          transition: opacity 0.4s;
        }
        .admin-input:focus {
          background: rgba(20,20,15,0.8); border-color: transparent;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.5), 0 0 20px rgba(212, 175, 55, 0.15);
        }
        .admin-input:focus ~ .input-glow { opacity: 1; }
        
        .admin-input-label {
          position: absolute; left: 56px; top: 24px; color: rgba(255,255,255,0.3);
          font-size: 0.95rem; pointer-events: none; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          font-weight: 500; z-index: 2;
        }

        /* Floating label mechanics */
        .admin-input:focus ~ .admin-input-label,
        .admin-input:not(:placeholder-shown) ~ .admin-input-label {
          top: 12px; font-size: 0.65rem; color: #d4af37; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .admin-input:focus ~ .input-icon,
        .admin-input:not(:placeholder-shown) ~ .input-icon { 
          color: #d4af37; 
        }

        .show-pass-btn {
          position: absolute; right: 20px; background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25); padding: 4px; display: flex; align-items: center; justify-content: center;
          transition: color 0.3s; z-index: 2;
        }
        .show-pass-btn:hover { color: #d4af37; transform: scale(1.1); }

        /* Submit Button */
        .admin-submit-btn {
          margin-top: 10px;
          padding: 22px;
          background: rgba(212, 175, 55, 0.1);
          color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.5); border-radius: 8px;
          font-family: Inter, monospace; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.2em;
          cursor: pointer; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
          display: flex; align-items: center; justify-content: center; gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          position: relative; overflow: hidden;
        }
        .btn-shine {
          position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
          transform: skewX(-20deg); transition: 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .admin-submit-btn:hover:not(.loading) {
          background: #d4af37;
          color: #000;
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
          transform: translateY(-2px);
        }
        .admin-submit-btn:hover:not(.loading) .btn-shine { left: 150%; }
        .admin-submit-btn.loading { 
          opacity: 0.8; cursor: wait; border-color: rgba(212, 175, 55, 0.3); color: rgba(212, 175, 55, 0.6);
        }
      `}} />
    </div>
  );
}

