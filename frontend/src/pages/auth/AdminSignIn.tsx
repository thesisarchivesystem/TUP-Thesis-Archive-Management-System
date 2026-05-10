import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboardPathForRole, useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import RoleSignInLayout from './RoleSignInLayout';

export default function AdminSignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const activeUser = useAuthStore((s) => s.user);
  const activeToken = useAuthStore((s) => s.token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeUser && activeToken) {
      navigate(getDashboardPathForRole(activeUser.role), { replace: true });
    }
  }, [activeToken, activeUser, navigate]);

  return (
    <RoleSignInLayout
      pageTitle="Admin Sign In - Thesis Archive Management System"
      heading="Admin Sign In"
      description="Use your internal administrator credentials to manage users, academic structures, and archive configuration."
      showcaseHeading={<>Internal archive <em>administration</em></>}
      showcaseDescription="This portal is reserved for internal management and does not participate in thesis approval workflow."
      roleBadgeText="Internal Admin"
      roleBadgeIcon={<ShieldCheck size={14} />}
      showcaseStats={[
        { value: '100%', label: 'Internal' },
        { value: '4', label: 'Core Modules' },
        { value: '/admin', label: 'Portal Path' },
      ]}
      identifierLabel="Admin Email"
      identifierPlaceholder="e.g. admin@tup.edu.ph"
      roleSwitchLinks={[
        { label: 'Student', to: '/sign-in/student' },
        { label: 'Faculty', to: '/sign-in/faculty' },
      ]}
      accent={{
        successBgLight: 'rgba(61,139,74,0.12)',
        successTextLight: '#276437',
        successBgDark: 'rgba(91,175,104,0.16)',
        successTextDark: '#8fd39b',
      }}
      error={error}
      isLoading={isLoading}
      onSubmit={async ({ identifier, password, remember }) => {
        setIsLoading(true);
        setError('');
        try {
          const response = await authService.login(identifier, password);
          if (response.user.role !== 'admin') {
            setError('This login is for internal admin accounts only.');
            return;
          }
          setAuth(response.user, response.token, remember);
          navigate('/admin/dashboard', { replace: true });
        } catch (err: any) {
          setError(err.response?.data?.errors?.identifier?.[0] || err.response?.data?.message || 'Login failed');
        } finally {
          setIsLoading(false);
        }
      }}
    />
  );
}
