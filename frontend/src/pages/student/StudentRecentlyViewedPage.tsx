import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BookMarked,
  Clock3,
  Eye,
  LayoutList,
} from 'lucide-react';
import StudentLayout from '../../components/student/StudentLayout';
import { thesisService } from '../../services/thesisService';

type RecentlyViewedRecord = {
  id: string;
  viewed_at?: string;
  thesis?: {
    id: string;
    title: string;
    authors?: string[];
    department?: string | null;
    program?: string | null;
    school_year?: string | null;
    keywords?: string[];
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
};

type ActivityCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  toneClass: string;
  panelTitle: string;
  panelSubtitle: string;
};

const formatMonthYear = (value?: string) => {
  if (!value) return 'No recent update';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent update';

  return `Updated ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
};

export default function StudentRecentlyViewedPage() {
  const [items, setItems] = useState<RecentlyViewedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('latest');

  useEffect(() => {
    setLoading(true);
    setError(null);

    void thesisService.recentlyViewed()
      .then((response) => {
        setItems((response?.data ?? []).filter((item: RecentlyViewedRecord) => item?.thesis));
      })
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : 'Failed to load recently viewed theses.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activityCards = useMemo<ActivityCard[]>(() => {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const last24Hours = items.filter((item) => {
      const viewedAt = item.viewed_at ? new Date(item.viewed_at).getTime() : 0;
      return viewedAt >= dayAgo;
    }).length;

    const thisWeek = items.filter((item) => {
      const viewedAt = item.viewed_at ? new Date(item.viewed_at).getTime() : 0;
      return viewedAt >= weekAgo;
    }).length;

    const categories = new Set(
      items
        .map((item) => item.thesis?.category?.name)
        .filter(Boolean),
    ).size;

    const authors = new Set(
      items.flatMap((item) => item.thesis?.authors ?? []).filter(Boolean),
    ).size;

    const activeReads = new Set(
      items.map((item) => item.thesis?.id).filter(Boolean),
    ).size;

    return [
      {
        key: 'last24',
        title: 'Viewed in the last 24 hours',
        subtitle: `${last24Hours} thesis${last24Hours === 1 ? '' : 'es'} opened`,
        icon: <Eye size={18} />,
        toneClass: 'phi-maroon',
        panelTitle: 'Viewed in the Last 24 Hours',
        panelSubtitle: 'Theses you opened during the past day',
      },
      {
        key: 'week',
        title: 'Activity this week',
        subtitle: `${thisWeek} recent view${thisWeek === 1 ? '' : 's'}`,
        icon: <ArrowDownToLine size={18} />,
        toneClass: 'phi-blue',
        panelTitle: 'This Week\'s Reading',
        panelSubtitle: 'Recent archive views from the last 7 days',
      },
      {
        key: 'categories',
        title: 'Most read categories',
        subtitle: `${categories} research area${categories === 1 ? '' : 's'} explored`,
        icon: <BookMarked size={18} />,
        toneClass: 'phi-green',
        panelTitle: 'Top Category Reads',
        panelSubtitle: 'Recently viewed theses from your most visited category',
      },
      {
        key: 'authors',
        title: 'Authors explored',
        subtitle: `${authors} author${authors === 1 ? '' : 's'} in your history`,
        icon: <LayoutList size={18} />,
        toneClass: 'phi-terracotta',
        panelTitle: 'Author Reading History',
        panelSubtitle: 'Theses from the author you read most often',
      },
      {
        key: 'resume',
        title: 'Resume reading',
        subtitle: `${activeReads} thesis${activeReads === 1 ? '' : 'es'} in your recent list`,
        icon: <Clock3 size={18} />,
        toneClass: 'phi-sky',
        panelTitle: 'Resume Reading',
        panelSubtitle: 'Unique thesis titles from your recent reading list',
      },
    ];
  }, [items]);

  const activeCard = useMemo(
    () => activityCards.find((card) => card.key === activeFilter) ?? activityCards[0],
    [activityCards, activeFilter],
  );

  const filteredItems = useMemo(() => {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    if (activeFilter === 'last24') {
      return items.filter((item) => {
        const viewedAt = item.viewed_at ? new Date(item.viewed_at).getTime() : 0;
        return viewedAt >= dayAgo;
      });
    }

    if (activeFilter === 'week') {
      return items.filter((item) => {
        const viewedAt = item.viewed_at ? new Date(item.viewed_at).getTime() : 0;
        return viewedAt >= weekAgo;
      });
    }

    if (activeFilter === 'categories') {
      const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
        const name = item.thesis?.category?.name;
        if (!name) return acc;
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
      }, {});

      const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      return topCategory ? items.filter((item) => item.thesis?.category?.name === topCategory) : [];
    }

    if (activeFilter === 'authors') {
      const authorCounts = items.reduce<Record<string, number>>((acc, item) => {
        (item.thesis?.authors ?? []).forEach((author) => {
          if (!author) return;
          acc[author] = (acc[author] ?? 0) + 1;
        });
        return acc;
      }, {});

      const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      return topAuthor ? items.filter((item) => (item.thesis?.authors ?? []).includes(topAuthor)) : [];
    }

    if (activeFilter === 'resume') {
      const seen = new Set<string>();
      return items.filter((item) => {
        const thesisId = item.thesis?.id;
        if (!thesisId || seen.has(thesisId)) return false;
        seen.add(thesisId);
        return true;
      });
    }

    return items;
  }, [activeFilter, items]);

  const latestUpdatedLabel = formatMonthYear(items[0]?.viewed_at);

  return (
    <StudentLayout
      title="Recent Activity"
      description="Browse your latest thesis interactions and jump back into your reading list."
    >
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      <div className="student-recent-layout">
        <section className="student-recent-activity">
          {activityCards.map((card, index) => (
            <button
              type="button"
              key={card.key}
              className={`student-recent-stat-card vpaa-card student-recent-revealed student-recent-delay-${Math.min(index + 1, 4)}${activeFilter === card.key ? ' active' : ''}`}
              onClick={() => setActiveFilter(card.key)}
            >
              <div className={`student-recent-stat-icon ${card.toneClass}`}>{card.icon}</div>
              <div className="student-recent-stat-copy">
                <h3>{card.title}</h3>
                <p>{loading ? 'Loading activity...' : card.subtitle}</p>
              </div>
            </button>
          ))}
        </section>

        <section className="student-recent-panel vpaa-card">
          <div className="student-recent-panel-head">
            <div>
              <h2>{activeCard?.panelTitle ?? 'Recently Viewed Theses'}</h2>
              <p>{activeCard?.panelSubtitle ?? 'Your latest thesis reads from the archive'}</p>
            </div>
            <span>{latestUpdatedLabel}</span>
          </div>

          {loading ? (
            <div className="student-recent-empty">Loading recently viewed theses...</div>
          ) : filteredItems.length ? (
            <div className="student-recent-grid">
              {filteredItems.map((item, index) => {
                const thesis = item.thesis;

                if (!thesis) return null;

                return (
                  <article
                    key={item.id}
                    className={`student-recent-card student-recent-revealed student-recent-delay-${(index % 4) + 1}`}
                  >
                    <div className="vpaa-cover student-recent-cover">
                      <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                      <div className="vpaa-cover-meta">{thesis.department || thesis.program || 'Student Research Archive'}</div>
                      <div className="vpaa-cover-title">{thesis.title}</div>
                    </div>

                    <div className="student-recent-card-body">
                      <h3>{thesis.title}</h3>
                      <p>
                        {(thesis.authors ?? []).join(', ') || 'Unknown author'}
                        {thesis.school_year ? ` - ${thesis.school_year}` : ''}
                      </p>

                      <div className="student-recent-tags">
                        {(thesis.keywords ?? []).slice(0, 2).map((keyword) => (
                          <span key={keyword} className="student-recent-tag">{keyword}</span>
                        ))}
                        {!thesis.keywords?.length && thesis.category?.name ? (
                          <span className="student-recent-tag">{thesis.category.name}</span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="student-recent-empty">No theses match this activity yet.</div>
          )}
        </section>
      </div>
    </StudentLayout>
  );
}
