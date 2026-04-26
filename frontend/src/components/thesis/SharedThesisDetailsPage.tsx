import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpenText, CalendarDays, FolderOpen, GraduationCap, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis.types';

type SharedThesisDetailsPageProps = {
  role: 'vpaa' | 'faculty' | 'student';
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

export default function SharedThesisDetailsPage({
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

  const metadata = [
    thesis?.department,
    thesis?.program,
    thesis?.school_year,
    thesis?.category?.name,
  ].filter(Boolean);

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
                <div className="student-submission-cover">
                  <span className="student-submission-cover-meta">TUP Thesis Archive</span>
                  <span className="student-submission-cover-meta">{thesis.department || 'Archive Record'}</span>
                  <strong>{thesis.title}</strong>
                </div>

                <div className="student-submission-hero-copy">
                  <div className="student-submission-hero-title-row">
                    <h2>{thesis.title}</h2>
                  </div>

                  <p className="student-submission-authors">{authorLabel}</p>

                  <div className="student-submission-meta-row">
                    {metadata.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                    <span>{thesis.status === 'approved' ? 'Archived thesis' : 'Thesis record'}</span>
                    <span>Updated {formatDate(thesis.reviewed_at || thesis.approved_at || thesis.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="student-submission-summary">
                <strong>Abstract</strong>
                <p>{thesis.abstract || 'No abstract provided for this thesis.'}</p>
              </div>

              <div className="student-submission-summary">
                <strong>Authors</strong>
                <p>{authorLabel}</p>
              </div>
            </section>

            <aside className="student-submissions-side vpaa-card thesis-details-side-card">
              <div className="student-submissions-summary-head thesis-details-side-head">
                <div>
                  <h2>Thesis Details</h2>
                  <p>Database-backed archive record</p>
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
                    <span>Category</span>
                    <strong>{thesis.category?.name || 'Not assigned yet'}</strong>
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
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}
