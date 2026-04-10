import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import AppRouter from './router/AppRouter';

function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <AppRouter />;
}

export default App;
