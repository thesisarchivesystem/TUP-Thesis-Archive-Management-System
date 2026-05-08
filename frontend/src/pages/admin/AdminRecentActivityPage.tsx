import { ArrowLeft, Check, FileText, NotebookPen, UserPlus2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import { adminService, type AdminDashboardResponse } from '../../services/adminService';

export default function AdminRecentActivityPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void adminService.getDashboard({ recent_activity_limit: 50 })
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load recent activity.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const searchTerm = searchParams.get('search')?.trim().toLowerCase() ?? '';

  const filteredActivity = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.recent_activity;

    return data.recent_activity.filter((item) => (
      `${item.title} ${item.actor} ${item.action}`.toLowerCase().includes(searchTerm)
    ));
  }, [data, searchTerm]);

  if (error) return <div className="admin-alert">{error}</div>;
  if (loading || !data) return <SectionLoadingScreen label="Loading recent activity..." />;

  const activityIconMap = {
    green: Check,
    blue: UserPlus2,
    orange: NotebookPen,
    rose: FileText,
  } as const;

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <Link
            to="/admin/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--maroon)] no-underline transition hover:translate-x-[-2px]"
          >
            <ArrowLeft size={16} />
            <span>Back to Admin Dashboard</span>
          </Link>
          <h1>Recent <em>Activity</em></h1>
          <p>Monitor thesis and account changes recorded across the internal admin system.</p>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>All Recent Activity</h3>
        </div>
        <div className="admin-activity-grid">
          {filteredActivity.length > 0 ? filteredActivity.map((item) => {
            const Icon = activityIconMap[item.tone] ?? FileText;

            return (
              <article key={item.id} className="admin-activity-card">
                <span className={`admin-activity-icon ${item.tone}`}>
                  <Icon size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.actor} · {item.relative_time || 'Recently'}</p>
                </div>
              </article>
            );
          }) : (
            <div className="admin-empty-state">No activity matched your current search.</div>
          )}
        </div>
      </section>
    </div>
  );
}
