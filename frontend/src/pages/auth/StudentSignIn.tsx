import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import RoleSignInLayout from './RoleSignInLayout';

function StudentBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
    </svg>
  );
}

export default function StudentSignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <RoleSignInLayout
      pageTitle="Student Sign In - Thesis Archive Management System"
      heading="Student Sign In"
      description="Enter your student credentials to access the thesis archive and browse research documents."
      showcaseHeading={
        <>
          Welcome to the
          <br />
          Thesis <em>Archive</em>
        </>
      }
      showcaseDescription="Access hundreds of thesis documents, research papers, and scholarly works from the Computer Studies Department at TUP Manila."
      roleBadgeText="Student Account"
      roleBadgeIcon={<StudentBadgeIcon />}
      showcaseStats={[
        { value: '500+', label: 'Documents' },
        { value: '3', label: 'Programs' },
        { value: '10+', label: 'Years' },
      ]}
      identifierLabel="Student ID"
      identifierPlaceholder="e.g. TUPM-21-0001"
      roleSwitchLinks={[
        { label: 'Faculty', to: '/sign-in/faculty' },
        { label: 'VPAA', to: '/sign-in/vpaa' },
      ]}
      accent={{
        successBgLight: 'rgba(61,139,74,0.08)',
        successTextLight: '#3D8B4A',
        successBgDark: 'rgba(91,175,104,0.1)',
        successTextDark: '#5BAF68',
      }}
      error={error}
      isLoading={isLoading}
      onSubmit={async ({ email, password }) => {
        setIsLoading(true);
        setError('');
        try {
          const response = await authService.login(email, password);
          if (response.user.role !== 'student') {
            setError('This login is for students only');
            return;
          }
          setAuth(response.user, response.token);
          navigate('/student/dashboard', { replace: true });
        } catch (err: any) {
          setError(err.response?.data?.message || 'Login failed');
        } finally {
          setIsLoading(false);
        }
      }}
    />
  );
}
