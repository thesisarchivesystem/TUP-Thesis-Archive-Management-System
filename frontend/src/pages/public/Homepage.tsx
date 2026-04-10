import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookCopy,
  BriefcaseMedical,
  FolderClosed,
  GraduationCap,
  HardDrive,
  Layers3,
  LaptopMinimal,
  LocateFixed,
  MapPinned,
  Monitor,
  ScanSearch,
  Shield,
  SunMedium,
  UserRoundCog,
  Wrench,
  ChevronDown,
  Headset,
  Send,
  X,
  MoonStar,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import tupBuilding from '../../assets/tup-building.gif';

const stats = [
  { value: '500+', label: 'Thesis Documents' },
  { value: '3', label: 'Programs' },
  { value: '10+', label: 'Years of Research' },
  { value: '200+', label: 'Research Groups' },
];

const features = [
  {
    icon: MapPinned,
    title: 'Intelligent Search',
    description:
      'Find thesis documents effortlessly with our AI-powered smart search. Get relevant results through natural language queries, auto-suggestions, and intelligent keyword matching.',
    accent: 'before:bg-[#b46a74]',
    iconTone: 'bg-[#efe2df] text-[#7f2734]',
  },
  {
    icon: FolderClosed,
    title: 'Organized Collection',
    description:
      'All thesis documents are categorized by program, year, and research area for effortless navigation and easy discovery.',
    accent: 'before:bg-[#99c79c]',
    iconTone: 'bg-[#dfead8] text-[#428c49]',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description:
      'Role-based authentication ensures that only authorized students, faculty, and administrators can access thesis documents.',
    accent: 'before:bg-[#e8a58d]',
    iconTone: 'bg-[#f3e3da] text-[#cc7551]',
  },
];

const departments = [
  {
    icon: BriefcaseMedical,
    count: '150+',
    name: 'Computer Science',
    label: 'Thesis Documents',
    tone: 'text-[#99293a]',
    badge: 'bg-[#eddedd] text-[#99293a]',
  },
  {
    icon: Monitor,
    count: '120+',
    name: 'Information Technology',
    label: 'Thesis Documents',
    tone: 'text-[#4c95c7]',
    badge: 'bg-[#dfeaf2] text-[#4c95c7]',
  },
  {
    icon: HardDrive,
    count: '100+',
    name: 'Information Systems',
    label: 'Thesis Documents',
    tone: 'text-[#3f9d59]',
    badge: 'bg-[#e1eddc] text-[#3f8d4d]',
  },
];

const categories = [
  { icon: LaptopMinimal, title: 'Web & Mobile Development', count: '85+ documents', tone: 'bg-[#efe1df] text-[#812836]' },
  { icon: LocateFixed, title: 'Artificial Intelligence & ML', count: '62+ documents', tone: 'bg-[#e4edf4] text-[#4b90bf]' },
  { icon: Shield, title: 'Cybersecurity & Networking', count: '48+ documents', tone: 'bg-[#dfe8da] text-[#438f4c]' },
  { icon: ScanSearch, title: 'IoT & Embedded Systems', count: '35+ documents', tone: 'bg-[#f2e2d9] text-[#cb764e]' },
  { icon: HardDrive, title: 'Data Science & Analytics', count: '54+ documents', tone: 'bg-[#dce9f4] text-[#448fc2]' },
  { icon: UserRoundCog, title: 'Human-Computer Interaction', count: '28+ documents', tone: 'bg-[#dfeadc] text-[#4d9853]' },
  { icon: GraduationCap, title: 'Game Development', count: '22+ documents', tone: 'bg-[#eee0de] text-[#8a3440]' },
  { icon: Wrench, title: 'Automation & Robotics', count: '18+ documents', tone: 'bg-[#f0e2db] text-[#be6d48]' },
];

const accessRoles = [
  { label: 'Student', path: '/sign-in/student', primary: true },
  { label: 'Faculty', path: '/sign-in/faculty' },
  { label: 'VPAA', path: '/sign-in/vpaa' },
];

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'departments', label: 'Departments' },
  { id: 'browse', label: 'Browse' },
] as const;

type ChatMessage = {
  type: 'bot' | 'user';
  text: string;
};

export default function Homepage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]['id']>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: 'bot' as const, text: 'Hi! I can help you explore categories, departments, or access options.' },
    { type: 'bot' as const, text: 'Try one of the quick prompts below.' },
  ]);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const chatFabRef = useRef<HTMLButtonElement | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);

  const chatSuggestions = useMemo(
    () => ['Show thesis categories', 'Where do students sign in?', 'Browse departments'],
    []
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveSection(visible.target.id as (typeof sections)[number]['id']);
        }

        entries.forEach((entry) => {
          const target = entry.target;
          const revealId = target instanceof HTMLElement ? target.dataset.revealId : undefined;
          if (entry.isIntersecting && revealId) {
            setRevealed((current) =>
              current.includes(revealId)
                ? current
                : [...current, revealId]
            );
          }
        });
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: [0.1, 0.2, 0.35, 0.6],
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    document.querySelectorAll<HTMLElement>('[data-reveal-id]').forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!isChatOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsChatOpen(false);
      }
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
    if (!chatMessagesRef.current) return;
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [messages, isChatOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const replyToMessage = (message: string) => {
    const normalized = message.toLowerCase();

    if (normalized.includes('student') || normalized.includes('sign in') || normalized.includes('login')) {
      return 'Use the Student sign-in option in the access section to continue to the student portal.';
    }

    if (normalized.includes('category') || normalized.includes('browse')) {
      return 'You can explore areas like web and mobile development, AI and ML, cybersecurity, data science, game development, and robotics in the browse section.';
    }

    if (normalized.includes('department') || normalized.includes('program')) {
      return 'The department section highlights Computer Science, Information Technology, and Information Systems collections.';
    }

    return 'I can help with sections, departments, categories, or access paths on this homepage.';
  };

  const handleChat = (rawMessage: string) => {
    const trimmedMessage = rawMessage.trim();
    if (!trimmedMessage) return;

    setMessages((current) => [...current, { type: 'user', text: trimmedMessage }]);
    setChatInput('');

    window.setTimeout(() => {
      setMessages((current) => [...current, { type: 'bot', text: replyToMessage(trimmedMessage) }]);
    }, 320);
  };

  const revealClass = (id: string, delay = '') =>
    `${revealed.includes(id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700 ${delay}`;

  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'min-h-screen bg-[#1a1214] text-[#f0e4e6]' : 'min-h-screen bg-[#f7f2eb] text-[#321f22]'}>
      <header
        className={`sticky top-0 z-50 backdrop-blur-[24px] transition-all duration-300 ${
          isDark ? 'bg-[rgba(26,18,20,0.9)]' : 'bg-[rgba(248,244,238,0.94)]'
        } ${isScrolled ? (isDark ? 'shadow-[0_2px_20px_rgba(0,0,0,0.3)]' : 'shadow-[0_2px_20px_rgba(60,30,30,0.08)]') : ''}`}
      >
        <div className={`mx-auto flex h-[78px] max-w-[1800px] items-center justify-between px-6 md:px-14 ${isDark ? 'border-b border-[rgba(200,160,170,0.12)]' : 'border-b border-[rgba(157,78,85,0.08)]'}`}>
          <button type="button" onClick={() => scrollToSection('home')} className="flex items-center gap-4 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#9b2636] text-white shadow-[0_12px_30px_rgba(155,38,54,0.18)]">
              <Layers3 size={18} />
            </div>
            <div className={`font-serif text-[17px] leading-none ${isDark ? 'text-[#f0e4e6]' : 'text-[#2f1c1f]'}`}>
              Thesis <span className="text-[#a52d3d]">Archive</span>
            </div>
          </button>

          <div className="flex items-center gap-4 md:gap-7">
            <nav className={`hidden items-center gap-3 text-[15px] md:flex ${isDark ? 'text-[#b8a0a4]' : 'text-[#654f52]'}`}>
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className="text-[15px] transition"
                  >
                    <span
                      className={
                        isActive
                          ? isDark
                            ? 'rounded-xl bg-[rgba(184,58,78,0.14)] px-5 py-2.5 text-[#d56a79]'
                            : 'rounded-xl bg-[#efe4de] px-5 py-2.5 text-[#a52d3d]'
                          : isDark
                            ? 'rounded-xl px-5 py-2.5 text-[#b8a0a4] hover:text-[#d56a79]'
                            : 'rounded-xl px-5 py-2.5 text-[#654f52] hover:text-[#a52d3d]'
                      }
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => navigate('/sign-in/student')}
              className="rounded-[12px] bg-[#9d2636] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(157,38,54,0.16)] transition hover:bg-[#851f2e]"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label="Theme toggle"
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isDark ? 'border-[rgba(200,160,170,0.18)] bg-[rgba(36,28,34,0.92)] text-[#7bb8d4]' : 'border-[rgba(214,165,80,0.35)] bg-[rgba(255,252,248,0.9)] text-[#d49a35]'}`}
            >
              {theme === 'light' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className={`relative overflow-hidden ${isDark ? 'border-b border-[rgba(200,160,170,0.08)]' : 'border-b border-[rgba(157,78,85,0.06)]'}`}>
          <div
            className={`absolute inset-0 bg-cover bg-center ${isDark ? 'opacity-[0.3]' : 'opacity-[0.23]'}`}
            style={{ backgroundImage: `url(${tupBuilding})` }}
          />
          <div className={`absolute inset-0 ${isDark ? 'bg-[linear-gradient(180deg,rgba(26,18,20,0.46)_0%,rgba(26,18,20,0.72)_52%,rgba(26,18,20,0.94)_100%)]' : 'bg-[linear-gradient(180deg,rgba(248,244,238,0.66)_0%,rgba(248,244,238,0.82)_52%,rgba(248,244,238,0.95)_100%)]'}`} />
          <div className={`absolute inset-x-0 top-0 h-[420px] ${isDark ? 'bg-[linear-gradient(180deg,rgba(184,58,78,0.08),rgba(26,18,20,0))]' : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0))]'}`} />
          <div className="relative mx-auto max-w-[1800px] px-6 pb-14 pt-6 md:px-14 md:pb-16 md:pt-4">
            <div className="mx-auto flex max-w-[860px] flex-col items-center pt-10 text-center md:pt-14">
              <div
                data-reveal-id="hero-badge"
                className={`mb-[18px] inline-flex items-center gap-2 rounded-full px-[18px] py-[7px] text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_8px_18px_rgba(165,45,61,0.08)] ${isDark ? 'border border-[rgba(200,160,170,0.16)] bg-[rgba(44,32,40,0.72)] text-[#d56a79]' : 'border border-[rgba(165,45,61,0.14)] bg-[rgba(255,250,246,0.78)] text-[#a33b46]'} ${revealClass('hero-badge')}`}
              >
                <span className="h-[6px] w-[6px] rounded-full bg-[#a52d3d] animate-pulse" />
                Computer Studies Department
              </div>

              <h1
                data-reveal-id="hero-title"
                className={`max-w-[760px] text-[clamp(44px,6.5vw,78px)] font-normal leading-[1.06] tracking-normal ${isDark ? 'text-[#f0e4e6]' : 'text-[#331d20]'} ${revealClass('hero-title', 'delay-100')}`}
              >
                Thesis <span className={`${isDark ? 'text-[#d56a79]' : 'text-[#a52d3d]'} italic`}>Archive</span>
                <br />
                Management System
              </h1>

              <p
                data-reveal-id="hero-subtitle"
                className={`mb-6 mt-0 font-serif text-[clamp(18px,2.5vw,28px)] font-normal leading-normal ${isDark ? 'text-[#d4846e]' : 'text-[#d07a52]'} ${revealClass('hero-subtitle', 'delay-150')}`}
              >
                Technological University of the Philippines - Manila
              </p>

              <p
                data-reveal-id="hero-copy"
                className={`mb-10 mt-0 max-w-[560px] text-[16px] leading-[1.7] ${isDark ? 'text-[#b8a0a4]' : 'text-[#6a5557]'} ${revealClass('hero-copy', 'delay-200')}`}
              >
                A comprehensive digital repository for academic research and scholarly works. Browse, search, and
                access thesis documents across all programs in one unified platform.
              </p>

              <div data-reveal-id="hero-actions" className={`mt-0 flex flex-col gap-4 sm:flex-row ${revealClass('hero-actions', 'delay-300')}`}>
                <button
                  type="button"
                  onClick={() => navigate('/sign-in/student')}
                  className="inline-flex min-w-[220px] items-center justify-center gap-3 rounded-[16px] bg-[#9d2636] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(157,38,54,0.2)] transition hover:bg-[#851f2e]"
                >
                  <ScanSearch size={18} />
                  Browse Theses
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('about')}
                  className={`inline-flex min-w-[190px] items-center justify-center gap-3 rounded-[16px] px-8 py-4 text-[15px] font-semibold shadow-[0_12px_30px_rgba(80,47,49,0.04)] transition ${isDark ? 'border border-[rgba(200,160,170,0.14)] bg-[rgba(42,32,40,0.76)] text-[#f0e4e6] hover:border-[rgba(212,132,110,0.3)]' : 'border border-[rgba(165,45,61,0.16)] bg-[rgba(255,251,248,0.8)] text-[#3a2326] hover:border-[rgba(165,45,61,0.26)]'}`}
                >
                  Learn More
                  <ChevronDown size={18} />
                </button>
              </div>

              <div
                data-reveal-id="hero-stats"
                className={`mt-16 w-full max-w-[810px] ${revealClass('hero-stats', 'delay-500')}`}
              >
                <div className={`mx-auto mb-8 h-px w-full ${isDark ? 'bg-[rgba(200,160,170,0.12)]' : 'bg-[rgba(165,45,61,0.12)]'}`} />
                <div className="grid grid-cols-2 gap-y-8 text-center md:grid-cols-4">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <p className={`font-serif text-[40px] leading-none tracking-normal ${isDark ? 'text-[#f0e4e6]' : 'text-[#351f22]'}`}>
                        {stat.value.replace('+', '')}
                        <span className="ml-1 align-top text-[2rem] font-normal text-[#d47c84]">+</span>
                      </p>
                      <p className={`mt-[6px] text-[12px] uppercase tracking-normal ${isDark ? 'text-[#7a6468]' : 'text-[#8e7a7c]'}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className={`${isDark ? 'bg-[#1a1214]' : 'bg-[#f7f2eb]'} px-6 py-28 md:px-14 md:py-32`}>
          <div className="mx-auto max-w-[1260px]">
            <div data-reveal-id="about-header" className={`mx-auto max-w-[760px] text-center ${revealClass('about-header')}`}>
              <div className="mb-8 flex items-center justify-center gap-6">
                <span className="h-px w-7 bg-[rgba(165,45,61,0.32)]" />
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#a52d3d]">Why Choose Us</p>
                <span className="h-px w-7 bg-[rgba(165,45,61,0.32)]" />
              </div>
              <h2 className={`text-[clamp(30px,3.5vw,44px)] font-normal leading-[1.15] tracking-normal ${isDark ? 'text-[#f0e4e6]' : 'text-[#331d20]'}`}>
                Built for Academic Excellence
              </h2>
              <p className={`mx-auto mt-0 max-w-[520px] text-[15px] leading-[1.65] ${isDark ? 'text-[#b8a0a4]' : 'text-[#6a5557]'}`}>
                A comprehensive platform designed to make academic research accessible, organized, and secure for the
                TUP community.
              </p>
            </div>

            <div className="mt-20 grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    data-reveal-id={`feature-${index}`}
                    className={`relative overflow-hidden rounded-[24px] px-9 py-10 transition-all duration-300 hover:-translate-y-1 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[4px] ${isDark ? 'border border-[rgba(200,160,170,0.12)] bg-[rgba(36,28,34,0.82)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:bg-[rgba(42,32,40,0.95)] hover:shadow-[0_18px_34px_rgba(0,0,0,0.28)]' : 'border border-[rgba(165,45,61,0.08)] bg-[rgba(255,252,249,0.62)] shadow-[0_10px_30px_rgba(73,43,44,0.04)] hover:bg-[rgba(255,252,249,0.9)] hover:shadow-[0_18px_34px_rgba(73,43,44,0.08)]'} ${feature.accent} ${revealClass(`feature-${index}`, `delay-[${(index + 1) * 100}ms]`)}`}
                  >
                    <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconTone}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className={`text-[20px] font-normal leading-normal ${isDark ? 'text-[#f0e4e6]' : 'text-[#311d1f]'}`}>{feature.title}</h3>
                    <p className={`mt-[10px] text-[14px] leading-[1.65] ${isDark ? 'text-[#b8a0a4]' : 'text-[#5f4a4d]'}`}>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="departments" className={`${isDark ? 'bg-[#221920]' : 'bg-[#f2eadf]'} px-6 py-28 md:px-14 md:py-32`}>
          <div className="mx-auto max-w-[1260px]">
            <div data-reveal-id="departments-header" className={`mx-auto max-w-[680px] text-center ${revealClass('departments-header')}`}>
              <div className="mb-8 flex items-center justify-center gap-6">
                <span className="h-px w-7 bg-[rgba(165,45,61,0.32)]" />
                <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#a52d3d]">Departments</p>
                <span className="h-px w-7 bg-[rgba(165,45,61,0.32)]" />
              </div>
              <h2 className={`text-[3.2rem] font-semibold leading-[1.02] tracking-[-0.04em] md:text-[4rem] ${isDark ? 'text-[#f0e4e6]' : 'text-[#331d20]'}`}>
                Thesis by Department
              </h2>
              <p className={`mx-auto mt-6 max-w-[650px] text-[18px] leading-[1.7] ${isDark ? 'text-[#b8a0a4]' : 'text-[#6a5557]'}`}>
                Browse our collection of thesis documents organized by academic department.
              </p>
            </div>

            <div className="mt-20 grid gap-6 md:grid-cols-3">
              {departments.map((department, index) => {
                const Icon = department.icon;
                return (
                  <article
                    key={department.name}
                    data-reveal-id={`department-${index}`}
                    className={`rounded-[22px] px-8 py-9 text-center transition-all duration-300 hover:-translate-y-1 ${isDark ? 'border border-[rgba(200,160,170,0.12)] bg-[rgba(36,28,34,0.88)] shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_34px_rgba(0,0,0,0.28)]' : 'border border-[rgba(165,45,61,0.08)] bg-[rgba(255,252,249,0.78)] shadow-[0_10px_28px_rgba(73,43,44,0.04)] hover:shadow-[0_18px_34px_rgba(73,43,44,0.08)]'} ${revealClass(`department-${index}`, `delay-[${(index + 1) * 100}ms]`)}`}
                  >
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${department.badge}`}>
                      <Icon size={20} />
                    </div>
                    <p className={`mt-8 font-serif text-[3.2rem] leading-none tracking-[-0.05em] ${department.tone}`}>
                      {department.count.replace('+', '')}
                      <span className="ml-1 align-top text-[2rem] font-normal text-[#d47c84]">+</span>
                    </p>
                    <h3 className={`mt-3 text-[20px] font-semibold ${isDark ? 'text-[#f0e4e6]' : 'text-[#221619]'}`}>{department.name}</h3>
                    <p className={`mt-1 text-[14px] ${isDark ? 'text-[#7a6468]' : 'text-[#8a777a]'}`}>{department.label}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="browse" className={`${isDark ? 'bg-[#1a1214]' : 'bg-[#f7f2eb]'} px-6 py-28 md:px-14 md:py-32`}>
          <div className="mx-auto max-w-[1260px]">
            <div data-reveal-id="browse-header" className={`mx-auto max-w-[760px] text-center ${revealClass('browse-header')}`}>
              <div className="mb-8 flex items-center justify-center gap-6">
                <span className="h-px w-7 bg-[rgba(165,45,61,0.32)]" />
                <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#a52d3d]">Browse</p>
                <span className="h-px w-7 bg-[rgba(165,45,61,0.32)]" />
              </div>
              <h2 className={`text-[3.2rem] font-semibold leading-[1.02] tracking-[-0.04em] md:text-[4rem] ${isDark ? 'text-[#f0e4e6]' : 'text-[#331d20]'}`}>
                Browse by Category
              </h2>
              <p className={`mx-auto mt-6 max-w-[720px] text-[18px] leading-[1.7] ${isDark ? 'text-[#b8a0a4]' : 'text-[#6a5557]'}`}>
                Explore thesis documents from the Computer Studies Department organized by research focus area.
              </p>
            </div>

            <div className="mt-20 grid gap-5 md:grid-cols-2">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <article
                    key={category.title}
                    data-reveal-id={`category-${index}`}
                    className={`group flex items-center gap-5 rounded-[20px] px-6 py-6 transition-all duration-300 hover:-translate-y-[3px] ${isDark ? 'border border-[rgba(200,160,170,0.12)] bg-[rgba(36,28,34,0.88)] shadow-[0_8px_22px_rgba(0,0,0,0.16)] hover:border-[rgba(212,132,110,0.18)] hover:shadow-[0_14px_26px_rgba(0,0,0,0.24)]' : 'border border-[rgba(165,45,61,0.08)] bg-[rgba(255,252,249,0.78)] shadow-[0_8px_22px_rgba(73,43,44,0.03)] hover:border-[rgba(165,45,61,0.18)] hover:shadow-[0_14px_26px_rgba(73,43,44,0.08)]'} ${revealClass(`category-${index}`, `delay-[${((index % 4) + 1) * 100}ms]`)}`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${category.tone}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-[18px] font-semibold ${isDark ? 'text-[#f0e4e6]' : 'text-[#221619]'}`}>{category.title}</h3>
                      <p className={`mt-1 text-[14px] ${isDark ? 'text-[#7a6468]' : 'text-[#8a777a]'}`}>{category.count}</p>
                    </div>
                    <div className="translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <ArrowRight size={18} className="text-[#8e2231]" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={`${isDark ? 'bg-[#1a1214]' : 'bg-[#f7f2eb]'} pt-0`}>
          <div className="bg-[linear-gradient(180deg,#952838_0%,#7a2030_55%,#661b28_100%)] px-6 py-28 text-center text-white md:px-14">
            <div data-reveal-id="cta-content" className={`mx-auto max-w-[780px] ${revealClass('cta-content')}`}>
              <h2 className="text-[3.2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white md:text-[4rem]">
                Ready to Access Our
                <br />
                Thesis Collection?
              </h2>
              <p className="mx-auto mt-8 max-w-[760px] text-[18px] leading-[1.7] text-[rgba(255,240,240,0.82)]">
                Join our academic community and start exploring thousands of research documents today.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                {accessRoles.map((role) => (
                  <button
                    key={role.label}
                    type="button"
                    onClick={() => navigate(role.path)}
                    className={
                      role.primary
                        ? 'min-w-[140px] rounded-[14px] bg-white px-9 py-4 text-[16px] font-semibold text-[#8e2231]'
                        : 'min-w-[140px] rounded-[14px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.02)] px-9 py-4 text-[16px] font-semibold text-white'
                    }
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className={`${isDark ? 'bg-[#150e11]' : 'bg-[#f2e8da]'} px-6 py-14 md:px-14`}>
            <div className="mx-auto max-w-[1260px]">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#9b2636] text-white">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <p className={`font-serif text-[18px] font-semibold ${isDark ? 'text-[#f0e4e6]' : 'text-[#2f1c1f]'}`}>Thesis Archive</p>
                    <p className={`text-[14px] ${isDark ? 'text-[#7a6468]' : 'text-[#907d7f]'}`}>Computer Studies Department</p>
                  </div>
                </div>

                <div className="text-left md:text-center">
                  <p className={`text-[17px] font-medium ${isDark ? 'text-[#b8a0a4]' : 'text-[#573f43]'}`}>
                    Technological University of the Philippines - Manila
                  </p>
                  <p className={`mt-2 text-[14px] ${isDark ? 'text-[#7a6468]' : 'text-[#988487]'}`}>San Marcelino St, Ayala Blvd, Ermita, Manila, 1000</p>
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'border border-[rgba(200,160,170,0.14)] bg-[rgba(184,58,78,0.08)] text-[#d56a79]' : 'border border-[rgba(157,38,54,0.18)] bg-[rgba(157,38,54,0.05)] text-[#9b2636]'}`}>
                  <BookCopy size={18} />
                </div>
              </div>

              <div className={`mt-12 border-t pt-8 text-center text-[14px] ${isDark ? 'border-[rgba(200,160,170,0.1)] text-[#7a6468]' : 'border-[rgba(157,38,54,0.08)] text-[#a08d90]'}`}>
                © 2026 Thesis Archive Management System. All rights reserved.
              </div>
            </div>
          </footer>
        </section>
      </main>

      <div
        ref={chatPanelRef}
        className={`fixed bottom-[112px] right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[26px] border backdrop-blur-xl transition-all duration-300 ${isDark ? 'border-[rgba(200,160,170,0.12)] bg-[rgba(36,28,34,0.96)] shadow-[0_28px_60px_rgba(0,0,0,0.38)]' : 'border-[rgba(157,38,54,0.12)] bg-[rgba(251,248,244,0.98)] shadow-[0_28px_60px_rgba(60,30,30,0.2)]'} ${
          isChatOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        aria-hidden={!isChatOpen}
      >
        <div className={`flex items-start justify-between border-b px-5 py-4 ${isDark ? 'border-[rgba(200,160,170,0.1)] bg-[linear-gradient(180deg,#2a2028_0%,#241c22_100%)]' : 'border-[rgba(157,38,54,0.08)] bg-[linear-gradient(180deg,#f4ebe3_0%,#f8f3ee_100%)]'}`}>
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#b84844_0%,#b1453d_100%)] text-white">
              <Headset size={20} />
            </div>
            <div>
              <h3 className={`text-[16px] font-semibold ${isDark ? 'text-[#f0e4e6]' : 'text-[#311d1f]'}`}>Archive Assistant</h3>
              <p className={`text-[13px] ${isDark ? 'text-[#7a6468]' : 'text-[#826f72]'}`}>Ask about collections, categories, and access.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8d7376] transition hover:bg-[rgba(157,38,54,0.06)] hover:text-[#8e2231]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div ref={chatMessagesRef} className="max-h-[240px] space-y-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.type}-${index}`}
                className={
                  message.type === 'bot'
                    ? isDark
                      ? 'max-w-[90%] rounded-[18px] rounded-tl-[6px] bg-[#2a2028] px-4 py-3 text-[14px] leading-6 text-[#d9c8cb]'
                      : 'max-w-[90%] rounded-[18px] rounded-tl-[6px] bg-[#f2e8df] px-4 py-3 text-[14px] leading-6 text-[#503c3f]'
                    : 'ml-auto max-w-[90%] rounded-[18px] rounded-tr-[6px] bg-[#9b2636] px-4 py-3 text-[14px] leading-6 text-white'
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chatSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleChat(suggestion)}
                className={`rounded-full border px-3 py-2 text-[12px] font-medium transition ${isDark ? 'border-[rgba(200,160,170,0.1)] bg-[#2a2028] text-[#b8a0a4] hover:border-[rgba(212,132,110,0.22)] hover:text-[#f0e4e6]' : 'border-[rgba(157,38,54,0.1)] bg-[#f8f2ec] text-[#7a6568] hover:border-[rgba(157,38,54,0.2)] hover:text-[#8e2231]'}`}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form
            className={`mt-4 flex items-center gap-2 rounded-[18px] border p-2 ${isDark ? 'border-[rgba(200,160,170,0.12)] bg-[#2a2028]' : 'border-[rgba(157,38,54,0.1)] bg-white'}`}
            onSubmit={(event) => {
              event.preventDefault();
              handleChat(chatInput);
            }}
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="flex-1 border-0 bg-transparent px-2 py-2 text-[14px] shadow-none focus:shadow-none"
              placeholder="Type your question..."
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#9b2636] text-white transition hover:bg-[#851f2e]"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <button
        ref={chatFabRef}
        type="button"
        aria-label="Open chatbot"
        aria-expanded={isChatOpen}
        aria-controls="archive-chatbot-panel"
        onClick={() => setIsChatOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-40 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#b84844_0%,#b1453d_100%)] text-white shadow-[0_18px_34px_rgba(177,69,61,0.34)] transition hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-[rgba(184,72,68,0.22)]"
      >
        <Headset size={30} />
      </button>
    </div>
  );
}
