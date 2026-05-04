import { create } from 'zustand';

export type PresetBookColorThemeId = 'archive-red' | 'rose' | 'violet' | 'indigo' | 'amber' | 'meadow' | 'emerald';
export type BookColorThemeId = PresetBookColorThemeId | 'custom';
export type BookThemeMode = 'light' | 'dark';
export type BookThemeCssVarMap = Record<`--${string}`, string>;

export type BookColorTheme = {
  id: BookColorThemeId;
  name: string;
  swatch: string;
  page: string;
  panel: string;
  spine: string;
  footer: string;
  line: string;
  text: string;
  meta: string;
  footerText: string;
  footerSubtext: string;
  pillBg: string;
  pillText: string;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const DEFAULT_CUSTOM_COLOR = '#8b2332';
const BOOK_THEME_STORAGE_KEY = 'tams-book-color-theme';
const BOOK_CUSTOM_COLOR_STORAGE_KEY = 'tams-book-custom-color';

export const BOOK_COLOR_THEMES: BookColorTheme[] = [
  {
    id: 'archive-red',
    name: 'Archive red',
    swatch: '#c83538',
    page: 'linear-gradient(180deg, #fbf6f0 0%, #efe6db 100%)',
    panel: 'linear-gradient(180deg, #c83538 0%, #b11f24 100%)',
    spine: 'linear-gradient(180deg, #a71d22 0%, #8f161b 100%)',
    footer: 'linear-gradient(180deg, #f3e7db 0%, #e8d8ca 100%)',
    line: 'rgba(255, 255, 255, 0.26)',
    text: '#fff7f4',
    meta: 'rgba(255, 243, 237, 0.78)',
    footerText: '#4f3e33',
    footerSubtext: 'rgba(79, 62, 51, 0.78)',
    pillBg: 'rgba(255, 251, 247, 0.98)',
    pillText: '#99412c',
  },
  {
    id: 'rose',
    name: 'Rose',
    swatch: '#d57f82',
    page: 'linear-gradient(180deg, #fff7f6 0%, #f0dfdc 100%)',
    panel: 'linear-gradient(180deg, #d57f82 0%, #a84a55 100%)',
    spine: 'linear-gradient(180deg, #a84a55 0%, #78313b 100%)',
    footer: 'linear-gradient(180deg, #fff0eb 0%, #ecd9d2 100%)',
    line: 'rgba(255, 255, 255, 0.28)',
    text: '#fffaf8',
    meta: 'rgba(255, 246, 243, 0.82)',
    footerText: '#4f3336',
    footerSubtext: 'rgba(79, 51, 54, 0.76)',
    pillBg: 'rgba(255, 250, 247, 0.96)',
    pillText: '#8c3940',
  },
  {
    id: 'violet',
    name: 'Violet',
    swatch: '#5b18e8',
    page: 'linear-gradient(180deg, #f8f5ff 0%, #e5def4 100%)',
    panel: 'linear-gradient(180deg, #5b18e8 0%, #35108b 100%)',
    spine: 'linear-gradient(180deg, #3f12a8 0%, #23085d 100%)',
    footer: 'linear-gradient(180deg, #eee8ff 0%, #ddd3f4 100%)',
    line: 'rgba(255, 255, 255, 0.24)',
    text: '#fbf8ff',
    meta: 'rgba(239, 231, 255, 0.78)',
    footerText: '#30264f',
    footerSubtext: 'rgba(48, 38, 79, 0.76)',
    pillBg: 'rgba(249, 246, 255, 0.96)',
    pillText: '#3a1d8f',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    swatch: '#0f0aa8',
    page: 'linear-gradient(180deg, #f3f5ff 0%, #dde1f2 100%)',
    panel: 'linear-gradient(180deg, #1214b8 0%, #08076d 100%)',
    spine: 'linear-gradient(180deg, #0b0b88 0%, #050546 100%)',
    footer: 'linear-gradient(180deg, #e9edff 0%, #d8def3 100%)',
    line: 'rgba(255, 255, 255, 0.22)',
    text: '#f8faff',
    meta: 'rgba(235, 240, 255, 0.78)',
    footerText: '#25294c',
    footerSubtext: 'rgba(37, 41, 76, 0.76)',
    pillBg: 'rgba(247, 249, 255, 0.96)',
    pillText: '#14167e',
  },
  {
    id: 'amber',
    name: 'Amber',
    swatch: '#ff7a1a',
    page: 'linear-gradient(180deg, #fff8ee 0%, #ead8be 100%)',
    panel: 'linear-gradient(180deg, #ff7a1a 0%, #c74b09 100%)',
    spine: 'linear-gradient(180deg, #d85b0f 0%, #873107 100%)',
    footer: 'linear-gradient(180deg, #fff1d8 0%, #ead3af 100%)',
    line: 'rgba(255, 255, 255, 0.24)',
    text: '#fffaf2',
    meta: 'rgba(255, 246, 226, 0.82)',
    footerText: '#51320d',
    footerSubtext: 'rgba(81, 50, 13, 0.74)',
    pillBg: 'rgba(255, 249, 238, 0.96)',
    pillText: '#94410b',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    swatch: '#79dd55',
    page: 'linear-gradient(180deg, #f5ffef 0%, #dcefd2 100%)',
    panel: 'linear-gradient(180deg, #88e35d 0%, #4faf37 100%)',
    spine: 'linear-gradient(180deg, #5caf3d 0%, #2f7325 100%)',
    footer: 'linear-gradient(180deg, #f2ffe8 0%, #d7ebc9 100%)',
    line: 'rgba(17, 55, 19, 0.22)',
    text: '#102d12',
    meta: 'rgba(16, 45, 18, 0.78)',
    footerText: '#173018',
    footerSubtext: 'rgba(23, 48, 24, 0.72)',
    pillBg: 'rgba(250, 255, 244, 0.96)',
    pillText: '#23631c',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    swatch: '#10b86b',
    page: 'linear-gradient(180deg, #effdf7 0%, #d2efe4 100%)',
    panel: 'linear-gradient(180deg, #10b86b 0%, #05764a 100%)',
    spine: 'linear-gradient(180deg, #078a55 0%, #034a31 100%)',
    footer: 'linear-gradient(180deg, #e8fff5 0%, #ccecdf 100%)',
    line: 'rgba(255, 255, 255, 0.24)',
    text: '#f4fff9',
    meta: 'rgba(229, 255, 242, 0.82)',
    footerText: '#123b2d',
    footerSubtext: 'rgba(18, 59, 45, 0.74)',
    pillBg: 'rgba(244, 255, 249, 0.96)',
    pillText: '#075d3a',
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const normalizeHexColor = (color: string | null | undefined, fallback = DEFAULT_CUSTOM_COLOR) => {
  const value = (color ?? '').trim().replace(/^#/, '');

  if (/^[\da-f]{3}$/i.test(value)) {
    return `#${value.split('').map((character) => character + character).join('').toLowerCase()}`;
  }

  if (/^[\da-f]{6}$/i.test(value)) {
    return `#${value.toLowerCase()}`;
  }

  return fallback;
};

const hexToRgb = (color: string): RgbColor => {
  const normalized = normalizeHexColor(color);

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }: RgbColor) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const mixHex = (baseColor: string, targetColor: string, targetWeight: number) => {
  const base = hexToRgb(baseColor);
  const target = hexToRgb(targetColor);
  const weight = clamp(targetWeight, 0, 1);

  return rgbToHex({
    r: base.r * (1 - weight) + target.r * weight,
    g: base.g * (1 - weight) + target.g * weight,
    b: base.b * (1 - weight) + target.b * weight,
  });
};

const rgba = (color: string, alpha: number) => {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const linearChannel = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ r, g, b }: RgbColor) =>
  (0.2126 * linearChannel(r)) + (0.7152 * linearChannel(g)) + (0.0722 * linearChannel(b));

const contrastRatio = (first: RgbColor, second: RgbColor) => {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
};

const readableTextFor = (background: string) => {
  const backgroundRgb = hexToRgb(background);
  const lightText = hexToRgb('#fffaf5');
  const darkText = hexToRgb('#171411');

  return contrastRatio(backgroundRgb, lightText) >= contrastRatio(backgroundRgb, darkText)
    ? '#fffaf5'
    : '#171411';
};

const getReadableUiAccent = (color: string, mode: BookThemeMode) => {
  const surface = hexToRgb(mode === 'dark' ? '#241c22' : '#ffffff');
  const whiteText = hexToRgb('#ffffff');
  const minimumSurfaceContrast = mode === 'dark' ? 3 : 4.5;
  const candidates = [normalizeHexColor(color)];

  for (let step = 1; step <= 36; step += 1) {
    const weight = step / 40;
    candidates.push(mixHex(color, '#000000', weight), mixHex(color, '#ffffff', weight));
  }

  return candidates.find((candidate) => {
    const candidateRgb = hexToRgb(candidate);
    return contrastRatio(candidateRgb, whiteText) >= 4.5
      && contrastRatio(candidateRgb, surface) >= minimumSurfaceContrast;
  }) ?? (mode === 'dark' ? '#9b8f92' : '#6e1c28');
};

const createCustomBookColorTheme = (color: string): BookColorTheme => {
  const swatch = normalizeHexColor(color);
  const panelStart = mixHex(swatch, '#ffffff', 0.05);
  const panelEnd = mixHex(swatch, '#000000', 0.3);
  const panelText = readableTextFor(mixHex(panelStart, panelEnd, 0.48));
  const footerBase = mixHex(swatch, '#ffffff', 0.82);
  const footerText = readableTextFor(footerBase);
  const usesLightPanelText = panelText === '#fffaf5';

  return {
    id: 'custom',
    name: 'Custom',
    swatch,
    page: `linear-gradient(180deg, ${mixHex(swatch, '#ffffff', 0.94)} 0%, ${mixHex(swatch, '#ffffff', 0.78)} 100%)`,
    panel: `linear-gradient(180deg, ${panelStart} 0%, ${panelEnd} 100%)`,
    spine: `linear-gradient(180deg, ${mixHex(swatch, '#000000', 0.16)} 0%, ${mixHex(swatch, '#000000', 0.48)} 100%)`,
    footer: `linear-gradient(180deg, ${mixHex(footerBase, '#ffffff', 0.24)} 0%, ${mixHex(footerBase, '#000000', 0.08)} 100%)`,
    line: usesLightPanelText ? 'rgba(255, 255, 255, 0.26)' : 'rgba(23, 20, 17, 0.2)',
    text: panelText,
    meta: usesLightPanelText ? 'rgba(255, 250, 245, 0.8)' : 'rgba(23, 20, 17, 0.74)',
    footerText,
    footerSubtext: footerText === '#fffaf5' ? 'rgba(255, 250, 245, 0.76)' : 'rgba(23, 20, 17, 0.72)',
    pillBg: usesLightPanelText ? 'rgba(255, 251, 247, 0.96)' : 'rgba(255, 255, 255, 0.72)',
    pillText: usesLightPanelText ? mixHex(swatch, '#000000', 0.42) : mixHex(swatch, '#000000', 0.58),
  };
};

export const getBookColorTheme = (id: string | null | undefined, customColor = DEFAULT_CUSTOM_COLOR) => {
  if (id === 'custom') {
    return createCustomBookColorTheme(customColor);
  }

  return BOOK_COLOR_THEMES.find((theme) => theme.id === id) ?? BOOK_COLOR_THEMES[0];
};

export const getBookScreenThemeVariables = (bookTheme: BookColorTheme, mode: BookThemeMode): BookThemeCssVarMap => {
  const accent = getReadableUiAccent(bookTheme.swatch, mode);
  const accentDark = mixHex(accent, '#000000', mode === 'dark' ? 0.12 : 0.22);
  const accentLight = mixHex(accent, '#ffffff', 0.18);
  const accentRgb = hexToRgb(accent);

  return {
    '--book-theme-accent-rgb': `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
    '--maroon': accent,
    '--maroon-dark': accentDark,
    '--maroon-light': accentLight,
    '--border': rgba(accent, mode === 'dark' ? 0.12 : 0.08),
    '--border-strong': rgba(accent, mode === 'dark' ? 0.18 : 0.14),
    '--input-border': rgba(accent, mode === 'dark' ? 0.16 : 0.12),
    '--sidebar-active-bg': rgba(accent, mode === 'dark' ? 0.16 : 0.07),
    '--sidebar-hover-bg': rgba(accent, mode === 'dark' ? 0.09 : 0.04),
    '--stat-maroon-bg': rgba(accent, mode === 'dark' ? 0.16 : 0.08),
    '--theme-surface-wash': rgba(accent, mode === 'dark' ? 0.08 : 0.035),
    '--theme-surface-wash-strong': rgba(accent, mode === 'dark' ? 0.13 : 0.07),
    '--bg-quote': `linear-gradient(135deg, ${accentLight} 0%, ${accent} 52%, ${accentDark} 100%)`,
  };
};

const getInitialBookTheme = (): BookColorThemeId => {
  try {
    const saved = localStorage.getItem(BOOK_THEME_STORAGE_KEY);
    if (saved === 'custom' || BOOK_COLOR_THEMES.some((theme) => theme.id === saved)) {
      return saved as BookColorThemeId;
    }
  } catch {
    // Storage can be unavailable in private browsing or during tests.
  }

  return 'archive-red';
};

const getInitialCustomColor = () => {
  try {
    return normalizeHexColor(localStorage.getItem(BOOK_CUSTOM_COLOR_STORAGE_KEY));
  } catch {
    return DEFAULT_CUSTOM_COLOR;
  }
};

const saveBookThemeToStorage = (themeId: BookColorThemeId) => {
  try {
    localStorage.setItem(BOOK_THEME_STORAGE_KEY, themeId);
  } catch {
    // Keep the in-memory preference even if persistence is unavailable.
  }
};

const saveCustomColorToStorage = (color: string) => {
  try {
    localStorage.setItem(BOOK_CUSTOM_COLOR_STORAGE_KEY, color);
  } catch {
    // Keep the in-memory preference even if persistence is unavailable.
  }
};

interface BookThemeState {
  themeId: BookColorThemeId;
  customColor: string;
  setBookTheme: (themeId: BookColorThemeId) => void;
  setCustomBookTheme: (color: string) => void;
}

export const useBookThemeStore = create<BookThemeState>((set) => ({
  themeId: getInitialBookTheme(),
  customColor: getInitialCustomColor(),
  setBookTheme: (themeId) => {
    saveBookThemeToStorage(themeId);
    set({ themeId });
  },
  setCustomBookTheme: (color) => {
    const normalizedColor = normalizeHexColor(color);
    saveBookThemeToStorage('custom');
    saveCustomColorToStorage(normalizedColor);
    set({ themeId: 'custom', customColor: normalizedColor });
  },
}));
