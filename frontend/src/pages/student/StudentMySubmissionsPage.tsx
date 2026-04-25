import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, Check, Clock3, FileText, PencilLine, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { thesisService } from '../../services/thesisService';
import type { Thesis, ThesisStatus } from '../../types/thesis.types';

const formatSubmissionDate = (value?: string) => {
  if (!value) return 'Recently saved';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently saved';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusLabel = (status: ThesisStatus) => {
  if (status === 'approved') return 'Archived';
  if (status === 'rejected') return 'Revisions Needed';
  if (status === 'draft') return 'Draft';
  return 'Under Review';
};

const getStatusBadgeClass = (status: ThesisStatus) => {
  if (status === 'approved') return 'student-submission-badge approved';
  if (status === 'rejected') return 'student-submission-badge revisions';
  if (status === 'draft') return 'student-submission-badge draft';
  return 'student-submission-badge review';
};

const buildProgressSteps = (status: ThesisStatus) => {
  if (status === 'draft') {
    return [
      { label: 'Submitted', tone: 'pending' },
      { label: 'For Review', tone: 'pending' },
      { label: 'Approved', tone: 'pending' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  if (status === 'pending') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'current' },
      { label: 'Approved', tone: 'pending' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  if (status === 'under_review') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'current' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  if (status === 'approved') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'done' },
      { label: 'Archived', tone: 'done' },
    ];
  }

  return [
    { label: 'Submitted', tone: 'done' },
    { label: 'For Review', tone: 'done' },
    { label: 'Approved', tone: 'current' },
    { label: 'Archived', tone: 'pending' },
  ];
};

const getSubmissionActions = (item: Thesis) => {
  if (item.status === 'approved') return ['View Approval', 'Download PDF'];
  if (item.status === 'rejected') return ['Make Revision', 'Extension Request'];
  if (item.status === 'draft') return ['Continue Editing', 'Edit Draft', 'Delete Draft'];
  return ['View Details', 'Message Adviser', 'Withdraw'];
};

type FilterKey = 'all' | 'approved' | 'under_review' | 'rejected' | 'draft';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'rejected', label: 'Revisions' },
  { key: 'draft', label: 'Draft' },
];

export default function StudentMySubmissionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleViewDetails = (item: Thesis) => {
    const submissionId = String(item.id ?? '').trim();
    if (!submissionId) {
      setError('Unable to open this submission because its record ID is missing.');
      return;
    }

    setError(null);
    navigate(`/student/my-submissions/${encodeURIComponent(submissionId)}`, {
      state: { submission: item },
    });
  };

  const handleEditDraft = (item: Thesis) => {
    if (item.status !== 'draft') {
      setError('Only draft submissions can be edited.');
      return;
    }

    setError(null);
    navigate(`/student/upload-thesis?draft=${encodeURIComponent(item.id)}`, {
      state: { draft: item },
    });
  };

  const handleMakeRevision = (item: Thesis) => {
    setError(null);
    navigate(`/student/upload-thesis?draft=${encodeURIComponent(item.id)}`, {
      state: { draft: item },
    });
  };

  const handleExtensionRequest = (item: Thesis) => {
    setError(null);
    navigate(`/student/extension-request?thesis=${encodeURIComponent(item.id)}`, {
      state: { thesis: item },
    });
  };

  const handleDownloadManuscript = async (item: Thesis) => {
    if (!item.file_url) {
      setError('No manuscript is available for download yet.');
      return;
    }

    setError(null);
    setDownloadingId(item.id);

    try {
      const signedUrl = await thesisService.getManuscriptAccessUrl(item.id);

      if (!signedUrl) {
        throw new Error('Unable to download the manuscript right now.');
      }

      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error('Unable to download the manuscript right now.');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = item.file_name || `${item.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download the manuscript right now.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteDraft = async (item: Thesis) => {
    if (item.status !== 'draft') {
      setError('Only draft submissions can be deleted.');
      return;
    }

    const confirmed = window.confirm(`Delete the draft "${item.title}"?`);
    if (!confirmed) return;

    setError(null);
    setDeletingId(item.id);

    try {
      await thesisService.delete(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the draft right now.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    void thesisService.mySubmissions()
      .then((response) => {
        setItems(response?.data ?? []);
      })
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : 'Failed to load your submissions.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const approved = items.filter((item) => item.status === 'approved').length;
    const underReview = items.filter((item) => item.status === 'pending' || item.status === 'under_review').length;
    const revisions = items.filter((item) => item.status === 'rejected').length;

    return {
      total: items.length,
      approved,
      underReview,
      revisions,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'under_review') return item.status === 'pending' || item.status === 'under_review';
      return item.status === activeFilter;
    });

    return [...filtered].sort((a, b) => {
      const left = new Date(a.reviewed_at || a.approved_at || a.submitted_at || a.created_at).getTime();
      const right = new Date(b.reviewed_at || b.approved_at || b.submitted_at || b.created_at).getTime();
      return right - left;
    });
  }, [activeFilter, items]);

  const summary = useMemo(() => {
    const filesUploaded = items.filter((item) => item.file_url).length;
    const pendingTasks = items.filter((item) => item.status !== 'approved').length;
    const recentMessages = items
      .filter((item) => item.adviser_remarks || item.rejection_reason)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.status === 'rejected' ? 'Faculty' : item.status === 'approved' ? 'Faculty Approval' : 'Thesis Adviser',
        body: item.rejection_reason || item.adviser_remarks || 'No message available.',
      }));

    const turnaround = items.length
      ? Math.max(
        1,
        Math.round(
          items.reduce((total, item) => {
            const start = new Date(item.submitted_at || item.created_at).getTime();
            const end = new Date(item.reviewed_at || item.approved_at || item.created_at).getTime();
            if (Number.isNaN(start) || Number.isNaN(end)) return total;
            return total + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          }, 0) / items.length,
        ),
      )
      : 0;

    return {
      turnaround,
      panelComments: recentMessages.length,
      filesUploaded,
      pendingTasks,
    };
  }, [items]);

  return (
    <StudentLayout
      title="My Submissions"
      description="Track your thesis progress, manage revisions, and keep every requirement in one place."
    >
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      <div className="student-submissions-shell">
        <div className="student-submissions-stats">
          <article className="student-submissions-stat-card vpaa-card">
            <div>
              <span>Total Submissions</span>
              <strong>{loading ? '--' : stats.total}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-maroon"><FileText size={18} /></span>
          </article>

          <article className="student-submissions-stat-card vpaa-card">
            <div>
              <span>Approved</span>
              <strong>{loading ? '--' : stats.approved}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-green"><Check size={18} /></span>
          </article>

          <article className="student-submissions-stat-card vpaa-card">
            <div>
              <span>Under Review</span>
              <strong>{loading ? '--' : stats.underReview}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-blue"><Clock3 size={18} /></span>
          </article>

          <article className="student-submissions-stat-card vpaa-card">
            <div>
              <span>Revisions Needed</span>
              <strong>{loading ? '--' : stats.revisions}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-terracotta"><PencilLine size={18} /></span>
          </article>
        </div>

        <div className="student-submissions-layout">
          <section className="student-submissions-main">
            <div className="student-submissions-toolbar">
              <div className="student-submissions-filters">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`student-submissions-filter${activeFilter === filter.key ? ' active' : ''}`}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <Link to="/student/upload-thesis" className="student-submissions-primary">New Submission</Link>
            </div>

            {loading ? (
              <div className="student-submissions-empty vpaa-card">Loading your submissions...</div>
            ) : visibleItems.length ? (
              <div className="student-submissions-list">
                {visibleItems.map((item) => (
                  <article key={item.id} className="student-submission-list-card vpaa-card">
                    <div className="student-submission-list-head">
                      <div>
                        <h3>{item.title}</h3>
                        <p>
                          {item.status === 'draft' ? 'Draft saved' : 'Submitted'} {formatSubmissionDate(item.submitted_at || item.created_at)}
                          {item.submitter?.name ? ` by ${item.submitter.name}` : ''}
                        </p>
                      </div>
                      <span className={getStatusBadgeClass(item.status)}>{getStatusLabel(item.status)}</span>
                    </div>

                    <div className="student-submission-list-steps">
                      {buildProgressSteps(item.status).map((step) => (
                        <div key={step.label} className={`student-submission-list-step ${step.tone}`}>
                          <span className="student-submission-list-step-dot" />
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="student-submission-actions">
                      <button
                        type="button"
                        className="student-submissions-secondary"
                        onClick={() => handleViewDetails(item)}
                      >
                        View Details
                      </button>
                      {(item.status === 'rejected' ? getSubmissionActions(item) : getSubmissionActions(item).slice(1)).map((action) => {
                        if (action === 'Download PDF') {
                          return (
                            <button
                              key={action}
                              type="button"
                              className="student-submissions-secondary"
                              onClick={() => void handleDownloadManuscript(item)}
                              disabled={downloadingId === item.id}
                            >
                              {downloadingId === item.id ? 'Downloading...' : action}
                            </button>
                          );
                        }

                        if (action === 'Edit Draft') {
                          return (
                            <button
                              key={action}
                              type="button"
                              className="student-submissions-secondary"
                              onClick={() => handleEditDraft(item)}
                            >
                              {action}
                            </button>
                          );
                        }

                        if (action === 'Delete Draft') {
                          return (
                            <button
                              key={action}
                              type="button"
                              className="student-submissions-secondary"
                              onClick={() => void handleDeleteDraft(item)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? 'Deleting...' : action}
                            </button>
                          );
                        }

                        if (action === 'Make Revision') {
                          return (
                            <button
                              key={action}
                              type="button"
                              className="student-submissions-secondary"
                              onClick={() => handleMakeRevision(item)}
                            >
                              {action}
                            </button>
                          );
                        }

                        if (action === 'Extension Request') {
                          return (
                            <button
                              key={action}
                              type="button"
                              className="student-submissions-secondary"
                              onClick={() => handleExtensionRequest(item)}
                            >
                              {action}
                            </button>
                          );
                        }

                        return (
                          <button key={action} type="button" className="student-submissions-secondary">
                            {action}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-submissions-empty vpaa-card">No submissions found for this filter.</div>
            )}
          </section>

          <aside className="student-submissions-side vpaa-card thesis-details-side-card submission-accent-panel">
            <div className="student-submissions-summary-head thesis-details-side-head">
              <div>
                <h2>Submission Summary</h2>
                <p>Snapshot of your research workflow</p>
              </div>
              <div className="thesis-details-side-graphic" aria-hidden="true">
                <Sparkles size={12} className="thesis-details-side-spark thesis-details-side-spark-left" />
                <Sparkles size={10} className="thesis-details-side-spark thesis-details-side-spark-right" />
                <div className="thesis-details-side-cloud">
                  <div className="thesis-details-side-graphic-book">
                    <BookOpenText size={24} />
                  </div>
                  <div className="thesis-details-side-shield">
                    <ShieldCheck size={16} />
                  </div>
                </div>
              </div>
            </div>

            <div className="student-submissions-summary-grid submission-summary-grid">
              <div className="student-submissions-summary-box">
                <span>Turnaround Avg.</span>
                <strong>{loading ? '--' : `${summary.turnaround} days`}</strong>
              </div>
              <div className="student-submissions-summary-box">
                <span>Faculty Comments</span>
                <strong>{loading ? '--' : summary.panelComments}</strong>
              </div>
              <div className="student-submissions-summary-box">
                <span>Files Uploaded</span>
                <strong>{loading ? '--' : summary.filesUploaded}</strong>
              </div>
              <div className="student-submissions-summary-box">
                <span>Pending Tasks</span>
                <strong>{loading ? '--' : summary.pendingTasks}</strong>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </StudentLayout>
  );
}
