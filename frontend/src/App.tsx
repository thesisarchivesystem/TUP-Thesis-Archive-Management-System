import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { ConfirmDialogProvider } from './components/confirm/ConfirmDialogProvider';
import AppRouter from './router/AppRouter';

function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ConfirmDialogProvider>
      <AppRouter />
    </ConfirmDialogProvider>
  );
}

export default App;
