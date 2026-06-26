import React, { useState, useEffect, useRef } from 'react';
import {
  Search, LayoutDashboard, TrendingUp, ChevronRight, Star,
  ArrowRight, Target, Brain, BarChart3, Clock, AlertCircle, Layers,
  Menu, X, Play, Sparkles, Building2, Telescope, SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';

/* ─────────────────────────── design tokens ─────────────────────────── */
const C = {
  bg0:       '#081120',           // dark navy
  bg1:       '#0D1929',           // surface
  bg2:       '#101827',           // surface 2
  border:    'rgba(255,255,255,0.07)',
  borderBlue: 'rgba(10,91,255,0.28)',
  borderSky:  'rgba(46,168,255,0.22)',
  text1:     '#F8FAFC',
  text2:     '#94A3B8',
  text3:     '#64748b',
  blue:      '#0A5BFF',           // primary blue
  blueL:     '#2EA8FF',           // secondary blue
  sky:       '#38BDF8',           // light blue
  blueDark:  '#0847CC',           // dark blue
  amber:     '#f59e0b',
  red:       '#ef4444',
};

/* ─────────────────────────── css animations ─────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .lp-root {
    font-family: 'Inter', -apple-system, sans-serif;
    background: ${C.bg0};
    color: ${C.text1};
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
  }

  /* grid bg */
  .lp-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(10,91,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(10,91,255,0.04) 1px, transparent 1px);
    background-size: 64px 64px;
  }

  /* glow blobs */
  .lp-glow-top {
    position: fixed; top: -120px; left: 50%; transform: translateX(-50%);
    width: 900px; height: 600px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(10,91,255,0.14) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .lp-glow-right {
    position: fixed; top: 30vh; right: -200px;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(46,168,255,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  /* navbar */
  .lp-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(8,17,32,0.84);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid ${C.border};
  }
  .lp-nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
    height: 60px;
  }
  .lp-nav-links { display: flex; gap: 28px; }
  .lp-nav-link {
    font-size: 14px; color: ${C.text2}; text-decoration: none;
    transition: color 0.15s; cursor: pointer; background: none; border: none;
  }
  .lp-nav-link:hover { color: ${C.text1}; }
  .lp-btn-ghost {
    font-size: 14px; color: ${C.text2}; background: none; border: none;
    padding: 8px 16px; cursor: pointer; border-radius: 8px;
    transition: color 0.15s, background 0.15s;
  }
  .lp-btn-ghost:hover { color: ${C.text1}; background: rgba(255,255,255,0.05); }
  .lp-btn-primary {
    font-size: 14px; font-weight: 600;
    background: ${C.blue}; color: #fff;
    border: none; padding: 9px 20px; border-radius: 8px;
    cursor: pointer; transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 14px rgba(10,91,255,0.35);
  }
  .lp-btn-primary:hover {
    background: ${C.blueDark}; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(10,91,255,0.45);
  }
  .lp-btn-primary-lg {
    font-size: 15px; font-weight: 600;
    background: ${C.blue}; color: #fff;
    border: none; padding: 13px 28px; border-radius: 10px;
    cursor: pointer; transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 20px rgba(10,91,255,0.4);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .lp-btn-primary-lg:hover {
    background: ${C.blueDark}; transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(10,91,255,0.5);
  }
  .lp-btn-secondary-lg {
    font-size: 15px; font-weight: 500;
    background: rgba(255,255,255,0.04); color: ${C.text2};
    border: 1px solid ${C.border}; padding: 13px 28px; border-radius: 10px;
    cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .lp-btn-secondary-lg:hover {
    background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14);
    color: ${C.text1};
  }

  /* badges */
  .lp-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid rgba(10,91,255,0.32);
    background: rgba(10,91,255,0.09);
    border-radius: 999px; padding: 5px 14px;
    font-size: 12px; color: #93c5fd; font-weight: 500;
    margin-bottom: 28px;
  }
  .lp-badge-sky {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid rgba(46,168,255,0.32);
    background: rgba(46,168,255,0.09);
    border-radius: 999px; padding: 5px 14px;
    font-size: 12px; color: #7dd3fc; font-weight: 500;
    margin-bottom: 28px;
  }
  .lp-badge-red {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid rgba(239,68,68,0.25);
    background: rgba(239,68,68,0.06);
    border-radius: 999px; padding: 5px 14px;
    font-size: 12px; color: #fca5a5; font-weight: 500;
    margin-bottom: 28px;
  }

  /* sections */
  .lp-section { position: relative; z-index: 1; }
  .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .lp-container-sm { max-width: 900px; margin: 0 auto; padding: 0 24px; }

  /* hero */
  .lp-hero { padding: 96px 24px 64px; text-align: center; }
  .lp-h1 {
    font-size: clamp(42px, 6vw, 72px); font-weight: 800;
    line-height: 1.06; letter-spacing: -0.03em;
    color: ${C.text1}; margin-bottom: 22px;
  }
  .lp-h1-grad {
    background: linear-gradient(135deg, #38BDF8 0%, #2EA8FF 45%, #0A5BFF 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lp-hero-sub {
    font-size: 18px; line-height: 1.7; color: ${C.text2};
    max-width: 620px; margin: 0 auto 36px;
  }
  .lp-hero-ctas {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; flex-wrap: wrap; margin-bottom: 64px;
  }

  /* browser chrome */
  .lp-browser {
    position: relative; max-width: 1040px; margin: 0 auto;
    border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
  }
  .lp-browser-chrome {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; background: #0D1929;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .lp-dot { width: 11px; height: 11px; border-radius: 50%; }
  .lp-url-bar {
    margin-left: 8px; flex: 1; max-width: 280px;
    height: 22px; background: rgba(255,255,255,0.05);
    border-radius: 5px; display: flex; align-items: center;
    padding: 0 10px; font-size: 11px; color: ${C.text3};
    font-family: 'JetBrains Mono', monospace;
  }
  .lp-browser img { display: block; width: 100%; }
  .lp-browser-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 120px;
    background: linear-gradient(to top, ${C.bg0}, transparent);
    pointer-events: none;
  }
  .lp-browser-glow {
    position: absolute; inset: -20px;
    background: radial-gradient(ellipse at 50% 100%, rgba(10,91,255,0.18) 0%, transparent 60%);
    pointer-events: none; z-index: -1;
  }

  /* metrics */
  .lp-metrics {
    padding: 56px 24px;
    border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border};
    background: rgba(255,255,255,0.01);
  }
  .lp-metrics-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .lp-metric-card {
    text-align: center; padding: 28px 16px;
    border: 1px solid ${C.border}; border-radius: 14px;
    background: rgba(255,255,255,0.02);
    transition: border-color 0.2s, background 0.2s;
  }
  .lp-metric-card:hover {
    border-color: rgba(10,91,255,0.3); background: rgba(10,91,255,0.05);
  }
  .lp-metric-num {
    font-size: 48px; font-weight: 800; line-height: 1;
    background: linear-gradient(135deg, #38BDF8, #0A5BFF);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; margin-bottom: 8px;
  }
  .lp-metric-label { font-size: 13px; color: ${C.text2}; }

  /* cards */
  .lp-card {
    border: 1px solid ${C.border}; border-radius: 16px;
    background: rgba(255,255,255,0.02); padding: 24px;
    transition: border-color 0.25s, background 0.25s, transform 0.25s;
  }
  .lp-card:hover { transform: translateY(-2px); }
  .lp-card-red:hover    { border-color: rgba(239,68,68,0.3);  background: rgba(239,68,68,0.04); }
  .lp-card-amber:hover  { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.04); }
  .lp-card-orange:hover { border-color: rgba(249,115,22,0.3); background: rgba(249,115,22,0.04); }
  .lp-card-blue:hover   { border-color: rgba(10,91,255,0.3);  background: rgba(10,91,255,0.04); }

  /* feature cards */
  .lp-feat-card {
    border: 1px solid ${C.border}; border-radius: 16px;
    background: rgba(255,255,255,0.02); padding: 24px;
    cursor: default; transition: all 0.25s;
  }
  .lp-feat-card.active-blue   { border-color: rgba(10,91,255,0.38);  background: rgba(10,91,255,0.08); }
  .lp-feat-card.active-sky    { border-color: rgba(46,168,255,0.38);  background: rgba(46,168,255,0.07); }
  .lp-feat-card.active-light  { border-color: rgba(56,189,248,0.38);  background: rgba(56,189,248,0.06); }
  .lp-feat-card.active-amber  { border-color: rgba(245,158,11,0.38);  background: rgba(245,158,11,0.06); }

  /* step cards */
  .lp-step { border-radius: 16px; padding: 28px; position: relative; }
  .lp-step-blue   { border: 1px solid rgba(10,91,255,0.22);  background: rgba(10,91,255,0.07); }
  .lp-step-mid    { border: 1px solid rgba(8,71,204,0.22);   background: rgba(8,71,204,0.07); }
  .lp-step-sky    { border: 1px solid rgba(46,168,255,0.22); background: rgba(46,168,255,0.07); }

  /* testimonial */
  .lp-testi {
    border: 1px solid ${C.border}; border-radius: 16px;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%);
    padding: 24px; display: flex; flex-direction: column; gap: 18px;
    transition: border-color 0.2s;
  }
  .lp-testi:hover { border-color: rgba(10,91,255,0.28); }

  /* CTA block */
  .lp-cta-block {
    border: 1px solid rgba(10,91,255,0.24); border-radius: 24px;
    background: linear-gradient(135deg, rgba(10,91,255,0.1) 0%, rgba(13,25,41,1) 50%, rgba(46,168,255,0.07) 100%);
    padding: 80px 48px; text-align: center; position: relative; overflow: hidden;
  }

  /* footer */
  .lp-footer {
    border-top: 1px solid ${C.border};
    padding: 56px 24px;
  }

  /* mobile nav */
  .lp-mobile-nav { display: none; }

  /* strip */
  .lp-strip {
    padding: 14px 24px;
    border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border};
    background: rgba(255,255,255,0.01);
    display: flex; flex-wrap: wrap; align-items: center;
    justify-content: center; gap: 10px;
  }
  .lp-strip-badge {
    display: inline-flex; align-items: center; gap: 7px;
    border: 1px solid; border-radius: 999px; padding: 6px 16px;
    font-size: 13px; font-weight: 500;
  }

  /* section headers */
  .lp-sh { text-align: center; margin-bottom: 56px; }
  .lp-h2 {
    font-size: clamp(28px, 4vw, 46px); font-weight: 800;
    letter-spacing: -0.025em; color: ${C.text1}; margin-bottom: 16px; line-height: 1.1;
  }
  .lp-h2-sub { font-size: 17px; color: ${C.text2}; max-width: 540px; margin: 0 auto; line-height: 1.65; }

  @keyframes lp-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .lp-pulse { animation: lp-pulse 2s ease-in-out infinite; }

  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-fade-up { animation: lp-fade-up 0.6s ease forwards; }

  @media (max-width: 900px) {
    .lp-metrics-grid { grid-template-columns: repeat(2,1fr); }
    .lp-nav-links, .lp-nav-ctas { display: none !important; }
    .lp-mobile-btn { display: flex !important; }
    .lp-mobile-nav { display: flex; }
  }
  @media (max-width: 640px) {
    .lp-metrics-grid { grid-template-columns: repeat(2,1fr); }
    .lp-hero { padding: 72px 20px 48px; }
    .lp-cta-block { padding: 48px 24px; }
    .lp-h2 { font-size: 28px; }
  }
`;

/* ─────────────────────────── data ─────────────────────────── */
const FEATURES = [
  { icon: Telescope,        title: 'AI Job Discovery',      color: 'blue',  desc: 'Discover relevant roles faster using intelligent filters and AI-powered recommendations tailored to your skills.' },
  { icon: Building2,        title: 'Company Research',       color: 'sky',   desc: 'Understand company culture, funding stage, products, and hiring signals before you apply.' },
  { icon: LayoutDashboard,  title: 'Application Tracker',    color: 'light', desc: 'A single visual pipeline for every application across every stage — statuses, deadlines, contacts, and notes.' },
  { icon: Search,           title: 'AI Research Assistant',  color: 'blue',  desc: 'Deep-research any company, role, recruiter, or market signal in seconds with real intelligence.' },
  { icon: SlidersHorizontal,title: 'Opportunity Scoring',   color: 'sky',   desc: 'AI scores every role across match potential, growth, and salary alignment so you focus on the right opportunities.' },
  { icon: TrendingUp,       title: 'Smart Insights',         color: 'amber', desc: 'See where applications drop off, which roles convert better, and what to improve to move opportunities forward.' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen', role: 'Product Designer → Ghost', initials: 'SC',
    grad: 'linear-gradient(135deg,#0A5BFF,#0847CC)',
    quote: 'For the first time, I could see every application in one place. No more spreadsheet chaos, no more wondering what I applied to last week. Everything was right there.',
  },
  {
    name: 'Marcus Rivera', role: 'Product Manager → Linear', initials: 'MR',
    grad: 'linear-gradient(135deg,#2EA8FF,#0A5BFF)',
    quote: 'The research feature helped me understand companies before applying. I stopped wasting applications on roles that weren\'t right. My response rate doubled in three weeks.',
  },
  {
    name: 'Priya Nair', role: 'Senior Engineer → Vercel', initials: 'PN',
    grad: 'linear-gradient(135deg,#38BDF8,#2EA8FF)',
    quote: 'Tracking my pipeline changed everything. I became more intentional with every application — I could see what was working, what wasn\'t, and course-correct in real time.',
  },
];

const PROBLEMS = [
  { icon: Layers,    color: C.red,    border: 'rgba(239,68,68,0.22)',    cls: 'lp-card-red',    title: 'Lost Applications',       desc: 'Spreadsheets and sticky notes can\'t scale. Applications fall through cracks and follow-ups are missed entirely.' },
  { icon: Clock,     color: C.amber,  border: 'rgba(245,158,11,0.22)',   cls: 'lp-card-amber',  title: 'Missed Follow-ups',        desc: '73% of hiring managers say timely follow-up influences their decision. Most candidates never follow up at all.' },
  { icon: Target,    color: '#f97316',border: 'rgba(249,115,22,0.22)',   cls: 'lp-card-orange', title: 'Poor Opportunity Fit',     desc: 'Most job seekers apply to roles without understanding fit, culture, or market position — reducing interview chances.' },
  { icon: Building2, color: C.blueL,  border: 'rgba(46,168,255,0.22)',   cls: 'lp-card-blue',   title: 'Weak Company Research',    desc: 'Showing up underprepared signals disinterest. Candidates who research deeply get more callbacks and convert better.' },
];

const STEPS = [
  {
    num: '01', cls: 'lp-step-blue',  icon: Target,    iconColor: '#60A5FA', iconBorder: 'rgba(10,91,255,0.3)',  numColor: 'rgba(10,91,255,0.38)',
    title: 'Add Job Opportunity', desc: 'Paste a job URL or description. ApplyFlow instantly pulls company data, role requirements, and evaluates your match percentage.',
  },
  {
    num: '02', cls: 'lp-step-mid',   icon: Brain,     iconColor: '#93C5FD', iconBorder: 'rgba(8,71,204,0.3)',   numColor: 'rgba(8,71,204,0.4)',
    title: 'Research & Analyze',  desc: 'Get company insights, role fit signals, recruiter context, and market data — so you understand exactly what you\'re walking into.',
  },
  {
    num: '03', cls: 'lp-step-sky',   icon: BarChart3, iconColor: '#7DD3FC', iconBorder: 'rgba(46,168,255,0.3)', numColor: 'rgba(46,168,255,0.38)',
    title: 'Track & Improve',     desc: 'Monitor every application through your pipeline. Review analytics that show you what\'s working and get notified when to follow up.',
  },
];

/* ─────────────────────────── colour helpers ─────────────────────────── */
function featureActiveClass(color) {
  return { blue: 'active-blue', sky: 'active-sky', light: 'active-light', amber: 'active-amber' }[color] || 'active-blue';
}
function featureIconColor(color) {
  return { blue: '#60A5FA', sky: '#7DD3FC', light: '#38BDF8', amber: C.amber }[color];
}
function featureIconBg(color) {
  return { blue: 'rgba(10,91,255,0.12)', sky: 'rgba(46,168,255,0.12)', light: 'rgba(56,189,248,0.1)', amber: 'rgba(245,158,11,0.1)' }[color];
}
function featureTextColor(color) {
  return { blue: '#93C5FD', sky: '#7DD3FC', light: '#38BDF8', amber: '#FCD34D' }[color];
}

/* ─────────────────────────── component ─────────────────────────── */
export default function LandingPage({ onGetStarted }) {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [counts, setCounts]               = useState([0, 0, 0, 0]);
  const countsRef = useRef(false);

  /* restore body scroll while landing page is mounted */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    if (root) root.style.overflow = 'hidden';
    return () => {};
  }, []);

  /* animated counters */
  useEffect(() => {
    if (countsRef.current) return;
    countsRef.current = true;
    const targets   = [43, 100, 3, 73];
    const durations = [1200, 1400, 1000, 1600];
    targets.forEach((target, i) => {
      const step = Math.ceil(target / 40);
      let current = 0;
      const tick = () => {
        current = Math.min(current + step, target);
        setCounts(prev => { const n = [...prev]; n[i] = current; return n; });
        if (current < target) setTimeout(tick, durations[i] / 40);
      };
      setTimeout(tick, 300 + i * 120);
    });
  }, []);

  const NAV_LINKS = ['Features', 'How It Works', 'Pricing', 'Blog'];

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-root" style={{ height: '100vh' }}>
        <div className="lp-grid" />
        <div className="lp-glow-top" />
        <div className="lp-glow-right" />

        {/* ── NAVBAR ── */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo-full.svg" alt="Applyflow" style={{ height: 30, width: 'auto', display: 'block' }} />
            </div>

            {/* Desktop links */}
            <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {NAV_LINKS.map(l => <button key={l} className="lp-nav-link">{l}</button>)}
            </div>

            <div className="lp-nav-ctas" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="lp-btn-ghost" onClick={onGetStarted}>Sign In</button>
              <button className="lp-btn-primary" onClick={onGetStarted}>Get Started →</button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lp-mobile-btn"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="lp-mobile-nav" style={{
              flexDirection: 'column', gap: 4, padding: '12px 20px 20px',
              background: 'rgba(8,17,32,0.97)', borderTop: `1px solid ${C.border}`,
            }}>
              {NAV_LINKS.map(l => (
                <button key={l} className="lp-nav-link" style={{ padding: '10px 0', textAlign: 'left' }}>{l}</button>
              ))}
              <button
                className="lp-btn-primary" onClick={onGetStarted}
                style={{ marginTop: 8, width: '100%', padding: '12px', borderRadius: 8 }}
              >Get Started</button>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section className="lp-section lp-hero">
          <div className="lp-badge">
            <Sparkles size={11} />
            <span>AI-Powered Job Application OS</span>
          </div>

          <h1 className="lp-h1">
            Stop Applying Blindly.<br />
            <span className="lp-h1-grad">Start Applying Smarter.</span>
          </h1>

          <p className="lp-hero-sub">
            Discover opportunities, research companies deeply, track every application,
            and make smarter decisions — all from one AI-powered workspace built for serious job seekers.
          </p>

          <div className="lp-hero-ctas">
            <button className="lp-btn-primary-lg" onClick={onGetStarted}>
              Get Started Free <ArrowRight size={16} />
            </button>
            <button className="lp-btn-secondary-lg" onClick={onGetStarted}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={10} style={{ marginLeft: 2 }} />
              </div>
              Watch Demo
            </button>
          </div>

          {/* Browser frame */}
          <div style={{ position: 'relative', maxWidth: 1040, margin: '0 auto' }}>
            <div className="lp-browser-glow" />
            <div className="lp-browser">
              <div className="lp-browser-chrome">
                <div className="lp-dot" style={{ background: '#ef4444' }} />
                <div className="lp-dot" style={{ background: '#f59e0b' }} />
                <div className="lp-dot" style={{ background: '#22c55e' }} />
                <div className="lp-url-bar">app.applyflow.ai/dashboard</div>
              </div>
              <img
                src="/Landing/applyflow dashboard.jpg"
                alt="ApplyFlow dashboard — pipeline analytics, AI match scores, and opportunity tracking"
                style={{ display: 'block', width: '100%' }}
              />
              <div className="lp-browser-fade" />
            </div>
          </div>
        </section>

        {/* ── CAPABILITY STRIP ── */}
        <div className="lp-strip lp-section">
          {[
            { icon: Brain,            label: 'AI-Powered Insights',    bc: 'rgba(10,91,255,0.22)',  bg: 'rgba(10,91,255,0.07)',  tc: '#93c5fd' },
            { icon: LayoutDashboard,  label: 'Real-Time Tracking',      bc: 'rgba(46,168,255,0.22)', bg: 'rgba(46,168,255,0.07)', tc: '#7dd3fc' },
            { icon: Building2,        label: 'Deep Company Research',   bc: 'rgba(56,189,248,0.22)', bg: 'rgba(56,189,248,0.07)', tc: '#38bdf8' },
            { icon: SlidersHorizontal,label: 'Opportunity Scoring',    bc: 'rgba(10,91,255,0.22)',  bg: 'rgba(8,71,204,0.08)',   tc: '#93c5fd' },
            { icon: TrendingUp,       label: 'Smarter Decisions',       bc: 'rgba(46,168,255,0.22)', bg: 'rgba(46,168,255,0.07)', tc: '#7dd3fc' },
            { icon: Target,           label: 'Pipeline Analytics',      bc: 'rgba(10,91,255,0.22)',  bg: 'rgba(10,91,255,0.07)',  tc: '#93c5fd' },
          ].map(b => {
            const I = b.icon;
            return (
              <div key={b.label} className="lp-strip-badge" style={{ borderColor: b.bc, background: b.bg, color: b.tc }}>
                <I size={13} />
                {b.label}
              </div>
            );
          })}
        </div>

        {/* ── METRICS ── */}
        <section className="lp-metrics lp-section">
          <div className="lp-container">
            <div className="lp-metrics-grid">
              {[
                { num: counts[0], suffix: '+',   label: 'Opportunities tracked per user' },
                { num: counts[1], suffix: 'pts', label: 'Max AI match compatibility score' },
                { num: counts[2], suffix: 'x',   label: 'Faster company research with AI' },
                { num: counts[3], suffix: '%',   label: 'Of managers influenced by follow-up' },
              ].map((m, i) => (
                <div className="lp-metric-card" key={i}>
                  <div className="lp-metric-num">{m.num}{m.suffix}</div>
                  <div className="lp-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="lp-section" style={{ padding: '96px 24px' }}>
          <div className="lp-container">
            <div className="lp-sh">
              <div className="lp-badge-red"><AlertCircle size={11} />The Problem</div>
              <h2 className="lp-h2">Job hunting shouldn't feel<br />like a full-time job.</h2>
              <p className="lp-h2-sub">
                The average job seeker applies to 100+ positions and gets 3 interviews.
                Most of that effort is entirely wasted.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {PROBLEMS.map(p => {
                const I = p.icon;
                return (
                  <div key={p.title} className={`lp-card ${p.cls}`}>
                    <div style={{ color: p.color, marginBottom: 14 }}><I size={24} /></div>
                    <h3 style={{ fontWeight: 600, fontSize: 15, color: C.text1, marginBottom: 8 }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="lp-section" style={{ padding: '0 24px 96px', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 700, height: 400, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(10,91,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="lp-container" style={{ position: 'relative' }}>
            <div className="lp-sh">
              <div className="lp-badge"><Sparkles size={11} />Everything You Need</div>
              <h2 className="lp-h2">One workspace. Every edge.</h2>
              <p className="lp-h2-sub">
                Six AI-powered tools working together to transform how you find, apply for, and land your next role.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
              {FEATURES.map((f, i) => {
                const I = f.icon;
                const isActive = activeFeature === i;
                const ac = featureActiveClass(f.color);
                return (
                  <div
                    key={f.title}
                    className={`lp-feat-card${isActive ? ' ' + ac : ''}`}
                    onMouseEnter={() => setActiveFeature(i)}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? featureIconBg(f.color) : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isActive ? featureIconBg(f.color) : C.border}`,
                      color: isActive ? featureIconColor(f.color) : C.text3,
                      transition: 'all 0.25s',
                    }}>
                      <I size={18} />
                    </div>
                    <h3 style={{ fontWeight: 600, fontSize: 15, color: C.text1, marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>{f.desc}</p>
                    <div style={{
                      marginTop: 16, display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 500,
                      color: isActive ? featureTextColor(f.color) : C.text3,
                      transition: 'color 0.25s',
                    }}>
                      Learn more <ChevronRight size={13} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DASHBOARD SHOWCASE ── */}
        <section className="lp-section" style={{ padding: '0 24px 96px' }}>
          <div className="lp-container">
            <div className="lp-sh">
              <div className="lp-badge-sky"><BarChart3 size={11} />The Product</div>
              <h2 className="lp-h2">Total clarity over your<br />job search.</h2>
              <p className="lp-h2-sub">
                Pipeline metrics, AI match recommendations, follow-up tracking, and industry analytics — all in one view.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -24,
                background: 'radial-gradient(ellipse at 50% 0%, rgba(10,91,255,0.13) 0%, transparent 60%)',
                borderRadius: 32, pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden',
                border: `1px solid rgba(255,255,255,0.08)`,
                boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(10,91,255,0.55), transparent)',
                }} />
                <img
                  src="/Landing/applyflow dashboard.jpg"
                  alt="ApplyFlow full dashboard view"
                  style={{ display: 'block', width: '100%' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                  background: `linear-gradient(to top, ${C.bg0}, transparent)`,
                  pointerEvents: 'none', zIndex: 1,
                }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section" style={{ padding: '0 24px 96px' }}>
          <div className="lp-container-sm">
            <div className="lp-sh">
              <div className="lp-badge"><CheckCircle2 size={11} />Simple Process</div>
              <h2 className="lp-h2">From chaotic to systematic<br />in three steps.</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, position: 'relative' }}>
              {STEPS.map(s => {
                const I = s.icon;
                return (
                  <div key={s.num} className={`lp-step ${s.cls}`}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: s.numColor, position: 'absolute', top: 20, right: 20, fontVariantNumeric: 'tabular-nums' }}>
                      {s.num}
                    </div>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, marginBottom: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.iconBorder}`,
                      color: s.iconColor,
                    }}>
                      <I size={22} />
                    </div>
                    <h3 style={{ fontWeight: 600, fontSize: 17, color: C.text1, marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section" style={{ padding: '0 24px 96px', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 800, height: 400, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(46,168,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="lp-container" style={{ position: 'relative' }}>
            <div className="lp-sh">
              <div className="lp-badge-sky"><Star size={11} />Real Results</div>
              <h2 className="lp-h2">Jobs won. Offers landed.<br />Careers changed.</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="lp-testi">
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={C.amber} color={C.amber} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.75, flex: 1 }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: t.grad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>{t.initials}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.text1 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: C.text3 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-section" style={{ padding: '0 24px 96px' }}>
          <div className="lp-container-sm">
            <div className="lp-cta-block">
              {/* top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(10,91,255,0.65), transparent)' }} />
              {/* glow blobs */}
              <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 500, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(10,91,255,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -40, right: -40, width: 300, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(46,168,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative' }}>
                <div className="lp-badge" style={{ marginBottom: 24 }}><Sparkles size={11} />Start for free today</div>
                <h2 className="lp-h2" style={{ marginBottom: 16 }}>
                  Your next opportunity<br />deserves a better system.
                </h2>
                <p style={{ fontSize: 17, color: C.text2, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.65 }}>
                  Join thousands of job seekers who replaced spreadsheet chaos with an intelligent, AI-powered workflow.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button className="lp-btn-primary-lg" onClick={onGetStarted}>
                    Get Started Free <ArrowRight size={16} />
                  </button>
                  <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>No credit card required · Free forever plan</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer lp-section">
          <div className="lp-container">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
              {/* Brand col */}
              <div>
                <div style={{ marginBottom: 14 }}>
                  <img src="/logo-full.svg" alt="Applyflow" style={{ height: 24, width: 'auto', display: 'block' }} />
                </div>
                <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.7, maxWidth: 240 }}>
                  The AI-powered job application OS for serious job seekers. Apply smarter, not harder.
                </p>
              </div>
              {/* Link cols */}
              {[
                { title: 'Product',   links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
                { title: 'Resources', links: ['Blog', 'Job Search Guide', 'Research Playbook', 'API'] },
                { title: 'Company',   links: ['About', 'Careers', 'Privacy', 'Terms'] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{col.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {col.links.map(link => (
                      <a key={link} href="#" style={{ fontSize: 13, color: C.text3, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = C.text2}
                        onMouseLeave={e => e.target.style.color = C.text3}
                      >{link}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
              paddingTop: 24, borderTop: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 12, color: C.text3 }}>© 2025 ApplyFlow, Inc. All rights reserved.</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="lp-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 12, color: C.text3 }}>All systems operational</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
