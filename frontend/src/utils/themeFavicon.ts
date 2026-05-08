const brandMarkPaths = [
  'M22 19.5 32 15l10 4.5-10 4.5-10-4.5Z',
  'M26 21.6v4.4',
  'M38 21.6v4.4',
  'M17.5 25.5c5.8 0 11 1.4 14.5 5v19c-3.5-3.6-8.7-5-14.5-5Z',
  'M46.5 25.5c-5.8 0-11 1.4-14.5 5v19c3.5-3.6 8.7-5 14.5-5Z',
  'M20.5 30.4c4.1.2 7.5 1.2 10.1 3',
  'M20.5 35.2c4.1.2 7.5 1.2 10.1 3',
  'M20.5 40c4.1.2 7.5 1.2 10.1 3',
  'M43.5 30.4c-4.1.2-7.5 1.2-10.1 3',
  'M43.5 35.2c-4.1.2-7.5 1.2-10.1 3',
  'M43.5 40c-4.1.2-7.5 1.2-10.1 3',
  'M32 50V36.5',
  'm28.6 39.8 3.4-6.3 3.4 6.3-3.4-.6Z',
];

const sanitizeSvgColor = (color: string) => (
  /^#[\da-f]{6}$/i.test(color) ? color : '#8b2332'
);

export const buildThemedFaviconHref = (accentColor: string) => {
  const background = sanitizeSvgColor(accentColor);
  const paths = brandMarkPaths.map((path) => `<path d="${path}"/>`).join('');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="TUP Thesis Archive">',
    `<rect width="64" height="64" rx="12" fill="${background}"/>`,
    '<g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
    paths,
    '</g>',
    '</svg>',
  ].join('');

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const updateThemedFavicon = (accentColor: string) => {
  const selector = 'link[rel="icon"]';
  let favicon = document.querySelector<HTMLLinkElement>(selector);

  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }

  favicon.type = 'image/svg+xml';
  favicon.href = buildThemedFaviconHref(accentColor);
};
