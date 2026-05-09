import { Check, ChevronDown, Clock3, FileText, NotebookPen, UserPlus2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import { adminService, type AdminDashboardResponse } from '../../services/adminService';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialYear = Number(searchParams.get('year')) || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [openYearMenu, setOpenYearMenu] = useState<'submissions' | 'courses' | null>(null);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryYear = Number(searchParams.get('year')) || new Date().getFullYear();
    setSelectedYear(queryYear);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void adminService.getDashboard({
      year: selectedYear,
      recent_uploads_limit: 5,
      recent_activity_limit: 9,
    })
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load admin dashboard.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear]);

  const searchTerm = searchParams.get('search')?.trim().toLowerCase() ?? '';

  const filteredUploads = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.recent_uploads;

    return data.recent_uploads.filter((item) => {
      const haystack = [item.title, item.author, item.department, item.program, item.category, item.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [data, searchTerm]);

  const filteredActivity = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.recent_activity;

    return data.recent_activity.filter((item) => (
      `${item.title} ${item.actor} ${item.action}`.toLowerCase().includes(searchTerm)
    ));
  }, [data, searchTerm]);

  if (error) return <div className="admin-alert">{error}</div>;
  if (loading || !data) return <SectionLoadingScreen label="Loading dashboard..." />;

  const totalTheses = data.dashboard_metrics.total_theses;
  const approved = data.dashboard_metrics.approved;
  const underReview = data.dashboard_metrics.under_review;
  const revisionsNeeded = data.dashboard_metrics.revisions_needed;
  const maxMonthlyValue = Math.max(...data.monthly_submissions.map((item) => item.value), 1);
  const courseUploads = data.course_uploads ?? data.department_uploads ?? [];
  const maxCourseValue = Math.max(...courseUploads.map((item) => item.value), 1);

  const statCards = [
    { label: 'Total Theses', value: totalTheses.toLocaleString(), note: `${data.dashboard_metrics.monthly_growth_percentage >= 0 ? '+' : ''}${data.dashboard_metrics.monthly_growth_percentage}% this month`, icon: FileText, tone: 'rose' },
    { label: 'Approved', value: approved.toLocaleString(), note: `${totalTheses ? ((approved / totalTheses) * 100).toFixed(1) : '0.0'}% of total`, icon: Check, tone: 'sage' },
    { label: 'Under Review', value: underReview.toLocaleString(), note: `${totalTheses ? ((underReview / totalTheses) * 100).toFixed(1) : '0.0'}% of total`, icon: Clock3, tone: 'sky' },
    { label: 'Revisions Needed', value: revisionsNeeded.toLocaleString(), note: `${totalTheses ? ((revisionsNeeded / totalTheses) * 100).toFixed(1) : '0.0'}% of total`, icon: NotebookPen, tone: 'peach' },
  ] as const;

  const linePoints = data.monthly_submissions.map((item, index) => {
    const x = 10 + (index * 594) / Math.max(data.monthly_submissions.length - 1, 1);
    const y = 194 - ((item.value / maxMonthlyValue) * 160);
    return { x, y, month: item.month, value: item.value };
  });
  const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
  const fillPath = `${linePath} L604 210 L10 210 Z`;
  const activityIconMap = {
    green: Check,
    blue: UserPlus2,
    orange: NotebookPen,
    rose: FileText,
  } as const;

  const setYearAndCloseMenu = (year: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('year', String(year));
    setSearchParams(params);
    setSelectedYear(year);
    setOpenYearMenu(null);
  };

  return (
    <div
      className="admin-page"
      onClick={() => {
        setOpenYearMenu(null);
      }}
    >
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
            <div className="admin-menu-wrap">
              <button
                type="button"
                className="admin-filter-pill"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenYearMenu((current) => current === 'submissions' ? null : 'submissions');
                }}
              >
                <span>{selectedYear}</span>
                <ChevronDown size={14} />
              </button>
              <div className={`admin-year-menu ${openYearMenu === 'submissions' ? 'open' : ''}`}>
                {data.available_years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={year === selectedYear ? 'active' : ''}
                    onClick={(event) => {
                      event.stopPropagation();
                      setYearAndCloseMenu(year);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="admin-line-chart">
            <div className="admin-line-grid">
              {[maxMonthlyValue, Math.round(maxMonthlyValue * 0.75), Math.round(maxMonthlyValue * 0.5), Math.round(maxMonthlyValue * 0.25), 0].map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="admin-line-plot">
              <svg viewBox="0 0 620 220" preserveAspectRatio="none" className="admin-chart-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="adminLineFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--maroon)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--maroon)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={fillPath} fill="url(#adminLineFill)" />
                <path d={linePath} fill="none" stroke="var(--maroon)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                {linePoints.map((point) => (
                  <circle key={`${point.month}-${point.x}`} cx={point.x} cy={point.y} r="3.8" fill="var(--maroon)">
                    <title>{`${point.month}: ${point.value}`}</title>
                  </circle>
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
            <h3>Course-wise Uploads</h3>
            <div className="admin-menu-wrap">
              <button
                type="button"
                className="admin-filter-pill"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenYearMenu((current) => current === 'courses' ? null : 'courses');
                }}
              >
                <span>{selectedYear}</span>
                <ChevronDown size={14} />
              </button>
              <div className={`admin-year-menu ${openYearMenu === 'courses' ? 'open' : ''}`}>
                {data.available_years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={year === selectedYear ? 'active' : ''}
                    onClick={(event) => {
                      event.stopPropagation();
                      setYearAndCloseMenu(year);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="admin-bar-chart">
            {courseUploads.map((item) => (
              <button key={`${item.label}-${item.name}`} type="button" className="admin-bar-column" title={item.name}>
                <strong>{item.value}</strong>
                <div className="admin-bar-rail">
                  <div className="admin-bar-fill" style={{ height: `${Math.max((item.value / maxCourseValue) * 100, 18)}%` }} />
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>Recent Submissions</h3>
          <button type="button" className="admin-view-all" onClick={() => navigate('/admin/submissions')}>
            View All
          </button>
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
              </tr>
            </thead>
            <tbody>
              {filteredUploads.length > 0 ? filteredUploads.map((item) => (
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
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No submissions matched your current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>Recent Activity</h3>
          <button type="button" className="admin-view-all" onClick={() => navigate('/admin/activity')}>
            View All
          </button>
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
