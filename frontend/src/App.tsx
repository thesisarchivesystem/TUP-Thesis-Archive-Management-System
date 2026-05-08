import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { getBookColorTheme, getBookScreenThemeVariables, useBookThemeStore } from './store/bookThemeStore';
import { ConfirmDialogProvider } from './components/confirm/ConfirmDialogProvider';
import AppRouter from './router/AppRouter';
import { updateThemedFavicon } from './utils/themeFavicon';

function App() {
  const theme = useThemeStore((state) => state.theme);
  const bookThemeId = useBookThemeStore((state) => state.themeId);
  const customBookColor = useBookThemeStore((state) => state.customColor);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const bookTheme = getBookColorTheme(bookThemeId, customBookColor);
    const themeVariables = getBookScreenThemeVariables(bookTheme, theme);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    updateThemedFavicon(themeVariables['--maroon']);
  }, [bookThemeId, customBookColor, theme]);

  return (
    <ConfirmDialogProvider>
      <AppRouter />
    </ConfirmDialogProvider>
  );
}

export default App;
