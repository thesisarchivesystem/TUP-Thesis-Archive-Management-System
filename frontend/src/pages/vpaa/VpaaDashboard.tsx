import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import { vpaaDashboardService, type DailyQuote, type VpaaDashboardThesis } from '../../services/vpaaDashboardService';

export default function VpaaDashboard() {
  const [recentTheses, setRecentTheses] = useState<VpaaDashboardThesis[]>([]);
  const [topSearches, setTopSearches] = useState<VpaaDashboardThesis[]>([]);
  const [quote, setQuote] = useState<DailyQuote | null>(null);

  useEffect(() => {
    void vpaaDashboardService.getDashboard().then((dashboardResponse) => {
      setRecentTheses(dashboardResponse.recent_theses ?? []);
      setTopSearches(dashboardResponse.top_searches ?? []);
    }).catch(() => {
      setRecentTheses([]);
      setTopSearches([]);
    });
  }, []);

  useEffect(() => {
    void vpaaDashboardService.getDailyQuote().then(setQuote).catch(() => setQuote(null));
  }, []);

  const recentCards = useMemo(() => recentTheses.slice(0, 8), [recentTheses]);
  const continueReadingCards = useMemo(() => recentTheses.slice(0, 4), [recentTheses]);
  const topSearchCards = useMemo(() => topSearches.slice(0, 8), [topSearches]);
  const renderDashboardCard = (item: VpaaDashboardThesis) => {
    const tags = (item.keywords?.length ? item.keywords : [item.category, item.department]).filter(Boolean).slice(0, 2);

    return (
      <article className="vpaa-category-thesis-card" key={item.id}>
        <div className="vpaa-cover vpaa-category-thesis-cover">
          <div className="vpaa-cover-meta">Technological University of the Philippines</div>
          <div className="vpaa-cover-meta">{item.department || item.program || 'Research Archive'}</div>
          <div className="vpaa-cover-title">{item.title}</div>
        </div>

        <div className="vpaa-category-thesis-body">
          <h3>{item.title}</h3>
          <p>{item.author} - {item.year || 'Recent'}</p>
          <div className="vpaa-category-tags">
            {tags.map((tag) => (
              <span className="vpaa-pill vpaa-category-tag" key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </article>
    );
  };

  return (
    <VpaaLayout
      title={<><span>Welcome back, </span><em>VPAA</em></>}
      description="Here’s your dashboard overview for thesis approvals, archive activity, faculty oversight, and department updates."
    >
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
            {continueReadingCards.map((item) => (
              <div className="vpaa-cover" key={item.id}>
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">Computer Studies Department</div>
                <div className="vpaa-cover-title">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3><Activity size={16} /> Recently Added</h3>
          <span>Show All</span>
        </div>
        {recentCards.length ? (
          <div className="vpaa-grid-4">
            {recentCards.map(renderDashboardCard)}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No recently added theses are available yet.</div>
        )}
      </div>

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3><Activity size={16} /> Top Searches</h3>
          <span>Show All</span>
        </div>
        {topSearchCards.length ? (
          <div className="vpaa-grid-4">
            {topSearchCards.map(renderDashboardCard)}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No top searches available yet.</div>
        )}
      </div>
    </VpaaLayout>
  );
}
