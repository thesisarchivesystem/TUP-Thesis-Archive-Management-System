import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, Send } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { thesisService } from '../../services/thesisService';
import { extensionRequestService } from '../../services/extensionRequestService';
import type { Thesis } from '../../types/thesis.types';

type LocationState = {
  thesis?: Thesis;
};

export default function StudentExtensionRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState | null;
  const thesisFromState = state?.thesis ?? null;
  const thesisId = searchParams.get('thesis');
  const [thesis, setThesis] = useState<Thesis | null>(thesisFromState);
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(() => !thesisFromState && !!thesisId);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!thesisId) return;
    const normalizedId = decodeURIComponent(thesisId);

    if (thesisFromState && thesisFromState.id === normalizedId) {
      setThesis(thesisFromState);
      return;
    }

    setLoading(true);
    void thesisService.get(normalizedId)
      .then((response) => {
        const data = response?.data ?? response;
        setThesis(data ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load the thesis details right now.');
      })
      .finally(() => setLoading(false));
  }, [thesisFromState, thesisId]);

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!thesis?.id) {
      setError('A thesis record is required before sending an extension request.');
      return;
    }

    setSubmitting(true);
    setSuccess('');
    setError('');

    try {
      await extensionRequestService.create({
        thesis_id: thesis.id,
        requested_deadline: requestedDeadline,
        reason: reason.trim(),
      });

      setSuccess('Extension request submitted successfully.');
      setTimeout(() => navigate('/student/my-submissions'), 1200);
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

      <div className="student-upload-shell">
        <section className="student-upload-main vpaa-card">
          <div className="student-upload-section-copy">
            <h2><Send size={20} /> Request More Time</h2>
            <p>Provide the thesis, new target date, and a clear reason for the extension.</p>
          </div>

          {loading ? <div className="vpaa-card">Loading thesis details...</div> : null}

          {!loading && thesis ? (
            <form className="student-upload-form" onSubmit={handleSubmit}>
              <div className="student-upload-note">
                Revise the paper first if you can still complete the required changes on time. Use the extension request only when you need a formal deadline adjustment.
              </div>

              <label className="student-upload-field full">
                <span><FileText size={14} /> Thesis Title</span>
                <input value={thesis.title} readOnly />
              </label>

              <div className="student-upload-grid">
                <label className="student-upload-field">
                  <span>Current Status</span>
                  <input value={thesis.status} readOnly />
                </label>

                <label className="student-upload-field">
                  <span><CalendarDays size={14} /> Requested Deadline</span>
                  <input type="date" value={requestedDeadline} min={minDate} onChange={(event) => setRequestedDeadline(event.target.value)} required />
                </label>
              </div>

              <label className="student-upload-field full">
                <span>Reason for Extension</span>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={7} minLength={10} placeholder="Explain why you need more time and what revision work is still pending." required />
              </label>

              <div className="student-upload-actions">
                <button type="button" className="student-upload-secondary" onClick={() => navigate('/student/my-submissions')} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="student-upload-primary" disabled={submitting || !requestedDeadline || reason.trim().length < 10}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <aside className="student-upload-side vpaa-card thesis-details-side-card submission-accent-panel">
          <div className="student-upload-section-copy thesis-details-side-head">
            <div>
              <h2>Before You Submit</h2>
              <p>Extension requests are sent to your assigned faculty adviser and recorded in the archive.</p>
            </div>
          </div>
          <div className="student-upload-note">
            Include the revision blockers, the documents still pending, and a realistic date for completion.
          </div>
          <div className="student-upload-note">
            Faculty will receive a notification and can review your request from their Review Submissions workspace.
          </div>
        </aside>
      </div>
    </StudentLayout>
  );
}
