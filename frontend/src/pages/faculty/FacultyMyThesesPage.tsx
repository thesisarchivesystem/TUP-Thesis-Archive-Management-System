import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, Check, Clock3, FileText, PencilLine, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { facultyThesisService } from '../../services/facultyThesisService';
import { thesisService } from '../../services/thesisService';
import type { Thesis, ThesisStatus } from '../../types/thesis.types';

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

const getStatusBadgeClass = (status: ThesisStatus) => {
  if (status === 'approved') return 'student-submission-badge approved';
  if (status === 'rejected') return 'student-submission-badge revisions';
  if (status === 'draft') return 'student-submission-badge draft';
  return 'student-submission-badge review';
};

const buildProgressSteps = (item: Thesis) => {
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
  const navigate = useNavigate();
  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const confirmed = window.confirm(`Delete the draft "${item.title}"?`);
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

    const confirmed = window.confirm(`Archive "${item.title}" now? This will make it visible in the main thesis archive.`);
    if (!confirmed) return;

    setArchivingId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await facultyThesisService.archive(item.id);
      const updated = response.data;

      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...updated } : entry)));
      setSuccess('Thesis archived successfully. It will now appear in dashboard, search, and categories.');
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

  return (
    <FacultyLayout
      title="My Submissions"
      description="Track your thesis progress, manage drafts, and archive approved faculty submissions when they are ready for public access."
    >
      {success ? <div className="vpaa-banner-success">{success}</div> : null}
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
              <span>Archived</span>
              <strong>{loading ? '--' : stats.archived}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-green"><Check size={18} /></span>
          </article>

          <article className="student-submissions-stat-card vpaa-card">
            <div>
              <span>Approved</span>
              <strong>{loading ? '--' : stats.approved}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-blue"><Clock3 size={18} /></span>
          </article>

          <article className="student-submissions-stat-card vpaa-card">
            <div>
              <span>Drafts</span>
              <strong>{loading ? '--' : stats.drafts}</strong>
            </div>
            <span className="student-submissions-stat-icon phi-terracotta"><PencilLine size={18} /></span>
          </article>
        </div>

        <div className="student-submissions-layout">
          <section className="student-submissions-main">
            <div className="student-submissions-toolbar">
              <div className="student-submissions-filters">
                {FILTERS.map((filter) => (
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

              <Link to="/faculty/manage-thesis/add" className="student-submissions-primary">New Submission</Link>
            </div>

            {loading ? (
              <div className="student-submissions-empty vpaa-card">Loading your submissions...</div>
            ) : visibleItems.length ? (
              <div className="student-submissions-list">
                {visibleItems.map((item) => (
                  <article key={item.id} className="student-submission-list-card vpaa-card">
                    <div className="student-submission-list-head">
                      <div>
                        <h3>{item.title}</h3>
                        <p>
                          {item.status === 'draft'
                            ? 'Draft saved'
                            : item.status === 'approved' && item.is_archived
                              ? 'Archived'
                              : 'Submitted'} {formatSubmissionDate(item.archived_at || item.approved_at || item.submitted_at || item.created_at)}
                        </p>
                      </div>
                      <span className={getStatusBadgeClass(item.status)}>{getStatusLabel(item)}</span>
                    </div>

                    <div className="student-submission-list-steps">
                      {buildProgressSteps(item).map((step) => (
                        <div key={step.label} className={`student-submission-list-step ${step.tone}`}>
                          <span className="student-submission-list-step-dot" />
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="student-submission-actions">
                      <button
                        type="button"
                        className="student-submissions-secondary"
                        onClick={() => handleViewDetails(item)}
                      >
                        View Details
                      </button>

                      {item.status === 'draft' ? (
                        <>
                          <button
                            type="button"
                            className="student-submissions-secondary"
                            onClick={() => handleEditDraft(item)}
                          >
                            Edit Draft
                          </button>
                          <button
                            type="button"
                            className="student-submissions-secondary"
                            onClick={() => void handleDeleteDraft(item)}
                            disabled={deletingId === item.id}
                          >
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
                          {archivingId === item.id ? 'Archiving...' : 'Archive Thesis'}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-submissions-empty vpaa-card">No submissions found for this filter.</div>
            )}
          </section>

          <aside className="student-submissions-side vpaa-card thesis-details-side-card submission-accent-panel">
            <div className="student-submissions-summary-head thesis-details-side-head">
              <div>
                <h2>Submission Summary</h2>
                <p>Snapshot of your faculty archive workflow</p>
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

            <div className="student-submissions-summary-grid submission-summary-grid">
              <div className="student-submissions-summary-box">
                <span>Ready to Archive</span>
                <strong>{loading ? '--' : summary.readyToArchive}</strong>
              </div>
              <div className="student-submissions-summary-box">
                <span>Archived</span>
                <strong>{loading ? '--' : summary.archived}</strong>
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
          </aside>
        </div>
      </div>
    </FacultyLayout>
  );
}
