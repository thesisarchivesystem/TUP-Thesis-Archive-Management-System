import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, FileBadge2, FileText, FolderOpen, GraduationCap, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
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

const getStatusLabel = (status?: Thesis['status']) => {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Needs Revision';
  if (status === 'draft') return 'Draft';
  return 'Pending Review';
};

const getProgramLabel = (program?: string | null) => {
  if (!program) return 'General';
  if (program.toLowerCase().includes('computer science')) return 'CS';
  return program;
};

type LocationState = {
  submission?: Thesis;
};

export default function FacultySubmissionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;
  const [submission, setSubmission] = useState<Thesis | null>(locationState?.submission ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openingManuscript, setOpeningManuscript] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [revisionDueAt, setRevisionDueAt] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewCommentError, setReviewCommentError] = useState('');
  const [revisionDueAtError, setRevisionDueAtError] = useState('');
  const reviewCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const revisionDueAtRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Submission not found.');
      setIsLoading(false);
      return;
    }

    if (locationState?.submission?.id === id) {
      setSubmission(locationState.submission);
      setReviewComment(locationState.submission.adviser_remarks ?? locationState.submission.rejection_reason ?? '');
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    void thesisService.get(id)
      .then((response) => {
        const data = response?.data ?? response;
        setSubmission(data ?? null);
        setReviewComment(data?.adviser_remarks ?? data?.rejection_reason ?? '');
        setRevisionDueAt(data?.revision_due_at ?? '');
      })
      .catch((err) => {
        setSubmission(null);
        setError(err instanceof Error ? err.message : 'Unable to load thesis details right now.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, locationState]);

  useEffect(() => {
    if (!locationState?.submission) return;
    setReviewComment(locationState.submission.adviser_remarks ?? locationState.submission.rejection_reason ?? '');
    setRevisionDueAt(locationState.submission.revision_due_at ?? '');
  }, [locationState]);

  const authorLabel = useMemo(() => {
    if (!submission) return 'Student';
    return submission.submitter?.name || submission.authors?.join(', ') || 'Student';
  }, [submission]);

  const submissionDateLabel = useMemo(
    () => formatDateTime(submission?.submitted_at ?? submission?.created_at),
    [submission],
  );

  const handleOpenManuscript = async () => {
    if (!submission) return;

    const previewWindow = window.open('', '_blank');

    if (!previewWindow) {
      setError('Popup blocked while opening the manuscript. Please allow popups and try again.');
      return;
    }

    setOpeningManuscript(true);
    previewWindow.document.title = submission.file_name || submission.title || 'Opening manuscript...';
    previewWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px;">Opening manuscript...</p>';

    try {
      const signedUrl = await thesisService.getManuscriptAccessUrl(submission.id);

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
    } finally {
      setOpeningManuscript(false);
    }
  };

  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!submission || isSubmittingReview) return;

    const trimmedComment = reviewComment.trim();

    if (!trimmedComment) {
      const message = status === 'rejected'
        ? 'Please add a rejection reason or feedback before rejecting this submission.'
        : 'Please add a review comment or feedback before approving this submission.';
      setReviewCommentError(message);
      setError(message);
      setSuccess('');
      reviewCommentRef.current?.focus();
      reviewCommentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setReviewCommentError('');

    if (status === 'rejected' && !revisionDueAt) {
      const message = 'Please set a revision due date before marking this submission for revision.';
      setRevisionDueAtError(message);
      setError(message);
      setSuccess('');
      revisionDueAtRef.current?.focus();
      revisionDueAtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setRevisionDueAtError('');

    setIsSubmittingReview(true);
    setError('');
    setSuccess('');

    try {
      await thesisService.review(
        submission.id,
        status,
        trimmedComment,
        status === 'rejected' ? trimmedComment : undefined,
        status === 'rejected' ? revisionDueAt : undefined,
      );

      if (status === 'approved') {
        navigate('/faculty/manage-thesis/approved', {
          replace: true,
          state: {
            successMessage: 'Submission approved successfully.',
          },
        });
        return;
      }

      navigate('/faculty/manage-thesis/review', {
        replace: true,
        state: {
          successMessage: 'Submission marked for revision successfully.',
        },
      });
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the review right now.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <FacultyLayout
      title="Submission Details"
      description="Review the thesis record, submission context, and manuscript from one page."
    >
      <div className="faculty-submission-details-shell">
        <div className="faculty-submission-details-topbar">
          <Link to="/faculty/manage-thesis/review" className="faculty-submission-back-link">
            <ArrowLeft size={16} />
            <span>Back to Review Queue</span>
          </Link>
        </div>

        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {success ? <div className="vpaa-banner-success">{success}</div> : null}

        {isLoading ? (
          <div className="vpaa-card faculty-submission-details-loading">Loading thesis details...</div>
        ) : !submission ? (
          <div className="vpaa-card faculty-submission-details-loading">No thesis details were found for this submission.</div>
        ) : (
          <div className="faculty-submission-details-grid">
            <section className="vpaa-card faculty-submission-hero-card">
              <div className="faculty-submission-hero-header">
                <div className="faculty-submission-title-block">
                  <span className="faculty-submission-eyebrow">Faculty Review Record</span>
                  <h2>{submission.title}</h2>
                  <p className="faculty-submission-hero-copy">
                    A complete submission snapshot for thesis screening, context review, and manuscript access.
                  </p>
                </div>
                <span className={`faculty-submission-status-pill status-${submission.status}`}>
                  {getStatusLabel(submission.status)}
                </span>
              </div>

              <div className="faculty-submission-meta-chips">
                <span><GraduationCap size={14} /> {getProgramLabel(submission.program)}</span>
                <span><FolderOpen size={14} /> {submission.department || 'No department'}</span>
                <span><CalendarDays size={14} /> Submitted {submissionDateLabel}</span>
                <span><UserRound size={14} /> {authorLabel}</span>
              </div>

              <div className="faculty-submission-metrics">
                <article>
                  <span>School Year</span>
                  <strong>{submission.school_year || 'Not available'}</strong>
                </article>
                <article>
                  <span>Category</span>
                  <strong>{submission.category?.name || 'Not assigned'}</strong>
                </article>
                <article>
                  <span>Adviser</span>
                  <strong>{submission.adviser?.name || 'Not assigned yet'}</strong>
                </article>
              </div>

              <div className="faculty-submission-section">
                <h3>Abstract</h3>
                <p>{submission.abstract || 'No abstract provided for this submission.'}</p>
              </div>

            </section>

            <aside className="faculty-submission-side-panel">
              <section className="vpaa-card faculty-submission-manuscript-card">
                <div className="faculty-submission-manuscript-header">
                  <div>
                    <h3>Manuscript Access</h3>
                    <p className="faculty-submission-manuscript-copy">
                      Open the uploaded thesis manuscript from this details page whenever you are ready to review the file.
                    </p>
                  </div>
                  <span className="faculty-submission-manuscript-icon">
                    <FileBadge2 size={20} />
                  </span>
                </div>

                <div className="faculty-submission-manuscript-preview">
                  <span className="faculty-submission-manuscript-label">Current File</span>
                  <strong>{submission.file_name || 'No file uploaded'}</strong>
                  <small>
                    {submission.file_url
                      ? `Uploaded on ${submissionDateLabel}`
                      : 'A manuscript link will appear here once a file is available.'}
                  </small>
                </div>

                <button
                  type="button"
                  className="faculty-submission-manuscript-button"
                  onClick={() => void handleOpenManuscript()}
                  disabled={!submission.file_url || openingManuscript}
                >
                  <FileText size={16} />
                  <span>{openingManuscript ? 'Opening...' : 'View Manuscript'}</span>
                </button>

                <div className="faculty-submission-review-panel">
                  <div className="faculty-submission-review-head">
                    <div>
                      <span className="faculty-submission-eyebrow">Faculty Decision</span>
                      <h3>Review or Comment</h3>
                    </div>
                  </div>
                  <div className="faculty-submission-review-field">
                    <textarea
                      ref={reviewCommentRef}
                      className="faculty-submission-review-textarea"
                      aria-invalid={reviewCommentError ? 'true' : 'false'}
                      value={reviewComment}
                      onChange={(event) => {
                        setReviewComment(event.target.value);
                        if (event.target.value.trim()) {
                          setReviewCommentError('');
                        }
                      }}
                      placeholder="Add faculty comments, revision notes, or approval remarks here..."
                      rows={5}
                    />
                    {reviewCommentError ? (
                      <div className="faculty-submission-review-warning" role="alert">
                        <span className="faculty-submission-review-warning-icon">!</span>
                        <span>{reviewCommentError}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="faculty-submission-review-field">
                    <label className={`student-upload-field${revisionDueAtError ? ' has-error' : ''}`}>
                      <span><CalendarDays size={14} /> Revision Due Date</span>
                      <input
                        ref={revisionDueAtRef}
                        type="date"
                        aria-invalid={revisionDueAtError ? 'true' : 'false'}
                        value={revisionDueAt}
                        onChange={(event) => {
                          setRevisionDueAt(event.target.value);
                          if (event.target.value) {
                            setRevisionDueAtError('');
                          }
                        }}
                      />
                    </label>
                    {revisionDueAtError ? (
                      <div className="faculty-submission-review-warning" role="alert">
                        <span className="faculty-submission-review-warning-icon">!</span>
                        <span>{revisionDueAtError}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="faculty-submission-review-actions">
                    <button
                      type="button"
                      className="faculty-submission-review-button reject"
                      onClick={() => void handleReviewAction('rejected')}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? 'Saving...' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      className="faculty-submission-review-button approve"
                      onClick={() => void handleReviewAction('approved')}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? 'Saving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
