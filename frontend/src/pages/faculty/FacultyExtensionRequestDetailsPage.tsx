import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, FileText, MoveDown, UserRound, WandSparkles } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { extensionRequestService } from '../../services/extensionRequestService';
import type { FacultyExtensionRequest } from '../../types/faculty-extension-request.types';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatStatus = (status?: string) => {
  if (!status) return 'Pending';

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

type LocationState = {
  extensionRequest?: FacultyExtensionRequest;
};

export default function FacultyExtensionRequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [request, setRequest] = useState<FacultyExtensionRequest | null>(locationState?.extensionRequest ?? null);
  const [loading, setLoading] = useState(() => !locationState?.extensionRequest);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Extension request not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    void extensionRequestService.getForFaculty(id)
      .then((data) => {
        setRequest(data);
      })
      .catch((err) => {
        setRequest(null);
        setError(err instanceof Error ? err.message : 'Unable to load extension request details right now.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const currentRevisionDueDate = useMemo(
    () => formatDate(request?.thesis?.revision_due_at),
    [request?.thesis?.revision_due_at],
  );

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!request || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await extensionRequestService.decide(request.id, status);
      navigate('/faculty/manage-thesis/review', {
        replace: true,
        state: {
          extensionRequestId: request.id,
          successMessage: status === 'approved'
            ? 'Extension request approved successfully.'
            : 'Extension request rejected successfully.',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this extension request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FacultyLayout
      title="Extension Request"
      description="Review the student request and decide whether to extend the revision deadline."
    >
      <div className="faculty-submission-details-shell faculty-extension-request-shell">
        <div className="faculty-submission-details-topbar">
          <Link to="/faculty/manage-thesis/review" className="faculty-submission-back-link">
            <ArrowLeft size={16} />
            <span>Back to Review Queue</span>
          </Link>
        </div>

        {error ? <div className="vpaa-banner-error">{error}</div> : null}

        {loading ? (
          <div className="vpaa-card faculty-submission-details-loading">Loading extension request...</div>
        ) : !request ? (
          <div className="vpaa-card faculty-submission-details-loading">No extension request details were found.</div>
        ) : (
          <div className="faculty-submission-details-grid faculty-extension-request-grid">
            <section className="vpaa-card faculty-submission-hero-card faculty-extension-request-hero">
              <div className="faculty-submission-hero-header faculty-extension-request-header">
                <div className="faculty-submission-title-block faculty-extension-request-title-block">
                  <span className="faculty-submission-eyebrow">Student Extension Request</span>
                  <h2>{request.thesis?.title || 'Untitled thesis'}</h2>
                  <p className="faculty-submission-hero-copy faculty-extension-request-copy">
                    Review the requested revision extension and decide whether to update the student&apos;s deadline.
                  </p>
                </div>
                <span className={`faculty-submission-status-pill status-${request.status}`}>
                  {formatStatus(request.status)}
                </span>
              </div>

              <div className="faculty-submission-meta-chips faculty-extension-request-chips">
                <span><UserRound size={14} /> {request.student?.name || 'Student'}</span>
                <span><CalendarDays size={14} /> Current Due {currentRevisionDueDate}</span>
                <span className="faculty-extension-request-chip-alert"><CalendarDays size={14} /> Requested {formatDate(request.requested_deadline)}</span>
                <span><FileText size={14} /> Thesis Status: {formatStatus(request.thesis?.status)}</span>
              </div>

              <div className="faculty-extension-request-summary-strip">
                <div>
                  <span>Deadline Shift</span>
                  <strong>{currentRevisionDueDate} to {formatDate(request.requested_deadline)}</strong>
                </div>
                <div>
                  <span>Decision State</span>
                  <strong>{formatStatus(request.status)}</strong>
                </div>
              </div>

              <div className="faculty-submission-metrics faculty-extension-request-metrics">
                <article>
                  <span>Student Email</span>
                  <strong>{request.student?.email || 'Not available'}</strong>
                </article>
                <article>
                  <span>Request Status</span>
                  <strong>{formatStatus(request.status)}</strong>
                </article>
                <article>
                  <span>Submitted On</span>
                  <strong>{formatDate(request.created_at)}</strong>
                </article>
              </div>

              <div className="faculty-submission-section faculty-extension-request-reason">
                <div className="faculty-extension-request-section-head">
                  <h3>Reason for Extension</h3>
                  <small>Student statement</small>
                </div>
                <div className="faculty-extension-request-reason-box">
                  <p>&quot;{request.reason}&quot;</p>
                </div>
              </div>
            </section>

            <aside className="faculty-submission-side-panel faculty-extension-request-side">
              <section className="vpaa-card faculty-submission-manuscript-card faculty-extension-request-decision-card">
                <div className="faculty-submission-manuscript-header faculty-extension-request-decision-header">
                  <div>
                    <h3>Decision</h3>
                    <p className="faculty-submission-manuscript-copy">
                      Approving this request updates the thesis revision due date to the student&apos;s requested deadline.
                    </p>
                  </div>
                  <span className="faculty-submission-manuscript-icon faculty-extension-request-icon">
                    <WandSparkles size={18} />
                  </span>
                </div>

                <div className="faculty-submission-review-panel faculty-extension-request-review-panel">
                  <div className="faculty-submission-review-head">
                    <div>
                      <span className="faculty-submission-eyebrow">Faculty Decision</span>
                      <h3>Approve or Reject</h3>
                    </div>
                  </div>

                  <div className="faculty-extension-request-comparison">
                    <div className="faculty-extension-request-comparison-row">
                      <span>Current due date</span>
                      <strong>{currentRevisionDueDate}</strong>
                    </div>
                    <div className="faculty-extension-request-comparison-arrow" aria-hidden="true">
                      <MoveDown size={16} />
                    </div>
                    <div className="faculty-extension-request-comparison-row requested">
                      <span>Requested deadline</span>
                      <strong>{formatDate(request.requested_deadline)}</strong>
                    </div>
                  </div>

                  <div className="faculty-extension-request-decision-note">
                    {request.status === 'pending'
                      ? 'Choose an action to keep the revision schedule accurate for both the student and the archive record.'
                      : `This request has already been marked as ${formatStatus(request.status)}.`}
                  </div>

                  <div className="faculty-submission-review-actions faculty-extension-request-actions">
                    <button
                      type="button"
                      className="faculty-submission-review-button approve faculty-extension-request-action-button"
                      onClick={() => void handleDecision('approved')}
                      disabled={submitting || request.status !== 'pending'}
                    >
                      {submitting ? 'Saving...' : 'Approve Request'}
                    </button>
                    <button
                      type="button"
                      className="faculty-submission-review-button reject faculty-extension-request-action-button"
                      onClick={() => void handleDecision('rejected')}
                      disabled={submitting || request.status !== 'pending'}
                    >
                      {submitting ? 'Saving...' : 'Reject Request'}
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
