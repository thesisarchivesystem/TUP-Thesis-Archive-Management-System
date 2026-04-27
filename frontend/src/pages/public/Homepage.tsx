import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { aiService } from '../../services/aiService';
import ChatMessageContent from '../../components/chats/ChatMessageContent';
import BrandMarkIcon from '../../components/BrandMarkIcon';
import tupBuilding from '../../assets/tup-building.gif';
import tamsBot from '../../assets/tams-bot.png';
import '../../styles/vpaa-shell.css';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'departments', label: 'Departments' },
  { id: 'categories', label: 'Browse' },
] as const;

const stats = [
  { value: '200+', label: 'Thesis Documents' },
  { value: '3', label: 'Programs' },
  { value: '25+', label: 'Student Authors' },
  { value: '95%', label: 'Completion Rate' },
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
    count: '80+',
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
    count: '20+',
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
    count: '15+',
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
  { label: 'Student', path: '/sign-in/student' },
  { label: 'Faculty', path: '/sign-in/faculty' },
  { label: 'VPAA', path: '/sign-in/vpaa' },
];

type ChatMessage = {
  type: 'bot' | 'user';
  text: string;
};

const CHATBOT_GREETING = 'Hello! I am Archie, your Archive Assistant. Pleasure to answer your questions';
const CHAT_FAB_RIGHT = 28;
const CHAT_FAB_BOTTOM = 28;
const CHAT_FAB_SIZE = 74;
const CHAT_PANEL_GAP = 16;
const CHAT_DRAG_MARGIN = 16;

type ChatDragState = {
  startX: number;
  startY: number;
  startRight: number;
  startBottom: number;
  moved: boolean;
  pointerId: number;
};

type ChatPosition = {
  right: number;
  bottom: number;
};

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

function SchoolIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-5 9 5" />
      <path d="M5 10v8" />
      <path d="M9.5 10v8" />
      <path d="M14.5 10v8" />
      <path d="M19 10v8" />
      <path d="M3 18h18" />
      <path d="M12 5v13" opacity=".35" />
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
      .homepage-shell *{box-sizing:border-box}.homepage-shell button,.homepage-shell input{font:inherit}.homepage-shell nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 36px;height:62px;display:flex;align-items:center;justify-content:space-between;background:var(--nav-bg);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);transition:all .4s ease}.homepage-shell nav.scrolled{background:var(--nav-bg-scroll);box-shadow:0 2px 20px var(--nav-shadow)}
      .nav-brand{display:flex;align-items:center;gap:12px;border:0;background:transparent;padding:0;cursor:pointer}.nav-logo,.footer-logo{display:flex;align-items:center;justify-content:center}.nav-logo{width:44px;height:44px;border-radius:12px;background:var(--maroon);color:#fff;flex-shrink:0}.nav-logo svg{width:28px;height:28px}.footer-logo{width:48px;height:48px;border-radius:14px;background:rgba(139,35,50,.08);border:1px solid rgba(139,35,50,.12);color:var(--maroon)}.footer-logo svg{width:30px;height:30px}.homepage-shell[data-theme='dark'] .footer-logo{background:rgba(184,58,78,.08);border-color:rgba(200,160,170,.14)}.nav-title,.hero h1,.hero-sub,.hero-stat-number,.section-title,.feature-card h3,.dept-count,.dept-name,.cta h2,.footer-brand-text h4,.footer-uni-text h4{font-family:'DM Serif Display',serif}.nav-title{font-size:15px;color:var(--text-primary)}.nav-title span{color:var(--maroon)}.nav-right{display:flex;align-items:center;gap:8px}.nav-links{display:flex;align-items:center;gap:2px}.nav-links button{color:var(--nav-text);background:transparent;border:0;font-size:13px;font-weight:500;padding:7px 13px;border-radius:8px;transition:all .25s ease;cursor:pointer}.nav-links button:hover,.nav-links button.active{color:var(--maroon);background:rgba(139,35,50,.08)}.nav-cta{background:var(--maroon);color:#fff;font-size:12px;font-weight:600;border-radius:8px;padding:6px 11px;border:0;cursor:pointer;transition:all .25s ease}.nav-cta:hover{background:var(--maroon-dark)}.theme-toggle{width:38px;height:38px;border:1.5px solid var(--border-hover);border-radius:10px;background:var(--bg-card);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s ease;margin-left:6px;overflow:hidden}.theme-toggle:hover{border-color:var(--maroon);background:var(--bg-card-hover);transform:scale(1.05)}.theme-toggle svg{width:18px;height:18px}.theme-toggle .sun-icon{color:var(--gold)}.theme-toggle .moon-icon{color:var(--sky)}.homepage-shell[data-theme='light'] .theme-toggle .sun-icon{display:none}.homepage-shell[data-theme='dark'] .theme-toggle .moon-icon{display:none}
      .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);overflow:hidden;padding-top:62px;transition:background var(--transition-speed) ease}.hero-bg-image{position:absolute;inset:0;background-size:cover;background-position:center top;background-repeat:no-repeat;image-rendering:pixelated;image-rendering:crisp-edges;transform:scale(1.05);opacity:var(--hero-img-opacity);transition:opacity var(--transition-speed) ease}.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,var(--hero-overlay-start) 0%,var(--hero-overlay-mid) 45%,var(--hero-overlay-end) 80%);z-index:1;transition:background var(--transition-speed) ease}.hero-pattern{position:absolute;inset:0;z-index:2;opacity:.025;background-image:radial-gradient(circle at 1px 1px,var(--maroon) .5px,transparent .5px);background-size:32px 32px}.hero-content{position:relative;z-index:3;text-align:center;max-width:740px;padding:0 28px}.hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--bg-card);border:1px solid var(--border-hover);color:var(--maroon);font-size:11px;font-weight:700;padding:6px 16px;border-radius:100px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:22px;animation:homepageFadeInDown .8s ease forwards;opacity:0;box-shadow:var(--shadow-sm)}.hero-badge-dot{width:6px;height:6px;background:var(--maroon);border-radius:50%;animation:homepagePulse 2s ease-in-out infinite}.hero h1{font-size:clamp(34px,5vw,58px);font-weight:700;color:var(--text-primary);line-height:1.08;margin:0 0 8px;animation:homepageFadeInUp .8s ease .15s forwards;opacity:0}.hero h1 em{font-style:italic;color:var(--maroon)}.hero-sub{font-size:clamp(16px,2.1vw,22px);color:var(--terracotta);margin-bottom:18px;animation:homepageFadeInUp .8s ease .3s forwards;opacity:0}.hero-copy{font-size:14px;color:var(--text-secondary);line-height:1.65;max-width:520px;margin:0 auto 30px;animation:homepageFadeInUp .8s ease .45s forwards;opacity:0}.hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;animation:homepageFadeInUp .8s ease .6s forwards;opacity:0}.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;transition:all .3s ease;cursor:pointer;border:none}.btn svg{width:16px;height:16px}.btn-primary{background:var(--maroon);color:#fff;box-shadow:0 4px 16px rgba(139,35,50,.25)}.btn-primary:hover{background:var(--maroon-dark);transform:translateY(-2px);box-shadow:0 8px 24px rgba(139,35,50,.3)}.btn-outline{background:var(--bg-card);color:var(--text-primary);border:1.5px solid var(--border-hover)}.btn-outline:hover{border-color:var(--maroon);color:var(--maroon);background:var(--bg-card-hover);transform:translateY(-2px);box-shadow:var(--shadow-md)}.hero-stats{display:flex;gap:28px;justify-content:center;margin-top:46px;padding-top:26px;border-top:1px solid var(--border);animation:homepageFadeInUp .8s ease .75s forwards;opacity:0}.hero-stat{text-align:center}.hero-stat-number{font-size:28px;color:var(--text-primary);line-height:1;margin-bottom:4px}.hero-stat-number span{color:var(--maroon)}.hero-stat-label{font-size:11px;color:var(--text-tertiary);font-weight:600;letter-spacing:.06em;text-transform:uppercase}
      .section-header{text-align:center;margin-bottom:52px}.section-label{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--maroon);margin-bottom:12px}.section-label::before,.section-label::after{content:'';width:20px;height:1.5px;background:var(--maroon);opacity:.3;border-radius:1px}.section-title{font-size:clamp(26px,3vw,36px);color:var(--text-primary);margin:0 0 12px;line-height:1.15}.section-desc{font-size:14px;color:var(--text-secondary);max-width:500px;margin:0 auto;line-height:1.65}
      .features,.departments,.categories,.cta{padding:82px 36px;position:relative}.features{background:var(--bg-primary)}.features::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:1px;height:48px;background:linear-gradient(to bottom,var(--maroon),transparent);opacity:.2}.departments{background:var(--bg-secondary)}.categories{background:var(--bg-primary)}.features-grid,.dept-grid,.cat-grid{max-width:1040px;margin:0 auto}.features-grid,.dept-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.feature-card,.dept-card,.cat-card{transition:all var(--transition-speed) ease;position:relative;overflow:hidden}.feature-card{background:var(--bg-card);border-radius:16px;padding:28px 24px;border:1px solid var(--border)}.feature-card::before{content:'';position:absolute;top:0;left:0;bottom:0;width:4px;border-radius:16px 0 0 16px;opacity:.6;transition:opacity .35s ease}.feature-card:nth-child(1)::before{background:var(--maroon)}.feature-card:nth-child(2)::before{background:var(--sage)}.feature-card:nth-child(3)::before{background:var(--terracotta)}.feature-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:transparent}.feature-card:hover::before{opacity:1}.homepage-shell[data-theme='light'] .feature-card:nth-child(1):hover{background:rgba(139,35,50,.03)}.homepage-shell[data-theme='light'] .feature-card:nth-child(2):hover{background:rgba(61,139,74,.03)}.homepage-shell[data-theme='light'] .feature-card:nth-child(3):hover{background:rgba(196,101,74,.03)}.homepage-shell[data-theme='dark'] .feature-card:nth-child(1):hover{background:rgba(184,58,78,.08)}.homepage-shell[data-theme='dark'] .feature-card:nth-child(2):hover{background:rgba(91,175,104,.06)}.homepage-shell[data-theme='dark'] .feature-card:nth-child(3):hover{background:rgba(212,132,110,.06)}
      .feature-icon,.dept-icon,.cat-icon,.ai-chatbot-avatar{display:flex;align-items:center;justify-content:center}.feature-icon{width:44px;height:44px;border-radius:11px;margin-bottom:16px}.feature-icon svg{width:20px;height:20px}.fi-maroon{background:rgba(139,35,50,.12)}.fi-maroon svg{color:var(--maroon);fill:var(--maroon)}.fi-sage{background:rgba(61,139,74,.12)}.fi-sage svg{color:var(--sage);fill:var(--sage)}.fi-terracotta{background:rgba(196,101,74,.12)}.fi-terracotta svg{color:var(--terracotta);fill:var(--terracotta)}.homepage-shell[data-theme='dark'] .fi-maroon{background:rgba(184,58,78,.15)}.homepage-shell[data-theme='dark'] .fi-sage{background:rgba(91,175,104,.12)}.homepage-shell[data-theme='dark'] .fi-terracotta{background:rgba(212,132,110,.12)}.feature-card h3{font-size:17px;color:var(--text-primary);margin:0 0 8px}.feature-card p{font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0}
      .dept-card{background:var(--bg-card);border-radius:16px;padding:26px 20px;text-align:center;border:1px solid var(--border);cursor:pointer}.dept-card::after{content:'';position:absolute;inset:auto 0 0 0;height:3px;opacity:0;transition:opacity .35s ease}.dept-card:nth-child(1)::after{background:var(--maroon)}.dept-card:nth-child(2)::after{background:var(--sky)}.dept-card:nth-child(3)::after{background:var(--sage)}.dept-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:transparent}.dept-card:hover::after{opacity:1}.homepage-shell[data-theme='light'] .dept-card:nth-child(1):hover{background:rgba(139,35,50,.03)}.homepage-shell[data-theme='light'] .dept-card:nth-child(2):hover{background:rgba(74,143,181,.04)}.homepage-shell[data-theme='light'] .dept-card:nth-child(3):hover{background:rgba(61,139,74,.03)}.homepage-shell[data-theme='dark'] .dept-card:nth-child(1):hover{background:rgba(184,58,78,.08)}.homepage-shell[data-theme='dark'] .dept-card:nth-child(2):hover{background:rgba(123,184,212,.06)}.homepage-shell[data-theme='dark'] .dept-card:nth-child(3):hover{background:rgba(91,175,104,.06)}.dept-icon{width:46px;height:46px;margin:0 auto 16px;border-radius:11px;transition:transform var(--transition-speed) ease}.dept-card:hover .dept-icon{transform:scale(1.1)}.dept-icon svg,.cat-icon svg{width:20px;height:20px;fill:currentColor}.di-maroon{background:rgba(139,35,50,.12);color:var(--maroon)}.di-sky{background:rgba(74,143,181,.12);color:var(--sky)}.di-sage{background:rgba(61,139,74,.12);color:var(--sage)}.di-terracotta{background:rgba(196,101,74,.12);color:var(--terracotta)}.homepage-shell[data-theme='dark'] .di-maroon{background:rgba(184,58,78,.15)}.homepage-shell[data-theme='dark'] .di-sky{background:rgba(123,184,212,.15)}.homepage-shell[data-theme='dark'] .di-sage{background:rgba(91,175,104,.12)}.homepage-shell[data-theme='dark'] .di-terracotta{background:rgba(212,132,110,.12)}.dept-count{font-size:34px;line-height:1;margin:0 0 6px}.dept-card:nth-child(1) .dept-count{color:var(--maroon)}.dept-card:nth-child(2) .dept-count{color:var(--sky)}.dept-card:nth-child(3) .dept-count{color:var(--sage)}.dept-name{font-size:18px;margin:0 0 4px;color:var(--text-primary)}.dept-label{font-size:13px;color:var(--text-tertiary)}
      .cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.cat-card{display:flex;align-items:center;gap:12px;background:var(--bg-card);border-radius:14px;padding:18px 18px;border:1px solid var(--border);cursor:pointer}.cat-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}.cat-card:nth-child(1):hover,.cat-card:nth-child(7):hover{border-color:var(--maroon)}.cat-card:nth-child(2):hover,.cat-card:nth-child(5):hover{border-color:var(--sky)}.cat-card:nth-child(3):hover,.cat-card:nth-child(6):hover{border-color:var(--sage)}.cat-card:nth-child(4):hover,.cat-card:nth-child(8):hover{border-color:var(--terracotta)}.homepage-shell[data-theme='light'] .cat-card:nth-child(1):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(7):hover{background:rgba(139,35,50,.04)}.homepage-shell[data-theme='light'] .cat-card:nth-child(2):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(5):hover{background:rgba(74,143,181,.04)}.homepage-shell[data-theme='light'] .cat-card:nth-child(3):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(6):hover{background:rgba(61,139,74,.04)}.homepage-shell[data-theme='light'] .cat-card:nth-child(4):hover,.homepage-shell[data-theme='light'] .cat-card:nth-child(8):hover{background:rgba(196,101,74,.04)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(1):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(7):hover{background:rgba(184,58,78,.08)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(2):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(5):hover{background:rgba(123,184,212,.06)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(3):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(6):hover{background:rgba(91,175,104,.06)}.homepage-shell[data-theme='dark'] .cat-card:nth-child(4):hover,.homepage-shell[data-theme='dark'] .cat-card:nth-child(8):hover{background:rgba(212,132,110,.06)}.cat-icon{width:38px;height:38px;border-radius:10px;flex-shrink:0}.cat-icon svg{width:18px;height:18px;stroke:currentColor;fill:none}.cat-info{flex:1;text-align:left}.cat-info h4{margin:0 0 2px;font-size:13px;font-weight:700;color:var(--text-primary)}.cat-info span{font-size:12px;color:var(--text-tertiary)}.cat-arrow{opacity:0;transform:translateX(-4px);transition:all var(--transition-speed) ease;color:var(--maroon)}.cat-card:hover .cat-arrow{opacity:1;transform:translateX(0)}
      .cta{background:var(--cta-bg);text-align:center;overflow:hidden}.cta-bg{position:absolute;inset:0;background:radial-gradient(circle at top,rgba(255,255,255,.12),transparent 48%)}.cta-pattern{position:absolute;inset:0;opacity:.08;background-image:linear-gradient(135deg,rgba(255,255,255,.1) 25%,transparent 25%),linear-gradient(225deg,rgba(255,255,255,.1) 25%,transparent 25%);background-size:26px 26px}.cta-content{position:relative;z-index:1;max-width:680px;margin:0 auto}.cta h2{font-size:clamp(28px,3.8vw,44px);line-height:1.08;margin:0 0 14px;color:#fff7f7}.homepage-shell[data-theme='dark'] .cta h2{color:#f0e4e6}.cta p{margin:0 auto 24px;max-width:560px;font-size:15px;line-height:1.65;color:rgba(255,240,240,.82)}.homepage-shell[data-theme='dark'] .cta p{color:rgba(240,228,230,.5)}.cta-buttons{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.btn-role{min-width:124px;border-radius:12px;padding:12px 20px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.02);color:#fff;cursor:pointer;transition:all .3s ease}.btn-role:hover{transform:translateY(-2px);background:#fff;color:var(--maroon);border-color:#fff;box-shadow:0 10px 24px rgba(0,0,0,.18)}
      footer{background:var(--footer-bg);padding:34px 36px 18px}.footer-main{max-width:1040px;margin:0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding-bottom:28px;border-bottom:1px solid var(--border)}.footer-brand{display:flex;align-items:center;gap:10px}.footer-brand-text h4,.footer-uni-text h4{font-size:17px;margin:0 0 3px;color:var(--text-primary)}.footer-brand-text span,.footer-uni-text span{font-size:12px;color:var(--text-tertiary)}.footer-uni{display:flex;align-items:center;gap:10px;text-align:right}.footer-uni-seal{width:46px;height:46px;border-radius:14px;background:rgba(139,35,50,.08);border:1px solid rgba(139,35,50,.16);display:flex;align-items:center;justify-content:center;padding:4px}.homepage-shell[data-theme='dark'] .footer-uni-seal{background:rgba(184,58,78,.08);border-color:rgba(200,160,170,.14)}.footer-uni-seal svg{width:24px;height:24px;color:var(--maroon)}.footer-bottom{max-width:1040px;margin:0 auto;padding-top:18px;text-align:center}.footer-bottom p{font-size:11px;color:var(--text-tertiary);margin:0}
      .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}.reveal.visible{opacity:1;transform:translateY(0)}.reveal-delay-1{transition-delay:.1s}.reveal-delay-2{transition-delay:.2s}.reveal-delay-3{transition-delay:.3s}.reveal-delay-4{transition-delay:.4s}
      .homepage-shell .vpaa-chat-bubble.self{max-width:78%;padding:10px 16px;border-radius:999px;align-self:flex-end}
      .homepage-shell .vpaa-chat-bubble.other{max-width:88%}
      .ai-chatbot-fab{position:fixed;right:28px;bottom:28px;width:74px;height:74px;border:0;background:transparent;box-shadow:none;display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;z-index:1301;transition:transform .25s ease,box-shadow .25s ease}.ai-chatbot-fab:active{cursor:grabbing}.ai-chatbot-fab:hover{transform:translateY(-2px) scale(1.02)}.ai-chatbot-fab img{width:84%;height:84%;object-fit:contain;display:block;pointer-events:none}
      .ai-chatbot-panel{position:fixed;right:28px;bottom:118px;width:320px;max-width:calc(100vw - 32px);border-radius:26px;overflow:hidden;border:1px solid var(--border);background:var(--bg-card);box-shadow:var(--shadow-xl);transform:translateY(16px);opacity:0;pointer-events:none;z-index:1300;transition:opacity .3s ease,transform .3s ease}.ai-chatbot-panel.open{transform:translateY(0);opacity:1;pointer-events:auto}.ai-chatbot-header,.ai-chatbot-title,.ai-chatbot-form{display:flex;align-items:center}.ai-chatbot-header{justify-content:space-between;align-items:flex-start;gap:12px;padding:14px 14px 12px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,var(--bg-tertiary),var(--bg-card))}.homepage-ai-chatbot-drag-handle{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}.homepage-ai-chatbot-drag-handle:active{cursor:grabbing}.ai-chatbot-title{gap:10px}.ai-chatbot-avatar{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.ai-chatbot-avatar img{width:100%;height:100%;object-fit:contain;display:block}.ai-chatbot-title h3{margin:0 0 2px;font-size:14px;color:var(--text-primary)}.ai-chatbot-title p{margin:0;font-size:11px;color:var(--text-tertiary)}.ai-chatbot-close{width:32px;height:32px;border:0;background:transparent;color:var(--text-tertiary);border-radius:12px;cursor:pointer;font-size:22px;line-height:1;transition:all .25s ease}.ai-chatbot-close:hover{background:rgba(139,35,50,.06);color:var(--maroon)}.ai-chatbot-body{padding:14px;display:flex;flex-direction:column}.ai-chatbot-messages{max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px}.chat-bubble{max-width:90%;border-radius:18px;padding:9px 11px;font-size:12px;line-height:1.45}.chat-bubble.bot{background:var(--bg-secondary);color:var(--text-secondary);border-top-left-radius:6px}.chat-bubble.user{margin-left:auto;background:var(--maroon);color:#fff;border-top-right-radius:6px}.ai-chatbot-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.chat-suggestion{border-radius:999px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);padding:7px 10px;font-size:11px !important;line-height:1.2 !important;font-weight:500;cursor:pointer;transition:all .25s ease;font-family:'Plus Jakarta Sans',sans-serif}.chat-suggestion:hover{border-color:var(--maroon);color:var(--maroon)}.ai-chatbot-form{margin-top:10px;gap:6px;border-radius:16px;border:1px solid var(--border);background:var(--bg-card);padding:6px}.ai-chatbot-input{flex:1;border:0;outline:none;background:transparent;color:var(--text-primary);padding:7px 9px;font-size:11px}.ai-chatbot-input::placeholder{color:var(--text-tertiary)}.ai-chatbot-send{width:34px;height:34px;border:0;border-radius:12px;background:var(--maroon);color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .25s ease}.ai-chatbot-send:hover{background:var(--maroon-dark)}.ai-chatbot-send svg{width:14px;height:14px;fill:currentColor}
      @keyframes homepagePulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes homepageFadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes homepageFadeInDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
      @media (max-width:1024px){.homepage-shell nav{padding:0 24px}.features-grid,.dept-grid{grid-template-columns:1fr}.cat-grid{grid-template-columns:1fr}.footer-main{flex-direction:column;align-items:flex-start}.footer-uni{text-align:left}}
      @media (max-width:768px){.nav-links{display:none}.features,.departments,.categories,.cta{padding:68px 24px}.hero-content{padding:0 20px}.hero-stats{gap:18px;flex-wrap:wrap}.hero-actions,.cta-buttons{flex-direction:column;align-items:center}footer{padding:30px 24px 18px}.ai-chatbot-panel{right:16px;left:16px;bottom:102px;width:auto;max-width:none}.ai-chatbot-fab{right:16px;bottom:16px;width:68px;height:68px}.ai-chatbot-fab svg{width:32px;height:32px}}
    `}</style>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 768);
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]['id']>('home');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatPosition, setChatPosition] = useState<ChatPosition>({ right: CHAT_FAB_RIGHT, bottom: CHAT_FAB_BOTTOM });
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const chatFabRef = useRef<HTMLButtonElement | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const chatDragRef = useRef<ChatDragState | null>(null);
  const suppressFabClickRef = useRef(false);

  const clampChatPosition = (position: ChatPosition) => {
    const fabRect = chatFabRef.current?.getBoundingClientRect();
    const fabWidth = fabRect?.width ?? CHAT_FAB_SIZE;
    const fabHeight = fabRect?.height ?? CHAT_FAB_SIZE;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const minRight = CHAT_DRAG_MARGIN;
    const maxRight = Math.max(minRight, viewportWidth - CHAT_DRAG_MARGIN - fabWidth);
    const minBottom = CHAT_DRAG_MARGIN;
    const maxBottom = Math.max(minBottom, viewportHeight - CHAT_DRAG_MARGIN - fabHeight);

    return {
      right: Math.min(maxRight, Math.max(minRight, position.right)),
      bottom: Math.min(maxBottom, Math.max(minBottom, position.bottom)),
    };
  };

  const resolveChatPanelStyle = (position: ChatPosition) => {
    const panelRect = chatPanelRef.current?.getBoundingClientRect();
    const fabRect = chatFabRef.current?.getBoundingClientRect();
    const panelWidth = panelRect?.width ?? 360;
    const panelHeight = panelRect?.height ?? 520;
    const fabWidth = fabRect?.width ?? CHAT_FAB_SIZE;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const fabLeft = viewportWidth - position.right - fabWidth;
    const fabCenterX = fabLeft + (fabWidth / 2);
    const iconOnLeftSide = fabCenterX < viewportWidth / 2;
    const minPanelLeft = CHAT_DRAG_MARGIN;
    const maxPanelLeft = Math.max(minPanelLeft, viewportWidth - CHAT_DRAG_MARGIN - panelWidth);
    const maxPanelBottom = Math.max(
      CHAT_DRAG_MARGIN,
      viewportHeight - CHAT_DRAG_MARGIN - panelHeight
    );
    const rawPanelLeft = iconOnLeftSide
      ? fabLeft + fabWidth + CHAT_PANEL_GAP
      : fabLeft - panelWidth - CHAT_PANEL_GAP;
    const panelLeft = Math.min(maxPanelLeft, Math.max(minPanelLeft, rawPanelLeft));
    const panelBottom = Math.min(maxPanelBottom, Math.max(CHAT_DRAG_MARGIN, position.bottom));

    return {
      left: `${panelLeft}px`,
      right: 'auto',
      bottom: `${panelBottom}px`,
    };
  };

  const startChatDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDesktop || event.button !== 0) return;

    const clamped = clampChatPosition(chatPosition);
    chatDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRight: clamped.right,
      startBottom: clamped.bottom,
      moved: false,
      pointerId: event.pointerId,
    };
    suppressFabClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 768;
      setIsDesktop(desktop);
      if (!desktop) {
        setChatPosition({ right: CHAT_FAB_RIGHT, bottom: CHAT_FAB_BOTTOM });
      } else {
        setChatPosition((current) => clampChatPosition(current));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const endDrag = () => {
      const drag = chatDragRef.current;
      suppressFabClickRef.current = Boolean(drag?.moved);
      chatDragRef.current = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = chatDragRef.current;
      if (!drag) return;

      const nextPosition = clampChatPosition({
        right: drag.startRight - (event.clientX - drag.startX),
        bottom: drag.startBottom - (event.clientY - drag.startY),
      });
      const movedDistance = Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY);
      if (movedDistance > 4) {
        drag.moved = true;
      }

      setChatPosition(nextPosition);
      event.preventDefault();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [isChatOpen]);

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

  const handleChat = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || chatSending) return;
    setMessages((current) => [...current, { type: 'user', text: trimmedMessage }]);
    setChatInput('');
    setChatSending(true);

    try {
      const history = messages.map((message) => ({
          role: message.type === 'user' ? 'user' : 'assistant',
          content: message.text,
        }));
      const response = await aiService.chat(trimmedMessage, history, {
        page: 'Public homepage',
        section: activeSection,
        path: '/',
      });
      setMessages((current) => [...current, { type: 'bot', text: response.reply || 'No reply was returned by the chatbot.' }]);
    } catch {
      setMessages((current) => [...current, { type: 'bot', text: 'The AI chatbot is unavailable right now. Please try again in a moment.' }]);
    } finally {
      setChatSending(false);
    }
  };

  const revealClass = (id: string, delay = '') =>
    ['reveal', delay, revealed.includes(id) ? 'visible' : ''].filter(Boolean).join(' ');

  return (
    <div className="homepage-shell" data-theme={theme}>
      <HomePageStyles />
      <nav className={isScrolled ? 'scrolled' : ''}>
        <button type="button" className="nav-brand" onClick={() => scrollToSection('home')}>
          <div className="nav-logo">
            <BrandMarkIcon />
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
              Manila Campus
            </div>

            <h1>
              Thesis <em>Archive</em>
              <br />
              Management System
            </h1>

            <div className="hero-sub">Technological University of the Philippines</div>

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
                  className="btn-role"
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
                <BrandMarkIcon />
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
                <SchoolIcon />
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Thesis Archive Management System. All rights reserved.</p>
          </div>
        </footer>
      </main>

      <div
        ref={chatPanelRef}
        className={`vpaa-ai-chatbot-panel ${isChatOpen ? 'open' : ''}`}
        aria-hidden={!isChatOpen}
        style={isDesktop ? resolveChatPanelStyle(chatPosition) : undefined}
      >
        <div className="vpaa-ai-chatbot-header">
          <div className="vpaa-ai-chatbot-title">
            <div className="vpaa-ai-chatbot-avatar" aria-hidden="true">
              <img src={tamsBot} alt="Archie chatbot" />
            </div>
            <div>
              <h3>Archie - Archive Assistant</h3>
              <p>Ask about reviews, faculty workflows, and support.</p>
            </div>
          </div>

          <button type="button" className="vpaa-ai-chatbot-close" onClick={() => setIsChatOpen(false)} aria-label="Close AI chatbot">
            ×
          </button>
        </div>

        <div className="vpaa-ai-chatbot-body">
          <div className="vpaa-ai-chatbot-messages" ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <div key={`${message.type}-${index}`} className={`vpaa-chat-bubble ${message.type === 'user' ? 'self' : 'other'}`}>
                <ChatMessageContent text={message.text} variant={message.type} />
              </div>
            ))}
            {chatSending ? (
              <div className="vpaa-chat-bubble other typing" aria-label="Chatbot is typing" aria-live="polite">
                <span className="vpaa-chat-typing-dot" />
                <span className="vpaa-chat-typing-dot" />
                <span className="vpaa-chat-typing-dot" />
              </div>
            ) : null}
          </div>

          <form
            className="vpaa-ai-chatbot-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleChat(chatInput);
            }}
          >
            <input
              className="vpaa-ai-chatbot-input"
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type your question..."
              aria-label="Chat message"
              disabled={chatSending}
            />
            <button type="submit" className="vpaa-ai-chatbot-send" aria-label="Send message" disabled={chatSending}>
              <SendIcon />
            </button>
          </form>
        </div>
      </div>

      <button
        ref={chatFabRef}
        type="button"
        className="vpaa-ai-chatbot-fab"
        aria-label="Open Archie chatbot"
        aria-expanded={isChatOpen}
        style={isDesktop ? { right: `${chatPosition.right}px`, bottom: `${chatPosition.bottom}px` } : undefined}
        onPointerDown={startChatDrag}
        onClick={() => {
          if (suppressFabClickRef.current) {
            suppressFabClickRef.current = false;
            return;
          }
          if (!isChatOpen) {
            setChatPosition((current) => clampChatPosition(current));
            setMessages((current) => current.length ? current : [{ type: 'bot', text: CHATBOT_GREETING }]);
          }
          setIsChatOpen((current) => !current);
        }}
      >
        <img src={tamsBot} alt="Archie chatbot" draggable={false} />
      </button>
    </div>
  );
}
