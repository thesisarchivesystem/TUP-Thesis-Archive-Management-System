import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Clock3, FileClock, FilePlus2, FileText, GraduationCap, Home, LogOut, Menu, MessageSquare, Moon, Search, Settings, Shapes, Sun, Upload, User, Users } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/vpaa-shell.css';

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
          <button type="button" className="vpaa-nav-item">
            <FilePlus2 size={20} />
            <span>Manage Thesis</span>
            <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
          </button>

          <span className="vpaa-nav-section-label">Activity</span>
          <button type="button" className="vpaa-nav-item">
            <FileClock size={20} />
            <span>Activity Log</span>
          </button>
          <NavLink className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to="/faculty/students"><Users size={20} /><span>My Advisees</span></NavLink>
        </nav>

        <div className="vpaa-sidebar-footer">
          <Link to="/faculty/dashboard">About</Link>
          <Link to="/faculty/support">Support</Link>
          <Link to="/faculty/dashboard">Terms & Conditions</Link>
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

            <button type="button" className="vpaa-topbar-icon-btn" aria-label="Messages">
              <MessageSquare size={18} />
            </button>
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
                <span className="vpaa-user-avatar">{initials}</span>
                <span className="vpaa-user-info">
                  <strong className="vpaa-user-name">{user?.name || 'Faculty User'}</strong>
                  <span className="vpaa-user-role">Faculty</span>
                </span>
              </button>

              <div className={`vpaa-dropdown-panel vpaa-profile-panel ${profileOpen ? 'open' : ''}`}>
                <div className="vpaa-profile-card">
                  <span className="vpaa-user-avatar small">{initials}</span>
                  <div className="vpaa-user-info">
                    <strong className="vpaa-user-name">{user?.name || 'Faculty User'}</strong>
                    <span className="vpaa-user-role">{user?.email || 'Faculty account'}</span>
                  </div>
                </div>

                <div className="vpaa-profile-actions">
                  <Link className="vpaa-profile-action" to="/faculty/profilepage"><User size={16} /><span>Profile</span></Link>
                  <Link className="vpaa-profile-action" to="/faculty/settingspage"><Settings size={16} /><span>Settings</span></Link>
                  <button type="button" className="vpaa-profile-action signout" onClick={logout}><LogOut size={16} /><span>Sign Out</span></button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="vpaa-content">
          {!hidePageIntro ? (
            <div className="vpaa-page-intro">
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          ) : null}
          {children}
        </section>
      </main>
    </div>
  );
}
