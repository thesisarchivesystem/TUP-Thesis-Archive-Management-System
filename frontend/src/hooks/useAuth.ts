import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const auth = useAuthStore();
  const confirmAndLogout = () => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to log out?')) {
      return;
    }

    auth.logout();
  };

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: !!auth.token,
    rememberMe: auth.rememberMe,
    setAuth: auth.setAuth,
    updateUser: auth.updateUser,
    logout: auth.logout,
    confirmAndLogout,
  };
}
