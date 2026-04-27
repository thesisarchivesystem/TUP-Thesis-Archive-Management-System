import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoonStar, SunMedium } from 'lucide-react';
import BrandMarkIcon from '../../components/BrandMarkIcon';
import { useTheme } from '../../hooks/useTheme';
import { authService } from '../../services/authService';
import tupBuilding from '../../assets/tup-building.gif';

function LogoIcon() {
  return <BrandMarkIcon />;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function ForgotPasswordStyles() {
  return (
    <style>{`
      .forgot-shell {
        --maroon: #8b2332;
        --maroon-dark: #6e1c28;
        --gold: #c9963a;
        --sky: #4a8fb5;
        --transition-speed: 0.35s;
        height: 100vh;
        display: flex;
        overflow: hidden;
        font-family: 'Plus Jakarta Sans', sans-serif;
        -webkit-font-smoothing: antialiased;
        background: var(--bg-primary);
        color: var(--text-primary);
        transition: background var(--transition-speed) ease, color var(--transition-speed) ease;
      }

      .forgot-shell[data-theme='light'] {
        --bg-primary: #f7f2ec;
        --bg-secondary: #f0e8de;
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
        --panel-bg: rgba(251, 248, 244, 0.92);
        --gif-overlay-start: rgba(240, 232, 222, 0.1);
        --gif-overlay-end: rgba(247, 242, 236, 0.6);
        --gif-opacity: 0.5;
        --note-bg: rgba(74, 143, 181, 0.08);
        --note-border: rgba(74, 143, 181, 0.15);
        --note-text: #355f77;
      }

      .forgot-shell[data-theme='dark'] {
        --bg-primary: #1a1214;
        --bg-secondary: #221920;
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
        --panel-bg: rgba(38, 28, 34, 0.92);
        --gif-overlay-start: rgba(26, 18, 20, 0.2);
        --gif-overlay-end: rgba(26, 18, 20, 0.7);
        --gif-opacity: 0.25;
        --maroon: #b83a4e;
        --maroon-dark: #9b2e40;
        --gold: #daba5e;
        --sky: #7bb8d4;
        --note-bg: rgba(123, 184, 212, 0.08);
        --note-border: rgba(123, 184, 212, 0.14);
        --note-text: #9cc9de;
      }

      .forgot-shell * { box-sizing: border-box; }
      .forgot-shell button, .forgot-shell input, .forgot-shell select { font: inherit; }

      .forgot-showcase {
        flex: 1;
        position: relative;
        overflow: hidden;
        height: 100vh;
        display: flex;
        align-items: flex-end;
        padding: clamp(24px, 2.5vw, 34px);
      }

      .forgot-showcase-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        opacity: var(--gif-opacity);
      }

      .forgot-showcase-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, var(--gif-overlay-start) 0%, var(--gif-overlay-end) 100%);
      }

      .forgot-showcase-content,
      .forgot-panel-inner,
      .forgot-role-chip {
        position: relative;
        z-index: 1;
      }

      .forgot-showcase-content {
        max-width: 440px;
      }

      .forgot-role-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .forgot-logo-text,
      .forgot-header h1 {
        font-family: 'DM Serif Display', serif;
      }

      .forgot-showcase h2,
      .forgot-showcase-number {
        font-family: 'DM Serif Display', serif;
      }

      .forgot-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        background: rgba(139, 35, 50, 0.15);
        border: 1px solid rgba(139, 35, 50, 0.2);
        color: var(--maroon);
        backdrop-filter: blur(8px);
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .forgot-kicker-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .forgot-showcase h2 {
        margin: 0 0 10px;
        font-size: clamp(32px, 2.7vw, 38px);
        line-height: 1.1;
        color: var(--text-primary);
      }

      .forgot-showcase h2 em {
        color: var(--maroon);
        font-style: italic;
      }

      .forgot-showcase p {
        margin: 0 0 22px;
        font-size: 13px;
        line-height: 1.65;
        color: var(--text-secondary);
      }

      .forgot-showcase-stats {
        display: flex;
        gap: 24px;
        padding-top: 14px;
        border-top: 1px solid var(--border);
      }

      .forgot-showcase-number {
        margin-bottom: 3px;
        font-size: 24px;
        line-height: 1;
        color: var(--text-primary);
      }

      .forgot-showcase-number span { color: var(--maroon); }

      .forgot-showcase-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-tertiary);
      }

      .forgot-panel {
        width: 470px;
        height: 100vh;
        padding: 30px 44px 24px;
        background: var(--panel-bg);
        border-left: 1px solid var(--border);
        backdrop-filter: blur(30px);
        position: relative;
        display: flex;
        align-items: center;
      }

      .forgot-panel-inner {
        width: 100%;
        max-height: 100%;
      }

      .forgot-theme-toggle {
        position: absolute;
        top: 20px;
        right: 26px;
        width: 44px;
        height: 44px;
        border: 1.5px solid var(--border-hover);
        border-radius: 14px;
        background: var(--bg-card);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .forgot-theme-toggle:hover {
        border-color: var(--maroon);
        background: var(--bg-card-hover);
        transform: scale(1.05);
      }

      .forgot-theme-toggle .sun-icon { color: var(--gold); }
      .forgot-theme-toggle .moon-icon { color: var(--sky); }
      .forgot-shell[data-theme='light'] .forgot-theme-toggle .moon-icon { display: none; }
      .forgot-shell[data-theme='dark'] .forgot-theme-toggle .sun-icon { display: none; }

      .forgot-back-link,
      .forgot-inline-link {
        color: var(--maroon);
        text-decoration: none;
        font-weight: 600;
      }

      .forgot-back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        margin-bottom: 20px;
        color: var(--text-tertiary);
      }

      .forgot-back-link:hover,
      .forgot-inline-link:hover {
        text-decoration: underline;
      }

      .forgot-back-link:hover { color: var(--maroon); }
      .forgot-back-link svg { width: 16px; height: 16px; }

      .forgot-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }

      .forgot-logo-icon {
        width: 40px;
        height: 40px;
        border-radius: 11px;
        background: var(--maroon);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .forgot-logo-icon svg { width: 20px; height: 20px; fill: white; color: white; }
      .forgot-logo-text { font-size: 17px; color: var(--text-primary); }
      .forgot-logo-text span { color: var(--maroon); }

      .forgot-header { margin-bottom: 16px; }

      .forgot-header h1 {
        margin: 0 0 8px;
        font-size: clamp(28px, 2.2vw, 30px);
        color: var(--text-primary);
      }

      .forgot-header p {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--text-secondary);
      }

      .forgot-role-chip {
        margin-top: 10px;
        background: rgba(74, 143, 181, 0.08);
        color: var(--sky);
      }

      .forgot-role-chip svg,
      .forgot-input-icon svg {
        width: 14px;
        height: 14px;
        flex: 0 0 14px;
      }

      .forgot-note,
      .forgot-success,
      .forgot-error {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 12px;
        line-height: 1.6;
      }

      .forgot-success {
        background: rgba(61, 139, 74, 0.1);
        border: 1px solid rgba(61, 139, 74, 0.18);
        color: #2f7040;
      }

      .forgot-shell[data-theme='dark'] .forgot-success {
        background: rgba(91, 175, 104, 0.1);
        border-color: rgba(91, 175, 104, 0.18);
        color: #8ed09a;
      }

      .forgot-error {
        background: rgba(139, 35, 50, 0.08);
        border: 1px solid rgba(139, 35, 50, 0.16);
        color: var(--maroon);
      }

      .forgot-shell[data-theme='dark'] .forgot-error {
        background: rgba(184, 58, 78, 0.12);
        border-color: rgba(184, 58, 78, 0.2);
        color: #f0a6b1;
      }

      .forgot-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .forgot-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .forgot-form-label {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .forgot-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .forgot-input-icon {
        position: absolute;
        left: 13px;
        color: var(--text-tertiary);
        pointer-events: none;
      }

      .forgot-input {
        width: 100%;
        border-radius: 16px;
        border: 1.5px solid var(--input-border);
        background: var(--input-bg);
        color: var(--text-primary);
        outline: none;
        transition: all 0.25s ease;
        padding: 13px 16px 13px 44px;
        font-size: 14px;
      }

      .forgot-input::placeholder { color: var(--input-placeholder); }

      .forgot-input:focus {
        border-color: var(--maroon);
        box-shadow: 0 0 0 3px var(--input-focus);
      }

      .forgot-hint {
        font-size: 12px;
        line-height: 1.55;
        color: var(--text-tertiary);
      }

      .forgot-submit {
        width: 100%;
        margin-top: 12px;
        padding: 14px;
        border-radius: 14px;
        background: var(--maroon);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(139, 35, 50, 0.25);
      }

      .forgot-submit:hover:not(:disabled) {
        background: var(--maroon-dark);
        transform: translateY(-1px);
      }

      .forgot-submit:disabled {
        opacity: 0.7;
        cursor: default;
      }

      .forgot-submit svg {
        width: 18px;
        height: 18px;
        flex: 0 0 18px;
      }

      .forgot-actions {
        margin-top: 24px;
        padding-top: 12px;
        text-align: center;
      }

      .forgot-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 14px;
        color: var(--text-tertiary);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .forgot-divider::before,
      .forgot-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
      }

      .forgot-signin-copy {
        margin: 0 0 6px;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .forgot-signin-links {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.65;
      }

      .forgot-signin-links a {
        color: var(--maroon);
        text-decoration: none;
        font-weight: 700;
      }

      .forgot-signin-links a:hover {
        text-decoration: underline;
      }

      .forgot-footer {
        margin-top: 22px;
        padding-top: 14px;
        border-top: 1px solid var(--border);
        text-align: center;
        font-size: 11px;
        color: var(--text-tertiary);
      }

      @media (max-width: 1024px) {
        .forgot-showcase { display: none; }
        .forgot-panel {
          width: 100%;
          padding: 40px 32px;
        }
      }

      @media (max-width: 480px) {
        .forgot-panel { padding: 32px 24px; }
        .forgot-header h1 { font-size: 26px; }
        .forgot-theme-toggle {
          top: 18px;
          right: 18px;
        }
      }
    `}</style>
  );
}

export default function ForgotPassword() {
  const { theme, toggle } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.title = 'Forgot Password - Thesis Archive Management System';
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim()) return;

    setError('');
    setSuccessMessage('');
    setSubmitted(false);
    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword({ identifier: identifier.trim() });
      setSubmitted(true);
      setSuccessMessage(response.message || 'If the account exists and can receive mail, a password reset link has been sent.');
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.identifier?.[0]
          || err.response?.data?.message
          || 'Unable to send a password reset link.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-shell" data-theme={theme}>
      <ForgotPasswordStyles />
      <div className="forgot-showcase">
        <div className="forgot-showcase-bg" style={{ backgroundImage: `url(${tupBuilding})` }} />
        <div className="forgot-showcase-overlay" />
        <div className="forgot-showcase-content">
          <div className="forgot-kicker">
            <span className="forgot-kicker-dot" />
            Computer Studies Department
          </div>
          <h2>
            Reset your
            <br />
            Thesis <em>Archive</em> password
          </h2>
          <p>
            Enter the exact email address saved on your account. If it exists in the system, we&apos;ll send a password reset link so you can choose a new password.
          </p>
          <div className="forgot-showcase-stats">
            <div>
              <div className="forgot-showcase-number">
                1<span>.</span>
              </div>
              <div className="forgot-showcase-label">Enter email</div>
            </div>
            <div>
              <div className="forgot-showcase-number">
                2<span>.</span>
              </div>
              <div className="forgot-showcase-label">Get reset link</div>
            </div>
            <div>
              <div className="forgot-showcase-number">
                3<span>.</span>
              </div>
              <div className="forgot-showcase-label">Create password</div>
            </div>
          </div>
        </div>
      </div>

      <div className="forgot-panel">
        <button className="forgot-theme-toggle" type="button" aria-label="Toggle theme" onClick={toggle}>
          <SunMedium className="sun-icon" size={18} />
          <MoonStar className="moon-icon" size={18} />
        </button>

        <div className="forgot-panel-inner">
          <Link to="/" className="forgot-back-link">
            <BackIcon />
            Back to Home
          </Link>

          <div className="forgot-logo">
            <div className="forgot-logo-icon">
              <LogoIcon />
            </div>
            <div className="forgot-logo-text">
              Thesis <span>Archive</span>
            </div>
          </div>

          <div className="forgot-header">
            <h1>Forgot Password</h1>
            <p>Use only your registered email address. The reset link will be sent there, and it will open the page where you can create a new password.</p>
            <div className="forgot-role-chip">
              <ShieldIcon />
              Password Recovery
            </div>
          </div>

          {error ? <div className="forgot-error">{error}</div> : null}
          {submitted ? <div className="forgot-success">{successMessage}</div> : null}

          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label className="forgot-form-label" htmlFor="account-identifier">
                Registered email address
              </label>
              <div className="forgot-input-wrapper">
                <input
                  id="account-identifier"
                  className="forgot-input"
                  type="email"
                  autoComplete="email"
                  placeholder="name@tup.edu.ph"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
                <div className="forgot-input-icon">
                  <MailIcon />
                </div>
              </div>
              <div className="forgot-hint">The email must already belong to your student, faculty, or VPAA account in this system.</div>
            </div>

            <button className="forgot-submit" type="submit" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Sending password reset link...' : 'Send password reset link'}
            </button>
          </form>

          <div className="forgot-actions">
            <div className="forgot-divider">Sign Back In</div>
            <p className="forgot-signin-copy">Remembered your password?</p>
            <div className="forgot-signin-links">
              Sign in as <Link to="/sign-in/student">Student</Link>, <Link to="/sign-in/faculty">Faculty</Link>, or <Link to="/sign-in/vpaa">VPAA</Link>
            </div>
          </div>

          <div className="forgot-footer">&copy; 2026 Thesis Archive Management System &middot; TUP Manila</div>
        </div>
      </div>
    </div>
  );
}
