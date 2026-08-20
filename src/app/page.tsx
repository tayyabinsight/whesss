'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Start splash screen sequence
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      // Trigger card mount animation slightly after splash starts fading
      setTimeout(() => setMounted(true), 300);
    }, 2400);

    return () => clearTimeout(splashTimer);
  }, []);

  const roles = [
    { id: 'student' as const, label: 'Student', icon: 'person', href: '/student/dashboard' },
    { id: 'teacher' as const, label: 'Teacher', icon: 'co_present', href: '/teacher/dashboard' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const dest = roles.find(r => r.id === activeRole)?.href || '/';
    setTimeout(() => {
      window.location.href = dest;
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050a14',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Animated Aurora Background */}
      <div className="aurora-bg"></div>

      {/* Floating Geometric Elements for depth */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      
      {/* The Animated Splash Screen */}
      <div className={`splash-screen ${showSplash ? '' : 'hide'}`}>
        <div className="splash-logo-container">
          <Image 
            src="/wisdom.png" 
            alt="Wisdom House Logo" 
            width={180} 
            height={180} 
            className="splash-logo"
            priority
          />
        </div>
        <h1 className="splash-title">Wisdom House</h1>
        <div className="splash-subtitle">Academic Atelier</div>
      </div>

      {/* Centered Glass Card */}
      <div className={`glass-container ${mounted ? 'fade-up-enter-active' : 'fade-up-enter'}`} style={{
        width: '100%',
        maxWidth: '430px',
        padding: '48px 40px 36px',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Glowing border effect */}
        <div className="glass-glow"></div>

        {/* Centered Logo */}
        <div className="stagger-1" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '36px',
          textAlign: 'center',
        }}>
          <div className="logo-icon-container">
            <Image 
              src="/wisdom.png" 
              alt="Wisdom House Logo" 
              width={76} 
              height={76} 
              className="login-logo-img"
            />
          </div>
          <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '2rem', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Wisdom House
          </h1>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            Academic Atelier
          </div>
        </div>

        {/* Role Switcher */}
        <div className="stagger-2 role-switcher">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={activeRole === role.id ? 'role-btn active' : 'role-btn'}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>{role.icon}</span>
              {role.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="stagger-3">
            <div className="input-group">
              <span className="material-icons input-icon">email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="animated-input"
              />
              <label className={email ? 'active-label input-label' : 'input-label'}>Email Address</label>
            </div>
          </div>

          <div className="stagger-4">
            <div className="input-group">
              <span className="material-icons input-icon">lock</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="animated-input"
              />
              <label className={password ? 'active-label input-label' : 'input-label'}>Password</label>
              <button type="button" onClick={() => setShowPass(!showPass)} className="show-pass-btn">
                <span className="material-icons" style={{ fontSize: '20px' }}>{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="forgot-pass-btn">
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`submit-btn stagger-5 ${isLoading ? 'loading' : ''}`}
          >
            {isLoading && <span className="material-icons" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>sync</span>}
            {isLoading ? 'Authenticating...' : `Sign In as ${roles.find(r => r.id === activeRole)?.label}`}
          </button>
        </form>
        
        {/* Quick Demo Links */}
        <div className="stagger-6" style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
           {roles.map(role => (
             <Link key={role.id} href={role.href} className="demo-link">
               Demo {role.label} <span className="material-icons" style={{ fontSize: '14px' }}>arrow_forward</span>
             </Link>
           ))}
        </div>

        {/* Social Links Separator */}
        <div className="stagger-7" style={{ 
          marginTop: '36px', 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%',
          opacity: 0.6
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2))' }}></div>
          <span style={{ padding: '0 12px', fontSize: '0.75rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connect with us</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.2))' }}></div>
        </div>

        {/* Social Icons */}
        <div className="stagger-8 social-container">
          <a href="#" className="social-icon fb" aria-label="Facebook">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
          </a>
          <a href="#" className="social-icon ig" aria-label="Instagram">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
          </a>
          <a href="#" className="social-icon tw" aria-label="X (Twitter)">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* SPLASH SCREEN CSS */
        .splash-screen {
          position: fixed; inset: 0; background: #050a14;
          z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center;
          transition: opacity 1s cubic-bezier(0.19, 1, 0.22, 1), visibility 1s;
        }
        .splash-screen.hide {
          opacity: 0; visibility: hidden; pointer-events: none;
        }
        
        .splash-logo-container {
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(20,40,80,0.1) 60%);
          padding: 30px; border-radius: 40px;
          animation: floatPulse 3s ease-in-out infinite;
          box-shadow: 0 0 50px rgba(100, 150, 255, 0.2);
          position: relative;
        }
        .splash-logo-container::after {
          content: ""; position: absolute; inset: -4px; border-radius: 44px;
          background: linear-gradient(135deg, #00f2fe, #4a00e0, #4facfe);
          filter: blur(20px); opacity: 0.5; z-index: -1;
          animation: spin 6s linear infinite;
        }
        
        .splash-logo {
          transform: scale(0.8);
          animation: logoScale 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          object-fit: cover;
        }
        
        .splash-title {
          font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 2.5rem; color: #fff;
          margin-top: 30px; letter-spacing: -0.02em;
          opacity: 0; transform: translateY(20px);
          animation: fadeUp 1s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards;
        }
        
        .splash-subtitle {
          font-size: 1rem; color: rgba(255,255,255,0.7); letter-spacing: 0.3em;
          text-transform: uppercase; font-weight: 700; margin-top: 10px;
          opacity: 0; transform: translateY(20px);
          animation: fadeUp 1s cubic-bezier(0.19, 1, 0.22, 1) 0.7s forwards;
        }

        @keyframes logoScale {
          0% { transform: scale(0.5); opacity: 0; filter: blur(10px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes floatPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        /* Animations */
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(30px) scale(0.95); } }
        @keyframes float-3 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(20px, -20px) rotate(15deg); } }
        @keyframes aurora { 
          0%, 100% { background-position: 0% 50%; opacity: 0.8; } 
          50% { background-position: 100% 50%; opacity: 1; } 
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 20px rgba(100, 150, 255, 0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 40px rgba(100, 150, 255, 0.7); }
        }

        /* Staggered entry */
        .fade-up-enter { opacity: 0; transform: translateY(30px) scale(0.95); }
        .fade-up-enter-active { opacity: 1; transform: translateY(0) scale(1); transition: opacity 1s cubic-bezier(0.19, 1, 0.22, 1), transform 1s cubic-bezier(0.19, 1, 0.22, 1); }
        
        .stagger-1 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.1s forwards; }
        .stagger-2 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.2s forwards; }
        .stagger-3 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.3s forwards; }
        .stagger-4 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.4s forwards; }
        .stagger-5 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards; }
        .stagger-6 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.6s forwards; }
        .stagger-7 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.7s forwards; }
        .stagger-8 { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.8s forwards; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Background & Shapes */
        .aurora-bg {
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(from 180deg at 50% 50%, #060918 0deg, #101c4c 110deg, #370d30 240deg, #060918 360deg);
          animation: aurora 20s linear infinite;
          filter: blur(80px);
          z-index: 1;
        }
        
        .shape {
          position: absolute;
          filter: blur(5px);
          z-index: 2;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .shape-1 {
          width: 150px; height: 150px; border-radius: 20px;
          top: 15%; left: 15%; transform: rotate(15deg);
          animation: float-1 8s ease-in-out infinite;
          background: linear-gradient(135deg, rgba(58, 123, 213, 0.3), rgba(58, 96, 115, 0));
        }
        
        .shape-2 {
          width: 200px; height: 200px; border-radius: 50%;
          bottom: 10%; right: 10%;
          animation: float-2 10s ease-in-out infinite;
          background: linear-gradient(135deg, rgba(142, 45, 226, 0.3), rgba(74, 0, 224, 0));
        }
        
        .shape-3 {
          width: 80px; height: 80px; border-radius: 12px;
          top: 50%; right: 20%; transform: rotate(-25deg);
          animation: float-3 12s ease-in-out infinite;
          background: linear-gradient(135deg, rgba(249, 83, 198, 0.3), rgba(185, 29, 115, 0));
        }

        /* Glass Container & Glowing details */
        .glass-container {
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 32px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        
        .glass-glow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 32px;
          pointer-events: none;
          box-shadow: inset 0 0 20px rgba(255,255,255,0.05), inset 0 2px 2px rgba(255,255,255,0.15);
          z-index: 1;
        }

        .logo-icon-container {
          width: 76px; height: 76px;
          background: linear-gradient(135deg, rgba(20,40,80,0.8), rgba(0,0,0,0.4));
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 24px;
          margin-bottom: 20px;
          display: flex; alignItems: center; justifyContent: center;
          box-shadow: 0 15px 35px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4);
          position: relative;
          overflow: hidden;
        }
        .logo-icon-container::after {
          content: ''; position: absolute; inset: -4px; border-radius: 28px;
          background: linear-gradient(135deg, #00f2fe, #4facfe, #8e2de2, #4a00e0);
          filter: blur(14px); z-index: 1;
          animation: glowPulse 4s infinite;
          opacity: 0.7;
          pointer-events: none;
        }
        .login-logo-img {
          z-index: 2; border-radius: 22px; width: 100%; height: 100%; object-fit: cover;
        }

        /* Roles Switcher */
        .role-switcher {
          display: flex; background: rgba(0, 0, 0, 0.5); border-radius: 16px;
          padding: 6px; margin-bottom: 36px; border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        .role-btn {
          flex: 1; padding: 12px; border: none; border-radius: 12px;
          background: transparent; color: rgba(255,255,255,0.5);
          font-weight: 600; font-size: 0.85rem; font-family: Inter;
          cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .role-btn:hover:not(.active) { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); }
        .role-btn.active {
          background: rgba(255, 255, 255, 0.15); color: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2);
          transform: scale(1.02);
        }

        /* Inputs */
        .input-group { position: relative; width: 100%; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 18px; color: rgba(255,255,255,0.4); font-size: 20px; transition: color 0.3s; z-index: 2; }
        
        .animated-input {
          width: 100%; padding: 20px 20px 10px 52px; height: 60px;
          background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px; font-family: Inter; font-size: 1rem; color: #fff;
          outline: none; transition: all 0.3s ease;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
        }
        .animated-input:focus {
          background: rgba(0, 0, 0, 0.4); border-color: rgba(255,255,255,0.5);
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.2), 0 0 15px rgba(255,255,255,0.1);
        }
        .animated-input:focus + .input-label, .input-label.active-label {
          top: 10px; font-size: 0.65rem; color: rgba(255,255,255,0.7); letter-spacing: 0.05em; text-transform: uppercase;
        }
        .animated-input:focus ~ .input-icon { color: #fff; }
        
        .input-label {
          position: absolute; left: 52px; top: 20px; color: rgba(255,255,255,0.5);
          font-size: 0.95rem; pointer-events: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500; z-index: 2;
        }

        .show-pass-btn {
          position: absolute; right: 16px; background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.5); padding: 4px; display: flex; align-items: center; justify-content: center;
          transition: color 0.2s; z-index: 2;
        }
        .show-pass-btn:hover { color: #fff; }

        .forgot-pass-btn {
          font-size: 0.8rem; color: rgba(255,255,255,0.6); font-weight: 600;
          background: none; border: none; cursor: pointer; transition: all 0.2s;
          padding: 4px 8px; border-radius: 6px;
        }
        .forgot-pass-btn:hover { color: #fff; text-decoration: underline; background: rgba(255,255,255,0.05); }

        /* Submit Button */
        .submit-btn {
          padding: 18px;
          background: linear-gradient(135deg, #fff, #e0e0e0);
          color: #000; border: none; border-radius: 16px;
          font-family: Manrope; font-weight: 800; font-size: 1.05rem;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 10px 25px rgba(255,255,255,0.15);
          position: relative; overflow: hidden;
        }
        .submit-btn::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transform: skewX(-20deg); transition: 0.5s;
        }
        .submit-btn:hover:not(.loading) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(255,255,255,0.25);
          background: #fff;
        }
        .submit-btn:hover::before { left: 150%; }
        .submit-btn.loading { opacity: 0.8; transform: scale(0.98); }

        /* Social Icons */
        .social-container {
          display: flex; justify-content: center; gap: 20px; margin-top: 24px;
        }
        .social-icon {
          width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; text-decoration: none; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .social-icon svg { width: 20px; height: 20px; transition: transform 0.3s; }
        
        .social-icon:hover { transform: translateY(-4px) scale(1.05); }
        .social-icon:hover svg { transform: scale(1.1); }
        
        .social-icon.fb:hover { background: #1877F2; border-color: #1877F2; box-shadow: 0 8px 20px rgba(24,119,242,0.4); }
        .social-icon.ig:hover { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%); border-color: transparent; box-shadow: 0 8px 20px rgba(214,36,159,0.4); }
        .social-icon.tw:hover { background: #000; border-color: #333; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }

        .demo-link {
          font-size: 0.8rem; color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s;
          display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 20px;
        }
        .demo-link:hover { color: #fff; background: rgba(255,255,255,0.1); }
      `}} />
    </div>
  );
}
