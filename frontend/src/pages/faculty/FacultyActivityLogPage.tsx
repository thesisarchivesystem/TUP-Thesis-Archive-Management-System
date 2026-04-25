import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, List, Search, SquareSplitVertical, Users2 } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useAuth } from '../../hooks/useAuth';
import { facultyActivityService, type FacultyActivityLogResponse, type FacultyActivityRow } from '../../services/facultyActivityService';

const ACTIVITY_PAGE_SIZE = 10;

const defaultSummary = {
  actions_today: 0,
  approvals: 0,
  files_shared: 0,
  notes_added: 0,
  last_activity: 'No recent activity',
};

const toneClassMap: Record<FacultyActivityRow['tone'], string> = {
  maroon: 'status-pending',
  sky: 'status-pending',
  sage: 'status-approved',
  terracotta: 'status-revision',
  gold: 'status-pending',
};

const formatRelativeTime = (timestamp: string) => {
  const itemDate = new Date(timestamp);
  if (Number.isNaN(itemDate.getTime())) return 'Just now';

  const seconds = Math.max(0, Math.floor((Date.now() - itemDate.getTime()) / 1000));
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FacultyActivityLogPage() {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<FacultyActivityLogResponse | null>(null);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'mine'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    void facultyActivityService.getActivityLog()
      .then((response) => {
        if (!isMounted) return;
        setActivityData(response);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load activity log right now.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activityOptions = useMemo(
    () => ['all', ...new Set((activityData?.logs ?? []).map((item) => item.badge))],
    [activityData],
  );

  const departmentOptions = useMemo(
    () => ['all', ...new Set((activityData?.logs ?? []).map((item) => item.department))],
    [activityData],
  );

  const filteredLogs = useMemo(() => {
    const logs = activityData?.logs ?? [];

    return logs.filter((item) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch = !normalizedSearch || [item.badge, item.request_record, item.account, item.department]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesActivity = activityFilter === 'all' || item.badge === activityFilter;
      const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;

      const itemDate = new Date(item.timestamp);
      const now = new Date();
      const dayDiff = Number.isNaN(itemDate.getTime()) ? Number.POSITIVE_INFINITY : (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      const normalizedAccount = item.account.toLowerCase();
      const currentUserName = user?.name?.toLowerCase() ?? '';
      const matchesQuick = quickFilter === 'all'
        || (quickFilter === 'today' && dayDiff < 1)
        || (quickFilter === 'week' && dayDiff <= 7)
        || (quickFilter === 'mine' && (
          (currentUserName !== '' && normalizedAccount.includes(currentUserName))
          || normalizedAccount.includes('faculty')
        ));

      return matchesSearch && matchesActivity && matchesDepartment && matchesQuick;
    });
  }, [activityData, search, activityFilter, departmentFilter, quickFilter, user?.name]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ACTIVITY_PAGE_SIZE));

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ACTIVITY_PAGE_SIZE;
    return filteredLogs.slice(startIndex, startIndex + ACTIVITY_PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activityFilter, departmentFilter, quickFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summaryCards = [
    { label: 'Actions Today', value: activityData?.summary.actions_today ?? defaultSummary.actions_today, icon: <Clock3 size={20} />, tone: 'si-sky' },
    { label: 'Approvals', value: activityData?.summary.approvals ?? defaultSummary.approvals, icon: <CheckCircle2 size={20} />, tone: 'si-sage' },
    { label: 'Files Shared', value: activityData?.summary.files_shared ?? defaultSummary.files_shared, icon: <Users2 size={20} />, tone: 'si-maroon' },
    { label: 'Notes Added', value: activityData?.summary.notes_added ?? defaultSummary.notes_added, icon: <List size={20} />, tone: 'si-terracotta' },
    { label: 'Last Activity', value: activityData?.summary.last_activity ?? defaultSummary.last_activity, icon: <Clock3 size={20} />, tone: 'si-gold' },
  ];

  return (
    <FacultyLayout title="Activity Log" description="Track faculty approvals, uploads, and sharing activity across the archive.">
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}

        <div className="vpaa-grid-5" style={{ marginBottom: 8 }}>
          {summaryCards.map((card) => (
            <div className="vpaa-card vpaa-stat-card" key={card.label}>
              <div>
                <div className="vpaa-stat-label">{card.label}</div>
                <div className="vpaa-stat-value">{card.value}</div>
              </div>
              <div className={`vpaa-stat-icon ${card.tone}`}>{card.icon}</div>
            </div>
          ))}
        </div>

        <div className="review-panel">
          <div className="ra-header">
            <div className="ra-header-left">
              <span className="panel-header-icon phi-maroon"><SquareSplitVertical size={17} /></span>
              <h3 className="panel-title">Recent Activity</h3>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="vpaa-activity-search">
                <Search size={16} />
                <input
                  className="filter-input"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by action, thesis, or faculty..."
                />
              </label>

              <select className="filter-select" value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
                {activityOptions.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All Actions' : option}</option>
                ))}
              </select>

              <select className="filter-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All Departments' : option}</option>
                ))}
              </select>
            </div>

            <div className="filter-chips">
              {[
                ['all', 'All'],
                ['today', 'Today'],
                ['week', 'This Week'],
                ['mine', 'My Actions'],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`chip${quickFilter === value ? ' active' : ''}`}
                  onClick={() => setQuickFilter(value as 'all' | 'today' | 'week' | 'mine')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="review-table-wrap">
            <table className="review-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Thesis / File</th>
                  <th>Faculty</th>
                  <th>Department</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="vpaa-activity-empty">Loading activity log...</td>
                  </tr>
                ) : paginatedLogs.length ? paginatedLogs.map((entry) => (
                  <tr key={entry.id}>
                    <td><span className={`status-badge ${toneClassMap[entry.tone]}`}>{entry.badge}</span></td>
                    <td className="rt-title">{entry.request_record}</td>
                    <td>{entry.account}</td>
                    <td>{entry.department}</td>
                    <td>{formatRelativeTime(entry.timestamp)}</td>
                    <td className="table-actions"><button type="button" className="btn-review">{entry.action}</button></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="vpaa-activity-empty">No activity matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredLogs.length > ACTIVITY_PAGE_SIZE ? (
            <div className="vpaa-pagination">
              <span className="vpaa-pagination-meta">
                Showing {(currentPage - 1) * ACTIVITY_PAGE_SIZE + 1}-{Math.min(currentPage * ACTIVITY_PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
              </span>
              <div className="vpaa-pagination-actions">
                <button type="button" className="recent-see-all" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</button>
                <span className="vpaa-pagination-page">Page {currentPage} of {totalPages}</span>
                <button type="button" className="recent-see-all" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </FacultyLayout>
  );
}
