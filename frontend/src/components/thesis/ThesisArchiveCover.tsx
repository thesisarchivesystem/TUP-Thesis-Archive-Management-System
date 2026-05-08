import type { CSSProperties } from 'react';
import { getBookColorTheme, useBookThemeStore } from '../../store/bookThemeStore';

type ThesisCoverCategory = {
  id?: string;
  name: string;
  slug?: string;
};

type ThesisCoverStyle = CSSProperties & Record<`--${string}`, string>;

type ThesisArchiveCoverProps = {
  title: string;
  college?: string | null;
  department?: string | null;
  author?: string | null;
  authors?: string[];
  year?: string | number | null;
  categories?: ThesisCoverCategory[];
  className?: string;
  compact?: boolean;
};

const formatAuthorLine = (author?: string | null, authors?: string[]) => {
  const authorList = (authors?.filter(Boolean).length ? authors : (author ?? '').split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!authorList.length) return 'Unknown author';
  if (authorList.length === 1) return authorList[0];
  return `${authorList[0]}, ${authorList[1]}${authorList.length > 2 ? ' et al.' : ''}`;
};

export default function ThesisArchiveCover({
  title,
  author,
  authors,
  year,
  categories = [],
  className = '',
  compact = false,
}: ThesisArchiveCoverProps) {
  const visibleCategories = categories.filter((category) => category?.name).slice(0, 5);
  const authorLine = formatAuthorLine(author, authors);
  const selectedThemeId = useBookThemeStore((state) => state.themeId);
  const customColor = useBookThemeStore((state) => state.customColor);
  const bookTheme = getBookColorTheme(selectedThemeId, customColor);
  const coverStyle: ThesisCoverStyle = {
    '--thesis-cover-page': bookTheme.page,
    '--thesis-cover-panel': bookTheme.panel,
    '--thesis-cover-spine': bookTheme.spine,
    '--thesis-cover-footer': bookTheme.footer,
    '--thesis-cover-line': bookTheme.line,
    '--thesis-cover-text': bookTheme.text,
    '--thesis-cover-meta': bookTheme.meta,
    '--thesis-cover-footer-text': bookTheme.footerText,
    '--thesis-cover-footer-subtext': bookTheme.footerSubtext,
    '--thesis-cover-pill-bg': bookTheme.pillBg,
    '--thesis-cover-pill-text': bookTheme.pillText,
  };

  return (
    <div className={`thesis-archive-cover${compact ? ' compact' : ''} ${className}`.trim()} style={coverStyle}>
      <div className="thesis-archive-cover-book">
        <div className="thesis-archive-cover-spine" aria-hidden="true" />
        <div className="thesis-archive-cover-inner">
          <div className="thesis-archive-cover-top" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="thesis-archive-cover-title">{title}</div>

          <div className="thesis-archive-cover-tags">
            {visibleCategories.map((category) => (
              <span key={category.id ?? category.name} className="thesis-archive-cover-tag">
                <span>{category.name}</span>
              </span>
            ))}
          </div>

          <div className="thesis-archive-cover-footer">
            <div className="thesis-archive-cover-author">{authorLine}</div>
            <div className="thesis-archive-cover-year">{year || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
