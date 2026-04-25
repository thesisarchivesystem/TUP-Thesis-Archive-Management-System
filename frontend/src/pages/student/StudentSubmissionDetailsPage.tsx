import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpenText, CalendarDays, FileText, FolderOpen, GraduationCap, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis.types';

const formatDateTime = (value?: string) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDate = (value?: string) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const buildProgressSteps = (status?: Thesis['status']) => {
  if (status === 'draft') {
    return ['Submitted', 'For Review', 'Approved', 'Archived'].map((label) => ({ label, done: false }));
  }

  if (status === 'approved') {
    return ['Submitted', 'For Review', 'Approved', 'Archived'].map((label) => ({ label, done: true }));
  }

  if (status === 'under_review') {
    return [
      { label: 'Submitted', done: true },
      { label: 'For Review', done: true },
      { label: 'Approved', done: true },
      { label: 'Archived', done: false },
    ];
  }

  return [
    { label: 'Submitted', done: true },
    { label: 'For Review', done: true },
    { label: 'Approved', done: false },
    { label: 'Archived', done: false },
  ];
};

type LocationState = {
  submission?: Thesis;
  focus?: 'feedback';
};

export default function StudentSubmissionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [submission, setSubmission] = useState<Thesis | null>(locationState?.submission ?? null);
  const [isLoading, setIsLoading] = useState(() => !locationState?.submission);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Submission not found.');
      setIsLoading(false);
      return;
    }

    const normalizedId = decodeURIComponent(id);
    const stateSubmission = locationState?.submission ?? null;

    if (stateSubmission && String(stateSubmission.id) === normalizedId) {
      setSubmission(stateSubmission);
      setIsLoading(false);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    void thesisService.get(normalizedId)
      .then((response) => {
        const data = response?.data ?? response;
        setSubmission(data ?? null);
      })
      .catch((err) => {
        setSubmission(stateSubmission);
        setError(err instanceof Error ? err.message : 'Unable to load submission details right now.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, locationState?.submission]);

  useEffect(() => {
    if (locationState?.focus !== 'feedback' || isLoading) return;

    const target = document.getElementById('student-feedback-section');
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isLoading, locationState?.focus, submission]);

  const authorLabel = useMemo(() => {
    if (!submission) return 'Student';
    return submission.authors?.join(', ') || submission.submitter?.name || 'Student';
  }, [submission]);

  const summary = useMemo(() => {
    if (!submission) {
      return {
        turnaround: 0,
        panelComments: 0,
        filesUploaded: 0,
        pendingTasks: 0,
      };
    }

    const start = new Date(submission.submitted_at || submission.created_at).getTime();
    const end = new Date(submission.reviewed_at || submission.approved_at || submission.created_at).getTime();
    const turnaround = Number.isNaN(start) || Number.isNaN(end)
      ? 1
      : Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    return {
      turnaround,
      panelComments: submission.adviser_remarks || submission.rejection_reason ? 1 : 0,
      filesUploaded: submission.file_url ? 1 : 0,
      pendingTasks: submission.status === 'approved' ? 0 : 1,
    };
  }, [submission]);

  return (
    <StudentLayout
      title="Submission Details"
      description="Review the complete submission record, manuscript details, and workflow summary."
      hidePageIntro
    >
      <div className="student-submission-details-shell">
        <div className="student-submission-details-topbar">
          <Link to="/student/my-submissions" className="student-submission-back-link">
            <ArrowLeft size={16} />
            <span>Back to My Submissions</span>
          </Link>
        </div>

        {error ? <div className="vpaa-banner-error">{error}</div> : null}

        {isLoading ? (
          <div className="vpaa-card student-submission-details-loading">Loading submission details...</div>
        ) : !submission ? (
          <div className="vpaa-card student-submission-details-loading">No submission details were found.</div>
        ) : (
          <div className="student-submission-details-grid">
            <section className="vpaa-card student-submission-hero-card">
              <div className="student-submission-hero-top">
                <div className="student-submission-cover">
                  <span className="student-submission-cover-meta">TUP Thesis Archive</span>
                  <span className="student-submission-cover-meta">{submission.department || 'Computer Studies Department'}</span>
                  <strong>{submission.title}</strong>
                </div>

                <div className="student-submission-hero-copy">
                  <div className="student-submission-steps student-submission-steps-header">
                    {buildProgressSteps(submission.status).map((step) => (
                      <div key={step.label} className={`student-submission-step${step.done ? ' done' : ''}`}>
                        <span className="student-submission-step-dot" />
                        <span>{step.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="student-submission-hero-title-row">
                    <h2>{submission.title}</h2>
                  </div>

                  <p className="student-submission-authors">{authorLabel}</p>

                  <div className="student-submission-meta-row">
                    <span>{submission.department || 'Computer Studies Department'}</span>
                    {submission.program ? <span>{submission.program}</span> : null}
                    <span>{submission.school_year}</span>
                    {submission.category?.name ? <span>{submission.category.name}</span> : null}
                    <span>Updated {formatDate(submission.reviewed_at || submission.approved_at || submission.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="student-submission-summary">
                <strong>Abstract Preview</strong>
                <p>{submission.abstract || 'No abstract provided for this submission.'}</p>
              </div>

              {(submission.adviser_remarks || submission.rejection_reason) ? (
                <div className="student-submission-summary" id="student-feedback-section">
                  <strong>{submission.status === 'rejected' ? 'Revision Notes' : 'Approval Comment'}</strong>
                  <p>{submission.rejection_reason || submission.adviser_remarks}</p>
                </div>
              ) : null}
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

              <div className="student-submissions-summary-grid thesis-details-pane-grid submission-summary-grid">
                <div className="student-submissions-summary-box">
                  <span>Turnaround Avg.</span>
                  <strong>{summary.turnaround} days</strong>
                </div>
                <div className="student-submissions-summary-box">
                  <span>Faculty Comments</span>
                  <strong>{summary.panelComments}</strong>
                </div>
                <div className="student-submissions-summary-box">
                  <span>Files Uploaded</span>
                  <strong>{summary.filesUploaded}</strong>
                </div>
                <div className="student-submissions-summary-box">
                  <span>Pending Tasks</span>
                  <strong>{summary.pendingTasks}</strong>
                </div>
              </div>

              <div className="student-submission-detail-grid">
                <div className="student-submission-detail-card">
                  <span><CalendarDays size={13} /> Submitted</span>
                  <strong>{formatDateTime(submission.submitted_at || submission.created_at)}</strong>
                </div>
                <div className="student-submission-detail-card">
                  <span><UserRound size={13} /> Adviser</span>
                  <strong>{submission.adviser?.name || 'Not assigned yet'}</strong>
                </div>
                <div className="student-submission-detail-card">
                  <span><FolderOpen size={13} /> Category</span>
                  <strong>{submission.category?.name || 'Not assigned yet'}</strong>
                </div>
                <div className="student-submission-detail-card">
                  <span><GraduationCap size={13} /> Program</span>
                  <strong>{submission.program || 'Not assigned yet'}</strong>
                </div>
                <div className="student-submission-detail-card full">
                  <span><FileText size={13} /> Manuscript</span>
                  <strong>{submission.file_name || 'No file uploaded'}</strong>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
