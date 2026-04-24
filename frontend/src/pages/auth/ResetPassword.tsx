import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { authService } from '../../services/authService';
import tupBuilding from '../../assets/tup-building.gif';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LogoIcon() {
  return <GraduationCap />;
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ResetPasswordStyles() {
  return (
    <style>{`
      .reset-shell {
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

      .reset-shell[data-theme='light'] {
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
        --panel-bg: rgba(251, 248, 244, 0.92);
        --gif-overlay-start: rgba(240, 232, 222, 0.1);
        --gif-overlay-end: rgba(247, 242, 236, 0.6);
        --gif-opacity: 0.5;
        --info-bg: rgba(74, 143, 181, 0.08);
        --info-border: rgba(74, 143, 181, 0.15);
        --info-text: #355f77;
        --success-bg: rgba(61, 139, 74, 0.08);
        --success-border: rgba(61, 139, 74, 0.18);
        --success-text: #2f7040;
        --error-bg: rgba(184, 58, 78, 0.1);
        --error-border: rgba(139, 35, 50, 0.28);
        --error-text: #8b2332;
      }

      .reset-shell[data-theme='dark'] {
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
        --panel-bg: rgba(38, 28, 34, 0.92);
        --gif-overlay-start: rgba(26, 18, 20, 0.2);
        --gif-overlay-end: rgba(26, 18, 20, 0.7);
        --gif-opacity: 0.25;
        --maroon: #b83a4e;
        --maroon-dark: #9b2e40;
        --gold: #daba5e;
        --sky: #7bb8d4;
        --info-bg: rgba(123, 184, 212, 0.08);
        --info-border: rgba(123, 184, 212, 0.14);
        --info-text: #9cc9de;
        --success-bg: rgba(91, 175, 104, 0.1);
        --success-border: rgba(91, 175, 104, 0.18);
        --success-text: #8ed09a;
        --error-bg: rgba(184, 58, 78, 0.12);
        --error-border: rgba(184, 58, 78, 0.24);
        --error-text: #f0aab4;
      }

      .reset-shell * { box-sizing: border-box; }
      .reset-shell button, .reset-shell input { font: inherit; }

      .reset-showcase {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        padding: 40px;
        min-height: 100vh;
      }

      .reset-showcase-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        opacity: var(--gif-opacity);
      }

      .reset-showcase-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, var(--gif-overlay-start) 0%, var(--gif-overlay-end) 100%);
      }

      .reset-showcase-content,
      .reset-panel-inner {
        position: relative;
        z-index: 2;
      }

      .reset-showcase-content {
        max-width: 440px;
      }

      .reset-showcase-badge,
      .reset-role-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 100px;
        letter-spacing: 0.06em;
        font-size: 12px;
        font-weight: 700;
      }

      .reset-showcase-badge {
        background: rgba(139, 35, 50, 0.15);
        border: 1px solid rgba(139, 35, 50, 0.2);
        color: var(--maroon);
        padding: 5px 14px;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        backdrop-filter: blur(8px);
        font-size: 11px;
      }

      .reset-showcase-badge-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }

      .reset-showcase-content h2,
      .reset-logo-text,
      .reset-header h1,
      .reset-showcase-number {
        font-family: 'DM Serif Display', serif;
      }

      .reset-showcase-content h2 {
        font-size: 32px;
        color: var(--text-primary);
        line-height: 1.15;
        margin: 0 0 12px;
        font-weight: 700;
      }

      .reset-showcase-content em {
        font-style: italic;
        color: var(--maroon);
      }

      .reset-showcase-content p {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.65;
        margin: 0 0 24px;
      }

      .reset-showcase-stats {
        display: flex;
        gap: 28px;
        padding-top: 18px;
        border-top: 1px solid var(--border);
      }

      .reset-showcase-number {
        font-size: 23px;
        color: var(--text-primary);
        line-height: 1;
        margin-bottom: 3px;
      }

      .reset-showcase-number span { color: var(--maroon); }

      .reset-showcase-label {
        font-size: 11px;
        color: var(--text-tertiary);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .reset-panel {
        width: 470px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 40px 44px;
        background: var(--panel-bg);
        backdrop-filter: blur(30px);
        border-left: 1px solid var(--border);
        position: relative;
      }

      .reset-theme-toggle {
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

      .reset-theme-toggle:hover {
        border-color: var(--maroon);
        background: var(--bg-card-hover);
        transform: scale(1.05);
      }

      .reset-theme-toggle .sun-icon { color: var(--gold); }
      .reset-theme-toggle .moon-icon { color: var(--sky); }
      .reset-shell[data-theme='light'] .reset-theme-toggle .sun-icon { display: none; }
      .reset-shell[data-theme='dark'] .reset-theme-toggle .moon-icon { display: none; }

      .reset-back-link,
      .reset-inline-link {
        color: var(--maroon);
        text-decoration: none;
      }

      .reset-back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--text-tertiary);
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 30px;
      }

      .reset-back-link:hover { color: var(--maroon); }
      .reset-back-link svg { width: 16px; height: 16px; }

      .reset-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .reset-logo-icon {
        width: 38px;
        height: 38px;
        background: var(--maroon);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .reset-logo-icon svg { width: 20px; height: 20px; fill: white; }
      .reset-logo-text { font-size: 16px; color: var(--text-primary); }
      .reset-logo-text span { color: var(--maroon); }

      .reset-header {
        margin-bottom: 28px;
      }

      .reset-header h1 {
        font-size: 24px;
        color: var(--text-primary);
        margin: 18px 0 6px;
      }

      .reset-header p {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
      }

      .reset-role-badge {
        padding: 5px 14px;
        margin-top: 12px;
        background: rgba(74, 143, 181, 0.1);
        color: #4a8fb5;
      }

      .reset-shell[data-theme='dark'] .reset-role-badge {
        background: rgba(123, 184, 212, 0.12);
        color: #7bb8d4;
      }

      .reset-role-badge svg,
      .reset-input-icon svg {
        width: 14px;
        height: 14px;
        display: block;
        flex: 0 0 14px;
      }

      .reset-message {
        margin-bottom: 18px;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 13px;
        line-height: 1.6;
        border: 1px solid transparent;
      }

      .reset-message.info {
        background: var(--info-bg);
        border-color: var(--info-border);
        color: var(--info-text);
      }

      .reset-message.success {
        background: var(--success-bg);
        border-color: var(--success-border);
        color: var(--success-text);
      }

      .reset-message.error {
        background: var(--error-bg);
        border-color: var(--error-border);
        color: var(--error-text);
      }

      .reset-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .reset-form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .reset-form-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.02em;
      }

      .reset-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .reset-input-icon {
        position: absolute;
        left: 14px;
        width: 14px;
        height: 14px;
        color: var(--text-tertiary);
        pointer-events: none;
      }

      .reset-input {
        width: 100%;
        padding: 12px 44px 12px 40px;
        background: var(--input-bg);
        border: 1.5px solid var(--input-border);
        border-radius: 12px;
        font-size: 13px;
        color: var(--text-primary);
        outline: none;
        transition: all 0.25s ease;
      }

      .reset-input::placeholder { color: var(--input-placeholder); }

      .reset-input:focus {
        border-color: var(--maroon);
        box-shadow: 0 0 0 3px var(--input-focus);
      }

      .reset-input-wrapper:focus-within .reset-input-icon { color: var(--maroon); }

      .reset-password-toggle {
        position: absolute;
        right: 14px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-tertiary);
        display: flex;
      }

      .reset-password-toggle:hover { color: var(--maroon); }
      .reset-password-toggle svg { width: 18px; height: 18px; }

      .reset-hint {
        margin-top: -2px;
        font-size: 12px;
        color: var(--text-tertiary);
        line-height: 1.5;
      }

      .reset-submit {
        width: 100%;
        padding: 12px;
        background: var(--maroon);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 14px;
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

      .reset-submit:hover:not(:disabled) {
        background: var(--maroon-dark);
        transform: translateY(-1px);
      }

      .reset-submit:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .reset-submit svg { width: 18px; height: 18px; }

      .reset-actions {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .reset-actions a {
        font-weight: 700;
      }

      .reset-actions a:hover,
      .reset-inline-link:hover {
        text-decoration: underline;
      }

      .reset-footer {
        margin-top: 30px;
        padding-top: 18px;
        border-top: 1px solid var(--border);
        text-align: center;
      }

      .reset-footer p {
        margin: 0;
        font-size: 11px;
        color: var(--text-tertiary);
      }

      @media (max-width: 1024px) {
        .reset-showcase { display: none; }
        .reset-panel {
          width: 100%;
          max-width: 100%;
          padding: 36px 28px;
        }
      }

      @media (max-width: 480px) {
        .reset-panel { padding: 28px 20px; }
        .reset-header h1 { font-size: 22px; }
        .reset-showcase-stats { gap: 20px; }
      }
    `}</style>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggle } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token')?.trim() ?? '';
  const email = searchParams.get('email')?.trim() ?? '';
  const hasValidLink = token.length > 0 && emailPattern.test(email);
  const canSubmit = useMemo(
    () => hasValidLink && password.length >= 8 && confirmPassword.length >= 8 && !isSubmitting,
    [confirmPassword.length, hasValidLink, isSubmitting, password.length]
  );

  useEffect(() => {
    document.title = 'Reset Password - Thesis Archive Management System';
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!hasValidLink) {
      setError('This reset link is incomplete or invalid. Request a new password reset email.');
      return;
    }

    if (password.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });
      setSuccess(response.message || 'Your password has been reset successfully.');
      setTimeout(() => navigate('/', { replace: true }), 1800);
    } catch (err: any) {
      setError(err.response?.data?.errors?.email?.[0] || err.response?.data?.errors?.password?.[0] || err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-shell" data-theme={theme}>
      <ResetPasswordStyles />

      <div className="reset-showcase">
        <div className="reset-showcase-bg" style={{ backgroundImage: `url(${tupBuilding})` }} />
        <div className="reset-showcase-overlay" />
        <div className="reset-showcase-content">
          <div className="reset-showcase-badge">
            <span className="reset-showcase-badge-dot" />
            Computer Studies Department
          </div>
          <h2>
            Protect your
            <br />
            Thesis <em>Archive</em> access
          </h2>
          <p>
            Set a fresh password to regain access to your account. Use a strong password that you have not used before and keep it private.
          </p>
          <div className="reset-showcase-stats">
            <div>
              <div className="reset-showcase-number">
                1<span>.</span>
              </div>
              <div className="reset-showcase-label">Open reset link</div>
            </div>
            <div>
              <div className="reset-showcase-number">
                2<span>.</span>
              </div>
              <div className="reset-showcase-label">Create password</div>
            </div>
            <div>
              <div className="reset-showcase-number">
                3<span>.</span>
              </div>
              <div className="reset-showcase-label">Sign in again</div>
            </div>
          </div>
        </div>
      </div>

      <div className="reset-panel">
        <button className="reset-theme-toggle" type="button" aria-label="Toggle theme" onClick={toggle}>
          <SunMedium className="sun-icon" size={18} />
          <MoonStar className="moon-icon" size={18} />
        </button>

        <div className="reset-panel-inner">
          <Link to="/" className="reset-back-link">
            <BackIcon />
            Back to Home
          </Link>

          <div className="reset-logo">
            <div className="reset-logo-icon">
              <LogoIcon />
            </div>
            <div className="reset-logo-text">
              Thesis <span>Archive</span>
            </div>
          </div>

          <div className="reset-header">
            <h1>Choose a new password</h1>
            <p>
              Resetting password for <strong>{email || 'your account'}</strong>.
            </p>
            <div className="reset-role-badge">
              <ShieldIcon />
              Password Recovery
            </div>
          </div>

          {!hasValidLink ? (
            <div className="reset-message error">
              This reset link is missing the required token or email. Request a new reset email to continue.
            </div>
          ) : (
            <div className="reset-message info">
              Choose a password with at least 8 characters, then use it the next time you sign in.
            </div>
          )}

          {success ? <div className="reset-message success">{success}</div> : null}
          {error ? <div className="reset-message error">{error}</div> : null}

          <form className="reset-form" onSubmit={handleSubmit}>
            <div className="reset-form-group">
              <label className="reset-form-label" htmlFor="new-password">
                New password
              </label>
              <div className="reset-input-wrapper">
                <input
                  id="new-password"
                  className="reset-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
                <div className="reset-input-icon">
                  <LockIcon />
                </div>
                <button
                  type="button"
                  className="reset-password-toggle"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            <div className="reset-form-group">
              <label className="reset-form-label" htmlFor="confirm-password">
                Confirm new password
              </label>
              <div className="reset-input-wrapper">
                <input
                  id="confirm-password"
                  className="reset-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                />
                <div className="reset-input-icon">
                  <LockIcon />
                </div>
                <button
                  type="button"
                  className="reset-password-toggle"
                  aria-label="Toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              <div className="reset-hint">
                After resetting successfully, you&apos;ll be redirected to the homepage so you can sign in again.
              </div>
            </div>

            <button className="reset-submit" type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Resetting password...' : 'Reset password'}
              <ArrowRightIcon />
            </button>

            <div className="reset-actions">
              Need a new link?{' '}
              <Link to="/forgot-password" className="reset-inline-link">
                Request another reset email
              </Link>
            </div>
          </form>

          <div className="reset-footer">
            <p>&copy; 2026 Thesis Archive Management System &middot; TUP Manila</p>
          </div>
        </div>
      </div>
    </div>
  );
}
