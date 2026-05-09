import { useEffect, useMemo, useState } from 'react';
import { Archive, Check, Clock3, FileCheck2, FileText, PencilLine } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SharedSubmissionsBoard, { type SubmissionTimelineStep } from '../../components/submissions/SharedSubmissionsBoard';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { facultyThesisService } from '../../services/facultyThesisService';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis.types';

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

const getStatusLabel = (item: Thesis) => {
  if (item.status === 'approved' && item.is_archived) return 'Archived';
  if (item.status === 'approved') return 'Approved';
  if (item.status === 'rejected') return 'Revisions Needed';
  if (item.status === 'draft') return 'Draft';
  return 'Under Review';
};

const getStatusBadgeClass = (item: Thesis) => {
  if (item.status === 'approved' && item.is_archived) return 'student-submission-badge archived';
  if (item.status === 'approved') return 'student-submission-badge approved';
  if (item.status === 'rejected') return 'student-submission-badge revisions';
  if (item.status === 'draft') return 'student-submission-badge draft';
  return 'student-submission-badge review';
};

const buildProgressSteps = (item: Thesis): SubmissionTimelineStep[] => {
  if (item.status === 'draft') {
    return [
      { label: 'Submitted', tone: 'pending' },
      { label: 'For Review', tone: 'pending' },
      { label: 'Approved', tone: 'pending' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  if (item.status === 'approved' && item.is_archived) {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'done' },
      { label: 'Archived', tone: 'done' },
    ];
  }

  if (item.status === 'approved') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'done' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  if (item.status === 'pending') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'current' },
      { label: 'Approved', tone: 'pending' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  if (item.status === 'under_review') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'current' },
      { label: 'Archived', tone: 'pending' },
    ];
  }

  return [
    { label: 'Submitted', tone: 'done' },
    { label: 'For Review', tone: 'done' },
    { label: 'Approved', tone: 'current' },
    { label: 'Archived', tone: 'pending' },
  ];
};

type FilterKey = 'all' | 'approved' | 'under_review' | 'rejected' | 'draft';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'rejected', label: 'Revisions' },
  { key: 'draft', label: 'Draft' },
];

export default function FacultyMyThesesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage ?? '';

  useEffect(() => {
    if (!successMessage) return;

    setSuccess(successMessage);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, navigate, successMessage]);

  const handleViewDetails = (item: Thesis) => {
    setError(null);
    navigate(`/faculty/theses/${encodeURIComponent(item.id)}`, {
      state: { thesis: item },
    });
  };

  const handleEditDraft = (item: Thesis) => {
    if (item.status !== 'draft') {
      setError('Only draft submissions can be edited.');
      return;
    }

    setError(null);
    navigate(`/faculty/manage-thesis/add?draft=${encodeURIComponent(item.id)}`, {
      state: { draft: item },
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
      await facultyThesisService.delete(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the draft right now.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (item: Thesis) => {
    if (archivingId) return;

    const confirmed = await confirm({
      title: 'Archive Thesis',
      message: `Archive "${item.title}" now?\n\nThis will make it visible in the main thesis archive.`,
      confirmLabel: 'OK',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setArchivingId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await facultyThesisService.archive(item.id);
      const updated = response.data;

      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...updated } : entry)));
      setSuccess('Thesis archived successfully! It may take a few moments to appear in the main archive.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive this thesis.');
    } finally {
      setArchivingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    void facultyThesisService.myTheses()
      .then((response) => {
        setItems(response.data ?? []);
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
    const archived = items.filter((item) => item.status === 'approved' && item.is_archived).length;
    const approved = items.filter((item) => item.status === 'approved' && !item.is_archived).length;
    const drafts = items.filter((item) => item.status === 'draft').length;

    return {
      total: items.length,
      archived,
      approved,
      drafts,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'under_review') return item.status === 'pending' || item.status === 'under_review';
      return item.status === activeFilter;
    });

    return [...filtered].sort((a, b) => {
      const left = new Date(a.archived_at || a.reviewed_at || a.approved_at || a.submitted_at || a.created_at).getTime();
      const right = new Date(b.archived_at || b.reviewed_at || b.approved_at || b.submitted_at || b.created_at).getTime();
      return right - left;
    });
  }, [activeFilter, items]);

  const summary = useMemo(() => {
    const filesUploaded = items.filter((item) => item.file_url).length;
    const pendingTasks = items.filter((item) => item.status !== 'approved' || !item.is_archived).length;
    const readyToArchive = items.filter((item) => item.status === 'approved' && !item.is_archived).length;
    const archived = items.filter((item) => item.status === 'approved' && item.is_archived).length;

    return {
      readyToArchive,
      archived,
      filesUploaded,
      pendingTasks,
    };
  }, [items]);

  const statCards = [
    { label: 'Total Submissions', value: stats.total, icon: <FileText size={18} /> },
    { label: 'Approved', value: stats.approved, icon: <Check size={18} /> },
    { label: 'Under Review', value: items.filter((item) => item.status === 'pending' || item.status === 'under_review').length, icon: <Clock3 size={18} /> },
    { label: 'Revisions Needed', value: items.filter((item) => item.status === 'rejected').length, icon: <PencilLine size={18} /> },
  ];

  const summaryCards = [
    { label: 'Ready to Archive', value: summary.readyToArchive, icon: <Archive size={16} /> },
    { label: 'Archived', value: summary.archived, icon: <Check size={16} /> },
    { label: 'Files Uploaded', value: summary.filesUploaded, icon: <FileCheck2 size={16} /> },
    { label: 'Pending Tasks', value: summary.pendingTasks, icon: <Clock3 size={16} /> },
  ];

  return (
    <FacultyLayout
      title="My Submissions"
      description="Track your thesis progress, manage drafts, and archive approved faculty submissions when they are ready for public access."
    >
      {success ? <div className="vpaa-banner-success">{success}</div> : null}
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      <SharedSubmissionsBoard
        stats={statCards}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={(filter) => setActiveFilter(filter as FilterKey)}
        newSubmissionTo="/faculty/manage-thesis/add"
        loading={loading}
        items={visibleItems}
        emptyMessage="No submissions found for this filter."
        summaryTitle="Submission Summary"
        summaryDescription="Snapshot of your faculty researchworkflow"
        summaryCards={summaryCards}
        getStatusLabel={getStatusLabel}
        getStatusBadgeClass={getStatusBadgeClass}
        getMeta={(item) => ({
          submittedLabel: `${item.status === 'draft'
            ? 'Draft saved'
            : item.status === 'approved' && item.is_archived
              ? 'Archived'
              : 'Submitted'} ${formatSubmissionDate(item.archived_at || item.approved_at || item.submitted_at || item.created_at)}`,
          dueLabel: item.revision_due_at ? `Due ${formatSubmissionDate(item.revision_due_at)}` : 'No due date set',
        })}
        getTimeline={buildProgressSteps}
        onViewDetails={handleViewDetails}
        renderActions={(item) => (
          <>
            {item.status === 'draft' ? (
              <>
                <button
                  type="button"
                  className="student-submissions-secondary"
                  onClick={() => handleEditDraft(item)}
                >
                  <span className="student-submissions-action-icon"><PencilLine size={15} /></span>
                  Edit Draft
                </button>
                <button
                  type="button"
                  className="student-submissions-secondary"
                  onClick={() => void handleDeleteDraft(item)}
                  disabled={deletingId === item.id}
                >
                  <span className="student-submissions-action-icon"><PencilLine size={15} /></span>
                  {deletingId === item.id ? 'Deleting...' : 'Delete Draft'}
                </button>
              </>
            ) : null}

            {item.status === 'approved' ? (
              <button
                type="button"
                className="student-submissions-secondary"
                onClick={() => void handleDownloadManuscript(item)}
                disabled={downloadingId === item.id}
              >
                <span className="student-submissions-action-icon"><FileText size={15} /></span>
                {downloadingId === item.id ? 'Downloading...' : 'Download PDF'}
              </button>
            ) : null}

            {item.status === 'approved' && !item.is_archived ? (
              <button
                type="button"
                className="student-submissions-primary"
                onClick={() => void handleArchive(item)}
                disabled={archivingId === item.id}
              >
                <span className="student-submissions-action-icon"><Archive size={15} /></span>
                {archivingId === item.id ? 'Archiving...' : 'Archive Thesis'}
              </button>
            ) : null}
          </>
        )}
      />
    </FacultyLayout>
  );
}
