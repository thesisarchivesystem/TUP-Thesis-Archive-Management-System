import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MoonStar,
  Search,
  Settings,
  Shapes,
  SunMedium,
  Upload,
  User,
  FolderOpen,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNotificationChannel } from '../../hooks/useNotificationChannel';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';
import type { AppNotification } from '../../types/notification.types';
import { getNotificationNavigationTarget } from '../../utils/notificationNavigation';
import '../../styles/vpaa-shell.css';
import tamsBot from '../../assets/tams-bot.png';

type ChatMessage = {
  id: string;
  type: 'bot' | 'user';
  text: string;
};

const prompts = ['How do I upload my thesis?', 'Where can I check my submissions?', 'How do I find thesis categories?'];

const buildReply = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('upload') || normalized.includes('submit')) {
    return 'Use the Upload Thesis page to send your manuscript, then monitor review progress from My Submissions.';
  }
  if (normalized.includes('submission') || normalized.includes('status')) {
    return 'Open My Submissions to review your uploaded files, approval status, and recent updates from advisers.';
  }
  if (normalized.includes('categor') || normalized.includes('find') || normalized.includes('search')) {
    return 'The Categories page helps you browse thesis collections by topic so you can find related studies faster.';
  }
  return 'I can help with uploads, submissions, categories, and general archive guidance for students.';
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

export default function StudentLayout({ title, description, children, hidePageIntro = false }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'bot-1', type: 'bot', text: 'Hi! I can help with thesis uploads, archive browsing, and student support questions.' },
    { id: 'bot-2', type: 'bot', text: 'Try one of the quick prompts below.' },
  ]);
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  useNotificationChannel(user?.id ?? null);

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

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) return;

    void notificationService.list()
      .then((response) => {
        setNotifications((response?.data ?? []) as AppNotification[]);
      })
      .catch(() => {
        setNotifications([]);
      });
  }, [setNotifications, user?.id]);

  const initials = useMemo(() => {
    if (!user?.name) return 'ST';

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

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read_at) {
      markRead(notification.id);
      try {
        await notificationService.markRead(notification.id);
      } catch {
        // Keep optimistic UI behavior for now.
      }
    }

    setNotifOpen(false);

    const target = getNotificationNavigationTarget('student', notification);
    if (target) {
      navigate(target.path, { state: target.state });
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllRead();
      clearNotifications();
    } catch {
      // Keep optimistic UI behavior for now.
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    navigate(`/student/search?q=${encodeURIComponent(trimmed)}`);
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
        <Link className="vpaa-sidebar-brand" to="/student/dashboard">
          <span className="vpaa-sidebar-logo"><GraduationCap size={24} /></span>
          <span className="vpaa-sidebar-brand-text">Thesis <span>Archive</span></span>
        </Link>

        <nav className="vpaa-sidebar-nav">
          <span className="vpaa-nav-section-label">Main</span>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/student/dashboard"><Home size={20} /><span>Home</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/student/categories"><Shapes size={20} /><span>Categories</span></NavLink>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/student/upload-thesis"><Upload size={20} /><span>Upload Thesis</span></NavLink>

          <span className="vpaa-nav-section-label">Activity</span>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/student/my-submissions"><FolderOpen size={20} /><span>My Submissions</span></NavLink>
        </nav>

        <div className="vpaa-sidebar-footer">
          <NavLink to="/student/about">About</NavLink>
          <NavLink to="/student/support">Support</NavLink>
          <NavLink to="/student/terms">Terms & Conditions</NavLink>
        </div>
      </aside>

      <main className="vpaa-main">
        <header className="vpaa-topbar" onClick={(event) => event.stopPropagation()}>
          <div className="vpaa-topbar-left">
            <button type="button" className="vpaa-hamburger-btn" onClick={toggleSidebar} aria-label="Toggle navigation menu">
              <Menu size={18} />
            </button>
            <form className="vpaa-search-bar" onSubmit={handleSearchSubmit}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search the thesis archive, categories, or records..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </form>
          </div>

          <div className="vpaa-topbar-right">
            <div className="vpaa-topbar-info">
              <span className="vpaa-topbar-info-item"><Clock3 size={15} /><span>{currentTime}</span></span>
              <span className="vpaa-topbar-info-item"><CalendarDays size={15} /><span>{currentDate}</span></span>
            </div>

            <Link to="/student/messages" className="vpaa-topbar-icon-btn" aria-label="Messages">
              <MessageSquare size={18} />
            </Link>
            <div className="vpaa-topbar-dropdown">
              <button
                type="button"
                className="vpaa-topbar-icon-btn"
                aria-label="Notifications"
                onClick={(event) => {
                  event.stopPropagation();
                  setNotifOpen((current) => !current);
                  setProfileOpen(false);
                }}
              >
                <Bell size={18} />
                {!!unreadCount && <span className="vpaa-notif-dot" />}
              </button>
              <div className={`vpaa-dropdown-panel ${notifOpen ? 'open' : ''}`}>
                <div className="vpaa-dropdown-header">
                  <strong>Notifications</strong>
                  <button
                    type="button"
                    className="vpaa-chat-suggestion"
                    onClick={() => void handleMarkAllNotificationsRead()}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="vpaa-dropdown-list">
                  {notifications.length ? notifications.slice(0, 5).map((notification, index) => (
                    <button
                      type="button"
                      className="vpaa-dropdown-item"
                      key={notification.id}
                      onClick={() => void handleNotificationClick(notification)}
                    >
                      <div className={`vpaa-dropdown-icon ${index % 3 === 0 ? 'si-sage' : index % 3 === 1 ? 'si-maroon' : 'si-gold'}`}>
                        <Bell size={16} />
                      </div>
                      <div className="vpaa-dropdown-text">
                        <strong>{notification.title}</strong>
                        <span>{notification.body || 'You have a new thesis update.'}</span>
                        <span>{new Date(notification.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    </button>
                  )) : <div className="vpaa-dropdown-item vpaa-dropdown-item-empty">No notifications yet.</div>}
                </div>
              </div>
            </div>
            <button type="button" className="vpaa-topbar-icon-btn" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>

            <div className="vpaa-topbar-dropdown">
              <button
                type="button"
                className="vpaa-user-profile vpaa-user-profile-student"
                onClick={(event) => {
                  event.stopPropagation();
                  setProfileOpen((current) => !current);
                  setNotifOpen(false);
                }}
              >
                <span className="vpaa-user-avatar avatar-tone-student">{initials}</span>
                <span className="vpaa-user-info">
                  <strong className="vpaa-user-name">{user?.name || 'Student User'}</strong>
                  <span className="vpaa-user-role">Student</span>
                </span>
              </button>

              <div className={`vpaa-dropdown-panel vpaa-profile-panel ${profileOpen ? 'open' : ''}`}>
                <div className="vpaa-profile-actions">
                  <Link className="vpaa-profile-action" to="/student/profile"><User size={16} /><span>Profile</span></Link>
                  <Link className="vpaa-profile-action" to="/student/settings"><Settings size={16} /><span>Settings</span></Link>
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
            <div className="vpaa-ai-chatbot-avatar"><img src={tamsBot} alt="TAMS chatbot" /></div>
            <div><h3>Archive Assistant</h3><p>Ask about uploads, submissions, and archive access.</p></div>
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
        <img src={tamsBot} alt="TAMS chatbot" />
      </button>
    </div>
  );
}
