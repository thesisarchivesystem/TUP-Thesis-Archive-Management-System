import { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpenText, Building2, CalendarDays, Clock3, FolderTree, LayoutDashboard, LogOut, Menu, MoonStar, Search, SunMedium, Users } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useBookThemeCssVariables } from '../../hooks/useBookThemeCssVariables';
import { adminService, type AdminDashboardResponse } from '../../services/adminService';
import BrandMarkIcon from '../BrandMarkIcon';
import BookColorThemePicker from '../BookColorThemePicker';
import '../../styles/vpaa-shell.css';

const mainNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/submissions', label: 'Thesis', icon: BookOpenText },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/structure', label: 'Academic', icon: Building2 },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
];

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}-${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][date.getMonth()]}-${date.getFullYear()}`;

export default function AdminLayout() {
  const { user, confirmAndLogout } = useAuth();
  const { theme, toggle } = useTheme();
  const bookThemeStyle = useBookThemeCssVariables(theme);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const [notificationItems, setNotificationItems] = useState<AdminDashboardResponse['recent_activity']>([]);

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
        setNotificationsOpen(false);
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

  const initials = useMemo(() => {
    if (!user?.name) return 'AD';

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

  useEffect(() => {
    if (!notificationsOpen) return;

    let active = true;

    void adminService.getDashboard({ recent_activity_limit: 4 })
      .then((data) => {
        if (!active) return;
        setNotificationItems(data.recent_activity);
      })
      .catch(() => {
        if (!active) return;
        setNotificationItems([]);
      });

    return () => {
      active = false;
    };
  }, [notificationsOpen]);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search') ?? '';
    setSearchValue(query);
  }, [location.search]);

  return (
    <div
      className={[
        'vpaa-app-shell',
        'admin-app-shell',
        theme === 'dark' ? 'theme-dark' : 'theme-light',
        sidebarCollapsed ? 'sidebar-collapsed' : '',
        sidebarOpen ? 'sidebar-open' : '',
      ].filter(Boolean).join(' ')}
      style={bookThemeStyle}
      onClick={() => {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }}
    >
      <div className="vpaa-sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      <aside className="vpaa-sidebar" onClick={(event) => event.stopPropagation()}>
        <Link className="vpaa-sidebar-brand" to="/admin/dashboard">
          <span className="vpaa-sidebar-logo"><BrandMarkIcon /></span>
          <span className="vpaa-sidebar-brand-text">Thesis <span>Archive</span></span>
        </Link>

        <nav className="vpaa-sidebar-nav">
          <span className="vpaa-nav-section-label">Main</span>
          {mainNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} className={({ isActive }) => `vpaa-nav-item${isActive ? ' active' : ''}`} to={to}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}

        </nav>

        <div className="vpaa-sidebar-footer">
          <NavLink to="/admin/dashboard">About</NavLink>
          <NavLink to="/admin/dashboard">Support</NavLink>
          <NavLink to="/admin/dashboard">Terms & Conditions</NavLink>
        </div>
      </aside>

      <main className="vpaa-main">
        <header className="vpaa-topbar" onClick={(event) => event.stopPropagation()}>
          <div className="vpaa-topbar-left">
            <button type="button" className="vpaa-hamburger-btn" onClick={toggleSidebar} aria-label="Toggle navigation menu">
              <Menu size={18} />
            </button>
            <form
              className="vpaa-search-bar admin-topbar-search"
              onSubmit={(event) => {
                event.preventDefault();

                const query = searchValue.trim();
                const params = new URLSearchParams(location.search);

                if (query) {
                  params.set('search', query);
                } else {
                  params.delete('search');
                }

                navigate({
                  pathname: '/admin/dashboard',
                  search: params.toString() ? `?${params.toString()}` : '',
                });
              }}
            >
              <Search size={18} />
              <input
                type="text"
                placeholder="Search theses, authors, departments, or records..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>
          </div>

          <div className="vpaa-topbar-right">
            <div className="vpaa-topbar-info">
              <span className="vpaa-topbar-info-item"><Clock3 size={15} /><span>{currentTime}</span></span>
              <span className="vpaa-topbar-info-item"><CalendarDays size={15} /><span>{currentDate}</span></span>
            </div>

            <div className="vpaa-topbar-dropdown">
              <button
                type="button"
                className="vpaa-topbar-icon-btn admin-topbar-alert"
                aria-label="Notifications"
                onClick={(event) => {
                  event.stopPropagation();
                  setProfileOpen(false);
                  setNotificationsOpen((current) => !current);
                }}
              >
                <Bell size={18} />
                <span className="vpaa-notif-dot" />
              </button>

              <div className={`vpaa-dropdown-panel admin-notification-panel ${notificationsOpen ? 'open' : ''}`}>
                <div className="admin-notification-head">
                  <strong>Recent activity</strong>
                  <button
                    type="button"
                    className="admin-view-all"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/admin/activity');
                    }}
                  >
                    View all
                  </button>
                </div>
                <div className="admin-notification-list">
                  {notificationItems.length > 0 ? notificationItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="admin-notification-item"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/admin/activity');
                      }}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.actor} · {item.relative_time || 'Recently'}</span>
                    </button>
                  )) : (
                    <p className="admin-notification-empty">No recent admin activity yet.</p>
                  )}
                </div>
              </div>
            </div>
            <button type="button" className="vpaa-topbar-icon-btn theme-toggle" onClick={toggle} aria-label="Toggle theme">
              <SunMedium className="sun-icon" size={18} />
              <MoonStar className="moon-icon" size={18} />
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
                <span className="vpaa-user-avatar avatar-tone-admin">{initials}</span>
                <span className="vpaa-user-info">
                  <strong className="vpaa-user-name">{user?.name || 'System Admin'}</strong>
                  <span className="vpaa-user-role">System Admin</span>
                </span>
              </button>

              <div className={`vpaa-dropdown-panel vpaa-profile-panel ${profileOpen ? 'open' : ''}`}>
                <div className="vpaa-profile-actions">
                  <button type="button" className="vpaa-profile-action signout" onClick={confirmAndLogout}><LogOut size={16} /><span>Sign Out</span></button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="vpaa-content vpaa-content-workspace">
          <div className="vpaa-page-toolbar vpaa-page-toolbar-only admin-page-toolbar">
            <BookColorThemePicker />
          </div>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
