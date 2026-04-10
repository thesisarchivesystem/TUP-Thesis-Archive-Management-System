import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const auth = useAuthStore();

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: !!auth.token,
    setAuth: auth.setAuth,
    logout: auth.logout,
  };
}
