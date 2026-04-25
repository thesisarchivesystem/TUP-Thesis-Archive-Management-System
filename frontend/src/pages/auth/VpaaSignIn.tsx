import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import RoleSignInLayout from './RoleSignInLayout';

function VpaaBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function VpaaSignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <RoleSignInLayout
      pageTitle="VPAA Sign In - Thesis Archive Management System"
      heading="VPAA Sign In"
      description="Enter your administrator credentials to access the thesis archive and oversee research approvals."
      showcaseHeading={
        <>
          Administrative
          <br />
          Portal <em>Access</em>
        </>
      }
      showcaseDescription="Access admin tools to monitor thesis documents, approvals, and research records in the Computer Studies Department at TUP Manila."
      roleBadgeText="VPAA Account"
      roleBadgeIcon={<VpaaBadgeIcon />}
      showcaseStats={[
        { value: '500+', label: 'Documents' },
        { value: '3', label: 'Programs' },
        { value: '10+', label: 'Years' },
      ]}
      identifierLabel="VPAA Email"
      identifierPlaceholder="e.g. vpaa@tup.edu.ph"
      roleSwitchLinks={[
        { label: 'Student', to: '/sign-in/student' },
        { label: 'Faculty', to: '/sign-in/faculty' },
      ]}
      accent={{
        successBgLight: 'rgba(98,102,214,0.12)',
        successTextLight: '#5D63D8',
        successBgDark: 'rgba(147,132,235,0.16)',
        successTextDark: '#9384EB',
      }}
      error={error}
      isLoading={isLoading}
      onSubmit={async ({ identifier, password, remember }) => {
        setIsLoading(true);
        setError('');
        try {
          const response = await authService.login(identifier, password);
          if (response.user.role !== 'vpaa') {
            setError('This login is for VPAA administrators only');
            return;
          }
          setAuth(response.user, response.token, remember);
          navigate('/vpaa/dashboard', { replace: true });
        } catch (err: any) {
          setError(err.response?.data?.errors?.identifier?.[0] || err.response?.data?.message || 'Login failed');
        } finally {
          setIsLoading(false);
        }
      }}
    />
  );
}
