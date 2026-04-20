import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
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
  const recentlyAddedCards = useMemo(() => recentTheses.slice(0, 8), [recentTheses]);
  const topSearchCards = useMemo(() => topSearches.slice(0, 8), [topSearches]);
  const renderDashboardCard = (item: FacultyDashboardThesis) => {
    const tags = (item.keywords?.length ? item.keywords : [item.category, item.department]).filter(Boolean).slice(0, 2);

    return (
      <article className="vpaa-category-thesis-card" key={item.id}>
        <div className="vpaa-cover vpaa-category-thesis-cover">
          <div className="vpaa-cover-meta">Technological University of the Philippines</div>
          <div className="vpaa-cover-meta">{item.department || item.category || 'Thesis Archive'}</div>
          <div className="vpaa-cover-title">{item.title}</div>
        </div>

        <div className="vpaa-category-thesis-body">
          <h3>{item.title}</h3>
          <p>
            {item.author || item.submitter_name || 'Student'} - {item.year || 'Recent'}
          </p>
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
          <div className="vpaa-cover-strip-label">Continue Reading</div>
          <div className="vpaa-cover-scroll">
            {recentCards.map((item) => (
              <div className="vpaa-cover" key={item.id}>
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">Computer Studies Department</div>
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
          <h3><Activity size={16} /> Recently Added</h3>
          <span>Show All -&gt;</span>
        </div>
        {recentlyAddedCards.length ? (
          <div className="vpaa-grid-4">
            {recentlyAddedCards.map(renderDashboardCard)}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No recently added theses are available yet.</div>
        )}
      </div>

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3><Activity size={16} /> Top Searches</h3>
          <span>Show All -&gt;</span>
        </div>
        {topSearchCards.length ? (
          <div className="vpaa-grid-4">
            {topSearchCards.map(renderDashboardCard)}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No top searches are available yet.</div>
        )}
      </div>
    </FacultyLayout>
  );
}
