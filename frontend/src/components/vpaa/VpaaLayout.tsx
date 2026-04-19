import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Clock3, FileClock, FileText, GraduationCap, Home, LogOut, Menu, MessageSquare, Moon, Search, Settings, Shapes, Sun, User } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { vpaaDashboardService, type ActivityLogEntry } from '../../services/vpaaDashboardService';
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

const prompts = ['Show thesis categories', 'Where do students sign in?', 'Browse departments'];

const buildReply = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('student') || normalized.includes('sign in') || normalized.includes('login')) {
    return 'Faculty-created student accounts can sign in from the student portal and access their thesis workspace.';
  }
  if (normalized.includes('category') || normalized.includes('browse')) {
    return 'Categories highlight AI and ML, mobile systems, cybersecurity, data science, and archive-wide topic collections.';
  }
  if (normalized.includes('department')) {
    return 'The archive currently centers Computer Studies records, with oversight tools for faculty and VPAA reviewers.';
  }
  return 'I can help with categories, messages, faculty oversight, and where users should sign in.';
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}-${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][date.getMonth()]}-${date.getFullYear()}`;

const formatRelativeTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

type Props = {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  hidePageIntro?: boolean;
};

export default function VpaaLayout({ title, description, children, hidePageIntro = false }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'bot-1', type: 'bot', text: 'Hi! I can help you find thesis collections, browse categories, or guide you to the right sign-in page.' },
    { id: 'bot-2', type: 'bot', text: 'Try one of the quick prompts below.' },
  ]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));

  useEffect(() => {
    void vpaaDashboardService.getActivityLog()
      .then((response) => setActivityLog(
        response.logs.map((entry) => ({
          id: entry.id,
          userId: '',
          action: entry.badge,
          description: entry.request_record,
          timestamp: entry.timestamp,
          user: entry.account ? { name: entry.account } : undefined,
        })),
      ))
      .catch(() => setActivityLog([]));
  }, []);

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
        setNotifOpen(false);
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
    setNotifOpen(false);
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const notifications = useMemo(
    () =>
      activityLog.slice(0, 3).map((entry) => ({
        id: entry.id,
        title: entry.action,
        body: entry.description,
        time: formatRelativeTimestamp(entry.timestamp),
      })),
    [activityLog],
  );

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'VP';

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
      onClick={() => {
        setNotifOpen(false);
        setProfileOpen(false);
      }}
    >
      <div className="vpaa-sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      <aside className="vpaa-sidebar" onClick={(event) => event.stopPropagation()}>
        <Link className="vpaa-sidebar-brand" to="/vpaa/dashboard">
          <span className="vpaa-sidebar-logo"><GraduationCap size={18} /></span>
          <span className="vpaa-sidebar-brand-text">Thesis <span>Archive</span></span>
        </Link>

        <nav className="vpaa-sidebar-nav">
          <span className="vpaa-nav-section-label">Main</span>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/vpaa/dashboard"><Home size={20} /><span>Home</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/vpaa/categories"><Shapes size={20} /><span>Categories</span></NavLink>

          <span className="vpaa-nav-section-label">Activity</span>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/vpaa/activity-log"><FileClock size={20} /><span>Activity Log</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/vpaa/my-advisees"><User size={20} /><span>My Advisees</span></NavLink>
        </nav>

        <div className="vpaa-sidebar-footer">
          <NavLink to="/vpaa/about">About</NavLink>
          <NavLink to="/vpaa/support">Support</NavLink>
          <NavLink to="/vpaa/terms">Terms & Conditions</NavLink>
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
            <Link to="/vpaa/messages" className="vpaa-topbar-icon-btn" aria-label="Messages"><MessageSquare size={18} /></Link>

            <div className="vpaa-topbar-dropdown">
              <button type="button" className="vpaa-topbar-icon-btn" onClick={(event) => {
                event.stopPropagation();
                setNotifOpen((current) => !current);
                setProfileOpen(false);
              }}>
                <Bell size={18} />
                {!!notifications.length && <span className="vpaa-notif-dot" />}
              </button>
              <div className={`vpaa-dropdown-panel ${notifOpen ? 'open' : ''}`}>
                <div className="vpaa-dropdown-header"><strong>Notifications</strong><Link to="/vpaa/activity-log">View all</Link></div>
                <div className="vpaa-dropdown-list">
                  {notifications.length ? notifications.map((item, index) => (
                    <div className="vpaa-dropdown-item" key={item.id}>
                      <div className={`vpaa-dropdown-icon ${index % 3 === 0 ? 'si-maroon' : index % 3 === 1 ? 'si-sage' : 'si-terracotta'}`}><Bell size={16} /></div>
                      <div className="vpaa-dropdown-text"><strong>{item.title}</strong><span>{item.body}</span><span>{item.time}</span></div>
                    </div>
                  )) : <div className="vpaa-dropdown-item">No notifications yet.</div>}
                </div>
              </div>
            </div>

            <button type="button" className="vpaa-topbar-icon-btn" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="vpaa-topbar-dropdown">
              <button type="button" className="vpaa-user-profile" onClick={(event) => {
                event.stopPropagation();
                setProfileOpen((current) => !current);
                setNotifOpen(false);
              }}>
                <span className="vpaa-user-avatar avatar-tone-vpaa">{initials}</span>
                <span className="vpaa-user-info"><strong className="vpaa-user-name">{user?.name || 'VPAA User'}</strong><span className="vpaa-user-role">VPAA</span></span>
              </button>
              <div className={`vpaa-dropdown-panel vpaa-profile-panel ${profileOpen ? 'open' : ''}`}>
                <div className="vpaa-profile-card">
                  <span className="vpaa-user-avatar avatar-tone-vpaa small">{initials}</span>
                  <div className="vpaa-user-info"><strong className="vpaa-user-name">{user?.name || 'VPAA User'}</strong><span className="vpaa-user-role">{user?.email || 'Vice President for Academic Affairs'}</span></div>
                </div>
                <div className="vpaa-profile-actions">
                  <Link className="vpaa-profile-action" to="/vpaa/profile"><User size={16} /><span>My Profile</span></Link>
                  <Link className="vpaa-profile-action" to="/vpaa/settings"><Settings size={16} /><span>Settings</span></Link>
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
            <div><h3>Archive Assistant</h3><p>Ask about theses, departments, and access.</p></div>
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
