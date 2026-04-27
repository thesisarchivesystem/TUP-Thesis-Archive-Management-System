import { useEffect, useMemo, useState } from 'react';
import { Activity, FilePlus2, LibraryBig } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionLoadingScreen from '../SectionLoadingScreen';
import ThesisArchiveCover from '../thesis/ThesisArchiveCover';

type DashboardThesis = {
  id: string;
  title: string;
  author: string;
  authors?: string[];
  submitter_name?: string | null;
  year: string | null;
  college?: string | null;
  department: string;
  program?: string | null;
  category?: string | null;
  categories?: Array<{ id: string; name: string; slug: string }>;
  keywords?: string[];
  archived_at?: string | null;
  approved_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
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
    const rawAuthor = item.author || item.submitter_name || 'Unknown author';
    const authors = rawAuthor
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const compactAuthor = authors.length > 1 ? `${authors[0]} et al.` : authors[0] || rawAuthor;
    const authorLine = item.year ? `${compactAuthor} · ${item.year}` : compactAuthor;

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
          author={authorLine}
          year={item.year}
          categories={item.categories?.filter((category) => Boolean(category?.name)).length
            ? item.categories.filter((category): category is { id: string; name: string; slug: string } => Boolean(category?.name))
            : [item.category, item.program || item.department, ...(item.keywords ?? [])]
                .filter(Boolean)
                .slice(0, 2)
                .map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
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
        <span
          className="inline-flex items-center rounded-full border border-[rgba(139,35,50,0.12)] bg-[rgba(139,35,50,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--maroon)]"
        >
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
