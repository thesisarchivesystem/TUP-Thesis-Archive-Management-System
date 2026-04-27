import { useAuthStore } from '../store/authStore';
import { useConfirmDialog } from './useConfirmDialog';

export function useAuth() {
  const auth = useAuthStore();
  const { confirm } = useConfirmDialog();
  const confirmAndLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to log out?',
      confirmLabel: 'OK',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
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
