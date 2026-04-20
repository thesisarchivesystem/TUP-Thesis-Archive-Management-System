import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, FileBadge2, FileText, FolderOpen, GraduationCap, UserRound } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
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
  const locationState = location.state as LocationState | null;
  const [submission, setSubmission] = useState<Thesis | null>(locationState?.submission ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openingManuscript, setOpeningManuscript] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
      setError(status === 'rejected' ? 'Please add a rejection reason before rejecting this submission.' : 'Please add a review comment before approving this submission.');
      setSuccess('');
      return;
    }

    setIsSubmittingReview(true);
    setError('');
    setSuccess('');

    try {
      await thesisService.review(
        submission.id,
        status,
        trimmedComment,
        status === 'rejected' ? trimmedComment : undefined,
      );

      const refreshed = await thesisService.get(submission.id);
      const updatedSubmission = refreshed?.data ?? refreshed;
      setSubmission(updatedSubmission ?? null);
      setReviewComment(updatedSubmission?.adviser_remarks ?? updatedSubmission?.rejection_reason ?? trimmedComment);
      setSuccess(status === 'approved' ? 'Submission approved successfully.' : 'Submission marked for revision successfully.');
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

              <div className="faculty-submission-section">
                <h3>Keywords</h3>
                <div className="faculty-submission-keywords">
                  {(submission.keywords?.length ? submission.keywords : ['No keywords provided']).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
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
                  <textarea
                    className="faculty-submission-review-textarea"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Add faculty comments, revision notes, or approval remarks here..."
                    rows={5}
                  />
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
