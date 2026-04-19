import { useEffect, useMemo, useState } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useAuth } from '../../hooks/useAuth';
import {
  facultyDashboardService,
  type FacultyDashboardThesis,
  type FacultyDailyQuote,
} from '../../services/facultyDashboardService';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [recentTheses, setRecentTheses] = useState<FacultyDashboardThesis[]>([]);
  const [topSearches, setTopSearches] = useState<FacultyDashboardThesis[]>([]);
  const [quote, setQuote] = useState<FacultyDailyQuote | null>(null);

  useEffect(() => {
    if (user?.role !== 'faculty') return;

    void facultyDashboardService.getDashboard().then((dashboardResponse) => {
      setRecentTheses(dashboardResponse.recent_theses ?? []);
      setTopSearches(dashboardResponse.top_searches ?? []);
      setQuote(dashboardResponse.daily_quote ?? null);
    }).catch(() => {
      setRecentTheses([]);
      setTopSearches([]);
      setQuote(null);
    });
  }, [user?.role]);

  const recentCards = useMemo(() => recentTheses.slice(0, 4), [recentTheses]);
  const topSearchCards = useMemo(() => topSearches.slice(0, 8), [topSearches]);

  return (
    <FacultyLayout
      title={<><span>Welcome back, </span><em>{user?.first_name || user?.name || 'Faculty'}</em></>}
      description="Here&apos;s an overview of thesis submissions, pending reviews, and department activity."
      hidePageIntro
    >
      <div className="vpaa-page-intro">
        <h1><span>Welcome back, </span><em>{user?.first_name || user?.name || 'Faculty'}</em></h1>
        <p>Here&apos;s an overview of thesis submissions, pending reviews, and department activity.</p>
      </div>

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
            {recentCards.map((item) => (
              <div className="vpaa-cover" key={item.id}>
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">{item.author || item.submitter_name || 'Assigned Advisee'}</div>
                <div className="vpaa-cover-title">{item.title}</div>
              </div>
            ))}
            {!recentCards.length ? (
              <div className="vpaa-cover" aria-hidden="true">
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">Faculty Workspace</div>
                <div className="vpaa-cover-title">No recent submissions yet</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3>Top Searches</h3>
          <span>Show All -&gt;</span>
        </div>
        {topSearchCards.length ? (
          <div className="vpaa-grid-4">
            {topSearchCards.map((item) => (
              <div className="vpaa-list-card" key={item.id}>
                <div className="vpaa-cover vpaa-cover-wide">
                  <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                  <div className="vpaa-cover-meta">{item.author || item.submitter_name || 'Assigned Advisee'}</div>
                  <div className="vpaa-cover-title">{item.title}</div>
                </div>
                <div style={{ marginTop: 10, fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                  {item.author || item.submitter_name || 'Student'}, {item.department}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No recent submissions are available yet.</div>
        )}
      </div>
    </FacultyLayout>
  );
}
