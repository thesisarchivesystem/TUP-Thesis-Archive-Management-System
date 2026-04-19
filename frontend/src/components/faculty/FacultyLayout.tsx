import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, ChevronRight, Clock3, FileClock, FilePlus2, FileText, GraduationCap, Home, LogOut, Menu, MessageSquare, Moon, Search, Settings, Shapes, Sun, Upload, User, Users } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/vpaa-shell.css';

type ChatMessage = {
  id: string;
  type: 'bot' | 'user';
  text: string;
};

function BotFabIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        className="bot-fill"
        d="M24 10a8 8 0 0 1 16 0v2h6.4a9.6 9.6 0 0 1 9.6 9.6V40a9.6 9.6 0 0 1-9.6 9.6H38l-6 7.2L26 49.6h-8.4A9.6 9.6 0 0 1 8 40V21.6A9.6 9.6 0 0 1 17.6 12H24zm0 8h16v-8a8 8 0 1 0-16 0z"
      />
      <circle className="bot-cut" cx="24" cy="31" r="4.4" />
      <circle className="bot-cut" cx="40" cy="31" r="4.4" />
      <path
        className="bot-cut"
        d="M22.5 40.5c2.4 2 5.7 3.2 9.5 3.2s7.1-1.2 9.5-3.2c.9-.8 1-2.1.3-3.1-.8-.9-2.1-1-3.1-.3-1.6 1.3-3.9 2.1-6.7 2.1s-5.1-.8-6.7-2.1c-.9-.7-2.3-.6-3.1.3-.7 1-.6 2.3.3 3.1Z"
      />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 8C14.6 8 7 15.6 7 25v6c0 3.3 2.7 6 6 6h3.5c1.4 0 2.5-1.1 2.5-2.5v-8c0-1.4-1.1-2.5-2.5-2.5H11c.4-7.1 6.3-12.8 13-12.8S36.6 16.9 37 24h-5.5c-1.4 0-2.5 1.1-2.5 2.5v8c0 1.4 1.1 2.5 2.5 2.5H35c.7 0 1.4-.1 2-.4V38a4 4 0 0 1-4 4h-4.7a3.3 3.3 0 0 0-6.3 1.4 3.4 3.4 0 0 0 3.4 3.4h7.6A7 7 0 0 0 40 38v-13C40 15.6 32.4 8 24 8Z"
      />
    </svg>
  );
}

const prompts = ['How do I review submissions?', 'Where can I manage theses?', 'How do I contact support?'];

const buildReply = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('review') || normalized.includes('submission')) {
    return 'Open Review Submissions to check pending work, provide feedback, and track student revisions.';
  }
  if (normalized.includes('manage') || normalized.includes('thesis') || normalized.includes('approved')) {
    return 'The Manage Thesis section lets you add new records, review submissions, and browse approved theses.';
  }
  if (normalized.includes('support') || normalized.includes('contact') || normalized.includes('help')) {
    return 'Use the Support page for quick contacts, FAQs, and ticket requests related to archive workflows.';
  }
  return 'I can help with faculty submission review, thesis management, and archive support guidance.';
};

type Props = {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  hidePageIntro?: boolean;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}-${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][date.getMonth()]}-${date.getFullYear()}`;

export default function FacultyLayout({ title, description, children, hidePageIntro = false }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [manageThesisOpen, setManageThesisOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'bot-1', type: 'bot', text: 'Hi! I can help with thesis review, faculty workflows, and archive support questions.' },
    { id: 'bot-2', type: 'bot', text: 'Try one of the quick prompts below.' },
  ]);
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(formatTime(now));
      setCurrentDate(formatDate(now));
    };

    tick();
    const interval = window.setInterval(tick, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setChatOpen(false);
        if (window.innerWidth <= 1024) setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setManageThesisOpen(location.pathname.startsWith('/faculty/manage-thesis'));
  }, [location.pathname]);

  const isManageThesisRoute = location.pathname.startsWith('/faculty/manage-thesis');

  const initials = useMemo(() => {
    if (!user?.name) return 'FA';

    return user.name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user?.name]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  };

  const handleChatSubmit = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setChatMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, type: 'user', text: trimmed },
      { id: `bot-${Date.now() + 1}`, type: 'bot', text: buildReply(trimmed) },
    ]);
    setChatInput('');
    setChatOpen(true);
  };

  return (
    <div
      className={[
        'vpaa-app-shell',
        theme === 'dark' ? 'theme-dark' : 'theme-light',
        sidebarCollapsed ? 'sidebar-collapsed' : '',
        sidebarOpen ? 'sidebar-open' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => setProfileOpen(false)}
    >
      <div className="vpaa-sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      <aside className="vpaa-sidebar" onClick={(event) => event.stopPropagation()}>
        <Link className="vpaa-sidebar-brand" to="/faculty/dashboard">
          <span className="vpaa-sidebar-logo"><GraduationCap size={18} /></span>
          <span className="vpaa-sidebar-brand-text">Thesis <span>Archive</span></span>
        </Link>

        <nav className="vpaa-sidebar-nav">
          <span className="vpaa-nav-section-label">Main</span>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/faculty/dashboard"><Home size={20} /><span>Home</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/faculty/categories"><Shapes size={20} /><span>Categories</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/faculty/students"><Upload size={20} /><span>Add Files</span></NavLink>
          <div className={`vpaa-nav-group${manageThesisOpen ? ' open' : ''}`}>
            <button
              type="button"
              className={`vpaa-nav-item vpaa-nav-group-toggle${manageThesisOpen && !isManageThesisRoute ? ' active' : ''}`}
              onClick={() => setManageThesisOpen((current) => !current)}
              aria-expanded={manageThesisOpen}
              aria-controls="faculty-manage-thesis-submenu"
            >
              <FilePlus2 size={20} />
              <span>Manage Thesis</span>
              <ChevronDown className="vpaa-nav-group-arrow" size={16} />
            </button>

            <div
              id="faculty-manage-thesis-submenu"
              className={`vpaa-nav-submenu${manageThesisOpen ? ' open' : ''}`}
            >
              <NavLink className={({ isActive }) => `vpaa-nav-subitem${isActive ? ' active' : ''}`} to="/faculty/manage-thesis/add">Add Thesis</NavLink>
              <NavLink className={({ isActive }) => `vpaa-nav-subitem${isActive ? ' active' : ''}`} to="/faculty/manage-thesis/approved">Approved Theses</NavLink>
              <NavLink className={({ isActive }) => `vpaa-nav-subitem${isActive ? ' active' : ''}`} to="/faculty/manage-thesis/review">Review Submissions</NavLink>
            </div>
          </div>

          <span className="vpaa-nav-section-label">Activity</span>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/faculty/activity-log"><FileClock size={20} /><span>Activity Log</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/faculty/my-advisees"><Users size={20} /><span>My Advisees</span></NavLink>
        </nav>

        <div className="vpaa-sidebar-footer">
          <NavLink to="/faculty/about">About</NavLink>
          <NavLink to="/faculty/support">Support</NavLink>
          <NavLink to="/faculty/terms">Terms & Conditions</NavLink>
        </div>
      </aside>

      <main className="vpaa-main">
        <header className="vpaa-topbar" onClick={(event) => event.stopPropagation()}>
          <div className="vpaa-topbar-left">
            <button type="button" className="vpaa-hamburger-btn" onClick={toggleSidebar} aria-label="Toggle navigation menu">
              <Menu size={18} />
            </button>
            <div className="vpaa-search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search the thesis archive, categories, or records..." />
            </div>
          </div>

          <div className="vpaa-topbar-right">
            <div className="vpaa-topbar-info">
              <span className="vpaa-topbar-info-item"><Clock3 size={15} /><span>{currentTime}</span></span>
              <span className="vpaa-topbar-info-item"><FileText size={15} /><span>{currentDate}</span></span>
            </div>

            <Link to="/faculty/messages" className="vpaa-topbar-icon-btn" aria-label="Messages">
              <MessageSquare size={18} />
            </Link>
            <button type="button" className="vpaa-topbar-icon-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="vpaa-notif-dot" />
            </button>
            <button type="button" className="vpaa-topbar-icon-btn" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="vpaa-topbar-dropdown">
              <button
                type="button"
                className="vpaa-user-profile"
                onClick={(event) => {
                  event.stopPropagation();
                  setProfileOpen((current) => !current);
                }}
              >
                <span className="vpaa-user-avatar avatar-tone-faculty">{initials}</span>
                <span className="vpaa-user-info">
                  <strong className="vpaa-user-name">{user?.name || 'Faculty User'}</strong>
                  <span className="vpaa-user-role">Faculty</span>
                </span>
              </button>

              <div className={`vpaa-dropdown-panel vpaa-profile-panel ${profileOpen ? 'open' : ''}`}>
                <div className="vpaa-profile-card">
                  <span className="vpaa-user-avatar avatar-tone-faculty small">{initials}</span>
                  <div className="vpaa-user-info">
                    <strong className="vpaa-user-name">{user?.name || 'Faculty User'}</strong>
                    <span className="vpaa-user-role">{user?.email || 'Faculty account'}</span>
                  </div>
                </div>

                <div className="vpaa-profile-actions">
                  <Link className="vpaa-profile-action" to="/faculty/profile"><User size={16} /><span>Profile</span></Link>
                  <Link className="vpaa-profile-action" to="/faculty/settings"><Settings size={16} /><span>Settings</span></Link>
                  <button type="button" className="vpaa-profile-action signout" onClick={logout}><LogOut size={16} /><span>Sign Out</span></button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className={`vpaa-content${hidePageIntro ? ' vpaa-content-workspace' : ''}`}>
          {!hidePageIntro ? (
            <div className="vpaa-page-intro">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          ) : null}
          {children}
        </section>
      </main>

      <div className={`vpaa-ai-chatbot-panel ${chatOpen ? 'open' : ''}`} onClick={(event) => event.stopPropagation()}>
        <div className="vpaa-ai-chatbot-header">
          <div className="vpaa-ai-chatbot-title">
            <div className="vpaa-ai-chatbot-avatar"><HeadsetIcon /></div>
            <div><h3>Archive Assistant</h3><p>Ask about reviews, faculty workflows, and support.</p></div>
          </div>
          <button type="button" className="vpaa-ai-chatbot-close" onClick={() => setChatOpen(false)} aria-label="Close AI chatbot">&times;</button>
        </div>
        <div className="vpaa-ai-chatbot-body">
          <div className="vpaa-ai-chatbot-messages">
            {chatMessages.map((message) => (
              <div className={`vpaa-chat-bubble ${message.type === 'user' ? 'self' : 'other'}`} key={message.id}>{message.text}</div>
            ))}
          </div>
          <div className="vpaa-ai-chatbot-suggestions">
            {prompts.map((prompt) => (
              <button type="button" className="vpaa-chat-suggestion" key={prompt} onClick={() => handleChatSubmit(prompt)}>{prompt}</button>
            ))}
          </div>
          <form className="vpaa-ai-chatbot-form" onSubmit={(event) => {
            event.preventDefault();
            handleChatSubmit(chatInput);
          }}>
            <input className="vpaa-ai-chatbot-input" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Type your question..." />
            <button type="submit" className="vpaa-ai-chatbot-send" aria-label="Send message"><ChevronRight size={18} /></button>
          </form>
        </div>
      </div>

      <button type="button" className="vpaa-ai-chatbot-fab" aria-label="Open AI chatbot" onClick={(event) => {
        event.stopPropagation();
        setChatOpen((current) => !current);
      }}>
        <BotFabIcon />
      </button>
    </div>
  );
}
