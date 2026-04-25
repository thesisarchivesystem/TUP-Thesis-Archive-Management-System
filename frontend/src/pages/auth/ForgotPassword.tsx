import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoonStar, SunMedium } from 'lucide-react';
import BrandMarkIcon from '../../components/BrandMarkIcon';
import { useTheme } from '../../hooks/useTheme';
import { authService } from '../../services/authService';
import tupBuilding from '../../assets/tup-building.gif';

type AccountRole = 'student' | 'faculty' | 'vpaa';

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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
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
        min-height: 100vh;
        display: flex;
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
        display: flex;
        align-items: flex-end;
        padding: 48px;
        min-height: 100vh;
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
      .forgot-panel-inner {
        position: relative;
        z-index: 1;
      }

      .forgot-showcase-content {
        max-width: 500px;
      }

      .forgot-kicker,
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

      .forgot-kicker {
        margin-bottom: 20px;
        background: rgba(139, 35, 50, 0.15);
        border: 1px solid rgba(139, 35, 50, 0.2);
        color: var(--maroon);
        backdrop-filter: blur(8px);
      }

      .forgot-kicker-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .forgot-showcase h2,
      .forgot-logo-text,
      .forgot-header h1,
      .forgot-showcase-number {
        font-family: 'DM Serif Display', serif;
      }

      .forgot-showcase h2 {
        margin: 0 0 12px;
        font-size: 38px;
        line-height: 1.1;
        color: var(--text-primary);
      }

      .forgot-showcase h2 em {
        color: var(--maroon);
        font-style: italic;
      }

      .forgot-showcase p {
        margin: 0 0 28px;
        font-size: 14px;
        line-height: 1.7;
        color: var(--text-secondary);
      }

      .forgot-showcase-stats {
        display: flex;
        gap: 32px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
      }

      .forgot-showcase-number {
        margin-bottom: 3px;
        font-size: 26px;
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
        width: 520px;
        min-height: 100vh;
        padding: 48px 56px;
        background: var(--panel-bg);
        border-left: 1px solid var(--border);
        backdrop-filter: blur(30px);
        position: relative;
        display: flex;
        align-items: center;
      }

      .forgot-panel-inner { width: 100%; }

      .forgot-theme-toggle {
        position: absolute;
        top: 28px;
        right: 28px;
        width: 40px;
        height: 40px;
        border: 1.5px solid var(--border-hover);
        border-radius: 10px;
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
        margin-bottom: 36px;
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
        margin-bottom: 8px;
      }

      .forgot-logo-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: var(--maroon);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .forgot-logo-icon svg { width: 22px; height: 22px; fill: white; color: white; }
      .forgot-logo-text { font-size: 18px; color: var(--text-primary); }
      .forgot-logo-text span { color: var(--maroon); }

      .forgot-header { margin-bottom: 26px; }

      .forgot-header h1 {
        margin: 20px 0 10px;
        font-size: 30px;
        color: var(--text-primary);
      }

      .forgot-header p {
        margin: 0;
        font-size: 14px;
        line-height: 1.65;
        color: var(--text-secondary);
      }

      .forgot-role-chip {
        margin-top: 14px;
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
        margin-bottom: 18px;
        padding: 14px 16px;
        border-radius: 14px;
        font-size: 13px;
        line-height: 1.6;
      }

      .forgot-note {
        background: var(--note-bg);
        border: 1px solid var(--note-border);
        color: var(--note-text);
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
        gap: 18px;
      }

      .forgot-form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .forgot-form-label {
        font-size: 13px;
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
        left: 14px;
        color: var(--text-tertiary);
        pointer-events: none;
      }

      .forgot-input,
      .forgot-select {
        width: 100%;
        border-radius: 12px;
        border: 1.5px solid var(--input-border);
        background: var(--input-bg);
        color: var(--text-primary);
        outline: none;
        transition: all 0.25s ease;
      }

      .forgot-input {
        padding: 13px 14px 13px 42px;
      }

      .forgot-select {
        padding: 13px 14px;
        appearance: none;
      }

      .forgot-input::placeholder { color: var(--input-placeholder); }

      .forgot-input:focus,
      .forgot-select:focus {
        border-color: var(--maroon);
        box-shadow: 0 0 0 3px var(--input-focus);
      }

      .forgot-hint {
        font-size: 12px;
        line-height: 1.6;
        color: var(--text-tertiary);
      }

      .forgot-submit {
        width: 100%;
        margin-top: 4px;
        padding: 14px;
        border-radius: 12px;
        background: var(--maroon);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 15px;
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
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 6px;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .forgot-footer {
        margin-top: 36px;
        padding-top: 20px;
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
        .forgot-showcase-stats { gap: 20px; }
        .forgot-actions {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `}</style>
  );
}

export default function ForgotPassword() {
  const { theme, toggle } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<AccountRole>('student');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const roleMeta = useMemo(
    () => ({
      student: {
        signInTo: '/sign-in/student',
        label: 'Student recovery',
      },
      faculty: {
        signInTo: '/sign-in/faculty',
        label: 'Faculty recovery',
      },
      vpaa: {
        signInTo: '/sign-in/vpaa',
        label: 'VPAA recovery',
      },
    }),
    [],
  );

  const currentRole = roleMeta[role];
  const rootStyle = useMemo(
    () =>
      ({
        ['--badge-accent' as string]:
          role === 'student' ? '#3D8B4A' : role === 'faculty' ? '#4A8FB5' : '#A07A28',
      }) as CSSProperties,
    [role],
  );

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
    <div className="forgot-shell" data-theme={theme} style={rootStyle}>
      <ForgotPasswordStyles />

      <div className="forgot-showcase">
        <div className="forgot-showcase-bg" style={{ backgroundImage: `url(${tupBuilding})` }} />
        <div className="forgot-showcase-overlay" />
        <div className="forgot-showcase-content">
          <div className="forgot-kicker">
            <span className="forgot-kicker-dot" />
            Account Recovery
          </div>
          <h2>
            Recover your
            <br />
            Thesis <em>Archive</em> access
          </h2>
          <p>
            Use your institutional email or account identifier so the system can match your profile and send the right password reset link.
          </p>
          <div className="forgot-showcase-stats">
            <div>
              <div className="forgot-showcase-number">
                1<span>.</span>
              </div>
              <div className="forgot-showcase-label">Choose account type</div>
            </div>
            <div>
              <div className="forgot-showcase-number">
                2<span>.</span>
              </div>
              <div className="forgot-showcase-label">Submit account ID</div>
            </div>
            <div>
              <div className="forgot-showcase-number">
                3<span>.</span>
              </div>
              <div className="forgot-showcase-label">Check your email</div>
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
          <Link to={currentRole.signInTo} className="forgot-back-link">
            <BackIcon />
            Back to Sign In
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
            <p>Tell us which account you need help with and we&apos;ll email a reset link if the account can be matched.</p>
            <div className="forgot-role-chip">
              <ShieldIcon />
              {currentRole.label}
            </div>
          </div>

          <div className="forgot-note">
            Enter your institutional email or account ID. Use the same identifier you normally use to sign in.
          </div>

          {error ? <div className="forgot-error">{error}</div> : null}
          {submitted ? <div className="forgot-success">{successMessage}</div> : null}

          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label className="forgot-form-label" htmlFor="account-role">
                Account type
              </label>
              <select id="account-role" className="forgot-select" value={role} onChange={(event) => setRole(event.target.value as AccountRole)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="vpaa">VPAA</option>
              </select>
            </div>

            <div className="forgot-form-group">
              <label className="forgot-form-label" htmlFor="account-identifier">
                Institutional email or account ID
              </label>
              <div className="forgot-input-wrapper">
                <input
                  id="account-identifier"
                  className="forgot-input"
                  type="text"
                  placeholder="e.g. TUPM-21-0001 or juan.delacruz@tup.edu.ph"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
                <div className="forgot-input-icon">
                  <MailIcon />
                </div>
              </div>
              <div className="forgot-hint">The system will send the reset link to the email attached to the matched account.</div>
            </div>

            <button className="forgot-submit" type="submit" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Sending Reset Link...' : 'Request Password Help'}
              <ArrowRightIcon />
            </button>
          </form>

          <div className="forgot-actions">
            <span>
              Remembered it? <Link to={currentRole.signInTo} className="forgot-inline-link">Return to sign in</Link>
            </span>
            <span>
              Need another role? <Link to="/" className="forgot-inline-link">Go to homepage</Link>
            </span>
          </div>

          <div className="forgot-footer">&copy; 2026 Thesis Archive Management System &middot; TUP Manila</div>
        </div>
      </div>
    </div>
  );
}
