import { useEffect, useMemo, useState } from 'react';
import { Activity, FilePlus2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import ThesisArchiveCover from '../../components/thesis/ThesisArchiveCover';
import { useAuth } from '../../hooks/useAuth';
import { useFavoriteThesisStore } from '../../store/favoriteThesisStore';
import {
  facultyDashboardService,
  type FacultyDashboardThesis,
  type FacultyDailyQuote,
} from '../../services/facultyDashboardService';

export default function FacultyDashboard() {
  const DISPLAY_LIMIT = 12;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentTheses, setRecentTheses] = useState<FacultyDashboardThesis[]>([]);
  const [topSearches, setTopSearches] = useState<FacultyDashboardThesis[]>([]);
  const [quote, setQuote] = useState<FacultyDailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const favoriteTheses = useFavoriteThesisStore((state) =>
    state.favorites
      .filter((item) => item.role === 'faculty')
      .sort((left, right) => new Date(right.favorited_at).getTime() - new Date(left.favorited_at).getTime()));

  const sortDashboardTheses = (items: FacultyDashboardThesis[]) => [...items].sort((left, right) => {
    const leftTime = new Date(left.archived_at || left.updated_at || left.approved_at || left.created_at || 0).getTime();
    const rightTime = new Date(right.archived_at || right.updated_at || right.approved_at || right.created_at || 0).getTime();
    return rightTime - leftTime;
  });

  useEffect(() => {
    if (user?.role !== 'faculty') return;

    setLoading(true);
    setError(null);

    void facultyDashboardService.getDashboard()
      .then((dashboardResponse) => {
        setRecentTheses(sortDashboardTheses(dashboardResponse.recent_theses ?? []));
        setTopSearches(dashboardResponse.top_searches ?? []);
        setQuote(dashboardResponse.daily_quote ?? null);
      })
      .catch((err) => {
        setRecentTheses([]);
        setTopSearches([]);
        setQuote(null);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.role]);

  const favoriteCards = useMemo(() => favoriteTheses.slice(0, 4), [favoriteTheses]);
  const recentlyAddedCards = useMemo(
    () => recentTheses.slice(0, DISPLAY_LIMIT),
    [recentTheses, DISPLAY_LIMIT],
  );
  const topSearchCards = useMemo(
    () => topSearches.slice(0, DISPLAY_LIMIT),
    [topSearches, DISPLAY_LIMIT],
  );
  const allCards = useMemo(
    () => [...recentTheses].sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })).slice(0, DISPLAY_LIMIT),
    [recentTheses, DISPLAY_LIMIT],
  );

  const thesisHref = (item: { id: string }) => `/faculty/theses/${encodeURIComponent(item.id)}`;
  const truncateContinueReadingTitle = (title: string, maxWords = 5) => {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return title;
    return `${words.slice(0, maxWords).join(' ')}...`;
  };
  const truncateContinueReadingAuthor = (value: string, maxLength = 22) =>
    value.length <= maxLength ? value : `${value.slice(0, maxLength).trimEnd()}...`;
  const formatAuthorSummary = (author: string, year?: string | null) => (year ? `${author} · ${year}` : author);
  const formatAuthorLine = (item: FacultyDashboardThesis) => {
    const rawAuthor = item.author || item.submitter_name || 'Student';
    const authors = rawAuthor
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const compactAuthor = authors.length > 1 ? `${authors[0]} et al.` : authors[0] || rawAuthor;

    return item.year ? `${compactAuthor} · ${item.year}` : compactAuthor;
  };

  const renderDashboardCard = (item: FacultyDashboardThesis) => {
    const tags = (item.keywords?.length ? item.keywords : [item.category, item.department]).filter(Boolean).slice(0, 2);

    return (
      <Link
        className="vpaa-category-thesis-card"
        key={item.id}
        to={thesisHref(item)}
        state={{ thesis: item }}
      >
        <ThesisArchiveCover
          className="vpaa-category-thesis-cover"
          compact
          title={item.title}
          college={item.college}
          department={item.department}
          author={formatAuthorSummary(item.author, item.year)}
          year={item.year}
          categories={item.categories?.filter((category) => Boolean(category?.name)).length
            ? item.categories.filter((category): category is { id: string; name: string; slug: string } => Boolean(category?.name))
            : tags.map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
        />
      </Link>
    );
  };

  const renderRecentlyAddedCard = (item: FacultyDashboardThesis) => {
    return (
      <Link
        className="recent-added-card"
        key={item.id}
        to={thesisHref(item)}
        state={{ thesis: item }}
      >
        <ThesisArchiveCover
          className="recent-added-card-cover"
          compact
          title={item.title}
          college={item.college}
          department={item.department}
          author={formatAuthorLine(item)}
          year={item.year}
          categories={item.categories?.filter((category) => Boolean(category?.name)).length
            ? item.categories.filter((category): category is { id: string; name: string; slug: string } => Boolean(category?.name))
            : [item.category, item.department]
                .filter(Boolean)
                .slice(0, 2)
                .map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
        />
      </Link>
    );
  };

  const renderFavoriteCard = (item: { id: string; title: string; college?: string | null; department: string; author: string; year?: string | null; category?: string | null; keywords?: string[]; categories?: Array<{ id?: string; name: string; slug?: string }>; program?: string | null; }) => {
    const tags = (item.keywords?.length ? item.keywords : [item.category, item.department]).filter(Boolean).slice(0, 2);

    return (
      <Link className="continue-reading-card" key={item.id} to={thesisHref(item)} state={{ thesis: item }}>
        <ThesisArchiveCover
          className="continue-reading-cover"
          compact
          title={truncateContinueReadingTitle(item.title)}
          college={item.college}
          department={item.department}
          author={truncateContinueReadingAuthor(item.author)}
          year={item.year}
          categories={item.categories?.filter((category) => Boolean(category?.name)).length
            ? item.categories.filter((category): category is { id?: string; name: string; slug?: string } => Boolean(category?.name))
            : tags.map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
        />
      </Link>
    );
  };

  return (
    <FacultyLayout
      title={<><span>Welcome back, </span><em>{user?.first_name || user?.name || 'Faculty'}</em>!</>}
      description="Here&apos;s an overview of thesis submissions, pending reviews, and department activity."
      hidePageIntro
    >
      <div className="vpaa-page-intro">
        <h1><span>Welcome back, </span><em>{user?.first_name || user?.name || 'Faculty'}</em> !</h1>
        <p>Here&apos;s an overview of thesis submissions, pending reviews, and department activity.</p>
      </div>

      {loading ? (
        <SectionLoadingScreen label="Loading dashboard..." />
      ) : error ? (
        <div className="vpaa-banner-error">{error}</div>
      ) : (
        <>
          <div className="vpaa-hero-row">
            <div className="vpaa-quote-banner">
              <div className="vpaa-quote-title">Today&apos;s Quote</div>
              {quote ? (
                <>
                  <p className="vpaa-quote-body">&quot;{quote.body}&quot;</p>
                  <span>- {quote.author}</span>
                </>
              ) : (
                <p className="vpaa-quote-body">No quote available.</p>
              )}
            </div>

            <div className="vpaa-cover-strip">
              <div className="vpaa-cover-strip-label">My Favorites</div>
              <div className="vpaa-cover-strip-content">
                <div className="vpaa-cover-strip-head">
                  {favoriteTheses.length > 4 ? (
                    <button
                      type="button"
                      className="vpaa-dashboard-toggle"
                      onClick={() => navigate('/faculty/dashboard/favorites')}
                    >
                      View All
                    </button>
                  ) : null}
                </div>
                <div className="vpaa-cover-scroll">
                {favoriteCards.map(renderFavoriteCard)}
                </div>
              </div>
            </div>
          </div>

          <div className="vpaa-card vpaa-dashboard-panel">
            <div className="vpaa-dashboard-head">
              <h3><FilePlus2 size={16} /> Recently Added</h3>
              {recentTheses.length > DISPLAY_LIMIT ? (
                <button
                  type="button"
                  className="vpaa-dashboard-toggle"
                  onClick={() => navigate('/faculty/dashboard/recently-added')}
                >
                  View All
                </button>
              ) : null}
            </div>
            {recentlyAddedCards.length ? (
              <div className="recent-added-grid">
                {recentlyAddedCards.map(renderRecentlyAddedCard)}
              </div>
            ) : (
              <div className="vpaa-dashboard-empty">No recently added theses are available yet.</div>
            )}
          </div>

          <div className="vpaa-card vpaa-dashboard-panel">
            <div className="vpaa-dashboard-head">
              <h3><Activity size={16} /> Top Searches</h3>
              {topSearches.length > DISPLAY_LIMIT ? (
                <button
                  type="button"
                  className="vpaa-dashboard-toggle"
                  onClick={() => navigate('/faculty/dashboard/top-searches')}
                >
                  View All
                </button>
              ) : null}
            </div>
            {topSearchCards.length ? (
              <div className="vpaa-grid-4">
                {topSearchCards.map(renderDashboardCard)}
              </div>
            ) : (
              <div className="vpaa-dashboard-empty">No top searches are available yet.</div>
            )}
          </div>

          <div className="vpaa-card vpaa-dashboard-panel">
            <div className="vpaa-dashboard-head">
              <h3><FilePlus2 size={16} /> All Theses</h3>
              {recentTheses.length > DISPLAY_LIMIT ? (
                <button
                  type="button"
                  className="vpaa-dashboard-toggle"
                  onClick={() => navigate('/faculty/dashboard/all')}
                >
                  View All
                </button>
              ) : null}
            </div>
            {allCards.length ? (
              <div className="recent-added-grid">
                {allCards.map(renderRecentlyAddedCard)}
              </div>
            ) : (
              <div className="vpaa-dashboard-empty">No archived theses are available yet.</div>
            )}
          </div>
        </>
      )}
    </FacultyLayout>
  );
}
