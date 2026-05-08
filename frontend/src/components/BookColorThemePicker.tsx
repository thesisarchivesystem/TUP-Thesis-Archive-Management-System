import { BookOpen } from 'lucide-react';
import { BOOK_COLOR_THEMES, useBookThemeStore } from '../store/bookThemeStore';

export default function BookColorThemePicker() {
  const selectedThemeId = useBookThemeStore((state) => state.themeId);
  const customColor = useBookThemeStore((state) => state.customColor);
  const setBookTheme = useBookThemeStore((state) => state.setBookTheme);
  const setCustomBookTheme = useBookThemeStore((state) => state.setCustomBookTheme);

  return (
    <div className="book-color-theme-picker" role="group" aria-label="Screen and book color">
      <BookOpen className="book-color-theme-picker-icon" size={15} aria-hidden="true" />
      <div className="book-color-theme-picker-swatches">
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
        <label
          className={`book-color-theme-custom${selectedThemeId === 'custom' ? ' active' : ''}`}
          title="Custom color"
        >
          <input
            type="color"
            value={customColor}
            aria-label="Choose custom screen and book color"
            onChange={(event) => setCustomBookTheme(event.currentTarget.value)}
          />
        </label>
      </div>
    </div>
  );
}
