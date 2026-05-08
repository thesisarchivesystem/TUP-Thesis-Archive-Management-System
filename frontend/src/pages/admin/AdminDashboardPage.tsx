import { Check, Clock3, FileText, MoreVertical, NotebookPen, UserPlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminService, type AdminDashboardResponse } from '../../services/adminService';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminService.getDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load admin dashboard.'));
  }, []);

  if (error) return <div className="admin-alert">{error}</div>;
  if (!data) return <div className="admin-panel">Loading admin dashboard...</div>;

  const totalTheses = data.dashboard_metrics.total_theses;
  const approved = data.dashboard_metrics.approved;
  const underReview = data.dashboard_metrics.under_review;
  const revisionsNeeded = data.dashboard_metrics.revisions_needed;
  const maxMonthlyValue = Math.max(...data.monthly_submissions.map((item) => item.value), 1);
  const maxDepartmentValue = Math.max(...data.department_uploads.map((item) => item.value), 1);

  const statCards = [
    { label: 'Total Theses', value: totalTheses.toLocaleString(), note: `${data.dashboard_metrics.monthly_growth_percentage >= 0 ? '+' : ''}${data.dashboard_metrics.monthly_growth_percentage}% this month`, icon: FileText, tone: 'rose' },
    { label: 'Approved', value: approved.toLocaleString(), note: `${totalTheses ? ((approved / totalTheses) * 100).toFixed(1) : '0.0'}% of total`, icon: Check, tone: 'sage' },
    { label: 'Under Review', value: underReview.toLocaleString(), note: `${totalTheses ? ((underReview / totalTheses) * 100).toFixed(1) : '0.0'}% of total`, icon: Clock3, tone: 'sky' },
    { label: 'Revisions Needed', value: revisionsNeeded.toLocaleString(), note: `${totalTheses ? ((revisionsNeeded / totalTheses) * 100).toFixed(1) : '0.0'}% of total`, icon: NotebookPen, tone: 'peach' },
  ] as const;

  const linePoints = data.monthly_submissions.map((item, index) => {
    const x = 10 + (index * 594) / Math.max(data.monthly_submissions.length - 1, 1);
    const y = 194 - ((item.value / maxMonthlyValue) * 160);
    return { x, y, month: item.month };
  });
  const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
  const fillPath = `${linePath} L604 210 L10 210 Z`;
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
          <h1>Welcome back, <em>Admin!</em></h1>
          <p>Here&apos;s an overview of the thesis archive system and key administrative insights.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        {statCards.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className={`admin-stat-card tone-${tone}`}>
            <div className="vpaa-dashboard-head">
              <span className="admin-stat-card-label">{label}</span>
              <span className={`admin-stat-icon ${tone}`}>
                <Icon size={18} />
              </span>
            </div>
            <strong className="admin-stat-card-value">{value}</strong>
            <span className="admin-stat-card-note">{note}</span>
          </article>
        ))}
      </div>

      <div className="admin-panels-grid admin-panels-grid-dashboard">
        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-head">
            <h3>Monthly Thesis Submissions</h3>
            <button type="button" className="admin-filter-pill">This Year</button>
          </div>
          <div className="admin-line-chart">
            <div className="admin-line-grid">
              {[maxMonthlyValue, Math.round(maxMonthlyValue * 0.75), Math.round(maxMonthlyValue * 0.5), Math.round(maxMonthlyValue * 0.25), 0].map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="admin-line-plot">
              <svg viewBox="0 0 620 220" preserveAspectRatio="none" className="admin-chart-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="adminLineFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(196, 34, 34, 0.35)" />
                    <stop offset="100%" stopColor="rgba(196, 34, 34, 0.02)" />
                  </linearGradient>
                </defs>
                <path d={fillPath} fill="url(#adminLineFill)" />
                <path d={linePath} fill="none" stroke="#c42121" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                {linePoints.map((point) => (
                  <circle key={`${point.month}-${point.x}`} cx={point.x} cy={point.y} r="3.8" fill="#c42121" />
                ))}
              </svg>
              <div className="admin-chart-months">
                {data.monthly_submissions.map((item) => <span key={item.month}>{item.month}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-head">
            <h3>Department-wise Uploads</h3>
            <button type="button" className="admin-filter-pill">This Year</button>
          </div>
          <div className="admin-bar-chart">
            {data.department_uploads.map((item) => (
              <div key={`${item.label}-${item.name}`} className="admin-bar-column" title={item.name}>
                <strong>{item.value}</strong>
                <div className="admin-bar-rail">
                  <div className="admin-bar-fill" style={{ height: `${Math.max((item.value / maxDepartmentValue) * 100, 18)}%` }} />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>Recent Submissions</h3>
          <button type="button" className="admin-view-all">View All</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-polished">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Department</th>
                <th>Status</th>
                <th>Date Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.recent_uploads.map((item) => (
                <tr key={item.id}>
                  <td className="admin-title-cell">{item.title}</td>
                  <td>{item.author}</td>
                  <td>{item.department || 'Unassigned Department'}</td>
                  <td>
                    <span className={`admin-status-badge ${item.status}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                  <td><button type="button" className="admin-kebab"><MoreVertical size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>Recent Activity</h3>
          <button type="button" className="admin-view-all">View All</button>
        </div>
        <div className="admin-activity-grid">
          {data.recent_activity.map((item) => {
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
          })}
        </div>
      </section>
    </div>
  );
}
