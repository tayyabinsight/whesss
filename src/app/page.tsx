'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Users,
  Phone,
  MessageCircle,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  ChevronRight,
  X,
  Building,
  UserCheck,
  Bus,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [activeWing, setActiveWing] = useState<'montessori' | 'primary' | 'middle' | 'matric'>('montessori');
  const [activeTripCategory, setActiveTripCategory] = useState<'all' | 'educational' | 'recreation' | 'sports'>('all');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Admission Form State
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    phone: '',
    grade: 'Class 9th (Matric)',
    campus: 'Karachi Campus',
    gender: 'Male',
    previousSchool: '',
    area: '',
    message: ''
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.fatherName || !formData.phone) {
      alert('Please fill in Student Name, Father Name, and Contact Number.');
      return;
    }

    const whatsappNumber = '923304784749';
    const textMsg = `🏫 *WISDOM HOUSE EDUCATION SYSTEM - ADMISSION INQUIRY*
━━━━━━━━━━━━━━━━━━━━
👤 *Student Name:* ${formData.studentName}
👨‍👦 *Father / Guardian:* ${formData.fatherName}
📞 *Contact Number:* ${formData.phone}
🏫 *Campus:* 4 Campuses in Karachi (${formData.campus})
🎓 *Class Applying For:* ${formData.grade}
⚧ *Gender:* ${formData.gender}
📍 *Karachi Residential Area:* ${formData.area || 'Karachi'}
📚 *Previous School:* ${formData.previousSchool || 'N/A'}
📝 *Message / Note:* ${formData.message || 'Admission inquiry from official website'}
━━━━━━━━━━━━━━━━━━━━
_Affiliated with Board of Secondary Education Karachi (BSEK)_`;

    const encoded = encodeURIComponent(textMsg);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encoded}`;

    setFormSubmitted(true);
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 300);
  };

  // Metrics requested
  const schoolStats = [
    { number: '99%', label: 'Board Examination Pass Rate', sub: 'BSEK Karachi Science & Computer Science' },
    { number: '800+', label: 'Enrolled Active Scholars', sub: 'Montessori to Matric across Karachi' },
    { number: '30+', label: 'Certified Expert Educators', sub: 'Experienced Subject Specialists & Mentors' },
    { number: '20+', label: 'Years of Academic Excellence', sub: 'Trusted Karachi Education Tradition' },
    { number: '4', label: 'Campuses in Karachi', sub: 'Serving Students Across Karachi' }
  ];

  // School Trips & Outings
  const schoolTrips = [
    {
      id: 'paf-museum',
      title: 'PAF Museum Karachi Tour',
      type: 'educational',
      category: 'Heritage & Defense',
      badge: 'Aviation & History',
      desc: 'Exciting guided excursion to Pakistan Air Force Museum exploring historic fighter jets, aircraft galleries, radar systems, and defense archives along with recreational picnic time.',
      highlights: ['Aircraft & Jet Gallery', 'National Heroes Memorial', 'Interactive Flight Displays', 'Safe Group Transport']
    },
    {
      id: 'winterland',
      title: 'Winterland Karachi Adventure',
      type: 'recreation',
      category: 'Recreational Fun',
      badge: 'Ice & Snow Park',
      desc: 'Sub-zero indoor snow theme park experience with thrilling ice slides, snow play zones, bumper cars on ice, and joyful winter memories for junior and senior students.',
      highlights: ['-10°C Snow Chamber', 'Ice Slides & Sledges', 'Winter Gear Provided', 'Warm Refreshments']
    },
    {
      id: 'magnifiscience',
      title: 'MagnifiScience Centre Karachi',
      type: 'educational',
      category: 'Hands-on Science',
      badge: 'Scientific Exploration',
      desc: 'Immersive educational visit where students interact with physics models, gravity simulators, optical illusion rooms, botanical gardens, and practical science exhibits.',
      highlights: ['Physics & Biology Hubs', 'Sound & Light Experiments', 'Interactive Earth Science', 'Live Demonstration Sessions']
    },
    {
      id: 'quaid-house',
      title: 'Quaid-e-Azam House Museum (Flagstaff House)',
      type: 'educational',
      category: 'National Heritage',
      badge: 'History Tour',
      desc: 'Historic educational tour to the residence of Quaid-e-Azam Muhammad Ali Jinnah. Students learn about Pakistan independence history, rare personal belongings, and national legacy.',
      highlights: ['Quaid Personal Relics', 'Independence Archives', 'Historical Architecture', 'Quiz & Learning Session']
    },
    {
      id: 'sindh-press',
      title: 'Sindh Printing Press Study Tour',
      type: 'educational',
      category: 'Practical Field Trip',
      badge: 'Industrial Learning',
      desc: 'Practical study tour discovering the art and machinery of publishing, textbook printing, offset printing machines, paper binding, and official government publications.',
      highlights: ['Offset & Digital Presses', 'Book Binding Machinery', 'Typesetting Process', 'Real-world Industrial View']
    },
    {
      id: 'zoo',
      title: 'Karachi Zoo & Botanical Excursion',
      type: 'recreation',
      category: 'Nature & Wildlife',
      badge: 'Fauna & Flora',
      desc: 'Delightful day out for Montessori and Primary wings exploring animal habitats, bird sanctuary, reptilian houses, botanical trees, and learning about animal care.',
      highlights: ['Exotic Birds & Animals', 'Botanical Greenery', 'Guided Teacher Supervision', 'Group Outdoor Lunch']
    },
    {
      id: 'sports-gala',
      title: 'Annual Sports Gala & Athletics Championship',
      type: 'sports',
      category: 'Athletics & Fitness',
      badge: 'Annual Mega Event',
      desc: 'High-energy inter-house sports competitions featuring 100m sprint races, relay races, sack race, tug-of-war, badminton, obstacle courses, and medal ceremonies.',
      highlights: ['March Past & House Flags', 'Sprints & Field Events', 'Trophies & Medals', 'Parent Participation Races']
    },
    {
      id: 'cricket',
      title: 'Inter-Campus Cricket Tournaments',
      type: 'sports',
      category: 'Sports & Teamwork',
      badge: 'Cricket Cup',
      desc: 'Thrilling inter-branch tape-ball and hard-ball cricket matches fostering teamwork, sportsmanship, physical stamina, and competitive team spirit among senior students.',
      highlights: ['Inter-House Matches', 'Best Batsman & Bowler Awards', 'Live Commentary & Scoring', 'Coach Mentorship']
    },
    {
      id: 'farm-waterpark',
      title: 'Annual Farm House Picnic & Water Park Outing',
      type: 'recreation',
      category: 'Recreational Fun',
      badge: 'Family & Student Gala',
      desc: 'Full-day refreshing picnic with swimming pools, water slides, cricket grounds, swings, lush lawns, delicious live chicken barbecue, and fun games for all classes.',
      highlights: ['Large Swimming Pools & Slides', 'Live Barbecue & Biryani', 'Music & Outdoor Games', 'Dedicated Lifeguards & Security']
    },
    {
      id: 'kfc-treat',
      title: 'KFC Fun Day & Junior Treats',
      type: 'recreation',
      category: 'Celebration Days',
      badge: 'Kids Meal Outing',
      desc: 'Special celebration outings for Montessori, Kindergarten, and position achievers with delicious meal treats, indoor play zones, and birthday & distinction celebrations.',
      highlights: ['Krunch Burger Meals', 'Indoor Soft Play Area', 'Achievement Celebrations', 'Memorable Group Photos']
    }
  ];

  const filteredTrips = activeTripCategory === 'all'
    ? schoolTrips
    : schoolTrips.filter(t => t.type === activeTripCategory);

  // Academic Criteria Wings
  const academicWings = [
    {
      id: 'montessori' as const,
      title: 'Montessori & Early Years',
      classes: 'Playgroup • Nursery • Kindergarten (KG)',
      desc: 'Gentle, nurturing foundation focusing on phonics sound recognition, English & Urdu alphabet writing, number concepts, coloring, Islamic etiquettes, and speech development in a warm environment.',
      points: [
        'Phonics-based English reading & Urdu Haroof-e-Tahajji',
        'Basic arithmetic, counting, shapes and colors recognition',
        'Daily Duas, Kalmahs, and moral manners integration',
        'Caring female teachers with individual student care'
      ]
    },
    {
      id: 'primary' as const,
      title: 'Primary School Wing',
      classes: 'Class 1st to Class 5th',
      desc: 'Structured curriculum with daily homework diaries, concept-building in Mathematics, General Science, Social Studies, English Grammar, Urdu, and Nazra Quran with Tajweed.',
      points: [
        'Comprehensive English Medium course following provincial syllabus',
        'Mental math exercises, multiplication tables, and problem solving',
        'Spelling dictations, creative Urdu & English paragraph writing',
        'Regular monthly class tests and parent diary tracking'
      ]
    },
    {
      id: 'middle' as const,
      title: 'Middle School Wing',
      classes: 'Class 6th to Class 8th',
      desc: 'Stepping stone for board examinations. Strengthens concepts in Physics, Chemistry, Biology, Mathematics, Computer concepts, English Grammar, History & Geography.',
      points: [
        'Introductory laboratory demonstrations for Science subjects',
        'Computer practical classes (MS Office, typing, basics)',
        'Debates, speeches, quiz competitions, and Qirat contests',
        'Thorough preparation for transition into Matriculation'
      ]
    },
    {
      id: 'matric' as const,
      title: 'Senior Matriculation (BSEK Karachi)',
      classes: 'Class 9th & Class 10th (BSEK Board Affiliated)',
      desc: 'Targeted, high-discipline preparation for Board of Secondary Education Karachi examinations. Proven track record of A-1 and A grades with dedicated subject specialists.',
      points: [
        'Science Group: Biology (Pre-Medical Track)',
        'Science Group: Computer Science Track',
        'Exhaustive chapter-wise test sessions & 5-year past papers solving',
        'Fully equipped Science & Computer Labs for board practical exams'
      ]
    }
  ];

  // Real Facebook updates
  const facebookEvents = [
    {
      title: '14th August Independence Day Celebrations',
      tag: 'National Event',
      date: 'August 2025',
      desc: 'Patriotic stage tableaus, Milli Naghmay singing, speech competitions on Quaid-e-Azam, and green-and-white celebrations across all campuses.'
    },
    {
      title: 'Eid Milad-un-Nabi ﷺ & Seerat Quiz',
      tag: 'Islamic Occasion',
      date: 'Rabi-ul-Awwal',
      desc: 'Spiritual gathering featuring beautiful Naat Khawani by students, Seerat-un-Nabi speeches, Islamic ethics quiz, and certificate distribution.'
    },
    {
      title: 'Annual Prize Distribution & Merit Awards',
      tag: 'Academic Distinction',
      date: 'Annual Ceremony',
      desc: 'Honoring our top position holders, 100% attendance achievers, and BSEK board distinction students with trophies, certificates, and parent appreciation.'
    },
    {
      title: 'Annual Science & Art Model Exhibition',
      tag: 'Practical Learning',
      date: 'Winter Term',
      desc: 'Students showcased handcrafted working models of Volcanoes, Hydraulic cranes, Solar System, Water Filtration, and creative art paintings.'
    },
    {
      title: 'Defense Day (6th September) Commemoration',
      tag: 'National Pride',
      date: 'September 2025',
      desc: 'Special morning assembly paying tribute to our armed forces and national martyrs with patriotic speeches and student presentations.'
    },
    {
      title: 'Parent-Teacher Meeting (PTM) & Result Day',
      tag: 'Parent Partnership',
      date: 'Term End',
      desc: 'Constructive face-to-face progress discussions between parents and teachers reviewing monthly test copies, attendance, and exam report cards.'
    }
  ];

  const faqs = [
    {
      q: 'Which board is Wisdom House Education System affiliated with?',
      a: 'We are officially affiliated with the Board of Secondary Education Karachi (BSEK). Our Class 9th and 10th students appear in BSEK Karachi Board examinations for Science (Biology & Computer Science) and General groups with a consistent 99% pass record.'
    },
    {
      q: 'What classes are offered and what are the school timings?',
      a: 'We offer classes from Montessori (Playgroup, Nursery, KG) up to Class 10th (Matric). Morning shifts run typically from 7:45 AM to 1:30 PM depending on the wing and campus.'
    },
    {
      q: 'How many campuses does Wisdom House Education System have in Karachi?',
      a: 'We have 4 campuses across Karachi, providing unified academic standards, disciplined faculty, and convenient neighborhood access.'
    },
    {
      q: 'Are educational trips and co-curricular activities arranged regularly?',
      a: 'Yes! We actively organize educational visits (PAF Museum, MagnifiScience Centre, Quaid-e-Azam House, Sindh Printing Press), recreational trips (Winterland, Farm Houses, Water Parks, Karachi Zoo, KFC), and Annual Sports Galas & Cricket Tournaments.'
    },
    {
      q: 'How can parents and students check fee vouchers and academic details?',
      a: 'Click on the "Student Portal" button at the top or bottom of this page. Students and parents can check fee slips, timetable, homework, and exam results directly online.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070d1e', color: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif', overflowX: 'hidden' }}>
      
      {/* ── TOP ANNOUNCEMENT TICKER ── */}
      <div style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, padding: '7px 0', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="animate-marquee" style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <span>🌟 Admissions Open 2026-2027 • Montessori to Class 10th (Matric BSEK Karachi)</span>
          <span>•</span>
          <span>🏆 99% Board Examination Pass Rate • 20+ Years Educational Service in Karachi</span>
          <span>•</span>
          <span>📍 4 Campuses in Karachi • Quality Education & Moral Discipline</span>
          <span>•</span>
          <span>🚌 Recent Excursions: PAF Museum, Winterland, MagnifiScience & Annual Sports Gala</span>
          <span>•</span>
          <span>📞 Instant Admission Help via WhatsApp: 0330 4784749</span>
          <span>•</span>
          <span>🌟 Admissions Open 2026-2027 • Montessori to Class 10th (Matric BSEK Karachi)</span>
          <span>•</span>
          <span>🏆 99% Board Examination Pass Rate • 800+ Active Students • 30+ Dedicated Teachers</span>
        </div>
      </div>

      {/* ── STICKY MAIN NAVIGATION ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: isScrolled ? 'rgba(7, 13, 30, 0.96)' : 'rgba(7, 13, 30, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* School Name & Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)'
            }}>
              <div style={{ width: '100%', height: '100%', background: '#0a1636', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <Image src="/wisdom.png" alt="Wisdom House Education System Karachi" width={36} height={36} priority style={{ objectFit: 'contain' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}>
                WISDOM HOUSE EDUCATION SYSTEM
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Montessori to Matric • BSEK Karachi Affiliated
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#about" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">About Us</a>
            <a href="#academics" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">Study Criteria</a>
            <a href="#trips" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">Trips & Gala</a>
            <a href="#campuses" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">4 Campuses</a>
            <a href="#activities" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">School Life</a>
            <a href="#admissions" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">Admissions</a>
            <a href="#contact" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }} className="hover:text-sky-400">Contact</a>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* PORTAL BUTTON */}
            <button
              id="portal-header-btn"
              onClick={() => setIsPortalModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #1d4ed8)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: '1px solid rgba(56, 189, 248, 0.4)',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(2, 132, 199, 0.3)'
              }}
              className="hover:scale-105"
            >
              <UserCheck size={16} />
              <span>Portals</span>
            </button>

            {/* APPLY NOW BUTTON */}
            <button
              id="apply-header-btn"
              onClick={() => {
                const sec = document.getElementById('admissions');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: '1px solid rgba(251, 191, 36, 0.4)',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)'
              }}
              className="hover:scale-105"
            >
              <Sparkles size={15} />
              <span>Apply Now</span>
            </button>
          </div>

        </div>
      </nav>

      {/* ── HERO SECTION: AUTHENTIC KARACHI EDUCATION EXCELLENCE ── */}
      <section style={{
        position: 'relative',
        padding: '70px 20px 85px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(2, 132, 199, 0.3), rgba(7, 13, 30, 0))'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
            
            {/* Hero Left Content */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '20px'
              }}>
                <MapPin size={15} />
                <span>ESTABLISHED KARACHI SCHOOL SYSTEM • 4 CAMPUSES</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                fontFamily: 'Manrope, sans-serif',
                marginBottom: '18px'
              }}>
                Quality Education,{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Moral Discipline
                </span>{' '}
                & BSEK Board Distinction.
              </h1>

              <p style={{
                fontSize: '1.02rem',
                lineHeight: 1.65,
                color: '#cbd5e1',
                marginBottom: '28px',
                maxWidth: '580px'
              }}>
                Welcome to <strong>Wisdom House Education System</strong>. Serving Karachi families for over 20+ years with disciplined learning from <strong>Montessori to Matric (Class 10th)</strong>, affiliated with the <strong>Board of Secondary Education Karachi (BSEK)</strong>.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '32px' }}>
                <a
                  href="#admissions"
                  id="hero-apply-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                    cursor: 'pointer'
                  }}
                  className="hover:scale-105"
                >
                  <Sparkles size={18} />
                  <span>Online Admission Form</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="https://wa.me/923304784749?text=Hello%20Wisdom%20House%20Education%20System%2C%20I%20want%20to%20inquire%20about%20admissions."
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)'
                  }}
                  className="hover:bg-green-700"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp: 0330 4784749</span>
                </a>
              </div>

              {/* Highlights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={18} color="#10b981" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>BSEK Karachi Affiliated</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="#f59e0b" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>99% Matric Board Result</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={18} color="#38bdf8" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>4 Campuses Across Karachi</span>
                </div>
              </div>

            </div>

            {/* Hero Right Visual: Clean Karachi Campus Snapshot */}
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: '24px',
                padding: '2px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(245, 158, 11, 0.4))',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
              }}>
                <div style={{
                  backgroundColor: '#0c1633',
                  borderRadius: '22px',
                  padding: '28px 24px'
                }}>
                  
                  {/* Top Status Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>Wisdom House System</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>4 Active Campuses Across Karachi</div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      ● ADMISSIONS 2026-2027
                    </span>
                  </div>

                  {/* 4 Focus Pillars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <GraduationCap size={22} color="#38bdf8" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>Montessori to 10th</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Complete schooling chain</div>
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Award size={22} color="#f59e0b" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>Matric Science / CS</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Biology & Computer Science</div>
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Bus size={22} color="#10b981" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>Excursions & Trips</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PAF Museum, Winterland</div>
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <ShieldCheck size={22} color="#ec4899" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>Islamic & Moral</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nazra Quran & Ethics</div>
                    </div>
                  </div>

                  {/* Fast Portals Box */}
                  <div style={{ padding: '16px', background: 'rgba(2, 132, 199, 0.12)', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>ONLINE SCHOOL PORTALS</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Students & Faculty</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Link
                        href="/student/dashboard"
                        style={{
                          padding: '9px 12px',
                          background: '#0284c7',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        className="hover:bg-sky-500"
                      >
                        <GraduationCap size={14} />
                        <span>Student Portal</span>
                      </Link>

                      <Link
                        href="/teacher/dashboard"
                        style={{
                          padding: '9px 12px',
                          background: '#334155',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        className="hover:bg-slate-600"
                      >
                        <Users size={14} />
                        <span>Teacher Portal</span>
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── METRICS SECTION: 99% PASS RATE, 800+ STUDENTS, 30+ TEACHERS, 20+ YEARS, 4+ CAMPUSES ── */}
      <section style={{ backgroundColor: '#0a142c', padding: '45px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '24px' }}>
            {schoolStats.map((item, idx) => (
              <div key={idx} style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{
                  fontSize: 'clamp(2.2rem, 3.5vw, 2.8rem)',
                  fontWeight: 900,
                  color: '#38bdf8',
                  fontFamily: 'Manrope, sans-serif',
                  marginBottom: '2px'
                }}>
                  {item.number}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginBottom: '3px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHOOL TRIPS, EXCURSIONS & SPORTS GALA SECTION (USER REQUESTED HIGHLIGHT) ── */}
      <section id="trips" style={{ padding: '85px 20px', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '9999px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 800, marginBottom: '10px' }}>
              <Bus size={16} />
              <span>CO-CURRICULAR & RECREATIONAL LIFE</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
              School Excursions, Educational Trips & Sports Events
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
              At Wisdom House Education System, education extends beyond the four walls. We regularly organize memorable historical, scientific, and recreational visits across Karachi alongside our vibrant sports tournaments.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {[
              { id: 'all' as const, label: 'All Trips & Events' },
              { id: 'educational' as const, label: '🏛️ Educational & Heritage' },
              { id: 'recreation' as const, label: '🎡 Recreational & Picnics' },
              { id: 'sports' as const, label: '🏆 Sports & Cricket Gala' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTripCategory(tab.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTripCategory === tab.id ? '#0284c7' : 'rgba(15, 23, 42, 0.7)',
                  color: activeTripCategory === tab.id ? '#ffffff' : '#94a3b8',
                  border: activeTripCategory === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Trips Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                style={{
                  backgroundColor: '#0c1633',
                  borderRadius: '20px',
                  padding: '26px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease'
                }}
                className="hover:border-sky-400 hover:-translate-y-1"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: trip.type === 'sports' ? '#10b981' : trip.type === 'recreation' ? '#f59e0b' : '#38bdf8',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '4px 10px',
                      borderRadius: '9999px'
                    }}>
                      {trip.category}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>{trip.badge}</span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                    {trip.title}
                  </h3>
                  
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '18px' }}>
                    {trip.desc}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Trip Highlights:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {trip.highlights.map((h, hIdx) => (
                      <div key={hIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#94a3b8' }}>
                        <Check size={13} color="#38bdf8" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── STUDY CRITERIA & ACADEMIC WINGS (MONTESSORI TO MATRIC BSEK) ── */}
      <section id="academics" style={{ padding: '80px 20px', backgroundColor: '#070f26', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
            <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              OUR CURRICULUM & STUDY CRITERIA
            </div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.5rem)', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
              Academic Structure from Early Years to Matric (BSEK)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.94rem' }}>
              Structured, disciplined course plans focused on core English fluency, Urdu literacy, Science experiments, Mathematics, and BSEK Board Matric preparation.
            </p>
          </div>

          {/* Wing Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {academicWings.map(wing => (
              <button
                key={wing.id}
                onClick={() => setActiveWing(wing.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeWing === wing.id ? '#0284c7' : 'rgba(15, 23, 42, 0.8)',
                  color: activeWing === wing.id ? '#ffffff' : '#94a3b8',
                  border: activeWing === wing.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s'
                }}
              >
                {wing.title}
              </button>
            ))}
          </div>

          {/* Active Wing Detail Card */}
          {academicWings.filter(w => w.id === activeWing).map(wing => (
            <div
              key={wing.id}
              style={{
                background: 'linear-gradient(135deg, rgba(12, 22, 51, 0.95), rgba(15, 28, 64, 0.8))',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '36px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '36px',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '5px 12px', borderRadius: '9999px', display: 'inline-block', marginBottom: '14px' }}>
                  {wing.classes}
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
                  {wing.title}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.94rem', lineHeight: 1.7, marginBottom: '24px' }}>
                  {wing.desc}
                </p>
                <a
                  href="#admissions"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem'
                  }}
                >
                  <Sparkles size={15} />
                  <span>Apply for {wing.title}</span>
                </a>
              </div>

              <div style={{ background: 'rgba(6, 11, 24, 0.7)', borderRadius: '18px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Key Features & Methodology:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {wing.points.map((pt, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* ── 4 KARACHI CAMPUSES MENTION ── */}
      <section id="campuses" style={{ padding: '65px 20px', backgroundColor: '#0a142c', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800, marginBottom: '16px' }}>
            <Building size={16} />
            <span>CAMPUS NETWORK</span>
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 900, color: '#ffffff', marginBottom: '14px' }}>
            We Have 4 Campuses Across Karachi
          </h2>

          <p style={{ color: '#cbd5e1', fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto 24px' }}>
            Wisdom House Education System operates <strong>4 campuses</strong> across Karachi, providing unified academic curriculum, disciplined environment, and quality education from Montessori to Matriculation.
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 22px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Unified BSEK Karachi Curriculum & Certified Teaching Faculty at All 4 Campuses</span>
          </div>

        </div>
      </section>

      {/* ── SCHOOL LIFE & REAL FACEBOOK UPDATES ── */}
      <section id="activities" style={{ padding: '80px 20px', backgroundColor: '#070f26', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                CAMPUS HAPPENINGS & UPDATES
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', fontWeight: 900, color: '#ffffff' }}>
                Life at Wisdom House Education System
              </h2>
            </div>
            <a
              href="https://www.facebook.com/oxfordgrammarschool.edu.pk"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#1877f2',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
              className="hover:bg-blue-600"
            >
              <span>Visit Official Facebook Page</span>
              <ChevronRight size={16} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {facebookEvents.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#0c1633',
                  borderRadius: '18px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(2, 132, 199, 0.15)', padding: '3px 8px', borderRadius: '9999px' }}>
                    {ev.tag}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ev.date}</span>
                </div>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                  {ev.title}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {ev.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── ONLINE ADMISSION INQUIRY SECTION (WITH DIRECT WHATSAPP INTEGRATION) ── */}
      <section id="admissions" style={{ padding: '85px 20px', position: 'relative' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{
            borderRadius: '26px',
            padding: '2px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.6), rgba(2, 132, 199, 0.5))',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              backgroundColor: '#0a142e',
              borderRadius: '24px',
              padding: '40px 32px'
            }}>
              
              <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  marginBottom: '10px'
                }}>
                  <Sparkles size={15} />
                  <span>SESSION 2026-2027 ENROLLMENT</span>
                </span>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', fontWeight: 900, color: '#ffffff', marginBottom: '10px' }}>
                  Apply For Online Admission
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                  Fill in the details below. Our admissions coordinator will promptly verify and contact you on WhatsApp or phone.
                </p>
              </div>

              {formSubmitted ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '18px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    Inquiry Forwarded Successfully!
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '20px' }}>
                    Your inquiry details have been composed and opened in WhatsApp for instant submission to <strong>0330 4784749</strong>.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    style={{ padding: '10px 20px', background: '#0284c7', color: '#fff', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdmissionSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  
                  {/* Student Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      name="studentName"
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={formData.studentName}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Father Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Father / Guardian Name *
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      required
                      placeholder="e.g. Muhammad Tariq"
                      value={formData.fatherName}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Contact Number / WhatsApp */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Contact Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. 0330 4784749"
                      value={formData.phone}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Campus Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Select Campus (4 Campuses in Karachi) *
                    </label>
                    <select
                      name="campus"
                      value={formData.campus}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Campus 1">Campus 1 (Karachi)</option>
                      <option value="Campus 2">Campus 2 (Karachi)</option>
                      <option value="Campus 3">Campus 3 (Karachi)</option>
                      <option value="Campus 4">Campus 4 (Karachi)</option>
                    </select>
                  </div>

                  {/* Class Applying For */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Class / Grade Applying For *
                    </label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Playgroup">Montessori - Playgroup</option>
                      <option value="Nursery">Montessori - Nursery</option>
                      <option value="Kindergarten (KG)">Montessori - Kindergarten (KG)</option>
                      <option value="Class 1st">Class 1st</option>
                      <option value="Class 2nd">Class 2nd</option>
                      <option value="Class 3rd">Class 3rd</option>
                      <option value="Class 4th">Class 4th</option>
                      <option value="Class 5th">Class 5th</option>
                      <option value="Class 6th">Class 6th</option>
                      <option value="Class 7th">Class 7th</option>
                      <option value="Class 8th">Class 8th</option>
                      <option value="Class 9th (Matric Science - Biology)">Class 9th (Matric Science - Biology)</option>
                      <option value="Class 9th (Matric Science - Computer)">Class 9th (Matric Science - Computer Science)</option>
                      <option value="Class 10th (Matric Science - Biology)">Class 10th (Matric Science - Biology)</option>
                      <option value="Class 10th (Matric Science - Computer)">Class 10th (Matric Science - Computer Science)</option>
                    </select>
                  </div>

                  {/* Residential Area in Karachi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Karachi Residential Area / Location
                    </label>
                    <input
                      type="text"
                      name="area"
                      placeholder="e.g. Malir 15 / Model Colony / Gulshan"
                      value={formData.area}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Previous School */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      Previous School (If any)
                    </label>
                    <input
                      type="text"
                      name="previousSchool"
                      placeholder="e.g. Army Public / City School"
                      value={formData.previousSchool}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '13px 24px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)'
                      }}
                      className="hover:scale-102"
                    >
                      <MessageCircle size={18} />
                      <span>Submit Inquiry to WhatsApp</span>
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ── FAQS SECTION ── */}
      <section style={{ padding: '75px 20px', backgroundColor: '#070f26', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Common inquiries regarding Wisdom House Education System admissions in Karachi.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#0c1633',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      size={18}
                      color="#38bdf8"
                      style={{
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: '12px'
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 20px 18px', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── FOOTER & CONTACT ── */}
      <footer id="contact" style={{ backgroundColor: '#050a18', padding: '60px 20px 30px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '36px', marginBottom: '40px' }}>
            
            {/* School Profile */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Image src="/wisdom.png" alt="Wisdom House Education System" width={32} height={32} />
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>WISDOM HOUSE EDUCATION SYSTEM</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>
                Wisdom House Education System — A leading Karachi school system offering comprehensive academic curriculum from Montessori to Class 10th (BSEK Board).
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
                <ShieldCheck size={14} />
                <span>BSEK Board Karachi Verified</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', textTransform: 'uppercase' }}>
                Quick Navigation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <a href="#about" style={{ color: '#94a3b8' }} className="hover:text-sky-400">About Our School</a>
                <a href="#academics" style={{ color: '#94a3b8' }} className="hover:text-sky-400">Montessori to Matric (BSEK)</a>
                <a href="#trips" style={{ color: '#94a3b8' }} className="hover:text-sky-400">School Excursions & Sports Gala</a>
                <a href="#campuses" style={{ color: '#94a3b8' }} className="hover:text-sky-400">4 Campuses</a>
                <a href="#admissions" style={{ color: '#94a3b8' }} className="hover:text-sky-400">Admission Inquiry 2026-2027</a>
              </div>
            </div>

            {/* Institutional Portals */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', textTransform: 'uppercase' }}>
                Institutional Portals
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  href="/student/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                  className="hover:bg-sky-500"
                >
                  <GraduationCap size={16} />
                  <span>Student & Parent Portal</span>
                </Link>

                <Link
                  href="/teacher/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    color: '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  className="hover:bg-slate-700 hover:text-white"
                >
                  <Users size={16} />
                  <span>Teacher & Faculty Portal</span>
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', textTransform: 'uppercase' }}>
                Contact & Helplines
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="#38bdf8" />
                  <span>0330 4784749 (Helpline & WhatsApp)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="#38bdf8" />
                  <span>4 Campuses Across Karachi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="#38bdf8" />
                  <span>Mon - Sat: 7:45 AM - 2:00 PM</span>
                </div>
              </div>
            </div>

          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#64748b' }}>
            <div>
              © {new Date().getFullYear()} Wisdom House Education System, Karachi. All rights reserved.
            </div>
            <div>
              Affiliated with Board of Secondary Education Karachi (BSEK)
            </div>
          </div>

        </div>
      </footer>

      {/* ── PORTALS POPUP MODAL (STUDENT & TEACHER ONLY) ── */}
      {isPortalModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsPortalModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0c1633',
              borderRadius: '24px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '32px',
              maxWidth: '520px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPortalModalOpen(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.15)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={26} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                Select Institutional Portal
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Wisdom House Education System Karachi
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Student Portal */}
              <Link
                href="/student/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(2, 132, 199, 0.05))',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#ffffff',
                  transition: 'all 0.2s'
                }}
                className="hover:border-sky-400 hover:bg-sky-950"
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GraduationCap size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Student & Parent Portal</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fee vouchers, homework, timetable & results</div>
                </div>
                <ChevronRight size={18} color="#38bdf8" />
              </Link>

              {/* Teacher Portal */}
              <Link
                href="/teacher/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.3), rgba(30, 41, 59, 0.1))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  transition: 'all 0.2s'
                }}
                className="hover:border-slate-400 hover:bg-slate-800"
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Teacher & Faculty Portal</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mark attendance, student rosters & test entries</div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </Link>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
