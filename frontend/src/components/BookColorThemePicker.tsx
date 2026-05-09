import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { BOOK_COLOR_THEMES, useBookThemeStore } from '../store/bookThemeStore';

const BOOK_THEME_HINT_SEEN_KEY = 'book-theme-hint-seen';

export default function BookColorThemePicker() {
  const selectedThemeId = useBookThemeStore((state) => state.themeId);
  const customColor = useBookThemeStore((state) => state.customColor);
  const setBookTheme = useBookThemeStore((state) => state.setBookTheme);
  const setCustomBookTheme = useBookThemeStore((state) => state.setCustomBookTheme);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(BOOK_THEME_HINT_SEEN_KEY) === 'true') {
        return undefined;
      }

      setShowHint(true);
      window.localStorage.setItem(BOOK_THEME_HINT_SEEN_KEY, 'true');

      const timeout = window.setTimeout(() => {
        setShowHint(false);
      }, 10000);

      return () => window.clearTimeout(timeout);
    } catch {
      setShowHint(true);

      const timeout = window.setTimeout(() => {
        setShowHint(false);
      }, 10000);

      return () => window.clearTimeout(timeout);
    }
  }, []);

  return (
    <div className="book-color-theme-picker" role="group" aria-label="Screen and book color">
      {showHint ? <span className="book-color-theme-hint" aria-hidden="true">Hover to change color</span> : null}
      <label
        className={`book-color-theme-trigger${selectedThemeId === 'custom' ? ' active' : ''}`}
        title="Change theme color"
      >
        <input
          type="color"
          value={customColor}
          aria-label="Choose custom screen and book color"
          onChange={(event) => setCustomBookTheme(event.currentTarget.value)}
        />
      </label>
      <div className="book-color-theme-popover">
        <span className="book-color-theme-popover-icon" aria-hidden="true">
          <BookOpen size={15} />
        </span>
        <div className="book-color-theme-swatches">
          {BOOK_COLOR_THEMES.map((theme) => {
            const isSelected = theme.id === selectedThemeId;

            return (
              <button
                type="button"
                className={`book-color-theme-swatch${isSelected ? ' active' : ''}`}
                key={theme.id}
                style={{ background: theme.swatch }}
                aria-label={`Use ${theme.name} book color`}
                aria-pressed={isSelected}
                title={theme.name}
                onClick={() => setBookTheme(theme.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
