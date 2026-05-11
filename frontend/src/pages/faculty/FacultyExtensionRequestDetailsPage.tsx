import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareQuote,
  MoveRight,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { extensionRequestService } from '../../services/extensionRequestService';
import type { FacultyExtensionRequest } from '../../types/faculty-extension-request.types';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-US', {
    month: 'long',
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

const STATUS_META = {
  pending: {
    icon: Clock3,
    className: 'pending',
  },
  approved: {
    icon: CheckCircle2,
    className: 'approved',
  },
  rejected: {
    icon: XCircle,
    className: 'rejected',
  },
} as const;

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
  const [submittingDecision, setSubmittingDecision] = useState<'approved' | 'rejected' | null>(null);
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

  const authorList = useMemo(
    () => (request?.thesis?.authors?.filter(Boolean) ?? []).length
      ? request?.thesis?.authors?.filter(Boolean) ?? []
      : [request?.student?.name || 'Student'],
    [request?.student?.name, request?.thesis?.authors],
  );

  const statusMeta = STATUS_META[request?.status ?? 'pending'] ?? STATUS_META.pending;
  const StatusIcon = statusMeta.icon;

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!request || submitting) return;

    setSubmitting(true);
    setSubmittingDecision(status);
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
      setSubmittingDecision(null);
    }
  };

  return (
    <FacultyLayout
      title="Extension Request"
      description="Review the student request and decide whether to extend the revision deadline."
      hidePageIntro
    >
      <div className="faculty-submission-details-topbar">
        <Link to="/faculty/manage-thesis/review" className="faculty-submission-back-link">
          <ArrowLeft size={16} />
          <span>Back to Review Queue</span>
        </Link>
      </div>

      <div className="vpaa-page-intro faculty-extension-request-page-intro">
        <h1>Extension Request</h1>
        <p>Review the student request and decide whether to extend the revision deadline.</p>
      </div>

      <div className="faculty-submission-details-shell faculty-extension-request-shell">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}

        {loading ? (
          <div className="vpaa-card faculty-submission-details-loading">Loading extension request...</div>
        ) : !request ? (
          <div className="vpaa-card faculty-submission-details-loading">No extension request details were found.</div>
        ) : (
          <section className="vpaa-card faculty-extension-request-showcase">
            <div className="faculty-extension-request-showcase-head">
              <h2>{request.thesis?.title || 'Untitled thesis'}</h2>
              <span className={`faculty-extension-request-status-badge ${statusMeta.className}`}>
                <StatusIcon size={20} />
                <span>{formatStatus(request.status)}</span>
              </span>
            </div>

            <div className="faculty-extension-request-info-card">
              <span className="faculty-extension-request-info-icon">
                <Users size={30} />
              </span>
              <div className="faculty-extension-request-info-copy">
                <strong>Authors</strong>
                <div className="faculty-extension-request-author-chips">
                  {authorList.map((author) => (
                    <span key={author}>{author}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="faculty-extension-request-info-card">
              <span className="faculty-extension-request-info-icon">
                <FileText size={30} />
              </span>
              <div className="faculty-extension-request-info-copy">
                <strong>Abstract</strong>
                <p className="thesis-abstract-text">{request.thesis?.abstract || 'No abstract was provided for this thesis.'}</p>
              </div>
            </div>

            <div className="faculty-extension-request-quote-card">
              <span className="faculty-extension-request-info-icon quote">
                <MessageSquareQuote size={30} />
              </span>
              <div className="faculty-extension-request-info-copy">
                <strong>Reason for Extension</strong>
                <p><em>{request.reason}</em></p>
              </div>
            </div>

            <div className="faculty-extension-request-decision-strip">
              <div className="faculty-extension-request-decision-summary">
                <span className="faculty-extension-request-info-icon decision">
                  <CalendarDays size={30} />
                </span>
                <div className="faculty-extension-request-decision-copy">
                  <strong>Decision</strong>
                  <div className="faculty-extension-request-decision-dates">
                    <div>
                      <span>Current due date</span>
                      <strong>{currentRevisionDueDate}</strong>
                    </div>

                    <span className="faculty-extension-request-decision-arrow" aria-hidden="true">
                      <MoveRight size={30} />
                    </span>

                    <div className="requested">
                      <span>Requested deadline</span>
                      <strong>{formatDate(request.requested_deadline)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="faculty-extension-request-decision-actions">
                <button
                  type="button"
                  className="faculty-extension-request-showcase-button approve"
                  onClick={() => void handleDecision('approved')}
                  disabled={submitting || request.status !== 'pending'}
                >
                  <Check size={22} />
                  <span>{submittingDecision === 'approved' ? 'Saving...' : 'Approve Request'}</span>
                </button>
                <button
                  type="button"
                  className="faculty-extension-request-showcase-button reject"
                  onClick={() => void handleDecision('rejected')}
                  disabled={submitting || request.status !== 'pending'}
                >
                  <X size={22} />
                  <span>{submittingDecision === 'rejected' ? 'Saving...' : 'Reject Request'}</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </FacultyLayout>
  );
}
