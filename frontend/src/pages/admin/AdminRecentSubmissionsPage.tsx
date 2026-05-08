import { ArrowLeft, Copy, MoreVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import { adminService, type AdminDashboardResponse } from '../../services/adminService';

type ThesisActionMenuState = {
  id: string;
  anchorTop: number;
  anchorLeft: number;
} | null;

export default function AdminRecentSubmissionsPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openActionMenu, setOpenActionMenu] = useState<ThesisActionMenuState>(null);
  const [activeSubmission, setActiveSubmission] = useState<AdminDashboardResponse['recent_uploads'][number] | null>(null);
  const [copiedSubmissionId, setCopiedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void adminService.getDashboard({ recent_uploads_limit: 50 })
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load recent submissions.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!openActionMenu) return;

    const handleClose = () => setOpenActionMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [openActionMenu]);

  useEffect(() => {
    if (!copiedSubmissionId) return;

    const timeout = window.setTimeout(() => setCopiedSubmissionId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedSubmissionId]);

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

  if (error) return <div className="admin-alert">{error}</div>;
  if (loading || !data) return <SectionLoadingScreen label="Loading recent submissions..." />;

  return (
    <div className="admin-page" onClick={() => setOpenActionMenu(null)}>
      <div className="admin-page-intro">
        <div>
          <Link
            to="/admin/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--maroon)] no-underline transition hover:translate-x-[-2px]"
          >
            <ArrowLeft size={16} />
            <span>Back to Admin Dashboard</span>
          </Link>
          <h1>Recent <em>Submissions</em></h1>
          <p>Review the latest thesis records uploaded into the archive.</p>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>All Recent Submissions</h3>
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
                  <td className="admin-table-action-cell">
                    <button
                      type="button"
                      className="admin-kebab"
                      onClick={(event) => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        setOpenActionMenu({
                          id: item.id,
                          anchorTop: rect.bottom + window.scrollY + 6,
                          anchorLeft: rect.left + window.scrollX - 120,
                        });
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No submissions matched your current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openActionMenu ? (
        <div
          className="admin-context-menu"
          style={{ top: openActionMenu.anchorTop, left: openActionMenu.anchorLeft }}
          onClick={(event) => event.stopPropagation()}
        >
          {(() => {
            const currentSubmission = data.recent_uploads.find((item) => item.id === openActionMenu.id);
            if (!currentSubmission) return null;

            return (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubmission(currentSubmission);
                    setOpenActionMenu(null);
                  }}
                >
                  View details
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(currentSubmission.title);
                    setCopiedSubmissionId(currentSubmission.id);
                    setOpenActionMenu(null);
                  }}
                >
                  <Copy size={14} />
                  <span>{copiedSubmissionId === currentSubmission.id ? 'Copied title' : 'Copy title'}</span>
                </button>
              </>
            );
          })()}
        </div>
      ) : null}

      {activeSubmission ? (
        <div className="admin-modal-backdrop" onClick={() => setActiveSubmission(null)}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="admin-panel-head">
              <h3>Submission Details</h3>
              <button type="button" className="admin-view-all" onClick={() => setActiveSubmission(null)}>Close</button>
            </div>
            <div className="admin-detail-grid">
              <div>
                <span>Title</span>
                <strong>{activeSubmission.title}</strong>
              </div>
              <div>
                <span>Author</span>
                <strong>{activeSubmission.author}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{activeSubmission.department || 'Unassigned Department'}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{activeSubmission.status.replace(/_/g, ' ')}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{activeSubmission.category || 'Unassigned Category'}</strong>
              </div>
              <div>
                <span>Program</span>
                <strong>{activeSubmission.program || 'Unassigned Program'}</strong>
              </div>
              <div>
                <span>Date Submitted</span>
                <strong>{activeSubmission.created_at ? new Date(activeSubmission.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
