import { useEffect, useMemo, useState } from 'react';
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
  const topSearchCards = useMemo(() => topSearches.slice(0, 8), [topSearches]);

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
          <div className="vpaa-cover-strip-label">Recently Added</div>
          <div className="vpaa-cover-scroll">
            {recentCards.slice(0, 4).map((item) => (
              <div className="vpaa-cover" key={item.id}>
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">{item.department || item.program || 'Research Archive'}</div>
                <div className="vpaa-cover-title">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3>Top Searches</h3>
          <span>Show All</span>
        </div>
        {topSearchCards.length ? (
          <div className="vpaa-grid-4">
            {topSearchCards.map((item) => (
              <div className="vpaa-list-card" key={item.id}>
                <div className="vpaa-cover vpaa-cover-wide">
                  <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                  <div className="vpaa-cover-meta">{item.department || item.program || 'Research Archive'}</div>
                  <div className="vpaa-cover-title">{item.title}</div>
                </div>
                <div style={{ marginTop: 10, fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{item.author}, {item.year}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No top searches available yet.</div>
        )}
      </div>
    </VpaaLayout>
  );
}
