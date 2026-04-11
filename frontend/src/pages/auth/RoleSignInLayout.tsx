import { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import tupBuilding from '../../assets/tup-building.gif';

type RoleLink = {
  label: string;
  to: string;
};

type RoleSignInLayoutProps = {
  pageTitle: string;
  heading: string;
  description: string;
  showcaseHeading: ReactNode;
  showcaseDescription: string;
  roleBadgeText: string;
  roleBadgeIcon: ReactNode;
  showcaseStats: Array<{ value: string; label: string }>;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierAutoComplete?: string;
  roleSwitchLinks: RoleLink[];
  forgotPasswordTo?: string;
  footerLabel?: string;
  accent: {
    successBgLight: string;
    successTextLight: string;
    successBgDark: string;
    successTextDark: string;
  };
  error?: string;
  isLoading?: boolean;
  onSubmit: (values: { identifier: string; password: string }) => Promise<void> | void;
};

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

function AuthStyles() {
  return (
    <style>{`
      .role-signin-shell {
        --maroon: #8b2332;
        --maroon-dark: #6e1c28;
        --gold: #c9963a;
        --sky: #4a8fb5;
        --transition-speed: 0.35s;
        min-height: 100vh;
        display: flex;
        font-family: 'Plus Jakarta Sans', sans-serif;
        -webkit-font-smoothing: antialiased;
        background: var(--bg-primary);
        color: var(--text-primary);
        transition: background var(--transition-speed) ease, color var(--transition-speed) ease;
      }

      .role-signin-shell[data-theme='light'] {
        --bg-primary: #f7f2ec;
        --bg-secondary: #f0e8de;
        --bg-tertiary: #e8ddd0;
        --bg-card: #fbf8f4;
        --bg-card-hover: #fffdf9;
        --text-primary: #2e1a1a;
        --text-secondary: #5c4444;
        --text-tertiary: #8f7a7a;
        --border: rgba(139, 35, 50, 0.1);
        --border-hover: rgba(139, 35, 50, 0.2);
        --input-bg: #ffffff;
        --input-border: rgba(139, 35, 50, 0.15);
        --input-focus: rgba(139, 35, 50, 0.3);
        --input-placeholder: #b8a0a4;
        --shadow-sm: 0 1px 4px rgba(60, 30, 30, 0.06);
        --shadow-xl: 0 24px 60px rgba(60, 30, 30, 0.14);
        --panel-bg: rgba(251, 248, 244, 0.92);
        --gif-overlay-start: rgba(240, 232, 222, 0.1);
        --gif-overlay-end: rgba(247, 242, 236, 0.6);
        --gif-opacity: 0.5;
        --divider-text: #8f7a7a;
      }

      .role-signin-shell[data-theme='dark'] {
        --bg-primary: #1a1214;
        --bg-secondary: #221920;
        --bg-tertiary: #2c2028;
        --bg-card: #261c22;
        --bg-card-hover: #2e2229;
        --text-primary: #f0e4e6;
        --text-secondary: #b8a0a4;
        --text-tertiary: #7a6468;
        --border: rgba(200, 160, 170, 0.1);
        --border-hover: rgba(200, 160, 170, 0.18);
        --input-bg: #2c2028;
        --input-border: rgba(200, 160, 170, 0.12);
        --input-focus: rgba(184, 58, 78, 0.3);
        --input-placeholder: #5e4a50;
        --shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.2);
        --shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.4);
        --panel-bg: rgba(38, 28, 34, 0.92);
        --gif-overlay-start: rgba(26, 18, 20, 0.2);
        --gif-overlay-end: rgba(26, 18, 20, 0.7);
        --gif-opacity: 0.25;
        --divider-text: #5e4a50;
        --maroon: #b83a4e;
        --maroon-dark: #9b2e40;
        --gold: #daba5e;
        --sky: #7bb8d4;
      }

      .role-signin-shell * { box-sizing: border-box; }
      .role-signin-shell button, .role-signin-shell input { font: inherit; }

      .auth-showcase {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        padding: 48px;
        min-height: 100vh;
      }

      .auth-showcase-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        opacity: var(--gif-opacity);
        transition: opacity var(--transition-speed) ease;
      }

      .auth-showcase-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, var(--gif-overlay-start) 0%, var(--gif-overlay-end) 100%);
        transition: background var(--transition-speed) ease;
      }

      .auth-showcase-content {
        position: relative;
        z-index: 2;
        max-width: 480px;
      }

      .auth-showcase-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(139, 35, 50, 0.15);
        border: 1px solid rgba(139, 35, 50, 0.2);
        color: var(--maroon);
        font-size: 11px;
        font-weight: 700;
        padding: 5px 14px;
        border-radius: 100px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 20px;
        backdrop-filter: blur(8px);
      }

      .auth-showcase-badge-dot {
        width: 5px;
        height: 5px;
        background: var(--maroon);
        border-radius: 50%;
      }

      .auth-showcase-content h2,
      .auth-logo-text,
      .auth-header h1,
      .auth-showcase-number {
        font-family: 'DM Serif Display', serif;
      }

      .auth-showcase-content h2 {
        font-size: 36px;
        color: var(--text-primary);
        line-height: 1.15;
        margin: 0 0 12px;
        font-weight: 700;
      }

      .auth-showcase-content em { font-style: italic; color: var(--maroon); }

      .auth-showcase-content p {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.65;
        margin: 0 0 28px;
      }

      .auth-showcase-stats {
        display: flex;
        gap: 32px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
      }

      .auth-showcase-number {
        font-size: 26px;
        color: var(--text-primary);
        line-height: 1;
        margin-bottom: 3px;
      }

      .auth-showcase-number span { color: var(--maroon); }

      .auth-showcase-label {
        font-size: 11px;
        color: var(--text-tertiary);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .auth-panel {
        width: 520px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 48px 56px;
        background: var(--panel-bg);
        backdrop-filter: blur(30px);
        border-left: 1px solid var(--border);
        position: relative;
      }

      .auth-theme-toggle {
        position: absolute;
        top: 28px;
        right: 28px;
        width: 40px;
        height: 40px;
        border: 1.5px solid var(--border-hover);
        border-radius: 10px;
        background: var(--bg-card);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .auth-theme-toggle:hover {
        border-color: var(--maroon);
        background: var(--bg-card-hover);
        transform: scale(1.05);
      }

      .auth-theme-toggle .sun-icon { color: var(--gold); }
      .auth-theme-toggle .moon-icon { color: var(--sky); }
      .role-signin-shell[data-theme='light'] .auth-theme-toggle .moon-icon { display: none; }
      .role-signin-shell[data-theme='dark'] .auth-theme-toggle .sun-icon { display: none; }

      .auth-back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--text-tertiary);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 36px;
        transition: color 0.25s ease;
      }

      .auth-back-link:hover { color: var(--maroon); }
      .auth-back-link svg { width: 16px; height: 16px; }

      .auth-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .auth-logo-icon {
        width: 42px;
        height: 42px;
        background: var(--maroon);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .auth-logo-icon svg { width: 22px; height: 22px; fill: white; }
      .auth-logo-text { font-size: 18px; color: var(--text-primary); }
      .auth-logo-text span { color: var(--maroon); }

      .auth-header { margin-bottom: 32px; }
      .auth-header h1 {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 20px 0 8px;
      }

      .auth-header p {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
      }

      .auth-role-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--success-bg);
        color: var(--success-text);
        font-size: 12px;
        font-weight: 700;
        padding: 5px 14px;
        border-radius: 100px;
        letter-spacing: 0.05em;
        margin-top: 12px;
      }

      .auth-role-badge svg,
      .auth-input-icon svg {
        width: 14px;
        height: 14px;
        display: block;
        flex: 0 0 14px;
        stroke-width: 2;
      }

      .auth-error {
        margin-bottom: 18px;
        border-radius: 12px;
        border: 1px solid var(--maroon);
        background: rgba(184, 58, 78, 0.1);
        color: var(--maroon);
        padding: 12px 14px;
        font-size: 13px;
      }

      .auth-form { display: flex; flex-direction: column; gap: 20px; }
      .auth-form-group { display: flex; flex-direction: column; gap: 7px; }
      .auth-form-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.02em;
      }

      .auth-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .auth-input-icon {
        position: absolute;
        left: 14px;
        width: 14px;
        height: 14px;
        color: var(--text-tertiary);
        pointer-events: none;
        transition: color 0.25s ease;
      }

      .auth-input {
        width: 100%;
        padding: 13px 14px 13px 42px;
        background: var(--input-bg);
        border: 1.5px solid var(--input-border);
        border-radius: 12px;
        font-size: 14px;
        color: var(--text-primary);
        outline: none;
        transition: all 0.25s ease;
      }

      .auth-input::placeholder { color: var(--input-placeholder); }

      .auth-input:focus {
        border-color: var(--maroon);
        box-shadow: 0 0 0 3px var(--input-focus);
      }

      .auth-input-wrapper:focus-within .auth-input-icon { color: var(--maroon); }

      .auth-password-toggle {
        position: absolute;
        right: 14px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-tertiary);
        transition: color 0.25s ease;
        display: flex;
      }

      .auth-password-toggle:hover { color: var(--maroon); }
      .auth-password-toggle svg { width: 18px; height: 18px; }

      .auth-form-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .auth-checkbox-group {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .auth-checkbox-group input[type='checkbox'] {
        width: 16px;
        height: 16px;
        accent-color: var(--maroon);
        cursor: pointer;
      }

      .auth-checkbox-group label {
        font-size: 13px;
        color: var(--text-secondary);
        cursor: pointer;
      }

      .auth-forgot-link {
        font-size: 13px;
        color: var(--maroon);
        text-decoration: none;
        font-weight: 600;
        transition: color 0.25s ease;
      }

      .auth-forgot-link:hover {
        color: var(--maroon-dark);
        text-decoration: underline;
      }

      .auth-submit {
        width: 100%;
        padding: 14px;
        background: var(--maroon);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(139, 35, 50, 0.25);
        margin-top: 4px;
      }

      .auth-submit:hover:not(:disabled) {
        background: var(--maroon-dark);
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(139, 35, 50, 0.3);
      }

      .auth-submit:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .auth-submit svg { width: 18px; height: 18px; }

      .auth-divider {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 4px 0;
      }

      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
      }

      .auth-divider span {
        font-size: 12px;
        color: var(--divider-text);
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .auth-role-switch {
        text-align: center;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .auth-role-switch a {
        color: var(--maroon);
        text-decoration: none;
        font-weight: 700;
      }

      .auth-role-switch a:hover { text-decoration: underline; }

      .auth-footer {
        margin-top: 36px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
        text-align: center;
      }

      .auth-footer p {
        margin: 0;
        font-size: 11px;
        color: var(--text-tertiary);
      }

      .auth-footer a {
        color: var(--maroon);
        text-decoration: none;
      }

      .auth-footer a:hover { text-decoration: underline; }

      @media (max-width: 1024px) {
        .auth-showcase { display: none; }
        .auth-panel {
          width: 100%;
          max-width: 100%;
          padding: 40px 32px;
        }
      }

      @media (max-width: 480px) {
        .auth-panel { padding: 32px 24px; }
        .auth-header h1 { font-size: 24px; }
        .auth-showcase-stats { gap: 20px; }
      }
    `}</style>
  );
}

export default function RoleSignInLayout({
  pageTitle,
  heading,
  description,
  showcaseHeading,
  showcaseDescription,
  roleBadgeText,
  roleBadgeIcon,
  showcaseStats,
  identifierLabel,
  identifierPlaceholder,
  identifierAutoComplete = 'username',
  roleSwitchLinks,
  forgotPasswordTo = '/forgot-password',
  footerLabel = 'TUP Manila',
  accent,
  error,
  isLoading,
  onSubmit,
}: RoleSignInLayoutProps) {
  const { theme, toggle } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const rootStyle = useMemo(
    () =>
      ({
        ['--success-bg' as string]: theme === 'dark' ? accent.successBgDark : accent.successBgLight,
        ['--success-text' as string]: theme === 'dark' ? accent.successTextDark : accent.successTextLight,
      }) as CSSProperties,
    [accent.successBgDark, accent.successBgLight, accent.successTextDark, accent.successTextLight, theme]
  );

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <div className="role-signin-shell" data-theme={theme} style={rootStyle}>
      <AuthStyles />

      <div className="auth-showcase">
        <div className="auth-showcase-bg" style={{ backgroundImage: `url(${tupBuilding})` }} />
        <div className="auth-showcase-overlay" />
        <div className="auth-showcase-content">
          <div className="auth-showcase-badge">
            <span className="auth-showcase-badge-dot" />
            Computer Studies Department
          </div>
          <h2>{showcaseHeading}</h2>
          <p>{showcaseDescription}</p>
          <div className="auth-showcase-stats">
            {showcaseStats.map((stat) => (
              <div key={stat.label}>
                <div className="auth-showcase-number">
                  {stat.value.replace('+', '')}
                  {stat.value.includes('+') ? <span>+</span> : null}
                </div>
                <div className="auth-showcase-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <button className="auth-theme-toggle" type="button" aria-label="Toggle theme" onClick={toggle}>
          <SunMedium className="sun-icon" size={18} />
          <MoonStar className="moon-icon" size={18} />
        </button>

        <Link to="/" className="auth-back-link">
          <BackIcon />
          Back to Home
        </Link>

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <LogoIcon />
          </div>
          <div className="auth-logo-text">
            Thesis <span>Archive</span>
          </div>
        </div>

        <div className="auth-header">
          <h1>{heading}</h1>
          <p>{description}</p>
          <div className="auth-role-badge">
            {roleBadgeIcon}
            {roleBadgeText}
          </div>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit({ identifier, password });
          }}
        >
          <div className="auth-form-group">
            <label className="auth-form-label">{identifierLabel}</label>
            <div className="auth-input-wrapper">
              <input
                className="auth-input"
                type="text"
                placeholder={identifierPlaceholder}
                autoComplete={identifierAutoComplete}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
              <div className="auth-input-icon">{roleBadgeIcon}</div>
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="auth-input-icon">
                <LockIcon />
              </div>
              <button
                type="button"
                className="auth-password-toggle"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-checkbox-group">
              <input id={`${heading}-remember`} type="checkbox" checked={remember} onChange={() => setRemember((current) => !current)} />
              <label htmlFor={`${heading}-remember`}>Remember me</label>
            </div>
            <Link to={forgotPasswordTo} className="auth-forgot-link">
              Forgot password?
            </Link>
          </div>

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
            <ArrowRightIcon />
          </button>

          <div className="auth-divider">
            <span>or sign in as</span>
          </div>

          <div className="auth-role-switch">
            {roleSwitchLinks.length > 0 ? (
              <>
                {`Not `}
                {heading.toLowerCase().includes('student')
                  ? 'a student'
                  : heading.toLowerCase().includes('faculty')
                    ? 'a faculty member'
                    : 'an administrator'}
                ?{' '}
                {roleSwitchLinks.map((link, index) => (
                  <span key={link.to}>
                    {index > 0 ? ' or ' : 'Sign in as '}
                    <Link to={link.to}>{link.label}</Link>
                  </span>
                ))}
              </>
            ) : null}
          </div>
        </form>

        <div className="auth-footer">
          <p>
            &copy; 2026 Thesis Archive Management System &middot; <a href="#">{footerLabel}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
