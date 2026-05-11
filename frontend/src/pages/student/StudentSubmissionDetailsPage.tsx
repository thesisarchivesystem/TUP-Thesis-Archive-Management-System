import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Heart,
  Info,
  LibraryBig,
  Quote,
  Tags,
  UserRound,
  Users2,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import ThesisArchiveCover from '../../components/thesis/ThesisArchiveCover';
import { thesisService } from '../../services/thesisService';
import { useFavoriteThesisStore } from '../../store/favoriteThesisStore';
import type { Thesis } from '../../types/thesis.types';
import { createFavoriteThesis } from '../../utils/favoriteThesis';
import { buildApa7ThesisCitation } from '../../utils/thesisCitation';
import { createWatermarkedThesisPdfBlob, getWatermarkedPdfFileName } from '../../utils/watermarkedPdf';

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

const truncateCoverTitle = (title: string, maxWords = 5) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return title;
  return `${words.slice(0, maxWords).join(' ')}...`;
};

const getStatusLabel = (submission?: Thesis | null) => {
  if (!submission) return 'Pending Review';
  if (submission.status === 'approved' && submission.is_archived) return 'Archived';
  if (submission.status === 'approved') return 'Approved';
  if (submission.status === 'rejected') return 'Revisions Needed';
  if (submission.status === 'draft') return 'Draft';
  return 'For Review';
};

const getStatusTone = (submission?: Thesis | null) => {
  if (!submission) return 'pending';
  if (submission.status === 'approved' && submission.is_archived) return 'archived';
  if (submission.status === 'approved') return 'approved';
  if (submission.status === 'rejected') return 'revision_needed';
  if (submission.status === 'draft') return 'pending';
  return submission.status;
};

const buildProgressSteps = (submission?: Thesis | null) => {
  if (!submission || submission.status === 'draft') {
    return [
      { label: 'Submitted', tone: 'current' },
      { label: 'For Review', tone: 'pending' },
      { label: 'Approved', tone: 'pending' },
      { label: 'Archived', tone: 'pending' },
    ] as const;
  }

  if (submission.status === 'approved' && submission.is_archived) {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'done' },
      { label: 'Archived', tone: 'done' },
    ] as const;
  }

  if (submission.status === 'approved') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'done' },
      { label: 'Archived', tone: 'pending' },
    ] as const;
  }

  if (submission.status === 'rejected') {
    return [
      { label: 'Submitted', tone: 'done' },
      { label: 'For Review', tone: 'done' },
      { label: 'Approved', tone: 'pending' },
      { label: 'Archived', tone: 'pending' },
    ] as const;
  }

  return [
    { label: 'Submitted', tone: 'done' },
    { label: 'For Review', tone: 'current' },
    { label: 'Approved', tone: 'pending' },
    { label: 'Archived', tone: 'pending' },
  ] as const;
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
  const [success, setSuccess] = useState('');
  const [openingManuscript, setOpeningManuscript] = useState(false);
  const [downloadingManuscript, setDownloadingManuscript] = useState(false);
  const toggleFavorite = useFavoriteThesisStore((state) => state.toggleFavorite);
  const isFavorite = useFavoriteThesisStore((state) => (id ? state.isFavorite('student', decodeURIComponent(id)) : false));

  useEffect(() => {
    document.body.classList.add('thesis-detail-mode');

    return () => {
      document.body.classList.remove('thesis-detail-mode');
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError('Submission not found.');
      setIsLoading(false);
      return;
    }

    const normalizedId = decodeURIComponent(id);
    const stateSubmission = locationState?.submission ?? null;
    const hasMatchingStateSubmission = Boolean(stateSubmission && String(stateSubmission.id) === normalizedId);

    if (hasMatchingStateSubmission) {
      setSubmission(stateSubmission);
      setError('');
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setError('');
    }

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

  useEffect(() => {
    if (!success) return;

    const timeoutId = window.setTimeout(() => {
      setSuccess('');
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [success]);

  const authorLabel = useMemo(() => {
    if (!submission) return 'Student';
    return submission.authors?.filter(Boolean).join(', ') || submission.submitter?.name || submission.submitter_name || 'Student';
  }, [submission]);

  const submissionCategories = useMemo(() => {
    if (!submission) return [];
    if (submission.categories?.length) return submission.categories.slice(0, 5);
    return submission.category ? [submission.category] : [];
  }, [submission]);

  const manuscriptActionLabel = openingManuscript ? 'Opening...' : 'View Thesis';
  const downloadLabel = downloadingManuscript ? 'Preparing...' : 'Download PDF';
  const feedbackLabel = submission?.status === 'rejected' ? 'Revision Notes' : 'Approval Comment';
  const feedbackText = submission?.rejection_reason || submission?.adviser_remarks || '';
  const progressSteps = buildProgressSteps(submission);
  const recordStatus = getStatusLabel(submission);
  const recordStatusTone = getStatusTone(submission);
  const publishedYear = submission?.school_year || submission?.approved_at?.slice(0, 4) || submission?.created_at?.slice(0, 4) || 'Not available';

  const createStudentWatermarkedManuscript = async () => {
    if (!submission?.id) {
      throw new Error('No manuscript is available right now.');
    }

    const manuscriptBlob = await thesisService.getManuscriptPdfBlob(submission.id);
    return createWatermarkedThesisPdfBlob(manuscriptBlob);
  };

  const handleViewManuscript = async () => {
    if (!submission?.id || !submission.file_url) {
      setError('No manuscript is available to view yet.');
      setSuccess('');
      return;
    }

    const previewWindow = window.open('', '_blank');

    if (!previewWindow) {
      setError('Popup blocked while opening the manuscript. Please allow popups and try again.');
      setSuccess('');
      return;
    }

    previewWindow.document.title = submission.file_name || submission.title || 'Opening manuscript...';
    previewWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px;">Opening manuscript...</p>';

    setError('');
    setSuccess('');
    setOpeningManuscript(true);

    try {
      const watermarkedBlob = await createStudentWatermarkedManuscript();
      const watermarkedUrl = URL.createObjectURL(watermarkedBlob);
      previewWindow.location.replace(watermarkedUrl);
      window.setTimeout(() => URL.revokeObjectURL(watermarkedUrl), 30_000);
    } catch (err) {
      previewWindow.document.title = 'Unable to open manuscript';
      previewWindow.document.body.innerHTML = `<p style="font-family: Arial, sans-serif; padding: 24px;">${
        err instanceof Error ? err.message : 'Unable to open the manuscript right now.'
      }</p>`;
      setError(err instanceof Error ? err.message : 'Unable to open the manuscript right now.');
    } finally {
      setOpeningManuscript(false);
    }
  };

  const handleDownloadManuscript = async () => {
    if (!submission?.id || !submission.file_url) {
      setError('No manuscript is available for download yet.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setDownloadingManuscript(true);

    try {
      const watermarkedBlob = await createStudentWatermarkedManuscript();
      const watermarkedUrl = URL.createObjectURL(watermarkedBlob);
      const link = document.createElement('a');
      link.href = watermarkedUrl;
      link.download = getWatermarkedPdfFileName(submission.file_name || submission.title || 'thesis.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(watermarkedUrl), 30_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download the manuscript right now.');
    } finally {
      setDownloadingManuscript(false);
    }
  };

  const handleCopyCitation = async () => {
    if (!submission) return;

    const citation = buildApa7ThesisCitation(submission, window.location.href);

    try {
      await navigator.clipboard.writeText(citation);
      setSuccess('APA 7 citation copied to clipboard.');
      setError('');
    } catch {
      setError('Unable to copy the citation right now.');
      setSuccess('');
    }
  };

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
        {success ? <div className="vpaa-banner-success">{success}</div> : null}

        {isLoading ? (
          <div className="vpaa-card student-submission-details-loading">Loading submission details...</div>
        ) : !submission ? (
          <div className="vpaa-card student-submission-details-loading">No submission details were found.</div>
        ) : (
          <div className="student-submission-details-grid">
            <section className="vpaa-card student-submission-hero-card">
              <div className="student-submission-hero-top">
                <ThesisArchiveCover
                  className="continue-reading-cover"
                  compact
                  title={truncateCoverTitle(submission.title)}
                  college={submission.college}
                  department={submission.department}
                  author={authorLabel}
                  authors={submission.authors}
                  year={submission.school_year ?? submission.created_at?.slice(0, 4) ?? ''}
                  categories={submissionCategories.map((category, index) => ({
                    id: category.id ?? `${submission.id}-category-${index}`,
                    name: category.name,
                    slug: category.slug,
                  }))}
                />

                <div className="student-submission-hero-copy">
                  <div className="student-submission-hero-title-row">
                    <h2>{submission.title}</h2>
                    <button
                      type="button"
                      className={`thesis-favorite-button${isFavorite ? ' active' : ''}`}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      aria-pressed={isFavorite}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={() => {
                        toggleFavorite(createFavoriteThesis('student', submission));
                      }}
                    >
                      <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="thesis-details-manuscript-actions">
                    <button
                      type="button"
                      className="thesis-details-quick-button thesis-details-quick-button-primary thesis-details-download-button"
                      onClick={() => void handleViewManuscript()}
                      disabled={!submission.file_url || openingManuscript || downloadingManuscript}
                    >
                      <Eye size={16} />
                      <span>{manuscriptActionLabel}</span>
                    </button>
                    <button
                      type="button"
                      className="thesis-details-quick-button thesis-details-download-button"
                      onClick={() => void handleDownloadManuscript()}
                      disabled={!submission.file_url || openingManuscript || downloadingManuscript}
                    >
                      <Download size={16} />
                      <span>{downloadLabel}</span>
                    </button>
                    <button
                      type="button"
                      className="thesis-details-quick-button thesis-details-inline-action"
                      onClick={() => void handleCopyCitation()}
                    >
                      <Quote size={14} />
                      <span>Cite This Thesis</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="thesis-record-section thesis-record-section-stack">
                <strong className="thesis-record-section-label">
                  <span className="thesis-record-section-icon"><FileText size={16} /></span>
                  <span>Abstract</span>
                </strong>
                <div className="thesis-record-section-body">
                  <p className="thesis-abstract-text">{submission.abstract || 'No abstract provided for this submission.'}</p>
                </div>
              </div>

              {feedbackText ? (
                <div className="thesis-record-section thesis-record-section-stack" id="student-feedback-section">
                  <strong className="thesis-record-section-label">
                    <span className="thesis-record-section-icon"><Quote size={16} /></span>
                    <span>{feedbackLabel}</span>
                  </strong>
                  <div className="thesis-record-section-body">
                    <p>{feedbackText}</p>
                  </div>
                </div>
              ) : null}

              <div className="thesis-record-section thesis-record-section-stack">
                <strong className="thesis-record-section-label">
                  <span className="thesis-record-section-icon"><Users2 size={16} /></span>
                  <span>Authors</span>
                </strong>
                <div className="thesis-record-authors thesis-record-section-body">
                  {(submission.authors?.filter(Boolean).length ? submission.authors.filter(Boolean) : [authorLabel]).map((author) => {
                    const initials = author
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('');

                    return (
                      <span key={author} className="thesis-record-author-chip">
                        <span className="thesis-record-author-avatar">{initials || 'AU'}</span>
                        <span>{author}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="thesis-details-side-column">
              <section className="student-submissions-side vpaa-card thesis-details-side-card">
                <div className="student-submissions-summary-head thesis-details-side-head">
                  <div>
                    <h2>Thesis Details</h2>
                    <p>Database-backed submission record</p>
                  </div>
                </div>

                <div className="thesis-details-pane-grid">
                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-archive">
                    <div className="thesis-details-info-icon">
                      <CalendarDays size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Submitted</span>
                      <strong>{formatDateTime(submission.submitted_at || submission.created_at)}</strong>
                    </div>
                  </article>

                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-submitter">
                    <div className="thesis-details-info-icon">
                      <UserRound size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Adviser</span>
                      <strong>{submission.adviser?.name || submission.adviser_name || 'Not assigned yet'}</strong>
                    </div>
                  </article>

                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-category">
                    <div className="thesis-details-info-icon">
                      <FolderOpen size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Categories</span>
                      <strong>{submissionCategories.map((category) => category.name).join(', ') || 'Not assigned yet'}</strong>
                    </div>
                  </article>

                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-program">
                    <div className="thesis-details-info-icon">
                      <GraduationCap size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Program</span>
                      <strong>{submission.program || 'Not assigned yet'}</strong>
                    </div>
                  </article>
                </div>
              </section>

              <section className="vpaa-card thesis-details-side-card thesis-details-info-section-card">
                <section className="thesis-details-info-section">
                  <div className="thesis-details-section-heading">
                    <Info size={16} />
                    <span>Additional Information</span>
                  </div>
                  <div className="thesis-details-info-list">
                    <div className="thesis-details-info-row">
                      <span><Tags size={14} /> Status</span>
                      <strong className={`thesis-details-status-inline thesis-status-${recordStatusTone}`}>{recordStatus}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><LibraryBig size={14} /> Department</span>
                      <strong>{submission.department || 'Not available'}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><GraduationCap size={14} /> College</span>
                      <strong>{submission.college || 'Not available'}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><CalendarDays size={14} /> Last Updated</span>
                      <strong>{formatDate(submission.reviewed_at || submission.approved_at || submission.created_at)}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><CalendarDays size={14} /> Year Published</span>
                      <strong>{publishedYear}</strong>
                    </div>
                  </div>
                </section>
              </section>

              <section className="vpaa-card thesis-details-side-card thesis-details-info-section-card">
                <section className="thesis-details-info-section">
                  <div className="thesis-details-section-heading">
                    <Info size={16} />
                    <span>Progress / Status</span>
                  </div>
                  <div className="student-submission-steps">
                    {progressSteps.map((step) => (
                      <div key={step.label} className={`student-submission-step ${step.tone}`}>
                        <span className="student-submission-step-dot" />
                        <span>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            </aside>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
