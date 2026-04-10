import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Building2,
  Cpu,
  Globe,
  GraduationCap,
  HeartHandshake,
  Layers3,
  Lock,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserCog,
  Wrench,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const stats = [
  { value: '500+', label: 'Thesis Documents' },
  { value: '3', label: 'Programs' },
  { value: '10+', label: 'Years of Research' },
  { value: '200+', label: 'Research Groups' },
];

const features = [
  {
    icon: Search,
    title: 'Intelligent Search',
    description:
      'Find thesis documents effortlessly with relevant search suggestions, quick filters, and focused discovery.',
    accent: 'border-[#b9585c]',
    iconTone: 'bg-[#f4e1df] text-[#8b2332]',
  },
  {
    icon: Layers3,
    title: 'Organized Collection',
    description:
      'All theses are grouped by program, year, and research area for smooth browsing and archive management.',
    accent: 'border-[#95cba0]',
    iconTone: 'bg-[#e4f2e5] text-[#4b8f5c]',
  },
  {
    icon: Lock,
    title: 'Secure Access',
    description:
      'Role-based sign-in keeps records protected while giving students, faculty, and administrators the right tools.',
    accent: 'border-[#efc3a8]',
    iconTone: 'bg-[#fbe9dd] text-[#c26b3f]',
  },
];

const departments = [
  {
    icon: Building2,
    count: '150+',
    name: 'Computer Science',
    label: 'Thesis Documents',
    tone: 'text-[#b13f4b]',
    badge: 'bg-[#f7e1e5] text-[#8b2332]',
  },
  {
    icon: MonitorSmartphone,
    count: '120+',
    name: 'Information Technology',
    label: 'Thesis Documents',
    tone: 'text-[#4996c7]',
    badge: 'bg-[#e5f0f9] text-[#3478a6]',
  },
  {
    icon: Cpu,
    count: '100+',
    name: 'Information Systems',
    label: 'Thesis Documents',
    tone: 'text-[#5c9b63]',
    badge: 'bg-[#e8f5e8] text-[#4b8f5c]',
  },
];

const categories = [
  { icon: Globe, title: 'Web & Mobile Development', count: '86 documents', tone: 'bg-[#f8e4e8] text-[#8b2332]' },
  { icon: Brain, title: 'Artificial Intelligence & ML', count: '62 documents', tone: 'bg-[#eef2f5] text-[#4e6272]' },
  { icon: ShieldCheck, title: 'Cybersecurity & Networking', count: '48 documents', tone: 'bg-[#e5f3e6] text-[#4b8f5c]' },
  { icon: Cpu, title: 'IoT & Embedded Systems', count: '35 documents', tone: 'bg-[#fcecdf] text-[#be6b3d]' },
  { icon: BookOpen, title: 'Data Science & Analytics', count: '54 documents', tone: 'bg-[#e7f0f7] text-[#3478a6]' },
  { icon: UserCog, title: 'Human-Computer Interaction', count: '28 documents', tone: 'bg-[#edf5e9] text-[#5a8d4e]' },
  { icon: GraduationCap, title: 'Game Development', count: '22 documents', tone: 'bg-[#f7e7ec] text-[#8b2332]' },
  { icon: Wrench, title: 'Automation & Robotics', count: '18 documents', tone: 'bg-[#f8ede5] text-[#9f5f32]' },
];

const accessRoles = [
  { label: 'Student', path: '/sign-in/student', primary: true },
  { label: 'Faculty', path: '/sign-in/faculty' },
  { label: 'VPAA', path: '/sign-in/vpaa' },
];

export default function Homepage() {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[rgba(247,242,236,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--maroon)] text-white shadow-[0_12px_30px_rgba(139,35,50,0.22)]">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Thesis Archive</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                TUP Manila
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-sm text-[var(--text-secondary)] md:flex">
            <a href="#home" className="rounded-full bg-[rgba(139,35,50,0.08)] px-4 py-2 text-[var(--maroon)]">
              Home
            </a>
            <a href="#about" className="transition hover:text-[var(--maroon)]">
              About
            </a>
            <a href="#departments" className="transition hover:text-[var(--maroon)]">
              Departments
            </a>
            <a href="#browse" className="transition hover:text-[var(--maroon)]">
              Browse
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/sign-in/student')}
              className="hidden rounded-xl bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(139,35,50,0.24)] transition hover:bg-[var(--maroon-dark)] md:inline-flex"
            >
              Sign In
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/75 text-[#d09a4c]">
              <SunMedium size={16} />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          id="home"
          className="relative overflow-hidden border-b border-[color:rgba(139,35,50,0.06)] bg-[linear-gradient(180deg,#f8f3ee_0%,#f7f2ec_50%,#f2ebe2_100%)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(139,35,50,0.08),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(247,242,236,0),#f7f2ec)]" />
          <div className="pointer-events-none absolute left-1/2 top-24 h-[430px] w-[min(92vw,980px)] -translate-x-1/2 rounded-[44px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] shadow-[0_40px_80px_rgba(90,50,40,0.10)]" />
          <div className="pointer-events-none absolute left-1/2 top-28 h-[360px] w-[min(88vw,900px)] -translate-x-1/2 overflow-hidden rounded-[36px] opacity-40">
            <div className="h-full w-full bg-[repeating-linear-gradient(90deg,rgba(177,135,118,0.14)_0,rgba(177,135,118,0.14)_2px,transparent_2px,transparent_92px),repeating-linear-gradient(0deg,rgba(177,135,118,0.08)_0,rgba(177,135,118,0.08)_2px,transparent_2px,transparent_66px)]" />
          </div>
          <div className="pointer-events-none absolute left-[7%] top-28 hidden h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(133,182,126,0.28),rgba(133,182,126,0))] blur-2xl md:block" />
          <div className="pointer-events-none absolute right-[8%] top-24 hidden h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(219,176,149,0.34),rgba(219,176,149,0))] blur-2xl md:block" />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pb-24 pt-12 text-center md:px-8 md:pb-28 md:pt-16">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(139,35,50,0.12)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--maroon)] shadow-[0_10px_25px_rgba(139,35,50,0.08)]">
              <Sparkles size={12} />
              Computer Studies Department
            </div>

            <div className="relative z-10 max-w-4xl">
              <h1 className="text-[3rem] font-semibold leading-[0.95] tracking-[-0.04em] text-[#311b1d] sm:text-[4.2rem] md:text-[5.4rem]">
                Thesis <span className="text-[var(--maroon)]">Archive</span>
                <br />
                Management System
              </h1>
              <p className="mt-4 text-lg font-semibold text-[#cf7445] md:text-2xl">
                Technological University of the Philippines - Manila
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
                A comprehensive digital repository for academic research and scholarly works. Browse,
                search, and access thesis documents across all programs in one unified platform.
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/sign-in/student')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--maroon)] px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(139,35,50,0.26)] transition hover:bg-[var(--maroon-dark)]"
              >
                <Search size={16} />
                Browse Theses
              </button>
              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:rgba(139,35,50,0.12)] bg-white/90 px-7 py-4 text-sm font-semibold text-[var(--text-primary)] shadow-[0_10px_25px_rgba(70,35,35,0.06)] transition hover:border-[rgba(139,35,50,0.22)] hover:text-[var(--maroon)]"
              >
                Learn More
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-6 border-t border-[rgba(139,35,50,0.08)] pt-8 text-center md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-[#3b2222] md:text-4xl">{stat.value}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-[var(--bg-primary)] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="section-kicker">Why Choose Us</p>
              <h2 className="section-title">Built for Academic Excellence</h2>
              <p className="section-copy mx-auto max-w-2xl">
                A comprehensive platform designed to make academic research accessible, organized, and
                secure for the TUP community.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className={`rounded-[28px] border border-[color:rgba(139,35,50,0.07)] border-l-4 ${feature.accent} bg-white/80 p-8 shadow-[0_18px_40px_rgba(76,44,36,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(76,44,36,0.1)]`}
                  >
                    <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconTone}`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#321e1f]">{feature.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="departments"
          className="border-y border-[color:rgba(139,35,50,0.05)] bg-[linear-gradient(180deg,#efe5d8_0%,#f5eee6_12%,#f7f2ec_100%)] px-5 py-20 md:px-8 md:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="section-kicker">Departments</p>
              <h2 className="section-title">Thesis by Department</h2>
              <p className="section-copy mx-auto max-w-xl">
                Browse our collection of thesis documents organized by academic department.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {departments.map((department) => {
                const Icon = department.icon;
                return (
                  <article
                    key={department.name}
                    className="rounded-[24px] border border-[color:rgba(139,35,50,0.06)] bg-white/85 p-8 text-center shadow-[0_15px_35px_rgba(76,44,36,0.06)]"
                  >
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${department.badge}`}>
                      <Icon size={18} />
                    </div>
                    <p className={`mt-6 text-4xl font-semibold tracking-[-0.05em] ${department.tone}`}>{department.count}</p>
                    <h3 className="mt-2 text-lg font-semibold text-[#332020]">{department.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      {department.label}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="browse" className="bg-[var(--bg-primary)] px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="section-kicker">Browse</p>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-copy mx-auto max-w-2xl">
                Explore thesis documents from the Computer Studies Department organized by research focus area.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <article
                    key={category.title}
                    className="flex items-start gap-4 rounded-[20px] border border-[color:rgba(139,35,50,0.06)] bg-white/85 px-5 py-5 shadow-[0_10px_24px_rgba(76,44,36,0.04)] transition duration-300 hover:border-[rgba(139,35,50,0.14)] hover:shadow-[0_16px_35px_rgba(76,44,36,0.08)]"
                  >
                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.tone}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#332020] md:text-base">{category.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-tertiary)]">{category.count}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-primary)] px-5 pb-0 pt-8 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-t-[40px] bg-[linear-gradient(135deg,#8b2332_0%,#7a1e2a_55%,#6b1825_100%)] px-6 py-16 text-center text-white shadow-[0_30px_70px_rgba(107,24,37,0.28)] md:px-10 md:py-20">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
                <HeartHandshake size={24} />
              </div>
              <h2 className="text-4xl font-semibold leading-tight md:text-5xl">Ready to Access Our Thesis Collection?</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/78 md:text-base">
                Join our academic community and start exploring thousands of research documents today.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {accessRoles.map((role) => (
                  <button
                    key={role.label}
                    type="button"
                    onClick={() => navigate(role.path)}
                    className={
                      role.primary
                        ? 'rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[var(--maroon)] shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition hover:bg-[#f9f0ef]'
                        : 'rounded-xl border border-white/18 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12'
                    }
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:rgba(139,35,50,0.05)] bg-[#efe4d6] px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--maroon)] text-white">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#341f1f]">Thesis Archive</p>
              <p className="text-xs text-[var(--text-tertiary)]">Computer Studies Department</p>
            </div>
          </div>

          <div className="text-left text-sm text-[var(--text-secondary)] md:text-center">
            <p className="font-medium text-[#5c3f40]">Technological University of the Philippines - Manila</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">San Marcelino St, Ayala Blvd, Ermita, Manila, 1000</p>
          </div>

          <p className="text-xs text-[var(--text-tertiary)]">
            © 2026 Thesis Archive Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
