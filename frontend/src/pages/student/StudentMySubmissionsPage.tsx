import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, FileText, PencilLine } from 'lucide-react';
import StudentLayout from '../../components/student/StudentLayout';
import { thesisService } from '../../services/thesisService';
import type { Thesis, ThesisStatus } from '../../types/thesis.types';

type SubmissionFilter = 'all' | ThesisStatus | 'revisions';

const submissionFilters: Array<{ key: SubmissionFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'revisions', label: 'Revisions' },
  { key: 'draft', label: 'Draft' },
];

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

const getStatusBadgeClass = (status: ThesisStatus) => {
  if (status === 'approved') return 'approved';
  if (status === 'draft') return 'draft';
  if (status === 'rejected') return 'revisions';
  return 'review';
};

const getStatusLabel = (status: ThesisStatus) => {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Revisions Needed';
  if (status === 'draft') return 'Draft';
  return 'Under Review';
};

const buildProgressSteps = (status: ThesisStatus) => {
  const allPending = [
    { label: 'Submitted', done: false, current: false },
    { label: 'Adviser Check', done: false, current: false },
    { label: 'Panel Review', done: false, current: false },
    { label: 'Library Intake', done: false, current: false },
  ];

  if (status === 'draft') {
    return allPending;
  }

  if (status === 'pending') {
    return [
      { label: 'Submitted', done: true, current: false },
      { label: 'Adviser Check', done: true, current: true },
      { label: 'Panel Review', done: false, current: false },
      { label: 'Library Intake', done: false, current: false },
    ];
  }

  if (status === 'under_review') {
    return [
      { label: 'Submitted', done: true, current: false },
      { label: 'Adviser Check', done: true, current: false },
      { label: 'Panel Review', done: true, current: true },
      { label: 'Library Intake', done: false, current: false },
    ];
  }

  if (status === 'approved') {
    return [
      { label: 'Submitted', done: true, current: false },
      { label: 'Adviser Check', done: true, current: false },
      { label: 'Panel Review', done: true, current: false },
      { label: 'Library Intake', done: true, current: false },
    ];
  }

  return [
    { label: 'Submitted', done: true, current: false },
    { label: 'Adviser Check', done: true, current: false },
    { label: 'Panel Review', done: false, current: true },
    { label: 'Library Intake', done: false, current: false },
  ];
};

export default function StudentMySubmissionsPage() {
  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SubmissionFilter>('all');

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

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    if (activeFilter === 'revisions') return items.filter((item) => item.status === 'rejected');
    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

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
                {submissionFilters.map((filter) => (
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

              <select className="student-submissions-sort" defaultValue="latest">
                <option value="latest">Sort by: Latest update</option>
              </select>
            </div>

            {loading ? (
              <div className="student-submissions-empty vpaa-card">Loading your submissions...</div>
            ) : filteredItems.length ? (
              <div className="student-submissions-list">
                {filteredItems.map((item) => (
                  <article key={item.id} className="student-submission-card vpaa-card">
                    <div className="student-submission-card-head">
                      <div>
                        <h3>{item.title}</h3>
                        <p>
                          {item.status === 'draft' ? 'Draft saved' : 'Submitted'} {formatSubmissionDate(item.submitted_at || item.created_at)}
                          {' '}by {(item.authors ?? []).join(', ') || 'Student author'}
                        </p>
                      </div>
                      <span className={`student-submission-badge ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <div className="student-submission-steps">
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

                    <div className="student-submission-actions">
                      {item.status === 'approved' ? (
                        <>
                          <button type="button">View Approval</button>
                          <button type="button">Download PDF</button>
                          <button type="button">Share</button>
                        </>
                      ) : item.status === 'rejected' ? (
                        <>
                          <button type="button">Upload Revision</button>
                          <button type="button">View Feedback</button>
                          <button type="button">Extension Request</button>
                        </>
                      ) : item.status === 'draft' ? (
                        <>
                          <button type="button">Continue Draft</button>
                          <button type="button">Submit Now</button>
                        </>
                      ) : (
                        <>
                          <button type="button">View Details</button>
                          <button type="button">Message Adviser</button>
                          <button type="button">Withdraw</button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-submissions-empty vpaa-card">No submissions found for this filter.</div>
            )}
          </section>

          <aside className="student-submissions-side vpaa-card">
            <div className="student-submissions-summary-head">
              <h2>Submission Summary</h2>
              <p>Snapshot of your research workflow</p>
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
