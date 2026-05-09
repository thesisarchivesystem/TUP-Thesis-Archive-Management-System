import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Eye, FileCheck2, FileText, MessageCircleMore, PencilLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SharedSubmissionsBoard, { type SubmissionTimelineStep } from '../../components/submissions/SharedSubmissionsBoard';
import StudentLayout from '../../components/student/StudentLayout';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { messageService } from '../../services/messageService';
import { thesisService } from '../../services/thesisService';
import type { Thesis, ThesisStatus } from '../../types/thesis.types';
import { createThesisCertificatePdfBlob, getCertificatePdfFileName } from '../../utils/thesisCertificate';

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

const formatDueDate = (value?: string) => {
  if (!value) return 'No due date set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date set';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isRevisionPastDue = (value?: string) => {
  if (!value) return false;

  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;

  dueDate.setHours(23, 59, 59, 999);
  return Date.now() > dueDate.getTime();
};

const getStatusLabel = (status: ThesisStatus, isArchived?: boolean) => {
  if (status === 'approved') return isArchived ? 'Archived' : 'Approved';
  if (status === 'rejected') return 'Revisions Needed';
  if (status === 'draft') return 'Draft';
  return 'Under Review';
};

const getStatusBadgeClass = (item: Thesis) => {
  if (item.status === 'approved' && item.is_archived) return 'student-submission-badge archived';
  if (item.status === 'approved') return 'student-submission-badge approved';
  if (item.status === 'rejected') return 'student-submission-badge revisions';
  if (item.status === 'draft') return 'student-submission-badge draft';
  return 'student-submission-badge review';
};

const buildProgressSteps = (status: ThesisStatus, isArchived?: boolean): SubmissionTimelineStep[] => {
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
      { label: 'Archived', tone: isArchived ? 'done' : 'pending' },
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
  if (item.status === 'approved') return item.is_archived ? ['View Approval', 'Download PDF'] : ['View Approval'];
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
  const { confirm } = useConfirmDialog();
  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [certificateBusyState, setCertificateBusyState] = useState<{ id: string; action: 'view' | 'download' } | null>(null);
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
    if (isRevisionPastDue(item.revision_due_at)) {
      setError('The revision due date has already passed. You can still view details or submit an extension request.');
      return;
    }

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

  const handleViewCertificate = async (item: Thesis) => {
    if (item.status !== 'approved') {
      setError('Certificates are available after faculty approval.');
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      setError('Popup blocked while opening the certificate. Please allow popups and try again.');
      return;
    }

    previewWindow.document.title = 'Opening certificate...';
    previewWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px;">Opening certificate...</p>';

    setError(null);
    setCertificateBusyState({ id: item.id, action: 'view' });

    try {
      const certificateBlob = await createThesisCertificatePdfBlob(item);
      const certificateUrl = URL.createObjectURL(certificateBlob);
      previewWindow.location.replace(certificateUrl);
      window.setTimeout(() => URL.revokeObjectURL(certificateUrl), 30_000);
    } catch (err) {
      previewWindow.document.title = 'Unable to open certificate';
      previewWindow.document.body.innerHTML = `<p style="font-family: Arial, sans-serif; padding: 24px;">${
        err instanceof Error ? err.message : 'Unable to open the certificate right now.'
      }</p>`;
      setError(err instanceof Error ? err.message : 'Unable to open the certificate right now.');
    } finally {
      setCertificateBusyState(null);
    }
  };

  const handleDownloadCertificate = async (item: Thesis) => {
    if (item.status !== 'approved') {
      setError('Certificates are available after faculty approval.');
      return;
    }

    setError(null);
    setCertificateBusyState({ id: item.id, action: 'download' });

    try {
      const certificateBlob = await createThesisCertificatePdfBlob(item);
      const certificateUrl = URL.createObjectURL(certificateBlob);
      const link = document.createElement('a');

      link.href = certificateUrl;
      link.download = getCertificatePdfFileName(item);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(certificateUrl), 30_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download the certificate right now.');
    } finally {
      setCertificateBusyState(null);
    }
  };

  const handleMessageAdviser = async (item: Thesis) => {
    const adviserId = item.adviser?.id || item.adviser_id;

    if (!adviserId) {
      setError('No adviser is assigned to this submission yet.');
      return;
    }

    setError(null);

    try {
      const response = await messageService.startConversation(adviserId);
      const conversationId = response?.data?.id;

      navigate('/student/messages', {
        state: conversationId ? { conversationId } : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open your adviser conversation right now.');
    }
  };

  const handleDeleteDraft = async (item: Thesis) => {
    if (item.status !== 'draft') {
      setError('Only draft submissions can be deleted.');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Draft',
      message: `Delete the draft "${item.title}"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });
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

  const handleWithdrawSubmission = async (item: Thesis) => {
    if (item.status === 'approved') {
      setError('Approved submissions cannot be withdrawn.');
      return;
    }

    const confirmed = await confirm({
      title: 'Withdraw Submission',
      message: `Withdraw "${item.title}"?\n\nThis will delete the submission.`,
      confirmLabel: 'Withdraw',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });
    if (!confirmed) return;

    setError(null);
    setDeletingId(item.id);

    try {
      await thesisService.delete(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to withdraw this submission right now.');
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

  const statCards = [
    { label: 'Total Submissions', value: stats.total, icon: <FileText size={18} /> },
    { label: 'Approved', value: stats.approved, icon: <Check size={18} /> },
    { label: 'Under Review', value: stats.underReview, icon: <Clock3 size={18} /> },
    { label: 'Revisions Needed', value: stats.revisions, icon: <PencilLine size={18} /> },
  ];

  const summaryCards = [
    { label: 'Turnaround Avg.', value: `${summary.turnaround} days`, icon: <Clock3 size={16} /> },
    { label: 'Faculty Comments', value: summary.panelComments, icon: <MessageCircleMore size={16} /> },
    { label: 'Files Uploaded', value: summary.filesUploaded, icon: <FileCheck2 size={16} /> },
    { label: 'Pending Tasks', value: summary.pendingTasks, icon: <Eye size={16} /> },
  ];

  return (
    <StudentLayout
      title="My Submissions"
      description="Track your thesis progress, manage revisions, and keep every requirement in one place."
    >
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      <SharedSubmissionsBoard
        stats={statCards}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={(filter) => setActiveFilter(filter as FilterKey)}
        newSubmissionTo="/student/upload-thesis"
        loading={loading}
        items={visibleItems}
        emptyMessage="No submissions found for this filter."
        summaryTitle="Submission Summary"
        summaryDescription="Snapshot of your research workflow"
        summaryCards={summaryCards}
        getStatusLabel={(item) => getStatusLabel(item.status, item.is_archived)}
        getStatusBadgeClass={getStatusBadgeClass}
        getMeta={(item) => ({
          submittedLabel: `${item.status === 'draft' ? 'Draft saved' : 'Submitted'} ${formatSubmissionDate(item.submitted_at || item.created_at)}`,
          dueLabel: item.status === 'rejected' ? `Due ${formatDueDate(item.revision_due_at)}` : 'No due date set',
        })}
        getTimeline={(item) => buildProgressSteps(item.status, item.is_archived)}
        onViewDetails={handleViewDetails}
        renderActions={(item) => (
          <>
            {item.status === 'approved' ? (
              <>
                <button
                  type="button"
                  className="student-submissions-secondary"
                  onClick={() => void handleViewCertificate(item)}
                  disabled={certificateBusyState?.id === item.id}
                >
                  <span className="student-submissions-action-icon"><FileText size={15} /></span>
                  {certificateBusyState?.id === item.id && certificateBusyState.action === 'view' ? 'Preparing...' : 'View Certificate'}
                </button>
                <button
                  type="button"
                  className="student-submissions-secondary"
                  onClick={() => void handleDownloadCertificate(item)}
                  disabled={certificateBusyState?.id === item.id}
                >
                  <span className="student-submissions-action-icon"><FileCheck2 size={15} /></span>
                  {certificateBusyState?.id === item.id && certificateBusyState.action === 'download' ? 'Preparing...' : 'Download Certificate'}
                </button>
                <button
                  type="button"
                  className="student-submissions-secondary"
                  onClick={() => void handleDownloadManuscript(item)}
                  disabled={downloadingId === item.id}
                >
                  <span className="student-submissions-action-icon"><FileText size={15} /></span>
                  {downloadingId === item.id ? 'Downloading...' : 'Download PDF'}
                </button>
              </>
            ) : null}
            {(item.status === 'rejected' ? getSubmissionActions(item) : getSubmissionActions(item).slice(1)).map((action) => {
              if (item.status === 'approved') return null;

              if (action === 'Edit Draft' || action === 'Continue Editing') {
                return (
                  <button
                    key={action}
                    type="button"
                    className="student-submissions-secondary"
                    onClick={() => handleEditDraft(item)}
                  >
                    <span className="student-submissions-action-icon"><PencilLine size={15} /></span>
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
                    <span className="student-submissions-action-icon"><PencilLine size={15} /></span>
                    {deletingId === item.id ? 'Deleting...' : action}
                  </button>
                );
              }

              if (action === 'Message Adviser') {
                return (
                  <button
                    key={action}
                    type="button"
                    className="student-submissions-secondary"
                    onClick={() => void handleMessageAdviser(item)}
                  >
                    <span className="student-submissions-action-icon"><MessageCircleMore size={15} /></span>
                    {action}
                  </button>
                );
              }

              if (action === 'Withdraw') {
                return (
                  <button
                    key={action}
                    type="button"
                    className="student-submissions-secondary"
                    onClick={() => void handleWithdrawSubmission(item)}
                    disabled={deletingId === item.id}
                  >
                    <span className="student-submissions-action-icon"><Eye size={15} /></span>
                    {deletingId === item.id ? 'Withdrawing...' : action}
                  </button>
                );
              }

              if (action === 'Make Revision') {
                const isDisabled = isRevisionPastDue(item.revision_due_at);

                return (
                  <button
                    key={action}
                    type="button"
                    className="student-submissions-secondary"
                    onClick={() => handleMakeRevision(item)}
                    aria-disabled={isDisabled}
                    title={isDisabled ? 'Revision deadline has passed.' : undefined}
                    style={isDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  >
                    <span className="student-submissions-action-icon"><PencilLine size={15} /></span>
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
                    <span className="student-submissions-action-icon"><Clock3 size={15} /></span>
                    {action}
                  </button>
                );
              }

              return null;
            })}
          </>
        )}
      />
    </StudentLayout>
  );
}
