import { useEffect, useMemo, useState } from 'react';
import { Activity, FilePlus2, LibraryBig } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionLoadingScreen from '../SectionLoadingScreen';
import ThesisArchiveCover from '../thesis/ThesisArchiveCover';

type DashboardThesis = {
  id: string;
  title: string;
  author?: string | null;
  authors?: Array<string | null | undefined>;
  submitter?: {
    name?: string | null;
  } | null;
  submitter_name?: string | null;
  year?: string | number | null;
  school_year?: string | null;
  college?: string | null;
  department: string;
  program?: string | null;
  category?: string | { id?: string; name?: string | null; slug?: string | null } | null;
  categories?: Array<string | { id?: string; name?: string | null; slug?: string | null } | null | undefined>;
  keywords?: Array<string | null | undefined>;
  archived_at?: string | null;
  approved_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type DisplayCategory = {
  id: string;
  name: string;
  slug?: string;
};

type SharedDashboardThesisCollectionViewProps = {
  emptyMessage: string;
  fetchItems: () => Promise<DashboardThesis[]>;
  role: 'student' | 'faculty' | 'vpaa';
  section: 'recently-added' | 'top-searches' | 'all';
};

const sortDashboardTheses = <T extends DashboardThesis>(items: T[]) => [...items].sort((left, right) => {
  const leftTime = new Date(left.archived_at || left.updated_at || left.approved_at || left.created_at || 0).getTime();
  const rightTime = new Date(right.archived_at || right.updated_at || right.approved_at || right.created_at || 0).getTime();
  return rightTime - leftTime;
});

const sortDashboardThesesAlphabetically = <T extends DashboardThesis>(items: T[]) => [...items].sort((left, right) =>
  left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }));

const cleanText = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const formatYearFromDate = (value?: string | null) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : null;
};

const getThesisYear = (item: DashboardThesis) =>
  cleanText(item.year) || cleanText(item.school_year) || formatYearFromDate(item.approved_at) || formatYearFromDate(item.created_at);

const getAuthorList = (item: DashboardThesis) => {
  const authors = Array.isArray(item.authors)
    ? item.authors.map(cleanText).filter(Boolean)
    : [];

  if (authors.length) return authors;

  const author = cleanText(item.author);
  if (author) {
    return author
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  const submitterName = cleanText(item.submitter_name) || cleanText(item.submitter?.name);
  return submitterName ? [submitterName] : [];
};

const getCompactAuthor = (item: DashboardThesis) => {
  const authors = getAuthorList(item);
  if (!authors.length) return 'Unknown author';
  return authors.length > 1 ? `${authors[0]} et al.` : authors[0];
};

const normalizeCategory = (
  category: DashboardThesis['category'] | NonNullable<DashboardThesis['categories']>[number],
  fallbackId: string,
): DisplayCategory | null => {
  if (!category) return null;

  if (typeof category === 'string') {
    const name = category.trim();
    return name ? { id: fallbackId, name } : null;
  }

  const name = cleanText(category.name);
  if (!name) return null;

  return {
    id: cleanText(category.id) || fallbackId,
    name,
    slug: cleanText(category.slug) || undefined,
  };
};

const getDisplayCategories = (item: DashboardThesis): DisplayCategory[] => {
  const resolvedCategories = Array.isArray(item.categories)
    ? item.categories
        .map((category, index) => normalizeCategory(category, `${item.id}-category-${index}`))
        .filter((category): category is DisplayCategory => Boolean(category))
    : [];

  if (resolvedCategories.length) return resolvedCategories;

  return [
    item.category,
    cleanText(item.program) || cleanText(item.department),
    ...(Array.isArray(item.keywords) ? item.keywords : []),
  ]
    .map((category, index) => normalizeCategory(category, `${item.id}-fallback-category-${index}`))
    .filter((category): category is DisplayCategory => Boolean(category))
    .slice(0, 2);
};

export default function SharedDashboardThesisCollectionView({
  emptyMessage,
  fetchItems,
  role,
  section,
}: SharedDashboardThesisCollectionViewProps) {
  const [items, setItems] = useState<DashboardThesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void fetchItems()
      .then((response) => {
        setItems(section === 'all' ? sortDashboardThesesAlphabetically(response) : sortDashboardTheses(response));
      })
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : 'Failed to load theses.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchItems]);

  const heading = section === 'recently-added' ? 'Recently Added' : section === 'top-searches' ? 'Top Searches' : 'All';
  const icon = section === 'recently-added' ? <FilePlus2 size={16} /> : section === 'top-searches' ? <Activity size={16} /> : <LibraryBig size={16} />;
  const thesisBasePath = `/${role}/theses`;

  const cards = useMemo(() => items.map((item) => {
    const authors = getAuthorList(item);
    const year = getThesisYear(item);
    const categories = getDisplayCategories(item);
    return (
      <Link
        className="recent-added-card"
        key={item.id}
        to={`${thesisBasePath}/${encodeURIComponent(item.id)}`}
        state={{ thesis: item }}
      >
        <ThesisArchiveCover
          className="recent-added-card-cover"
          compact
          title={item.title}
          college={item.college}
          department={item.department}
          author={getCompactAuthor(item)}
          authors={authors}
          year={year}
          categories={categories}
        />
      </Link>
    );
  }), [items, thesisBasePath]);

  if (loading) return <SectionLoadingScreen label={`Loading ${heading.toLowerCase()}...`} />;
  if (error) return <div className="vpaa-banner-error">{error}</div>;

  return (
    <div className="vpaa-card vpaa-dashboard-panel">
      <div className="vpaa-dashboard-head">
        <h3>{icon} {heading}</h3>
        <span className="vpaa-theme-count-pill">
          {items.length} THESES
        </span>
      </div>
      {cards.length ? (
        <div className="recent-added-grid">
          {cards}
        </div>
      ) : (
        <div className="vpaa-dashboard-empty">{emptyMessage}</div>
      )}
    </div>
  );
}
