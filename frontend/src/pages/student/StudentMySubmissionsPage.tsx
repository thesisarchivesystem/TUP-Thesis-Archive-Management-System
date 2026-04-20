import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, FileText, FileUp, PencilLine } from 'lucide-react';
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

const formatRelativeDate = (value?: string) => {
  if (!value) return 'No recent update';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent update';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getStatusLabel = (status: ThesisStatus) => {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Revisions Needed';
  if (status === 'draft') return 'Draft';
  return 'Under Review';
};

const getFeedbackLabel = (item: Thesis) => {
  if (item.status === 'rejected') return 'Revision Notes';
  if (item.status === 'approved') return 'Approval Comment';
  return 'Review Comment';
};

const getStatusBadgeClass = (status: ThesisStatus) => {
  if (status === 'approved') return 'student-submission-badge approved';
  if (status === 'rejected') return 'student-submission-badge revisions';
  if (status === 'draft') return 'student-submission-badge draft';
  return 'student-submission-badge review';
};

const buildProgressSteps = (status: ThesisStatus) => {
  const allPending = [
    { label: 'Submitted', done: false, current: false },
    { label: 'For Review', done: false, current: false },
    { label: 'Approved', done: false, current: false },
    { label: 'For Defense', done: false, current: false },
  ];

  if (status === 'draft') {
    return allPending;
  }

  if (status === 'pending') {
    return [
      { label: 'Submitted', done: true, current: false },
      { label: 'For Review', done: true, current: true },
      { label: 'Approved', done: false, current: false },
      { label: 'For Defense', done: false, current: false },
    ];
  }

  if (status === 'under_review') {
    return [
      { label: 'Submitted', done: true, current: false },
      { label: 'For Review', done: true, current: false },
      { label: 'Approved', done: true, current: true },
      { label: 'For Defense', done: false, current: false },
    ];
  }

  if (status === 'approved') {
    return [
      { label: 'Submitted', done: true, current: false },
      { label: 'For Review', done: true, current: false },
      { label: 'Approved', done: true, current: false },
      { label: 'For Defense', done: true, current: false },
    ];
  }

  return [
    { label: 'Submitted', done: true, current: false },
    { label: 'For Review', done: true, current: false },
    { label: 'Approved', done: false, current: true },
    { label: 'For Defense', done: false, current: false },
  ];
};

export default function StudentMySubmissionsPage() {
  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOpenManuscript = async (item: Thesis) => {
    const previewWindow = window.open('', '_blank');

    if (!previewWindow) {
      setError('Popup blocked while opening the manuscript. Please allow popups and try again.');
      return;
    }

    previewWindow.document.title = item.file_name || item.title || 'Opening manuscript...';
    previewWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px;">Opening manuscript...</p>';

    try {
      const signedUrl = await thesisService.getManuscriptAccessUrl(item.id);

      if (!signedUrl) {
        throw new Error('Unable to open the manuscript right now.');
      }

      previewWindow.location.replace(signedUrl);
    } catch (err) {
      previewWindow.document.title = 'Unable to open manuscript';
      previewWindow.document.body.innerHTML = `
        <p style="font-family: Arial, sans-serif; padding: 24px;">
          ${err instanceof Error ? err.message : 'Unable to open the manuscript right now.'}
        </p>
      `;
      setError(err instanceof Error ? err.message : 'Unable to open the manuscript right now.');
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

  const summary = useMemo(() => {
    const pendingTasks = items.filter((item) => item.status !== 'approved').length;
    const filesUploaded = items.filter((item) => item.file_url).length;
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

    const nextDeadlineItem = items.find((item) => item.status === 'rejected' || item.status === 'under_review' || item.status === 'pending');
    const recentMessages = items
      .filter((item) => item.adviser_remarks || item.rejection_reason)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.status === 'rejected' ? 'Panel' : 'Adviser',
        body: item.rejection_reason || item.adviser_remarks || 'No message available.',
      }));

    return {
      turnaround,
      panelComments: recentMessages.length,
      filesUploaded,
      pendingTasks,
      nextDeadline: nextDeadlineItem
        ? `${getStatusLabel(nextDeadlineItem.status)} for ${nextDeadlineItem.title}`
        : 'No active deadlines right now.',
      recentMessages,
      checklist: [
        { label: 'Adviser approval form', done: items.some((item) => item.status === 'approved' || item.status === 'under_review') },
        { label: 'Revised chapter upload', done: items.some((item) => item.status === 'rejected') },
        { label: 'Plagiarism report', done: items.some((item) => item.file_url) },
        { label: 'Final PDF upload', done: items.some((item) => item.status === 'approved') },
      ],
    };
  }, [items]);

  const spotlightItem = useMemo(
    () => items[0] ?? null,
    [items],
  );

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
            {loading ? (
              <div className="student-submissions-empty vpaa-card">Loading your submissions...</div>
            ) : items.length ? (
              <div className="student-submissions-list">
                {items.map((item) => (
                  <article key={item.id} className="student-submission-card vpaa-card">
                    <div className="student-submission-card-head">
                      <div className="student-submission-card-title-group">
                        <div className="student-submission-cover">
                          <span className="student-submission-cover-meta">TUP Thesis Archive</span>
                          <span className="student-submission-cover-meta">{item.department || item.program || 'Research Record'}</span>
                          <strong>{item.title}</strong>
                        </div>
                        <div className="student-submission-card-copy">
                          <div className="student-submission-steps student-submission-steps-header">
                            {buildProgressSteps(item.status).map((step) => (
                              <div
                                key={step.label}
                                className={`student-submission-step${step.done ? ' done' : ''}${step.current ? ' current' : ''}`}
                              >
                                <span className="student-submission-step-dot" />
                                <span>{step.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="student-submission-title-row">
                            <h3>{item.title}</h3>
                            <span className={getStatusBadgeClass(item.status)}>{getStatusLabel(item.status)}</span>
                            {item.file_url ? (
                              <button
                                type="button"
                                className="student-submissions-primary student-submission-inline-action"
                                onClick={() => void handleOpenManuscript(item)}
                              >
                                Open Manuscript
                              </button>
                            ) : null}
                          </div>
                          <p className="student-submission-authors">{(item.authors ?? []).join(', ') || 'Student author'}</p>
                          <p className="student-submission-date">
                            {item.status === 'draft' ? 'Draft saved' : 'Submitted'} {formatSubmissionDate(item.submitted_at || item.created_at)}
                          </p>
                          <div className="student-submission-meta-row">
                            <span>{item.department}</span>
                            {item.program ? <span>{item.program}</span> : null}
                            <span>{item.school_year}</span>
                            {item.category?.name ? <span>{item.category.name}</span> : null}
                            <span>Updated {formatRelativeDate(item.reviewed_at || item.approved_at || item.submitted_at || item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {item.abstract ? (
                      <div className="student-submission-summary">
                        <strong>Abstract Preview</strong>
                        <p>{item.abstract}</p>
                      </div>
                    ) : null}

                    {item.adviser_remarks || item.rejection_reason ? (
                      <div className="student-submission-summary">
                        <strong>{getFeedbackLabel(item)}</strong>
                        <p>{item.rejection_reason || item.adviser_remarks}</p>
                      </div>
                    ) : null}

                    <div className="student-submission-detail-grid">
                      <div className="student-submission-detail-card">
                        <span>Manuscript</span>
                        <strong>{item.file_name || (item.file_url ? 'Uploaded file available' : 'No file uploaded')}</strong>
                      </div>
                      <div className="student-submission-detail-card">
                        <span>Adviser</span>
                        <strong>{item.adviser?.name || 'Not assigned yet'}</strong>
                      </div>
                      <div className="student-submission-detail-card">
                        <span>Category</span>
                        <strong>{item.category?.name || 'Not assigned yet'}</strong>
                      </div>
                      <div className="student-submission-detail-card">
                        <span>Review Status</span>
                        <strong>{getStatusLabel(item.status)}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-submissions-empty vpaa-card">No submissions found.</div>
            )}
          </section>

          <aside className="student-submissions-side vpaa-card">
            <div className="student-submissions-summary-head">
              <h2>Submission Summary</h2>
              <p>Snapshot of your research workflow</p>
            </div>

            <div className="student-submissions-spotlight">
              <div className="student-submissions-spotlight-cover">
                <span className="student-submissions-spotlight-meta">Focused Record</span>
                <strong>{loading ? 'Loading active submission' : spotlightItem?.title || 'No submission selected'}</strong>
                <p>
                  {loading
                    ? 'Checking your current records.'
                    : spotlightItem?.category?.name || spotlightItem?.program || spotlightItem?.department || 'Your next approved submission will appear here.'}
                </p>
              </div>
              <div className="student-submissions-spotlight-stat">
                <FileUp size={16} />
                <span>{loading ? '--' : `${summary.filesUploaded} file${summary.filesUploaded === 1 ? '' : 's'} uploaded`}</span>
              </div>
            </div>

            <div className="student-submissions-summary-grid">
              <div className="student-submissions-summary-box">
                <span>Turnaround Avg.</span>
                <strong>{loading ? '--' : `${summary.turnaround} days`}</strong>
              </div>
              <div className="student-submissions-summary-box">
                <span>Panel Comments</span>
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

            <div className="student-submissions-note">
              <h3>Next Deadline</h3>
              <p>{summary.nextDeadline}</p>
            </div>

            <div className="student-submissions-message-block">
              <h3>Recent Messages</h3>
              {summary.recentMessages.length ? (
                summary.recentMessages.map((message) => (
                  <div key={message.id} className="student-submissions-message">
                    <strong>{message.title}:</strong> {message.body}
                  </div>
                ))
              ) : (
                <div className="student-submissions-message">No recent feedback messages yet.</div>
              )}
            </div>

            <div className="student-submissions-checklist">
              <h3>Quick Checklist</h3>
              {summary.checklist.map((item) => (
                <label key={item.label} className="student-submissions-check">
                  <input type="checkbox" checked={item.done} readOnly />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </StudentLayout>
  );
}
