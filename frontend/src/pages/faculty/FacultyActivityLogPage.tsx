import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCcw, Search, SquareSplitVertical, Users2 } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useAuth } from '../../hooks/useAuth';
import { facultyActivityService, type FacultyActivityLogResponse, type FacultyActivityRow } from '../../services/facultyActivityService';

const ACTIVITY_PAGE_SIZE = 10;
const ACTIVITY_FILTER_OPTIONS = ['all', 'Approved Thesis', 'Needs Revision', 'Archived Thesis', 'Account Created', 'Account Edited'] as const;

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

const formatCalendarDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toDateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const getActivityFilterLabel = (item: FacultyActivityRow) => {
  return item.badge;
};

export default function FacultyActivityLogPage() {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<FacultyActivityLogResponse | null>(null);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'mine'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [timeTick, setTimeTick] = useState(Date.now());

  const loadActivityLog = (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    return facultyActivityService.getActivityLog()
      .then((response) => {
        setActivityData(response);
      })
      .catch(() => {
        setError('Unable to load activity log right now.');
      })
      .finally(() => {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      });
  };

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const activityOptions = ACTIVITY_FILTER_OPTIONS;
  const filteredLogs = useMemo(() => {
    const logs = activityData?.logs ?? [];
    const now = new Date(timeTick);
    const startOfToday = toDateOnly(now);
    const todayKey = formatCalendarDateKey(startOfToday);
    const dayOfWeek = startOfToday.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
    const weekDateKeys = new Set(
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return formatCalendarDateKey(date);
      }),
    );

    return logs.filter((item) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch = !normalizedSearch || [getActivityFilterLabel(item), item.badge, item.request_record, item.account, item.role, item.college, item.department, item.action]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesActivity = activityFilter === 'all' || getActivityFilterLabel(item) === activityFilter;

      const itemDate = new Date(item.timestamp);
      const hasValidDate = !Number.isNaN(itemDate.getTime());
      const itemDateKey = hasValidDate ? formatCalendarDateKey(itemDate) : null;
      const isToday = itemDateKey === todayKey;
      const isThisWeek = itemDateKey ? weekDateKeys.has(itemDateKey) : false;
      const matchesQuick = quickFilter === 'all'
        || (quickFilter === 'today' && isToday)
        || (quickFilter === 'week' && isThisWeek)
        || (quickFilter === 'mine' && item.user_id === user?.id);

      return matchesSearch && matchesActivity && matchesQuick;
    });
  }, [activityData, search, activityFilter, quickFilter, timeTick, user?.id]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ACTIVITY_PAGE_SIZE));

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ACTIVITY_PAGE_SIZE;
    return filteredLogs.slice(startIndex, startIndex + ACTIVITY_PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activityFilter, quickFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summaryCards = [
    { label: 'Actions Today', value: activityData?.summary.actions_today ?? defaultSummary.actions_today, icon: <Clock3 size={20} />, tone: 'si-sky' },
    { label: 'Approvals', value: activityData?.summary.approvals ?? defaultSummary.approvals, icon: <CheckCircle2 size={20} />, tone: 'si-sage' },
    { label: 'Files Shared', value: activityData?.summary.files_shared ?? defaultSummary.files_shared, icon: <Users2 size={20} />, tone: 'si-maroon' },
    { label: 'Last Activity', value: activityData?.summary.last_activity ?? defaultSummary.last_activity, icon: <Clock3 size={20} />, tone: 'si-gold' },
  ];

  return (
    <FacultyLayout title="Activity Log" description="Track faculty approvals, uploads, and sharing activity across the archive.">
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}

        <div className="vpaa-grid-4 student-submissions-stats vpaa-activity-summary-grid" style={{ marginBottom: 28 }}>
          {summaryCards.map((card) => (
            <article className="student-submissions-stat-card vpaa-card vpaa-activity-summary-card" key={card.label}>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              <span className={`student-submissions-stat-icon ${card.tone}`}>{card.icon}</span>
            </article>
          ))}
        </div>

        <div className="review-panel faculty-activity-log-panel">
          <div className="ra-header faculty-activity-log-header">
            <div className="ra-header-left faculty-activity-log-header-left">
              <span className="panel-header-icon phi-maroon"><SquareSplitVertical size={17} /></span>
              <h3 className="panel-title">Recent Activity</h3>
            </div>
            <button
              type="button"
              className="faculty-activity-log-refresh"
              onClick={() => void loadActivityLog(true)}
              disabled={refreshing}
            >
              <RefreshCcw size={16} className={refreshing ? 'faculty-activity-log-refresh-icon spinning' : 'faculty-activity-log-refresh-icon'} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          <div className="filter-row faculty-activity-log-filters">
            <div className="filter-group faculty-activity-log-filter-group">
              <label className="vpaa-activity-search">
                <Search size={16} />
                <input
                  className="filter-input"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by action, account, or department..."
                />
              </label>

              <select className="filter-select" value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
                {activityOptions.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All Actions' : option}</option>
                ))}
              </select>
          </div>

            <div className="filter-chips faculty-activity-log-chips">
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

          <div className="review-table-wrap faculty-activity-log-table-wrap">
            <table className="review-table faculty-activity-log-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Request / Record</th>
                  <th>Account</th>
                  <th>Role</th>
                  <th>College</th>
                  <th>Department</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="vpaa-activity-empty">Loading activity log...</td>
                  </tr>
                ) : paginatedLogs.length ? paginatedLogs.map((entry) => (
                  <tr key={entry.id}>
                    <td><span className={`status-badge ${toneClassMap[entry.tone]}`}>{getActivityFilterLabel(entry)}</span></td>
                    <td className="rt-title">{entry.request_record}</td>
                    <td>{entry.account}</td>
                    <td>{entry.role}</td>
                    <td>{entry.college}</td>
                    <td>{entry.department}</td>
                    <td>{formatRelativeTime(entry.timestamp)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="vpaa-activity-empty">No activity matched the current filters.</td>
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
