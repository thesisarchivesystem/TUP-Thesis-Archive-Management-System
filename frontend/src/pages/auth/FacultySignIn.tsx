import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import RoleSignInLayout from './RoleSignInLayout';

function FacultyBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function FacultySignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <RoleSignInLayout
      pageTitle="Faculty Sign In - Thesis Archive Management System"
      heading="Faculty Sign In"
      description="Enter your faculty credentials to access the thesis archive and review research submissions."
      showcaseHeading={
        <>
          Faculty
          <br />
          Portal <em>Access</em>
        </>
      }
      showcaseDescription="Access faculty tools for reviewing thesis documents, submissions, and research works from the Computer Studies Department at TUP Manila."
      roleBadgeText="Faculty Account"
      roleBadgeIcon={<FacultyBadgeIcon />}
      showcaseStats={[
        { value: '500+', label: 'Documents' },
        { value: '3', label: 'Programs' },
        { value: '10+', label: 'Years' },
      ]}
      identifierLabel="Faculty Email"
      identifierPlaceholder="e.g. faculty@tup.edu.ph"
      roleSwitchLinks={[
        { label: 'Student', to: '/sign-in/student' },
        { label: 'VPAA', to: '/sign-in/vpaa' },
      ]}
      accent={{
        successBgLight: 'rgba(214,106,154,0.12)',
        successTextLight: '#C24F87',
        successBgDark: 'rgba(232,145,187,0.16)',
        successTextDark: '#E891BB',
      }}
      error={error}
      isLoading={isLoading}
      onSubmit={async ({ identifier, password, remember }) => {
        setIsLoading(true);
        setError('');
        try {
          const response = await authService.login(identifier, password);
          if (response.user.role !== 'faculty') {
            setError('This login is for faculty only');
            return;
          }
          setAuth(response.user, response.token, remember);
          navigate('/faculty/dashboard', { replace: true });
        } catch (err: any) {
          setError(err.response?.data?.errors?.identifier?.[0] || err.response?.data?.message || 'Login failed');
        } finally {
          setIsLoading(false);
        }
      }}
    />
  );
}
