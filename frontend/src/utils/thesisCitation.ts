import type { Thesis } from '../types/thesis.types';

const REPOSITORY_NAME = 'TUP Thesis Archive';
const SURNAME_PARTICLES = new Set([
  'da',
  'de',
  'del',
  'dela',
  'della',
  'der',
  'di',
  'dos',
  'du',
  'la',
  'le',
  'san',
  'st',
  'st.',
  'van',
  'von',
]);

const capitalizeFirstLetter = (value: string) =>
  value.replace(/[A-Za-z]/, (letter) => letter.toUpperCase());

const toApaSentenceCase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const tokens = trimmed.split(/(\s+)/);
  const normalized = tokens
    .map((token) => {
      if (/^\s+$/.test(token)) return token;

      const bareToken = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
      if (/^[A-Z0-9]{2,}$/.test(bareToken)) {
        return token;
      }

      return token.toLowerCase();
    })
    .join('');

  return capitalizeFirstLetter(normalized).replace(/:\s+[a-z]/g, (match) => match.toUpperCase());
};

const resolveSurname = (parts: string[]) => {
  if (parts.length <= 1) return parts;

  const surnameParts = [parts[parts.length - 1]];
  let cursor = parts.length - 2;

  while (cursor >= 0 && SURNAME_PARTICLES.has(parts[cursor].toLowerCase())) {
    surnameParts.unshift(parts[cursor]);
    cursor -= 1;
  }

  return surnameParts;
};

const formatApaAuthor = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  const surnameParts = resolveSurname(parts);
  const givenParts = parts.slice(0, parts.length - surnameParts.length);
  const initials = givenParts
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .map((letter) => `${letter}.`)
    .join(' ');

  return `${surnameParts.join(' ')}, ${initials}`.trim();
};

const formatApaAuthors = (authors: string[]) => {
  const formattedAuthors = authors
    .map((author) => formatApaAuthor(author))
    .filter(Boolean);

  if (formattedAuthors.length === 0) return 'Unknown author';
  if (formattedAuthors.length === 1) return formattedAuthors[0];
  if (formattedAuthors.length === 2) return `${formattedAuthors[0]}, & ${formattedAuthors[1]}`;

  return `${formattedAuthors.slice(0, -1).join(', ')}, & ${formattedAuthors[formattedAuthors.length - 1]}`;
};

const ensureTerminalPeriod = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

export const buildApa7ThesisCitation = (thesis: Thesis, currentUrl?: string) => {
  const authors = thesis.authors?.filter(Boolean).length
    ? thesis.authors.filter(Boolean)
    : [thesis.submitter?.name || thesis.submitter_name || 'Unknown author'];
  const authorSegment = formatApaAuthors(authors);
  const year = thesis.school_year || thesis.approved_at?.slice(0, 4) || thesis.created_at?.slice(0, 4) || 'n.d.';
  const titleSegment = ensureTerminalPeriod(toApaSentenceCase(thesis.title));
  const isArchivedThesis = Boolean(thesis.is_archived);
  const repositorySegment = isArchivedThesis ? ` ${REPOSITORY_NAME}.` : '';
  const urlSegment = isArchivedThesis && currentUrl ? ` ${currentUrl}` : '';

  return `${authorSegment} (${year}). ${titleSegment}${repositorySegment}${urlSegment}`.replace(/\s{2,}/g, ' ').trim();
};
