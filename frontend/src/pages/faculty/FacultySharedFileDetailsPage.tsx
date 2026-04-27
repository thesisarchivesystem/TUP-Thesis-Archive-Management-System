import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpenText, CalendarDays, FolderOpen, GraduationCap, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import ThesisArchiveCover from '../../components/thesis/ThesisArchiveCover';
import { facultyLibraryService, type FacultyLibraryItem } from '../../services/facultyLibraryService';

type LocationState = {
  file?: Partial<FacultyLibraryItem> & { id: string };
};

const formatDateTime = (value?: string | null) => {
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

const getInitials = (value: string) =>
  value
    .split(' ')
    .map((part) => part.trim()[0] ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const truncateCoverTitle = (title: string, maxWords = 5) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return title;
  return `${words.slice(0, maxWords).join(' ')}...`;
};

export default function FacultySharedFileDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;
  const [file, setFile] = useState<FacultyLibraryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Shared file not found.');
      setIsLoading(false);
      return;
    }

    const normalizedId = decodeURIComponent(id);
    const stateFile = locationState?.file ?? null;

    if (stateFile && String(stateFile.id) === normalizedId) {
      setFile((current) => ({ ...(current ?? {}), ...stateFile } as FacultyLibraryItem));
    }

    setIsLoading(true);
    setError('');

    void facultyLibraryService.getLibraryItem(normalizedId)
      .then((response) => {
        setFile(response ?? null);
      })
      .catch((err) => {
        if (!stateFile) setFile(null);
        setError(err instanceof Error ? err.message : 'Unable to load shared file details right now.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, locationState?.file]);

  const authorLabel = useMemo(() => {
    if (!file) return 'Unknown author';
    return file.authors?.filter(Boolean).join(', ') || file.author || 'Unknown author';
  }, [file]);

  const metadata = [
    file?.department,
    file?.college,
    file?.school_year,
    file?.category,
  ].filter(Boolean);

  return (
    <FacultyLayout
      title="Shared File"
      description="Review the shared file metadata and archive details."
      hidePageIntro
    >
      <div className="student-submission-details-shell">
        <div className="student-submission-details-topbar">
          <Link to="/faculty/students" className="student-submission-back-link">
            <ArrowLeft size={16} />
            <span>Back to Shared Files</span>
          </Link>
        </div>

        {error ? <div className="vpaa-banner-error">{error}</div> : null}

        {isLoading ? (
          <div className="vpaa-card student-submission-details-loading">Loading shared file details...</div>
        ) : !file ? (
          <div className="vpaa-card student-submission-details-loading">No shared file details were found.</div>
        ) : (
          <div className="student-submission-details-grid">
            <section className="vpaa-card student-submission-hero-card shared-file-hero-card">
              <div className="student-submission-hero-top shared-file-details-hero-top">
                <ThesisArchiveCover
                  className="continue-reading-cover shared-file-details-cover"
                  compact
                  title={truncateCoverTitle(file.title)}
                  college={file.college}
                  department={file.department || 'Faculty Library'}
                  author={authorLabel}
                  authors={file.authors ?? undefined}
                  year={file.year || file.school_year || ''}
                  categories={(file.keywords?.length
                    ? file.keywords
                    : [file.category, file.type, file.program]
                  )
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((tag, index) => ({ id: `${file.id}-tag-${index}`, name: String(tag) }))}
                />

                <div className="student-submission-hero-copy">
                  <div className="student-submission-hero-title-row">
                    <h2>{file.title}</h2>
                  </div>

                  <div className="shared-file-author-inline">
                    <span className="shared-file-author-avatar">{getInitials(authorLabel)}</span>
                    <p className="student-submission-authors shared-file-author-name">{authorLabel}</p>
                  </div>

                  <div className="student-submission-meta-row shared-file-meta-row">
                    {metadata.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                    <span>{file.is_draft ? 'Draft file' : file.type || 'Shared file'}</span>
                  </div>

                  <div className="shared-file-updated-row">Updated {formatDate(file.shared_at || file.created_at)}</div>

                  {file.is_draft ? (
                    <div className="shared-file-draft-actions">
                      <button
                        type="button"
                        className="student-upload-secondary shared-file-draft-button"
                        onClick={() => navigate('/faculty/students', { state: { draft: file } })}
                      >
                        Continue Draft
                      </button>
                      <button
                        type="button"
                        className="shared-file-draft-danger"
                        onClick={() => {
                          if (deleting) return;
                          const confirmed = window.confirm('Delete this draft permanently?');
                          if (!confirmed) return;
                          setDeleting(true);
                          void facultyLibraryService.deleteLibraryItem(file.id)
                            .then(() => navigate('/faculty/students'))
                            .catch((err) => setError(err instanceof Error ? err.message : 'Unable to delete this draft right now.'))
                            .finally(() => setDeleting(false));
                        }}
                        aria-label="Delete draft"
                      >
                        {deleting ? 'Deleting...' : 'Delete Draft'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="student-submission-summary shared-file-summary-row">
                <strong>Abstract</strong>
                <p>{file.abstract || 'No abstract or notes provided for this file.'}</p>
              </div>

              <div className="student-submission-summary shared-file-summary-row shared-file-author-row">
                <strong>Authors</strong>
                <div className="shared-file-author-chip">
                  <span className="shared-file-author-avatar">{getInitials(authorLabel)}</span>
                  <span>{authorLabel}</span>
                </div>
              </div>
            </section>

            <aside className="student-submissions-side vpaa-card thesis-details-side-card">
              <div className="student-submissions-summary-head thesis-details-side-head">
                <div>
                  <h2>File Details</h2>
                  <p>Database-backed shared library record</p>
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

              <div className="thesis-details-pane-grid">
                <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-archive">
                  <div className="thesis-details-info-icon">
                    <CalendarDays size={20} />
                  </div>
                  <div className="thesis-details-info-copy">
                    <span>Shared</span>
                    <strong>{formatDateTime(file.shared_at || file.created_at)}</strong>
                  </div>
                </article>

                <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-submitter">
                  <div className="thesis-details-info-icon">
                    <UserRound size={20} />
                  </div>
                  <div className="thesis-details-info-copy">
                    <span>Author / Owner</span>
                    <strong>{authorLabel}</strong>
                  </div>
                </article>

                <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-category">
                  <div className="thesis-details-info-icon">
                    <FolderOpen size={20} />
                  </div>
                  <div className="thesis-details-info-copy">
                    <span>Category</span>
                    <strong>{file.category || 'Not assigned yet'}</strong>
                  </div>
                </article>

                <article className="student-submission-detail-card thesis-details-pane-card thesis-tone-program">
                  <div className="thesis-details-info-icon">
                    <GraduationCap size={20} />
                  </div>
                  <div className="thesis-details-info-copy">
                    <span>College</span>
                    <strong>{file.college || 'Not assigned yet'}</strong>
                  </div>
                </article>
              </div>
            </aside>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
