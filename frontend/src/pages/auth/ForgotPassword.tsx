import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { authService } from '../../services/authService';
import tupBuilding from '../../assets/tup-building.gif';

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
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
        --bg-tertiary: #e8ddd0;
        --bg-card: #fbf8f4;
        --bg-card-hover: #fffdf9;
        --panel-bg: rgba(251, 248, 244, 0.92);
        --text-primary: #2e1a1a;
        --text-secondary: #5c4444;
        --text-tertiary: #8f7a7a;
        --border: rgba(139, 35, 50, 0.1);
        --border-hover: rgba(139, 35, 50, 0.2);
        --input-bg: #ffffff;
        --input-border: rgba(139, 35, 50, 0.15);
        --input-focus: rgba(139, 35, 50, 0.3);
        --input-placeholder: #b8a0a4;
        --success-bg: rgba(61, 139, 74, 0.1);
        --success-border: rgba(61, 139, 74, 0.18);
        --success-text: #2f7040;
        --error-bg: rgba(180, 49, 49, 0.08);
        --error-border: rgba(180, 49, 49, 0.16);
        --error-text: #8b2332;
        --info-bg: rgba(74, 143, 181, 0.08);
        --info-border: rgba(74, 143, 181, 0.16);
        --info-text: #355f77;
        --gif-opacity: 0.5;
      }

      .forgot-shell[data-theme='dark'] {
        --bg-primary: #1a1214;
        --bg-secondary: #221920;
        --bg-tertiary: #2c2028;
        --bg-card: #261c22;
        --bg-card-hover: #2e2229;
        --panel-bg: rgba(38, 28, 34, 0.92);
        --text-primary: #f0e4e6;
        --text-secondary: #b8a0a4;
        --text-tertiary: #7a6468;
        --border: rgba(200, 160, 170, 0.1);
        --border-hover: rgba(200, 160, 170, 0.18);
        --input-bg: #2c2028;
        --input-border: rgba(200, 160, 170, 0.12);
        --input-focus: rgba(184, 58, 78, 0.3);
        --input-placeholder: #5e4a50;
        --success-bg: rgba(91, 175, 104, 0.1);
        --success-border: rgba(91, 175, 104, 0.18);
        --success-text: #8ed09a;
        --error-bg: rgba(210, 90, 90, 0.12);
        --error-border: rgba(210, 90, 90, 0.18);
        --error-text: #f3b4b4;
        --info-bg: rgba(123, 184, 212, 0.08);
        --info-border: rgba(123, 184, 212, 0.14);
        --info-text: #9cc9de;
        --gif-opacity: 0.25;
      }

      .forgot-shell * { box-sizing: border-box; }
      .forgot-shell button, .forgot-shell input { font: inherit; }

      .forgot-showcase {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        padding: 40px;
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
        background: linear-gradient(180deg, rgba(240, 232, 222, 0.1) 0%, rgba(247, 242, 236, 0.6) 100%);
        background: linear-gradient(180deg, var(--gif-overlay-start, rgba(240, 232, 222, 0.1)) 0%, var(--gif-overlay-end, rgba(247, 242, 236, 0.6)) 100%);
      }

      .forgot-showcase-content,
      .forgot-panel-inner {
        position: relative;
        z-index: 2;
      }

      .forgot-showcase-content {
        max-width: 440px;
      }

      .forgot-showcase-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 20px;
        padding: 5px 14px;
        border: 1px solid rgba(139, 35, 50, 0.2);
        border-radius: 100px;
        color: var(--maroon);
        background: rgba(139, 35, 50, 0.15);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 11px;
        font-weight: 700;
        backdrop-filter: blur(8px);
      }

      .forgot-showcase-tag span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }

      .forgot-showcase h2,
      .forgot-brand,
      .forgot-header h1,
      .forgot-showcase-number,
      .forgot-brand,
      .forgot-panel h2 {
        font-family: 'DM Serif Display', serif;
      }

      .forgot-showcase h2 {
        margin: 0 0 12px;
        font-size: 32px;
        line-height: 1.15;
        font-weight: 700;
      }

      .forgot-showcase h2 em {
        color: var(--maroon);
        font-style: italic;
      }

      .forgot-showcase p {
        margin: 0;
        font-size: 13px;
        line-height: 1.7;
        color: var(--text-secondary);
      }

      .forgot-showcase-stats {
        display: flex;
        gap: 28px;
        padding-top: 18px;
        margin-top: 24px;
        border-top: 1px solid var(--border);
      }

      .forgot-showcase-number {
        font-size: 23px;
        color: var(--text-primary);
        line-height: 1;
        margin-bottom: 3px;
      }

      .forgot-showcase-number span { color: var(--maroon); }

      .forgot-showcase-label {
        font-size: 11px;
        color: var(--text-tertiary);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .forgot-panel {
        width: 470px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 40px 44px;
        background: var(--panel-bg);
        border-left: 1px solid var(--border);
        backdrop-filter: blur(30px);
        position: relative;
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
        color: var(--text-secondary);
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

      .forgot-back,
      .forgot-link {
        color: var(--maroon);
        text-decoration: none;
        font-weight: 600;
      }

      .forgot-back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 30px;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-tertiary);
      }

      .forgot-back:hover { color: var(--maroon); }
      .forgot-back svg { width: 16px; height: 16px; }

      .forgot-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .forgot-logo-icon {
        width: 38px;
        height: 38px;
        background: var(--maroon);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .forgot-logo-icon svg { width: 20px; height: 20px; fill: white; }

      .forgot-brand {
        font-size: 16px;
        color: var(--text-primary);
      }

      .forgot-brand span { color: var(--maroon); }

      .forgot-header {
        margin-bottom: 28px;
      }

      .forgot-header h1 {
        margin: 18px 0 6px;
        font-size: 24px;
        color: var(--text-primary);
      }

      .forgot-description {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .forgot-role-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(74, 143, 181, 0.1);
        color: #4a8fb5;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 14px;
        border-radius: 100px;
        letter-spacing: 0.05em;
        margin-top: 12px;
      }

      .forgot-shell[data-theme='dark'] .forgot-role-badge {
        background: rgba(123, 184, 212, 0.12);
        color: #7bb8d4;
      }

      .forgot-role-badge svg {
        width: 14px;
        height: 14px;
        flex: 0 0 14px;
      }

      .forgot-message {
        margin-bottom: 18px;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid transparent;
        line-height: 1.6;
        font-size: 13px;
      }

      .forgot-message.info {
        background: var(--info-bg);
        border-color: var(--info-border);
        color: var(--info-text);
      }

      .forgot-message.success {
        background: var(--success-bg);
        border-color: var(--success-border);
        color: var(--success-text);
      }

      .forgot-message.error {
        background: var(--error-bg);
        border-color: var(--error-border);
        color: var(--error-text);
      }

      .forgot-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .forgot-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .forgot-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.02em;
      }

      .forgot-input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1.5px solid var(--input-border);
        background: var(--input-bg);
        color: var(--text-primary);
        outline: none;
        font-size: 13px;
      }

      .forgot-input::placeholder { color: var(--input-placeholder); }

      .forgot-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .forgot-input:focus {
        border-color: var(--maroon);
        box-shadow: 0 0 0 3px var(--input-focus);
      }

      .forgot-hint {
        font-size: 12px;
        color: var(--text-tertiary);
        line-height: 1.5;
      }

      .forgot-submit {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 12px;
        background: var(--maroon);
        color: white;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(139, 35, 50, 0.25);
        margin-top: 4px;
      }

      .forgot-submit:hover:not(:disabled) {
        background: var(--maroon-dark);
        transform: translateY(-1px);
      }

      .forgot-submit:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .forgot-actions {
        margin-top: 6px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .forgot-actions a {
        color: var(--maroon);
        font-weight: 700;
      }

      .forgot-footer {
        margin-top: 30px;
        padding-top: 18px;
        border-top: 1px solid var(--border);
        text-align: center;
      }

      .forgot-footer p {
        margin: 0;
        font-size: 11px;
        color: var(--text-tertiary);
      }

      @media (max-width: 1024px) {
        .forgot-showcase { display: none; }
        .forgot-panel {
          width: 100%;
          max-width: 100%;
          padding: 36px 28px;
        }
      }

      @media (max-width: 480px) {
        .forgot-panel { padding: 28px 20px; }
        .forgot-header h1 { font-size: 22px; }
        .forgot-showcase-stats { gap: 20px; }
      }
    `}</style>
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export default function ForgotPassword() {
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const canSubmit = trimmedEmail.length > 0 && emailPattern.test(trimmedEmail) && !isSubmitting;

  useEffect(() => {
    document.title = 'Forgot Password - Thesis Archive Management System';
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!emailPattern.test(trimmedEmail)) {
      setError('Enter the same valid email address registered on your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.forgotPassword(trimmedEmail);
      setSuccess(response.message || 'A password reset link has been sent to your email address.');
    } catch (err: any) {
      setError(err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Unable to send a reset link right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-shell" data-theme={theme} style={{ ['--maroon' as string]: '#8b2332' } as CSSProperties}>
      <ForgotPasswordStyles />

      <div className="forgot-showcase">
        <div className="forgot-showcase-bg" style={{ backgroundImage: `url(${tupBuilding})` }} />
        <div className="forgot-showcase-overlay" />
        <div className="forgot-showcase-content">
          <div className="forgot-showcase-tag">
            <span />
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
          <Link to="/" className="forgot-back">
            <BackIcon />
            Back to Home
          </Link>

          <div className="forgot-logo">
            <div className="forgot-logo-icon">
              <LogoIcon />
            </div>
            <div className="forgot-brand">
              Thesis <span>Archive</span>
            </div>
          </div>

          <div className="forgot-header">
            <h1>Forgot Password</h1>
            <p className="forgot-description">
              Use only your registered email address. The reset link will be sent there, and it will open the page where you can create a new password.
            </p>
            <div className="forgot-role-badge">
              <ShieldIcon />
              Password Recovery
            </div>
          </div>

          <div className="forgot-message info">
            This works only for existing accounts with an email address that exactly matches the one stored in the system.
          </div>

          {success ? <div className="forgot-message success">{success}</div> : null}
          {error ? <div className="forgot-message error">{error}</div> : null}

          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label className="forgot-label" htmlFor="email">
                Registered email address
              </label>
              <div className="forgot-input-wrapper">
                <input
                  id="email"
                  className="forgot-input"
                  type="email"
                  placeholder="name@tup.edu.ph"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="forgot-hint">
                The email must already belong to your student, faculty, or VPAA account in this system.
              </div>
            </div>

            <button className="forgot-submit" type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Sending reset link...' : 'Send password reset link'}
            </button>
          </form>

          <div className="forgot-actions">
            <span>
              Remembered it? <Link to="/sign-in/student" className="forgot-link">Student sign in</Link>
            </span>
            <span>
              Other roles: <Link to="/sign-in/faculty" className="forgot-link">Faculty</Link> / <Link to="/sign-in/vpaa" className="forgot-link">VPAA</Link>
            </span>
          </div>

          <div className="forgot-footer">
            <p>&copy; 2026 Thesis Archive Management System &middot; TUP Manila</p>
          </div>
        </div>
      </div>
    </div>
  );
}
