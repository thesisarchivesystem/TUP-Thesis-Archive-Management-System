import { useEffect, useMemo, useState } from 'react';
import { Activity, FilePlus2, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThesisArchiveCover from '../../components/thesis/ThesisArchiveCover';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import { vpaaDashboardService, type DailyQuote, type VpaaDashboardThesis } from '../../services/vpaaDashboardService';

export default function VpaaDashboard() {
  const DISPLAY_LIMIT = 10;
  const [recentTheses, setRecentTheses] = useState<VpaaDashboardThesis[]>([]);
  const [topSearches, setTopSearches] = useState<VpaaDashboardThesis[]>([]);
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [recentlyAddedExpanded, setRecentlyAddedExpanded] = useState(false);
  const [topSearchesExpanded, setTopSearchesExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void Promise.all([
      vpaaDashboardService.getDashboard(),
      vpaaDashboardService.getDailyQuote(),
    ])
      .then(([dashboardResponse, dailyQuote]) => {
        setRecentTheses(dashboardResponse.recent_theses ?? []);
        setTopSearches(dashboardResponse.top_searches ?? []);
        setQuote(dailyQuote ?? null);
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
  }, []);

  const recentCards = useMemo(
    () => (recentlyAddedExpanded ? recentTheses : recentTheses.slice(0, DISPLAY_LIMIT)),
    [recentTheses, recentlyAddedExpanded, DISPLAY_LIMIT],
  );
  const continueReadingCards = useMemo(() => recentTheses.slice(0, 4), [recentTheses]);
  const topSearchCards = useMemo(
    () => (topSearchesExpanded ? topSearches : topSearches.slice(0, DISPLAY_LIMIT)),
    [topSearches, topSearchesExpanded, DISPLAY_LIMIT],
  );

  const thesisHref = (item: VpaaDashboardThesis) => `/vpaa/theses/${encodeURIComponent(item.id)}`;
  const truncateContinueReadingTitle = (title: string, maxWords = 5) => {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return title;
    return `${words.slice(0, maxWords).join(' ')}...`;
  };
  const truncateContinueReadingAuthor = (value: string, maxLength = 22) =>
    value.length <= maxLength ? value : `${value.slice(0, maxLength).trimEnd()}...`;
  const formatAuthorLine = (item: VpaaDashboardThesis) => {
    const rawAuthor = item.author || 'Unknown author';
    const authors = rawAuthor
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const compactAuthor = authors.length > 1 ? `${authors[0]} et al.` : authors[0] || rawAuthor;

    return item.year ? `${compactAuthor} · ${item.year}` : compactAuthor;
  };

  const renderDashboardCard = (item: VpaaDashboardThesis) => {
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
          author={formatAuthorLine(item)}
          year={item.year}
          categories={item.categories?.filter((category) => Boolean(category?.name)).length
            ? item.categories.filter((category): category is { id: string; name: string; slug: string } => Boolean(category?.name))
            : tags.map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
        />
      </Link>
    );
  };

  const renderRecentlyAddedCard = (item: VpaaDashboardThesis) => {
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
            : [item.category, item.program || item.department]
                .filter(Boolean)
                .slice(0, 2)
                .map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
        />
      </Link>
    );
  };

  const renderContinueReadingCard = (item: VpaaDashboardThesis) => {
    const tags = (item.keywords?.length ? item.keywords : [item.category, item.department]).filter(Boolean).slice(0, 2);

    return (
      <Link className="continue-reading-card" key={item.id} to={thesisHref(item)} state={{ thesis: item }}>
        <ThesisArchiveCover
          className="continue-reading-cover"
          compact
          title={truncateContinueReadingTitle(item.title)}
          college={item.college}
          department={item.department}
          author={truncateContinueReadingAuthor(formatAuthorLine(item))}
          year={item.year}
          categories={item.categories?.filter((category) => Boolean(category?.name)).length
            ? item.categories.filter((category): category is { id: string; name: string; slug: string } => Boolean(category?.name))
            : tags.map((tag, index) => ({ id: `${item.id}-${index}`, name: String(tag) }))}
        />
      </Link>
    );
  };

  return (
    <VpaaLayout
      title={<><span>Welcome back, </span><em>VPAA</em>!</>}
      description="Here’s your dashboard overview for thesis approvals, archive activity, faculty oversight, and department updates."
    >
      {loading ? (
        <div className="vpaa-card" style={{ display: 'grid', placeItems: 'center', minHeight: 280, gap: 12 }}>
          <LoaderCircle size={28} className="animate-spin" />
          <p className="vpaa-loading-copy">Loading dashboard...</p>
        </div>
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
              <div className="vpaa-cover-strip-label">Continue Reading</div>
              <div className="vpaa-cover-scroll">
                {continueReadingCards.map(renderContinueReadingCard)}
                {!continueReadingCards.length ? (
                  <div className="continue-reading-card" aria-hidden="true">
                    <ThesisArchiveCover className="continue-reading-cover" compact title="No recent theses yet" author="VPAA Workspace" year="" categories={[]} />
                  </div>
                ) : null}
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
                  onClick={() => setRecentlyAddedExpanded((current) => !current)}
                >
                  {recentlyAddedExpanded ? 'Show Less' : 'Show All'}
                </button>
              ) : null}
            </div>
            {recentCards.length ? (
              <div className="recent-added-grid">
                {recentCards.map(renderRecentlyAddedCard)}
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
                  onClick={() => setTopSearchesExpanded((current) => !current)}
                >
                  {topSearchesExpanded ? 'Show Less' : 'Show All'}
                </button>
              ) : null}
            </div>
            {topSearchCards.length ? (
              <div className="vpaa-grid-4">
                {topSearchCards.map(renderDashboardCard)}
              </div>
            ) : (
              <div className="vpaa-dashboard-empty">No top searches available yet.</div>
            )}
          </div>
        </>
      )}
    </VpaaLayout>
  );
}
