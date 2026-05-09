import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleX,
  Clock3,
  FileText,
  FolderOpen,
  Info,
  SendHorizontal,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { extensionRequestService } from '../../services/extensionRequestService';
import { thesisService } from '../../services/thesisService';
import type { ExtensionRequest } from '../../types/extension-request.types';
import type { Thesis } from '../../types/thesis.types';

type LocationState = {
  thesis?: Thesis;
};

const formatStatusLabel = (status?: string) => {
  if (!status) return '';

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

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

const getStatusNote = (status?: string) => {
  if (status === 'rejected') return 'Needs revision';
  if (status === 'draft') return 'Draft in progress';
  if (status === 'approved') return 'Already approved';
  return 'Awaiting review';
};

const getRequestStatusNote = (status?: string) => {
  if (status === 'approved') return 'Your adviser approved the extension.';
  if (status === 'rejected') return 'Your adviser did not approve the extension.';
  return 'Your request is waiting for adviser review.';
};

const getStatusCardClass = (status?: string) => {
  if (status === 'rejected') return 'student-extension-request-status-card rejected';
  if (status === 'approved') return 'student-extension-request-status-card approved';
  return 'student-extension-request-status-card';
};

const getRequestStatusCardClass = (status?: string) => {
  if (status === 'rejected') return 'student-extension-request-status-card rejected';
  if (status === 'approved') return 'student-extension-request-status-card approved';
  return 'student-extension-request-status-card pending';
};

const getStatusAlertClass = (status?: string) => {
  if (status === 'approved') return 'student-extension-request-alert approved';
  if (status === 'rejected') return 'student-extension-request-alert rejected';
  return 'student-extension-request-alert';
};

const getRequestAlertCopy = (status?: string) => {
  if (status === 'approved') {
    return {
      title: 'Your extension request was approved.',
      body: 'The thesis revision deadline has been updated based on the approved request.',
    };
  }

  if (status === 'rejected') {
    return {
      title: 'Your extension request was rejected.',
      body: 'Please continue your revision work using the current deadline shown on your thesis record.',
    };
  }

  return {
    title: 'Your extension request has been submitted.',
    body: 'Your faculty adviser is reviewing it now. You will receive a notification once a decision is made.',
  };
};

const getRequestStatusIcon = (status?: string) => {
  if (status === 'approved') return <CheckCircle2 size={18} />;
  if (status === 'rejected') return <CircleX size={18} />;
  return <Clock3 size={18} />;
};

export default function StudentExtensionRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState | null;
  const thesisFromState = state?.thesis ?? null;
  const thesisIdParam = searchParams.get('thesis');
  const normalizedThesisId = thesisFromState?.id ?? (thesisIdParam ? decodeURIComponent(thesisIdParam) : '');
  const [thesis, setThesis] = useState<Thesis | null>(thesisFromState);
  const [currentRequest, setCurrentRequest] = useState<ExtensionRequest | null>(null);
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(() => Boolean(normalizedThesisId));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [redirectAfterSuccess, setRedirectAfterSuccess] = useState(false);

  useEffect(() => {
    if (!normalizedThesisId) {
      setLoading(false);
      setError('A thesis record is required before opening the extension request page.');
      return;
    }

    setLoading(true);
    setError('');

    const thesisPromise = thesisFromState?.id === normalizedThesisId
      ? Promise.resolve(thesisFromState)
      : thesisService.get(normalizedThesisId).then((response) => response?.data ?? response ?? null);

    void Promise.all([
      thesisPromise,
      extensionRequestService.getForStudentByThesis(normalizedThesisId),
    ])
      .then(([loadedThesis, existingRequest]) => {
        setThesis(loadedThesis);
        setCurrentRequest(existingRequest);

        if (existingRequest) {
          setRequestedDeadline(existingRequest.requested_deadline ?? '');
          setReason(existingRequest.reason ?? '');
        }
      })
      .catch((err) => {
        setThesis(null);
        setCurrentRequest(null);
        setError(err instanceof Error ? err.message : 'Unable to load the extension request details right now.');
      })
      .finally(() => setLoading(false));
  }, [normalizedThesisId, thesisFromState]);

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (!success || !redirectAfterSuccess) return;

    const clearTimer = window.setTimeout(() => {
      setSuccess('');
    }, 2500);

    const redirectTimer = window.setTimeout(() => {
      navigate('/student/my-submissions');
    }, 3000);

    return () => {
      window.clearTimeout(clearTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [navigate, redirectAfterSuccess, success]);

  const statusAlertCopy = getRequestAlertCopy(currentRequest?.status);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!thesis?.id) {
      setError('A thesis record is required before sending an extension request.');
      return;
    }

    setSubmitting(true);
    setSuccess('');
    setError('');
    setRedirectAfterSuccess(false);

    try {
      const response = await extensionRequestService.create({
        thesis_id: thesis.id,
        requested_deadline: requestedDeadline,
        reason: reason.trim(),
      });

      setCurrentRequest(response.data ?? null);
      setRequestedDeadline(response.data?.requested_deadline ?? requestedDeadline);
      setReason(response.data?.reason ?? reason.trim());
      setSuccess(response.message || 'Extension request submitted successfully.');
      setRedirectAfterSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the extension request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentLayout
      title="Extension Request"
      description="Request more time for a revision and send the reason directly to your faculty adviser."
    >
      {success ? <div className="vpaa-banner-success">{success}</div> : null}
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      <div className="student-extension-request-shell">
        <div className="student-extension-request-grid">
          <section className="vpaa-card student-extension-request-main">
            <div className={currentRequest ? getStatusAlertClass(currentRequest.status) : 'student-extension-request-alert'}>
              <span className="student-extension-request-alert-icon">
                {currentRequest ? getRequestStatusIcon(currentRequest.status) : <Info size={26} />}
              </span>
              <div>
                <strong>{currentRequest ? statusAlertCopy.title : 'Revise the paper first if you can still complete the required changes on time.'}</strong>
                <p>{currentRequest ? statusAlertCopy.body : 'Use this form only when you need a formal deadline adjustment.'}</p>
              </div>
            </div>

            {loading ? <div className="vpaa-card">Loading thesis details...</div> : null}

            {!loading && thesis && !currentRequest ? (
              <form className="student-extension-request-form" onSubmit={handleSubmit}>
                <label className="student-upload-field full">
                  <span>Thesis Title</span>
                  <input value={thesis.title} readOnly />
                </label>

                <div className="student-extension-request-status-row">
                  <div className="student-extension-request-field-block">
                    <span className="student-extension-request-field-label">Current Status</span>
                    <div className={getStatusCardClass(thesis.status)}>
                      <span className="student-extension-request-status-icon">
                        <CircleX size={18} />
                      </span>
                      <div>
                        <strong>{formatStatusLabel(thesis.status)}</strong>
                        <small>{getStatusNote(thesis.status)}</small>
                      </div>
                    </div>
                  </div>

                  <label className="student-upload-field student-extension-request-deadline-field">
                    <span>Requested Deadline</span>
                    <input type="date" value={requestedDeadline} min={minDate} onChange={(event) => setRequestedDeadline(event.target.value)} required />
                  </label>
                </div>

                <label className="student-upload-field full">
                  <span>Reason for Extension</span>
                  <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={7} placeholder="Explain why you need more time and what revision work is still pending." required />
                </label>

                <div className="student-extension-request-actions">
                  <button type="button" className="student-extension-request-cancel" onClick={() => navigate('/student/my-submissions')} disabled={submitting}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" className="student-extension-request-submit" disabled={submitting || !requestedDeadline || !reason.trim()}>
                    <SendHorizontal size={17} />
                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            ) : null}

            {!loading && thesis && currentRequest ? (
              <div className="student-extension-request-form student-extension-request-status-view">
                <label className="student-upload-field full">
                  <span>Thesis Title</span>
                  <input value={thesis.title} readOnly />
                </label>

                <div className="student-extension-request-status-row">
                  <div className="student-extension-request-field-block">
                    <span className="student-extension-request-field-label">Request Status</span>
                    <div className={getRequestStatusCardClass(currentRequest.status)}>
                      <span className="student-extension-request-status-icon">
                        {getRequestStatusIcon(currentRequest.status)}
                      </span>
                      <div>
                        <strong>{formatStatusLabel(currentRequest.status)}</strong>
                        <small>{getRequestStatusNote(currentRequest.status)}</small>
                      </div>
                    </div>
                  </div>

                  <label className="student-upload-field student-extension-request-deadline-field">
                    <span>Requested Deadline</span>
                    <input value={formatDate(currentRequest.requested_deadline)} readOnly />
                  </label>
                </div>

                <div className="student-extension-request-status-row student-extension-request-status-row--details">
                  <label className="student-upload-field">
                    <span>Submitted On</span>
                    <input value={formatDate(currentRequest.created_at)} readOnly />
                  </label>

                  <label className="student-upload-field">
                    <span>Faculty Adviser</span>
                    <input value={currentRequest.faculty?.name || thesis.adviser?.name || 'Not assigned'} readOnly />
                  </label>
                </div>

                {currentRequest.status === 'approved' ? (
                  <label className="student-upload-field full">
                    <span>Updated Revision Due Date</span>
                    <input value={formatDate(currentRequest.thesis?.revision_due_at || thesis.revision_due_at)} readOnly />
                  </label>
                ) : null}

                <label className="student-upload-field full">
                  <span>Reason for Extension</span>
                  <textarea value={currentRequest.reason} rows={7} readOnly />
                </label>

                <div className="student-extension-request-actions">
                  <button type="button" className="student-extension-request-cancel" onClick={() => navigate('/student/my-submissions')}>
                    <span>Back to Submissions</span>
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="vpaa-card student-extension-request-side">
            <div className="student-extension-request-side-head">
              <h2>{currentRequest ? 'Request Status' : 'Before You Submit'}</h2>
              <p>
                {currentRequest
                  ? 'Review the latest extension request details and track the adviser decision from one place.'
                  : 'Extension requests are sent to your assigned faculty adviser and recorded in the archive.'}
              </p>
            </div>

            <div className="student-extension-request-side-list">
              {currentRequest ? (
                <>
                  <article>
                    <span className="student-extension-request-side-icon"><Clock3 size={22} /></span>
                    <div>
                      <strong>Current request status</strong>
                      <p>{formatStatusLabel(currentRequest.status)}. {getRequestStatusNote(currentRequest.status)}</p>
                    </div>
                  </article>
                  <article>
                    <span className="student-extension-request-side-icon"><CalendarDays size={22} /></span>
                    <div>
                      <strong>Requested deadline</strong>
                      <p>{formatDate(currentRequest.requested_deadline)}</p>
                    </div>
                  </article>
                  <article>
                    <span className="student-extension-request-side-icon"><UserRound size={22} /></span>
                    <div>
                      <strong>Assigned faculty adviser</strong>
                      <p>{currentRequest.faculty?.name || thesis?.adviser?.name || 'Not assigned yet.'}</p>
                    </div>
                  </article>
                </>
              ) : (
                <>
                  <article>
                    <span className="student-extension-request-side-icon"><FileText size={22} /></span>
                    <div>
                      <strong>Include the revision blockers</strong>
                      <p>List the main issues preventing you from completing the revision.</p>
                    </div>
                  </article>
                  <article>
                    <span className="student-extension-request-side-icon"><FolderOpen size={22} /></span>
                    <div>
                      <strong>List documents still pending</strong>
                      <p>Mention any required files or approvals that are not yet available.</p>
                    </div>
                  </article>
                  <article>
                    <span className="student-extension-request-side-icon"><CalendarDays size={22} /></span>
                    <div>
                      <strong>Choose a realistic date</strong>
                      <p>Set a target deadline that gives you enough time to complete the revision.</p>
                    </div>
                  </article>
                </>
              )}
            </div>

            <div className="student-extension-request-side-note">
              <span className="student-extension-request-side-icon compact"><ShieldCheck size={20} /></span>
              <p>
                {currentRequest
                  ? 'Students receive a notification when the faculty adviser approves or rejects the request.'
                  : 'Your request will be reviewed by your faculty adviser. You will receive a notification once a decision is made.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </StudentLayout>
  );
}
