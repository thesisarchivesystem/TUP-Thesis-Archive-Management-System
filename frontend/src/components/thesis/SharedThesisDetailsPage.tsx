import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Download, Eye, FileText, FolderOpen, GraduationCap, Heart, Info, LibraryBig, Quote, Tags, UserRound, Users2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { thesisService } from '../../services/thesisService';
import { useFavoriteThesisStore } from '../../store/favoriteThesisStore';
import type { Thesis } from '../../types/thesis.types';
import { createFavoriteThesis } from '../../utils/favoriteThesis';
import { createWatermarkedThesisPdfBlob, getWatermarkedPdfFileName } from '../../utils/watermarkedPdf';
import ThesisArchiveCover from './ThesisArchiveCover';

type SharedThesisDetailsPageProps = {
  role: 'faculty' | 'student' | 'admin';
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
  Layout: React.ComponentType<{
    title: React.ReactNode;
    description: string;
    children: React.ReactNode;
    hidePageIntro?: boolean;
  }>;
};

type LocationState = {
  thesis?: Partial<Thesis> & { id: string };
};

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

const formatStatusLabel = (status?: string | null) =>
  (status || 'archived')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SharedThesisDetailsPage({
  role,
  title,
  description,
  backTo,
  backLabel,
  Layout,
}: SharedThesisDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingManuscript, setOpeningManuscript] = useState(false);
  const [downloadingWatermarkedManuscript, setDownloadingWatermarkedManuscript] = useState(false);
  const toggleFavorite = useFavoriteThesisStore((state) => state.toggleFavorite);
  const isFavorite = useFavoriteThesisStore((state) => (id ? state.isFavorite(role, decodeURIComponent(id)) : false));

  useEffect(() => {
    document.body.classList.add('thesis-detail-mode');

    return () => {
      document.body.classList.remove('thesis-detail-mode');
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError('Thesis not found.');
      setIsLoading(false);
      return;
    }

    const normalizedId = decodeURIComponent(id);
    const stateThesis = locationState?.thesis ?? null;

    if (stateThesis && String(stateThesis.id) === normalizedId) {
      setThesis((current) => ({ ...(current ?? {}), ...stateThesis } as Thesis));
    }

    setIsLoading(true);
    setError('');

    void thesisService.get(normalizedId)
      .then((response) => {
        const data = response?.data ?? response;
        setThesis(data ?? null);
      })
      .catch((err) => {
        if (!stateThesis) {
          setThesis(null);
        }
        setError(err instanceof Error ? err.message : 'Unable to load thesis details right now.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, locationState?.thesis]);

  const authorLabel = useMemo(() => {
    if (!thesis) return 'Unknown author';
    return thesis.authors?.filter(Boolean).join(', ') || thesis.submitter?.name || thesis.submitter_name || 'Unknown author';
  }, [thesis]);

  const thesisCategories = thesis?.categories?.length
    ? thesis.categories.slice(0, 5)
    : (thesis?.category ? [thesis.category] : []);
  const hasManuscript = Boolean(thesis?.file_url);
  const canViewManuscript = hasManuscript;
  const canDownloadManuscript = hasManuscript;
  const shouldUseWatermarkedDownload = role === 'student';
  const manuscriptActionLabel = openingManuscript ? 'Opening...' : 'View Thesis';
  const watermarkedDownloadLabel = downloadingWatermarkedManuscript ? 'Preparing...' : 'Download PDF';
  const publishedYear = thesis?.school_year || thesis?.approved_at?.slice(0, 4) || thesis?.created_at?.slice(0, 4) || 'Not available';
  const recordStatus = formatStatusLabel(thesis?.status);

  const createStudentWatermarkedManuscript = async () => {
    if (!thesis?.id) {
      throw new Error('No manuscript is available right now.');
    }

    const manuscriptBlob = await thesisService.getManuscriptPdfBlob(thesis.id);
    return createWatermarkedThesisPdfBlob(manuscriptBlob);
  };

  const handleViewManuscript = async () => {
    if (!thesis?.id || !thesis.file_url || !canViewManuscript) {
      setError('No manuscript is available to view yet.');
      return;
    }

    const previewWindow = window.open('', '_blank');

    if (!previewWindow) {
      setError('Popup blocked while opening the manuscript. Please allow popups and try again.');
      return;
    }

    previewWindow.document.title = thesis.file_name || thesis.title || 'Opening manuscript...';
    previewWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px;">Opening manuscript...</p>';

    setError('');
    setOpeningManuscript(true);

    try {
      if (role === 'student') {
        const watermarkedBlob = await createStudentWatermarkedManuscript();
        const watermarkedUrl = URL.createObjectURL(watermarkedBlob);
        previewWindow.location.replace(watermarkedUrl);
        return;
      }

      const signedUrl = await thesisService.getManuscriptAccessUrl(thesis.id);
      if (!signedUrl) {
        throw new Error('Unable to open the manuscript right now.');
      }

      previewWindow.location.replace(signedUrl);
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
    if (!thesis?.id || !thesis.file_url || !canDownloadManuscript) {
      setError('No manuscript is available for download yet.');
      return;
    }

    setError('');
    setDownloadingWatermarkedManuscript(true);

    try {
      const link = document.createElement('a');

      if (shouldUseWatermarkedDownload) {
        const watermarkedBlob = await createStudentWatermarkedManuscript();
        const watermarkedUrl = URL.createObjectURL(watermarkedBlob);
        link.href = watermarkedUrl;
        link.download = getWatermarkedPdfFileName(thesis.file_name || thesis.title || 'thesis.pdf');
        window.setTimeout(() => URL.revokeObjectURL(watermarkedUrl), 30_000);
      } else {
        const signedUrl = await thesisService.getManuscriptAccessUrl(thesis.id);
        if (!signedUrl) {
          throw new Error('Unable to download the manuscript right now.');
        }

        link.href = signedUrl;
        link.download = thesis.file_name || thesis.title || 'thesis.pdf';
      }

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download the manuscript right now.');
    } finally {
      setDownloadingWatermarkedManuscript(false);
    }
  };

  return (
    <Layout title={title} description={description} hidePageIntro>
      <div className="student-submission-details-shell">
        <div className="student-submission-details-topbar">
          <Link to={backTo} className="student-submission-back-link">
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </Link>
        </div>

        {error ? <div className="vpaa-banner-error">{error}</div> : null}

        {isLoading ? (
          <div className="vpaa-card student-submission-details-loading">Loading thesis details...</div>
        ) : !thesis ? (
          <div className="vpaa-card student-submission-details-loading">No thesis details were found.</div>
        ) : (
          <div className="student-submission-details-grid">
            <section className="vpaa-card student-submission-hero-card">
              <div className="student-submission-hero-top">
                <ThesisArchiveCover
                  className="continue-reading-cover"
                  compact
                  title={truncateCoverTitle(thesis.title)}
                  college={thesis.college}
                  department={thesis.department}
                  author={authorLabel}
                  authors={thesis.authors}
                  year={thesis.school_year ?? thesis.created_at?.slice(0, 4) ?? ''}
                  categories={thesisCategories.map((category, index) => ({
                    id: category.id ?? `${thesis.id}-category-${index}`,
                    name: category.name,
                    slug: category.slug,
                  }))}
                />

                <div className="student-submission-hero-copy">
                  <div className="student-submission-hero-title-row">
                    <h2>{thesis.title}</h2>
                    <button
                      type="button"
                      className={`thesis-favorite-button${isFavorite ? ' active' : ''}`}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      aria-pressed={isFavorite}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={() => {
                        toggleFavorite(createFavoriteThesis(role, thesis));
                      }}
                    >
                      <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {canViewManuscript ? (
                    <div className="thesis-details-manuscript-actions">
                      <button
                        type="button"
                        className="thesis-details-quick-button thesis-details-quick-button-primary thesis-details-download-button"
                        onClick={() => void handleViewManuscript()}
                        disabled={openingManuscript || downloadingWatermarkedManuscript}
                      >
                        <Eye size={16} />
                        <span>{manuscriptActionLabel}</span>
                      </button>
                      {canDownloadManuscript ? (
                        <button
                          type="button"
                          className="thesis-details-quick-button thesis-details-download-button"
                          onClick={() => void handleDownloadManuscript()}
                          disabled={openingManuscript || downloadingWatermarkedManuscript}
                        >
                          <Download size={16} />
                          <span>{watermarkedDownloadLabel}</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="thesis-details-quick-button thesis-details-inline-action"
                      >
                        <Quote size={14} />
                        <span>Cite This Thesis</span>
                      </button>
                    </div>
                  ) : null}

                </div>
              </div>

              <div className="thesis-record-section">
                <strong className="thesis-record-section-label">
                  <span className="thesis-record-section-icon"><FileText size={16} /></span>
                  <span>Abstract</span>
                </strong>
                <div className="thesis-record-section-body">
                  <p>{thesis.abstract || 'No abstract provided for this thesis.'}</p>
                </div>
              </div>

              <div className="thesis-record-section">
                <strong className="thesis-record-section-label">
                  <span className="thesis-record-section-icon"><Users2 size={16} /></span>
                  <span>Authors</span>
                </strong>
                <div className="thesis-record-authors">
                  {(thesis.authors?.filter(Boolean).length ? thesis.authors.filter(Boolean) : [authorLabel]).map((author) => {
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
                    <p>Database-backed archive record</p>
                  </div>
                </div>

                <div className="thesis-details-pane-grid">
                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-archive">
                    <div className="thesis-details-info-icon">
                      <CalendarDays size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Archive</span>
                      <strong>{formatDateTime(thesis.approved_at || thesis.created_at)}</strong>
                    </div>
                  </article>

                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-submitter">
                    <div className="thesis-details-info-icon">
                      <UserRound size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Submitter</span>
                      <strong>{thesis.submitter?.name || thesis.submitter_name || 'Not available'}</strong>
                    </div>
                  </article>

                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-category">
                    <div className="thesis-details-info-icon">
                      <FolderOpen size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Categories</span>
                      <strong>{thesisCategories.map((category) => category.name).join(', ') || 'Not assigned yet'}</strong>
                    </div>
                  </article>

                  <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-program">
                    <div className="thesis-details-info-icon">
                      <GraduationCap size={20} />
                    </div>
                    <div className="thesis-details-info-copy">
                      <span>Program</span>
                      <strong>{thesis.program || 'Not assigned yet'}</strong>
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
                      <strong className={`thesis-details-status-inline thesis-status-${(thesis?.status || 'archived').toLowerCase()}`}>{recordStatus}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><LibraryBig size={14} /> Department</span>
                      <strong>{thesis.department || 'Not available'}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><GraduationCap size={14} /> College</span>
                      <strong>{thesis.college || 'Not available'}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><CalendarDays size={14} /> Last Updated</span>
                      <strong>{formatDate(thesis.reviewed_at || thesis.approved_at || thesis.archived_at || thesis.created_at)}</strong>
                    </div>
                    <div className="thesis-details-info-row">
                      <span><CalendarDays size={14} /> Year Published</span>
                      <strong>{publishedYear}</strong>
                    </div>
                  </div>
                </section>
              </section>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
