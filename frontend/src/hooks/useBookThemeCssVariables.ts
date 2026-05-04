import { useMemo, type CSSProperties } from 'react';
import {
  getBookColorTheme,
  getBookScreenThemeVariables,
  useBookThemeStore,
  type BookThemeMode,
} from '../store/bookThemeStore';

export type BookThemeCssVariables = CSSProperties & Record<`--${string}`, string>;

export const useBookThemeCssVariables = (mode: BookThemeMode): BookThemeCssVariables => {
  const themeId = useBookThemeStore((state) => state.themeId);
  const customColor = useBookThemeStore((state) => state.customColor);

  return useMemo(() => {
    const bookTheme = getBookColorTheme(themeId, customColor);
    return getBookScreenThemeVariables(bookTheme, mode) as BookThemeCssVariables;
  }, [customColor, mode, themeId]);
};
