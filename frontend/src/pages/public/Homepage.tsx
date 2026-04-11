import { useEffect, useMemo, useRef, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import tupBuilding from '../../assets/tup-building.gif';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'departments', label: 'Departments' },
  { id: 'categories', label: 'Browse' },
] as const;

const stats = [
  { value: '500+', label: 'Thesis Documents' },
  { value: '3', label: 'Programs' },
  { value: '10+', label: 'Years of Research' },
  { value: '200+', label: 'Research Groups' },
];

const features = [
  {
    title: 'Intelligent Search',
    description:
      'Find thesis documents effortlessly with our AI-powered smart search. Get relevant results through natural language queries, auto-suggestions, and intelligent keyword matching.',
    iconClass: 'fi-maroon',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4c0 2 1.5 3.5 2.5 5L12 14l1.5-3C14.5 9.5 16 8 16 6a4 4 0 0 0-4-4z" />
        <circle cx="12" cy="6" r="1" />
        <path d="M7 18h10" />
        <path d="M9 22h6" />
        <path d="m4.9 13.4 2.6-1.5" />
        <path d="m16.5 11.9 2.6 1.5" />
      </svg>
    ),
  },
  {
    title: 'Organized Collection',
    description:
      'All thesis documents are categorized by program, year, and research area for effortless navigation and easy discovery.',
    iconClass: 'fi-sage',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Secure Access',
    description:
      'Role-based authentication ensures that only authorized students, faculty, and administrators can access thesis documents.',
    iconClass: 'fi-terracotta',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const departments = [
  {
    count: '150+',
    name: 'Computer Science',
    label: 'Thesis Documents',
    iconClass: 'di-maroon',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm4 11h-3v3h-2v-3H6v-2h3v-3h2v3h3v2z" />
      </svg>
    ),
  },
  {
    count: '120+',
    name: 'Information Technology',
    label: 'Thesis Documents',
    iconClass: 'di-sky',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10z" />
      </svg>
    ),
  },
  {
    count: '100+',
    name: 'Information Systems',
    label: 'Thesis Documents',
    iconClass: 'di-sage',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm3-4H7v-2h8v2zm0-4H7V7h8v2z" />
      </svg>
    ),
  },
];

const categories = [
  {
    title: 'Web & Mobile Development',
    count: '85+ documents',
    iconClass: 'di-maroon',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
  },
  {
    title: 'Artificial Intelligence & ML',
    count: '62+ documents',
    iconClass: 'di-sky',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4c0 2 1.5 3.5 2.5 5L12 14l1.5-3C14.5 9.5 16 8 16 6a4 4 0 0 0-4-4z" />
        <circle cx="12" cy="6" r="1" />
        <path d="M7 18h10" />
        <path d="M9 22h6" />
      </svg>
    ),
  },
  {
    title: 'Cybersecurity & Networking',
    count: '48+ documents',
    iconClass: 'di-sage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'IoT & Embedded Systems',
    count: '35+ documents',
    iconClass: 'di-terracotta',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <path d="M13 2h8v8" />
        <path d="M16 8V5h-3" />
        <path d="m21 3-9 9" />
      </svg>
    ),
  },
  {
    title: 'Data Science & Analytics',
    count: '54+ documents',
    iconClass: 'di-sky',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    ),
  },
  {
    title: 'Human-Computer Interaction',
    count: '28+ documents',
    iconClass: 'di-sage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Game Development',
    count: '22+ documents',
    iconClass: 'di-maroon',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    title: 'Automation & Robotics',
    count: '18+ documents',
    iconClass: 'di-terracotta',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

const accessRoles = [
  { label: 'Student', path: '/sign-in/student', primary: true },
  { label: 'Faculty', path: '/sign-in/faculty', primary: false },
  { label: 'VPAA', path: '/sign-in/vpaa', primary: false },
];

type ChatMessage = {
  type: 'bot' | 'user';
  text: string;
};

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BotFabIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path className="bot-fill" d="M32 11c-11.9 0-21.5 9.4-21.5 21v8.1c0 4.2 3.4 7.7 7.7 7.7h1.2c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.4-2.2-2.8-3.4-6.2-3.4-9.9 0-8.8 6.5-15.2 14.5-15.2s14.5 6.4 14.5 15.2V35h-3.2c-1 0-1.9.8-1.9 1.9v2.5c0 3.1-2.5 5.6-5.6 5.6h-7.6c-1.3 0-2.4 1.1-2.4 2.4v2.2c0 1.3 1.1 2.4 2.4 2.4h8.1c6.2 0 11.2-5 11.2-11.2v-.6h.8c4.2 0 7.7-3.4 7.7-7.7V32c0-11.6-9.6-21-21.5-21z" />
      <rect className="bot-fill" x="7.5" y="27.5" width="7.8" height="18.7" rx="3.9" />
      <rect className="bot-fill" x="48.7" y="27.5" width="7.8" height="18.7" rx="3.9" />
      <path className="bot-fill" d="M24.6 25.6c2.4-1.5 4.8-2.1 7.4-2.1 2.7 0 5.2.7 7.7 2.2 1.5 1 2.3 2.8 2 4.6l-1.5 9c-.3 1.9-1.9 3.2-3.8 3.2H27.7c-1.9 0-3.5-1.4-3.8-3.2l-1.5-8.9c-.3-1.9.5-3.8 2.2-4.8z" />
      <circle className="bot-cut" cx="27.7" cy="33.2" r="2.3" />
      <circle className="bot-cut" cx="36.3" cy="33.2" r="2.3" />
      <path className="bot-fill" d="M20.1 47.1c-.9 0-1.7-.7-1.7-1.7s.7-1.7 1.7-1.7h5.2c.9 0 1.7.7 1.7 1.7s-.7 1.7-1.7 1.7h-5.2z" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2a7 7 0 0 0-7 7v2a3 3 0 0 0 3 3h1v1a2 2 0 0 0 2 2h2a4 4 0 0 0 4-4v-3a5 5 0 0 0-10 0v1H8a1 1 0 0 1-1-1V9a5 5 0 0 1 10 0v5a2 2 0 0 1-2 2h-2v2h2a4 4 0 0 0 4-4v-3h1a3 3 0 0 0 3-3V9a7 7 0 0 0-7-7z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3.4 20.4 21 12 3.4 3.6 3 10.1l12 1.9-12 1.9z" />
    </svg>
  );
}

function HomePageStyles() {
  return (
    <style>{`
      .homepage-shell{--maroon:#8b2332;--maroon-dark:#6e1c28;--terracotta:#c4654a;--gold:#c9963a;--sage:#3d8b4a;--sky:#4a8fb5;--transition-speed:.35s;min-height:100vh;overflow-x:hidden;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased;background:var(--bg-primary);color:var(--text-primary);transition:background var(--transition-speed) ease,color var(--transition-speed) ease}
      .homepage-shell[data-theme='light']{--bg-primary:#f7f2ec;--bg-secondary:#f0e8de;--bg-tertiary:#e8ddd0;--bg-card:#fbf8f4;--bg-card-hover:#fffdf9;--text-primary:#2e1a1a;--text-secondary:#5c4444;--text-tertiary:#8f7a7a;--border:rgba(139,35,50,.1);--border-hover:rgba(139,35,50,.2);--nav-bg:rgba(247,242,236,.88);--nav-bg-scroll:rgba(247,242,236,.96);--nav-shadow:rgba(60,30,30,.08);--nav-text:#5c4444;--hero-overlay-start:rgba(240,232,222,.2);--hero-overlay-mid:rgba(247,242,236,.75);--hero-overlay-end:rgba(247,242,236,1);--hero-img-opacity:.4;--shadow-sm:0 1px 4px rgba(60,30,30,.06);--shadow-md:0 4px 16px rgba(60,30,30,.08);--shadow-lg:0 10px 40px rgba(60,30,30,.1);--shadow-xl:0 20px 50px rgba(60,30,30,.14);--cta-bg:linear-gradient(135deg,#8b2332 0%,#6e1c28 40%,#521520 100%);--footer-bg:var(--bg-tertiary)}
      .homepage-shell[data-theme='dark']{--bg-primary:#1a1214;--bg-secondary:#221920;--bg-tertiary:#2c2028;--bg-card:#261c22;--bg-card-hover:#2e2229;--text-primary:#f0e4e6;--text-secondary:#b8a0a4;--text-tertiary:#7a6468;--border:rgba(200,160,170,.1);--border-hover:rgba(200,160,170,.18);--nav-bg:rgba(26,18,20,.88);--nav-bg-scroll:rgba(26,18,20,.96);--nav-shadow:rgba(0,0,0,.3);--nav-text:#b8a0a4;--hero-overlay-start:rgba(26,18,20,.3);--hero-overlay-mid:rgba(26,18,20,.75);--hero-overlay-end:rgba(26,18,20,1);--hero-img-opacity:.3;--shadow-sm:0 1px 4px rgba(0,0,0,.2);--shadow-md:0 4px 16px rgba(0,0,0,.25);--shadow-lg:0 10px 40px rgba(0,0,0,.3);--shadow-xl:0 20px 50px rgba(0,0,0,.4);--maroon:#b83a4e;--maroon-dark:#9b2e40;--terracotta:#d4846e;--sage:#5baf68;--sky:#7bb8d4;--gold:#daba5e;--cta-bg:linear-gradient(135deg,#2c2028 0%,#3a1e28 50%,#4a2030 100%);--footer-bg:#150e11}
      .homepage-shell *{box-sizing:border-box}.homepage-shell button,.homepage-shell input{font:inherit}.homepage-shell nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 48px;height:68px;display:flex;align-items:center;justify-content:space-between;background:var(--nav-bg);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);transition:all .4s ease}.homepage-shell nav.scrolled{background:var(--nav-bg-scroll);box-shadow:0 2px 20px var(--nav-shadow)}
      .nav-brand{display:flex;align-items:center;gap:12px;border:0;background:transparent;padding:0;cursor:pointer}.nav-logo,.footer-logo{width:38px;height:38px;background:var(--maroon);border-radius:10px;display:flex;align-items:center;justify-content:center}.nav-logo svg,.footer-logo svg{width:20px;height:20px;fill:#fff}.nav-title,.hero h1,.hero-sub,.hero-stat-number,.section-title,.feature-card h3,.dept-count,.dept-name,.cta h2,.footer-brand-text h4,.footer-uni-text h4{font-family:'DM Serif Display',serif}.nav-title{font-size:17px;color:var(--text-primary)}.nav-title span{color:var(--maroon)}.nav-right{display:flex;align-items:center;gap:8px}.nav-links{display:flex;align-items:center;gap:4px}.nav-links button{color:var(--nav-text);background:transparent;border:0;font-size:14px;font-weight:500;padding:8px 16px;border-radius:8px;transition:all .25s ease;cursor:pointer}.nav-links button:hover,.nav-links button.active{color:var(--maroon);background:rgba(139,35,50,.08)}.nav-cta{background:var(--maroon);color:#fff;font-size:13px;font-weight:600;border-radius:8px;padding:6px 12px;border:0;cursor:pointer;transition:all .25s ease}.nav-cta:hover{background:var(--maroon-dark)}.theme-toggle{width:42px;height:42px;border:1.5px solid var(--border-hover);border-radius:10px;background:var(--bg-card);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease;margin-left:8px;overflow:hidden}.theme-toggle:hover{border-color:var(--maroon);background:var(--bg-card-hover);transform:scale(1.05)}.theme-toggle svg{width:20px;height:20px}.theme-toggle .sun-icon{color:var(--gold)}.theme-toggle .moon-icon{color:var(--sky)}.homepage-shell[data-theme='light'] .theme-toggle .moon-icon{display:none}.homepage-shell[data-theme='dark'] .theme-toggle .sun-icon{display:none}
      .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);overflow:hidden;padding-top:68px;transition:background var(--transition-speed) ease}.hero-bg-image{position:absolute;inset:0;background-size:cover;background-position:center top;background-repeat:no-repeat;image-rendering:pixelated;image-rendering:crisp-edges;transform:scale(1.05);opacity:var(--hero-img-opacity);transition:opacity var(--transition-speed) ease}.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--hero-overlay-start) 0%,var(--hero-overlay-mid) 45%,var(--hero-overlay-end) 80%);z-index:1;transition:background var(--transition-speed) ease}.hero-pattern{position:absolute;inset:0;z-index:2;opacity:.025;background-image:radial-gradient(circle at 1px 1px,var(--maroon) .5px,transparent .5px);background-size:32px 32px}.hero-content{position:relative;z-index:3;text-align:center;max-width:860px;padding:0 32px}.hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--bg-card);border:1px solid var(--border-hover);color:var(--maroon);font-size:12px;font-weight:700;padding:7px 18px;border-radius:100px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:28px;animation:homepageFadeInDown .8s ease forwards;opacity:0;box-shadow:var(--shadow-sm)}.hero-badge-dot{width:6px;height:6px;background:var(--maroon);border-radius:50%;animation:homepagePulse 2s ease-in-out infinite}.hero h1{font-size:clamp(44px,6.5vw,78px);font-weight:700;color:var(--text-primary);line-height:1.06;margin:0 0 10px;animation:homepageFadeInUp .8s ease .15s forwards;opacity:0}.hero h1 em{font-style:italic;color:var(--maroon)}.hero-sub{font-size:clamp(18px,2.5vw,28px);color:var(--terracotta);margin-bottom:24px;animation:homepageFadeInUp .8s ease .3s forwards;opacity:0}.hero-copy{font-size:16px;color:var(--text-secondary);line-height:1.7;max-width:560px;margin:0 auto 40px;animation:homepageFadeInUp .8s ease .45s forwards;opacity:0}.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:homepageFadeInUp .8s ease .6s forwards;opacity:0}.btn{display:inline-flex;align-items:center;gap:10px;padding:14px 30px;border-radius:12px;font-size:15px;font-weight:600;transition:all .3s ease;cursor:pointer;border:none}.btn svg{width:18px;height:18px}.btn-primary{background:var(--maroon);color:#fff;box-shadow:0 4px 16px rgba(139,35,50,.25)}.btn-primary:hover{background:var(--maroon-dark);transform:translateY(-2px);box-shadow:0 8px 24px rgba(139,35,50,.3)}.btn-outline{background:var(--bg-card);color:var(--text-primary);border:1.5px solid var(--border-hover)}.btn-outline:hover{border-color:var(--maroon);color:var(--maroon);background:var(--bg-card-hover);transform:translateY(-2px);box-shadow:var(--shadow-md)}.hero-stats{display:flex;gap:40px;justify-content:center;margin-top:64px;padding-top:36px;border-top:1px solid var(--border);animation:homepageFadeInUp .8s ease .75s forwards;opacity:0}.hero-stat{text-align:center}.hero-stat-number{font-size:34px;color:var(--text-primary);line-height:1;margin-bottom:5px}.hero-stat-number span{color:var(--maroon)}.hero-stat-label{font-size:12px;color:var(--text-tertiary);font-weight:600;letter-spacing:.06em;text-transform:uppercase}
      .section-header{text-align:center;margin-bottom:64px}.section-label{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--maroon);margin-bottom:14px}.section-label::before,.section-label::after{content:'';width:24px;height:1.5px;background:var(--maroon);opacity:.3;border-radius:1px}.section-title{font-size:clamp(30px,3.5vw,44px);color:var(--text-primary);margin:0 0 14px;line-height:1.15}.section-desc{font-size:15px;color:var(--text-secondary);max-width:520px;margin:0 auto;line-height:1.65}
      .features,.departments,.categories,.cta{padding:110px 48px;position:relative}.features{background:var(--bg-primary)}.features::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:1px;height:60px;background:linear-gradient(to bottom,var(--maroon),transparent);opacity:.2}.departments{background:var(--bg-secondary)}.categories{background:var(--bg-primary)}.features-grid,.dept-grid,.cat-grid{max-width:1100px;margin:0 auto}.features-grid,.dept-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.feature-card,.dept-card,.cat-card{transition:all var(--transition-speed) ease;position:relative;overflow:hidden}.feature-card{background:var(--bg-card);border-radius:16px;padding:36px 32px;border:1px solid var(--border)}.feature-card::before{content:'';position:absolute;top:0;left:0;bottom:0;width:4px;border-radius:16px 0 0 16px;opacity:.6;transition:opacity .35s ease}.feature-card:nth-child(1)::before{background:var(--maroon)}.feature-card:nth-child(2)::before{background:var(--sage)}.feature-card:nth-child(3)::before{background:var(--terracotta)}.feature-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:transparent}.feature-card:hover::before{opacity:1}.homepage-shell[data-theme='light'] .feature-card:nth-child(1):hover{background:rgba(139,35,50,.03)}.homepage-shell[data-theme='light'] .feature-card:nth-child(2):hover{background:rgba(61,139,74,.03)}.homepage-shell[data-theme='light'] .feature-card:nth-child(3):hover{background:rgba(196,101,74,.03)}.homepage-shell[data-theme='dark'] .feature-card:nth-child(1):hover{background:rgba(184,58,78,.08)}.homepage-shell[data-theme='dark'] .feature-card:nth-child(2):hover{background:rgba(91,175,104,.06)}.homepage-shell[data-theme='dark'] .feature-card:nth-child(3):hover{background:rgba(212,132,110,.06)}
      .feature-icon,.dept-icon,.cat-icon,.ai-chatbot-avatar{display:flex;align-items:center;justify-content:center}.feature-icon{width:50px;height:50px;border-radius:12px;margin-bottom:20px}.feature-icon svg{width:24px;height:24px}.fi-maroon{background:rgba(139,35,50,.12)}.fi-maroon svg{color:var(--maroon);fill:var(--maroon)}.fi-sage{background:rgba(61,139,74,.12)}.fi-sage svg{color:var(--sage);fill:var(--sage)}.fi-terracotta{background:rgba(196,101,74,.12)}.fi-terracotta svg{color:var(--terracotta);fill:var(--terracotta)}.homepage-shell[data-theme='dark'] .fi-maroon{background:rgba(184,58,78,.15)}.homepage-shell[data-theme='dark'] .fi-sage{background:rgba(91,175,104,.12)}.homepage-shell[data-theme='dark'] .fi-terracotta{background:rgba(212,132,110,.12)}.feature-card h3{font-size:20px;color:var(--text-primary);margin:0 0 10px}.feature-card p{font-size:14px;color:var(--text-secondary);line-height:1.65;margin:0}
      .dept-card{background:var(--bg-card);border-radius:16px;padding:32px 24px;text-align:center;border:1px solid var(--border);cursor:pointer}.dept-card::after{content:'';position:absolute;inset:auto 0 0 0;height:3px;opacity:0;transition:opacity .35s ease}.dept-card:nth-child(1)::after{background:var(--maroon)}.dept-card:nth-child(2)::after{background:var(--sky)}.dept-card:nth-child(3)::after{background:var(--sage)}.dept-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:transparent}.dept-card:hover::after{opacity:1}.homepage-shell[data-theme='light'] .dept-card:nth-child(1):hover{background:rgba(139,35,50,.03)}.homepage-shell[data-theme='light'] .dept-card:nth-child(2):hover{background:rgba(74,143,181,.04)}.homepage-shell[data-theme='light'] .dept-card:nth-child(3):hover{background:rgba(61,139,74,.03)}.homepage-shell[data-theme='dark'] .dept-card:nth-child(1):hover{background:rgba(184,58,78,.08)}.homepage-shell[data-theme='dark'] .dept-card:nth-child(2):hover{background:rgba(123,184,212,.06)}.homepage-shell[data-theme='dark'] .dept-card:nth-child(3):hover{background:rgba(91,175,104,.06)}.dept-icon{width:52px;height:52px;margin:0 auto 20px;border-radius:12px;transition:transform var(--transition-speed) ease}.dept-card:hover .dept-icon{transform:scale(1.1)}.dept-icon svg,.cat-icon svg{width:24px;height:24px;fill:currentColor}.di-maroon{background:rgba(139,35,50,.12);color:var(--maroon)}.di-sky{background:rgba(74,143,181,.12);color:var(--sky)}.di-sage{background:rgba(61,139,74,.12);color:var(--sage)}.di-terracotta{background:rgba(196,101,74,.12);color:var(--terracotta)}.homepage-shell[data-theme='dark'] .di-maroon{background:rgba(184,58,78,.15)}.homepage-shell[data-theme='dark'] .di-sky{background:rgba(123,184,212,.15)}.homepage-shell[data-theme='dark'] .di-sage{background:rgba(91,175,104,.12)}.homepage-shell[data-theme='dark'] .di-terracotta{background:rgba(212,132,110,.12)}.dept-count{font-size:44px;line-height:1;margin:0 0 8px}.dept-card:nth-child(1) .dept-count{color:var(--maroon)}.dept-card:nth-child(2) .dept-count{color:var(--sky)}.dept-card:nth-child(3) .dept-count{color:var(--sage)}.dept-name{font-size:22px;margin:0 0 6px;color:var(--text-primary)}.dept-label{font-size:14px;color:var(--text-tertiary)}
      .cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.cat-card{display:flex;align-items:center;gap:14px;background:var(--bg-card);border-radius:14px;padding:22px 20px;border:1px solid var(--border);cursor:pointer}.cat-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}.cat-card:nth-child(1):hover,.cat-card:nth-child(7):hover{border-color:var(--maroon)}.cat-card:nth-child(2):hover,.cat-card:nth-child(5):hover{border-color:var(--sky)}.cat-card:nth-child(3):hover,.cat-card:nth-child(6):hover{border-color:var(--sage)}.cat-card:nth-child(4):hover,.cat-card:nth-child(8):hover{border-color:var(--terracotta)}.homepage-shell[data-theme='light'] .cat-card:nth-child(1):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(7):hover{background:rgba(139,35,50,.04)}.homepage-shell[data-theme='light'] .cat-card:nth-child(2):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(5):hover{background:rgba(74,143,181,.04)}.homepage-shell[data-theme='light'] .cat-card:nth-child(3):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(6):hover{background:rgba(61,139,74,.04)}.homepage-shell[data-theme='light'] .cat-card:nth-child(4):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(8):hover{background:rgba(196,101,74,.04)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(1):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(7):hover{background:rgba(184,58,78,.08)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(2):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(5):hover{background:rgba(123,184,212,.06)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(3):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(6):hover{background:rgba(91,175,104,.06)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(4):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(8):hover{background:rgba(212,132,110,.06)}.cat-icon{width:42px;height:42px;border-radius:10px;flex-shrink:0}.cat-icon svg{width:20px;height:20px;stroke:currentColor;fill:none}.cat-info{flex:1;text-align:left}.cat-info h4{margin:0 0 2px;font-size:14px;font-weight:700;color:var(--text-primary)}.cat-info span{font-size:14px;color:var(--text-tertiary)}.cat-arrow{opacity:0;transform:translateX(-4px);transition:all var(--transition-speed) ease;color:var(--maroon)}.cat-card:hover .cat-arrow{opacity:1;transform:translateX(0)}
      .cta{background:var(--cta-bg);text-align:center;overflow:hidden}.cta-bg{position:absolute;inset:0;background:radial-gradient(circle at top,rgba(255,255,255,.12),transparent 48%)}.cta-pattern{position:absolute;inset:0;opacity:.08;background-image:linear-gradient(135deg,rgba(255,255,255,.1) 25%,transparent 25%),linear-gradient(225deg,rgba(255,255,255,.1) 25%,transparent 25%);background-size:26px 26px}.cta-content{position:relative;z-index:1;max-width:760px;margin:0 auto}.cta h2{font-size:clamp(34px,4.4vw,58px);line-height:1.08;margin:0 0 18px;color:#fff7f7}.homepage-shell[data-theme='dark'] .cta h2{color:#f0e4e6}.cta p{margin:0 auto 30px;max-width:620px;font-size:18px;line-height:1.7;color:rgba(255,240,240,.82)}.homepage-shell[data-theme='dark'] .cta p{color:rgba(240,228,230,.5)}.cta-buttons{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.btn-role{min-width:140px;border-radius:12px;padding:14px 26px;font-size:15px;font-weight:600;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.02);color:#fff;cursor:pointer;transition:all .3s ease}.btn-role.primary{background:#fff;color:var(--maroon);border-color:#fff}.btn-role:hover{transform:translateY(-2px)}
      footer{background:var(--footer-bg);padding:42px 48px 20px}.footer-main{max-width:1100px;margin:0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding-bottom:36px;border-bottom:1px solid var(--border)}.footer-brand{display:flex;align-items:center;gap:12px}.footer-brand-text h4,.footer-uni-text h4{font-size:20px;margin:0 0 4px;color:var(--text-primary)}.footer-brand-text span,.footer-uni-text span{font-size:14px;color:var(--text-tertiary)}.footer-uni{display:flex;align-items:center;gap:12px;text-align:right}.footer-uni-seal{width:42px;height:42px;border-radius:50%;background:rgba(139,35,50,.08);border:1px solid rgba(139,35,50,.16);display:flex;align-items:center;justify-content:center}.homepage-shell[data-theme='dark'] .footer-uni-seal{background:rgba(184,58,78,.08);border-color:rgba(200,160,170,.14)}.footer-uni-seal svg{width:20px;height:20px;fill:var(--maroon)}.footer-bottom{max-width:1100px;margin:0 auto;padding-top:20px;text-align:center}.footer-bottom p{font-size:12px;color:var(--text-tertiary);margin:0}
      .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}.reveal.visible{opacity:1;transform:translateY(0)}.reveal-delay-1{transition-delay:.1s}.reveal-delay-2{transition-delay:.2s}.reveal-delay-3{transition-delay:.3s}.reveal-delay-4{transition-delay:.4s}
      .ai-chatbot-fab{position:fixed;right:28px;bottom:28px;width:74px;height:74px;border:0;border-radius:24px;background:linear-gradient(180deg,#b84844 0%,#b1453d 100%);box-shadow:0 18px 34px rgba(177,69,61,.34);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1200;transition:transform .25s ease,box-shadow .25s ease}.ai-chatbot-fab:hover{transform:translateY(-2px) scale(1.02)}.ai-chatbot-fab svg{width:36px;height:36px}.ai-chatbot-fab .bot-fill{fill:#fff}.ai-chatbot-fab .bot-cut{fill:#8f2a33}.homepage-shell[data-theme='dark'] .ai-chatbot-fab .bot-cut{fill:#b83a4e}
      .ai-chatbot-panel{position:fixed;right:28px;bottom:118px;width:360px;max-width:calc(100vw - 32px);border-radius:26px;overflow:hidden;border:1px solid var(--border);background:var(--bg-card);box-shadow:var(--shadow-xl);transform:translateY(16px);opacity:0;pointer-events:none;z-index:1190;transition:opacity .3s ease,transform .3s ease}.ai-chatbot-panel.open{transform:translateY(0);opacity:1;pointer-events:auto}.ai-chatbot-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 18px 16px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,var(--bg-tertiary),var(--bg-card))}.ai-chatbot-title{display:flex;align-items:center;gap:12px}.ai-chatbot-avatar{width:44px;height:44px;border-radius:14px;background:linear-gradient(180deg,#b84844 0%,#b1453d 100%);color:#fff}.ai-chatbot-avatar svg{width:22px;height:22px;fill:currentColor}.ai-chatbot-title h3{margin:0 0 2px;font-size:16px;color:var(--text-primary)}.ai-chatbot-title p{margin:0;font-size:13px;color:var(--text-tertiary)}.ai-chatbot-close{width:36px;height:36px;border:0;background:transparent;color:var(--text-tertiary);border-radius:12px;cursor:pointer;font-size:26px;line-height:1;transition:all .25s ease}.ai-chatbot-close:hover{background:rgba(139,35,50,.06);color:var(--maroon)}.ai-chatbot-body{padding:18px}.ai-chatbot-messages{max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:4px}.chat-bubble{max-width:90%;border-radius:18px;padding:12px 14px;font-size:14px;line-height:1.6}.chat-bubble.bot{background:var(--bg-secondary);color:var(--text-secondary);border-top-left-radius:6px}.chat-bubble.user{margin-left:auto;background:var(--maroon);color:#fff;border-top-right-radius:6px}.ai-chatbot-suggestions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.chat-suggestion{border-radius:999px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);padding:8px 12px;font-size:12px;font-weight:500;cursor:pointer;transition:all .25s ease}.chat-suggestion:hover{border-color:var(--maroon);color:var(--maroon)}.ai-chatbot-form{margin-top:14px;display:flex;align-items:center;gap:8px;border-radius:18px;border:1px solid var(--border);background:var(--bg-card);padding:8px}.ai-chatbot-input{flex:1;border:0;outline:none;background:transparent;color:var(--text-primary);padding:8px 10px}.ai-chatbot-input::placeholder{color:var(--text-tertiary)}.ai-chatbot-send{width:40px;height:40px;border:0;border-radius:14px;background:var(--maroon);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .25s ease}.ai-chatbot-send:hover{background:var(--maroon-dark)}.ai-chatbot-send svg{width:17px;height:17px;fill:currentColor}
      @keyframes homepagePulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes homepageFadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes homepageFadeInDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
      @media (max-width:1024px){.homepage-shell nav{padding:0 24px}.features-grid,.dept-grid{grid-template-columns:1fr}.cat-grid{grid-template-columns:1fr}.footer-main{flex-direction:column;align-items:flex-start}.footer-uni{text-align:left}}
      @media (max-width:768px){.nav-links{display:none}.features,.departments,.categories,.cta{padding:80px 24px}.hero-content{padding:0 24px}.hero-stats{gap:20px;flex-wrap:wrap}.hero-actions,.cta-buttons{flex-direction:column;align-items:center}footer{padding:36px 24px 20px}.ai-chatbot-panel{right:16px;left:16px;bottom:102px;width:auto;max-width:none}.ai-chatbot-fab{right:16px;bottom:16px;width:68px;height:68px}.ai-chatbot-fab svg{width:32px;height:32px}}
    `}</style>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]['id']>('home');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: 'bot', text: 'Hi! I can help you find thesis collections, browse categories, or guide you to the right sign-in page.' },
    { type: 'bot', text: 'Try one of the quick prompts below.' },
  ]);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const chatFabRef = useRef<HTMLButtonElement | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);

  const chatSuggestions = useMemo(
    () => ['Show thesis categories', 'Where do students sign in?', 'Browse departments'],
    []
  );

  useEffect(() => {
    const updateNavbarState = () => {
      setIsScrolled(window.scrollY > 50);
      const triggerPoint = 68 + 120;
      let nextActive: (typeof sections)[number]['id'] = 'home';
      sections.forEach(({ id }) => {
        const target = document.getElementById(id);
        if (target && target.getBoundingClientRect().top <= triggerPoint) nextActive = id;
      });
      setActiveSection(nextActive);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const revealId = (entry.target as HTMLElement).dataset.revealId;
          if (!revealId) return;
          setRevealed((current) => (current.includes(revealId) ? current : [...current, revealId]));
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll<HTMLElement>('[data-reveal-id]').forEach((element) => observer.observe(element));
    updateNavbarState();
    window.addEventListener('scroll', updateNavbarState);
    window.addEventListener('hashchange', updateNavbarState);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateNavbarState);
      window.removeEventListener('hashchange', updateNavbarState);
    };
  }, []);

  useEffect(() => {
    if (!isChatOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsChatOpen(false);
    };
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (chatPanelRef.current?.contains(target) || chatFabRef.current?.contains(target)) return;
      setIsChatOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const buildReply = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('student') || normalized.includes('sign in') || normalized.includes('login')) {
      return 'Students can use the Student button in the Ready to Access Our Thesis Collection section near the bottom of the page.';
    }
    if (normalized.includes('category') || normalized.includes('categories') || normalized.includes('browse')) {
      return 'You can browse topics like Web and Mobile Development, AI and ML, Cybersecurity, Data Science, Game Development, and more in the Browse by Category section.';
    }
    if (normalized.includes('department') || normalized.includes('program')) {
      return 'The homepage currently highlights Computer Science, Information Technology, and Information Systems in the Thesis by Department section.';
    }
    return 'I can help you explore categories, departments, or where to sign in. Try asking about theses, programs, or access options.';
  };

  const handleChat = (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    setMessages((current) => [...current, { type: 'user', text: trimmedMessage }]);
    setChatInput('');
    window.setTimeout(() => {
      setMessages((current) => [...current, { type: 'bot', text: buildReply(trimmedMessage) }]);
    }, 320);
  };

  const revealClass = (id: string, delay = '') =>
    ['reveal', delay, revealed.includes(id) ? 'visible' : ''].filter(Boolean).join(' ');

  return (
    <div className="homepage-shell" data-theme={theme}>
      <HomePageStyles />
      <nav className={isScrolled ? 'scrolled' : ''}>
        <button type="button" className="nav-brand" onClick={() => scrollToSection('home')}>
          <div className="nav-logo">
            <LogoIcon />
          </div>
          <div className="nav-title">
            Thesis <span>Archive</span>
          </div>
        </button>

        <div className="nav-right">
          <div className="nav-links">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => scrollToSection(section.id)}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                {section.label}
              </button>
            ))}
          </div>

          <button type="button" className="nav-cta" onClick={() => scrollToSection('cta')}>
            Sign In
          </button>

          <button type="button" className="theme-toggle" aria-label="Toggle theme" onClick={toggle}>
            <SunMedium className="sun-icon" />
            <MoonStar className="moon-icon" />
          </button>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-bg-image" style={{ backgroundImage: `url(${tupBuilding})` }} />
          <div className="hero-overlay" />
          <div className="hero-pattern" />
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Computer Studies Department
            </div>

            <h1>
              Thesis <em>Archive</em>
              <br />
              Management System
            </h1>

            <div className="hero-sub">Technological University of the Philippines - Manila</div>

            <p className="hero-copy">
              A comprehensive digital repository for academic research and scholarly works. Browse, search, and access
              thesis documents across all programs in one unified platform.
            </p>

            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/sign-in/student')}>
                <SearchIcon />
                Browse Theses
              </button>
              <button type="button" className="btn btn-outline" onClick={() => scrollToSection('features')}>
                Learn More
                <ChevronDownIcon />
              </button>
            </div>

            <div className="hero-stats">
              {stats.map((stat) => (
                <div className="hero-stat" key={stat.label}>
                  <div className="hero-stat-number">
                    {stat.value.replace('+', '')}
                    {stat.value.includes('+') ? <span>+</span> : null}
                  </div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div data-reveal-id="features-header" className={revealClass('features-header')}>
            <div className="section-header">
              <div className="section-label">Why Choose Us</div>
              <h2 className="section-title">Built for Academic Excellence</h2>
              <p className="section-desc">
                A comprehensive platform designed to make academic research accessible, organized, and secure for the
                TUP community.
              </p>
            </div>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                data-reveal-id={`feature-${index}`}
                className={`${revealClass(`feature-${index}`, `reveal-delay-${index + 1}`)} feature-card`}
              >
                <div className={`feature-icon ${feature.iconClass}`}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="departments" id="departments">
          <div data-reveal-id="departments-header" className={revealClass('departments-header')}>
            <div className="section-header">
              <div className="section-label">Departments</div>
              <h2 className="section-title">Thesis by Department</h2>
              <p className="section-desc">Browse our collection of thesis documents organized by academic department.</p>
            </div>
          </div>

          <div className="dept-grid">
            {departments.map((department, index) => (
              <div
                key={department.name}
                data-reveal-id={`department-${index}`}
                className={`${revealClass(`department-${index}`, `reveal-delay-${index + 1}`)} dept-card`}
              >
                <div className={`dept-icon ${department.iconClass}`}>{department.icon}</div>
                <div className="dept-count">{department.count}</div>
                <div className="dept-name">{department.name}</div>
                <div className="dept-label">{department.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="categories" id="categories">
          <div data-reveal-id="categories-header" className={revealClass('categories-header')}>
            <div className="section-header">
              <div className="section-label">Browse</div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-desc">
                Explore thesis documents from the Computer Studies Department organized by research focus area.
              </p>
            </div>
          </div>

          <div className="cat-grid">
            {categories.map((category, index) => (
              <button
                key={category.title}
                type="button"
                data-reveal-id={`category-${index}`}
                className={`${revealClass(`category-${index}`, `reveal-delay-${(index % 4) + 1}`)} cat-card`}
                onClick={() => navigate('/sign-in/student')}
              >
                <div className={`cat-icon ${category.iconClass}`}>{category.icon}</div>
                <div className="cat-info">
                  <h4>{category.title}</h4>
                  <span>{category.count}</span>
                </div>
                <div className="cat-arrow">
                  <ArrowRightIcon />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="cta" id="cta">
          <div className="cta-bg" />
          <div className="cta-pattern" />
          <div data-reveal-id="cta-content" className={`${revealClass('cta-content')} cta-content`}>
            <h2>
              Ready to Access Our
              <br />
              Thesis Collection?
            </h2>
            <p>Join our academic community and start exploring thousands of research documents today.</p>
            <div className="cta-buttons">
              {accessRoles.map((role) => (
                <button
                  key={role.label}
                  type="button"
                  className={`btn-role${role.primary ? ' primary' : ''}`}
                  onClick={() => navigate(role.path)}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer>
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <LogoIcon />
              </div>
              <div className="footer-brand-text">
                <h4>Thesis Archive</h4>
                <span>Computer Studies Department</span>
              </div>
            </div>

            <div className="footer-uni">
              <div className="footer-uni-text">
                <h4>Technological University of the Philippines - Manila</h4>
                <span>San Marcelino St, Ayala Blvd, Ermita, Manila, 1000</span>
              </div>
              <div className="footer-uni-seal">
                <LogoIcon />
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Thesis Archive Management System. All rights reserved.</p>
          </div>
        </footer>
      </main>

      <div ref={chatPanelRef} className={`ai-chatbot-panel${isChatOpen ? ' open' : ''}`} aria-hidden={!isChatOpen}>
        <div className="ai-chatbot-header">
          <div className="ai-chatbot-title">
            <div className="ai-chatbot-avatar" aria-hidden="true">
              <HeadsetIcon />
            </div>
            <div>
              <h3>Archive Assistant</h3>
              <p>Ask about theses, departments, and access.</p>
            </div>
          </div>

          <button type="button" className="ai-chatbot-close" onClick={() => setIsChatOpen(false)} aria-label="Close AI chatbot">
            ×
          </button>
        </div>

        <div className="ai-chatbot-body">
          <div className="ai-chatbot-messages" ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <div key={`${message.type}-${index}`} className={`chat-bubble ${message.type}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="ai-chatbot-suggestions">
            {chatSuggestions.map((suggestion) => (
              <button key={suggestion} type="button" className="chat-suggestion" onClick={() => handleChat(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form
            className="ai-chatbot-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleChat(chatInput);
            }}
          >
            <input
              className="ai-chatbot-input"
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type your question..."
              aria-label="Chat message"
            />
            <button type="submit" className="ai-chatbot-send" aria-label="Send message">
              <SendIcon />
            </button>
          </form>
        </div>
      </div>

      <button
        ref={chatFabRef}
        type="button"
        className="ai-chatbot-fab"
        aria-label="Open AI chatbot"
        aria-expanded={isChatOpen}
        onClick={() => setIsChatOpen((current) => !current)}
      >
        <BotFabIcon />
      </button>
    </div>
  );
}
