import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../hooks/useAuth';
import {
  studentDashboardService,
  type StudentDailyQuote,
  type StudentDashboardThesis,
} from '../../services/studentDashboardService';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recentTheses, setRecentTheses] = useState<StudentDashboardThesis[]>([]);
  const [topSearches, setTopSearches] = useState<StudentDashboardThesis[]>([]);
  const [quote, setQuote] = useState<StudentDailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'student') return;

    setLoading(true);
    setError(null);

    void studentDashboardService.getDashboard()
      .then((dashboardResponse) => {
        setRecentTheses(dashboardResponse.recent_theses ?? []);
        setTopSearches(dashboardResponse.top_searches ?? []);
        setQuote(dashboardResponse.daily_quote ?? null);
      })
      .catch((err) => {
        console.error('Student dashboard error:', err);
        setRecentTheses([]);
        setTopSearches([]);
        setQuote(null);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.role]);

  const recentCards = useMemo(() => recentTheses.slice(0, 4), [recentTheses]);
  const topSearchCards = useMemo(() => topSearches.slice(0, 8), [topSearches]);
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Student';

  const renderCover = (item: StudentDashboardThesis) => (
    <div className="vpaa-cover" key={item.id}>
      <div className="vpaa-cover-meta">Technological University of the Philippines</div>
      <div className="vpaa-cover-meta">{item.department || item.category || 'Thesis Archive'}</div>
      <div className="vpaa-cover-title">{item.title}</div>
    </div>
  );

  return (
    <StudentLayout
      title={<><span>Welcome back, </span><em>{firstName}</em></>}
      description="Here&apos;s an overview of the thesis archive activity and your quick access tools."
      hidePageIntro
    >
      <div className="vpaa-page-intro">
        <h1><span>Welcome back, </span><em>{firstName}</em></h1>
        <p>Here&apos;s an overview of the thesis archive activity and your quick access tools.</p>
      </div>

      {loading ? (
        <div className="vpaa-card" style={{ display: 'grid', placeItems: 'center', minHeight: 280, gap: 12 }}>
          <LoaderCircle size={28} className="animate-spin" />
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Loading dashboard...</p>
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
              <div className="vpaa-cover-strip-label">Recently Added</div>
              <div className="vpaa-cover-scroll">
                {recentCards.map(renderCover)}
                {!recentCards.length ? (
                  <div className="vpaa-cover" aria-hidden="true">
                    <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                    <div className="vpaa-cover-meta">Student Workspace</div>
                    <div className="vpaa-cover-title">No recent submissions yet</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="vpaa-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Top Searches</h3>
              <span style={{ color: 'var(--maroon)', fontWeight: 700 }}>Show All -&gt;</span>
            </div>

            {topSearchCards.length ? (
              <div className="vpaa-grid-4">
                {topSearchCards.map((item) => (
                  <div className="vpaa-list-card" key={item.id}>
                    <div className="vpaa-cover" style={{ width: '100%', minWidth: 'unset', height: 220 }}>
                      <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                      <div className="vpaa-cover-meta">{item.department || item.category || 'Thesis Archive'}</div>
                      <div className="vpaa-cover-title">{item.title}</div>
                    </div>
                    <div style={{ marginTop: 10, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                      {item.author || item.submitter_name || 'Unknown author'}, {item.year || 'Recent'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vpaa-card" style={{ marginTop: 16 }}>No recent submissions are available yet.</div>
            )}
          </div>
        </>
      )}
    </StudentLayout>
  );
}
