import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Files, LibraryBig } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis.types';

const PROGRAM_OPTIONS = ['All Programs', 'BSCS', 'BSIT', 'BSIS'] as const;

const normalizeProgram = (value?: string | null) => {
  const normalized = (value ?? '').trim().toUpperCase();

  if (!normalized) return '';
  if (normalized === 'BSCS' || normalized.includes('COMPUTER SCIENCE')) return 'BSCS';
  if (normalized === 'BSIT' || normalized.includes('INFORMATION TECHNOLOGY')) return 'BSIT';
  if (normalized === 'BSIS' || normalized.includes('INFORMATION SYSTEM')) return 'BSIS';

  return normalized;
};

const formatRelativeSync = (value?: string) => {
  if (!value) return 'No sync yet';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'No sync yet';
  const diffHours = Math.max(1, Math.round((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
};

const formatApprovedDate = (value?: string) => {
  if (!value) return 'Recently approved';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently approved';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const getProgramBadge = (program?: string | null) => {
  const normalized = normalizeProgram(program);
  return normalized || 'GEN';
};

export default function FacultyApprovedThesesPage() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [tagFilter, setTagFilter] = useState<'All' | 'This Month'>('All');
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleOpenManuscript = async (thesis: Thesis) => {
    const previewWindow = window.open('', '_blank');

    if (!previewWindow) {
      setError('Popup blocked while opening the manuscript. Please allow popups and try again.');
      return;
    }

    previewWindow.document.title = thesis.file_name || thesis.title || 'Opening manuscript...';
    previewWindow.document.body.innerHTML = '<p style="font-family: Arial, sans-serif; padding: 24px;">Opening manuscript...</p>';

    try {
      const signedUrl = await thesisService.getManuscriptAccessUrl(thesis.id);

      if (!signedUrl) {
        throw new Error('Unable to open the manuscript right now.');
      }

      previewWindow.location.replace(signedUrl);
    } catch (err) {
      previewWindow.document.title = 'Unable to open manuscript';
      previewWindow.document.body.innerHTML = `
        <p style="font-family: Arial, sans-serif; padding: 24px;">
          ${err instanceof Error ? err.message : 'Unable to open the manuscript right now.'}
        </p>
      `;
      setError(err instanceof Error ? err.message : 'Unable to open the manuscript right now.');
    }
  };

  const handleArchiveThesis = async (thesis: Thesis) => {
    if (archivingId) return;

    const confirmed = window.confirm(`Archive "${thesis.title}" now? This will make it visible in the dashboard, search, and categories.`);
    if (!confirmed) return;

    setArchivingId(thesis.id);
    setError('');
    setSuccess('');

    try {
      const response = await thesisService.archiveApproved(thesis.id);
      const updated = response.data;

      setTheses((current) => current.map((item) => (item.id === thesis.id ? { ...item, ...updated } : item)));
      setSuccess('Thesis archived successfully. It is now visible in the public archive.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive this thesis right now.');
    } finally {
      setArchivingId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void thesisService.approved()
      .then((response) => {
        if (!isMounted) return;
        setTheses(response.data ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load approved theses right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const programs = PROGRAM_OPTIONS;

  const filteredTheses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return theses.filter((thesis) => {
      const matchesSearch = !normalizedSearch || [
        thesis.title,
        normalizeProgram(thesis.program),
        thesis.submitter?.name,
        thesis.authors?.join(', '),
        thesis.adviser?.name,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesProgram = programFilter === 'All Programs' || normalizeProgram(thesis.program) === programFilter;

      const matchesTag = (() => {
        if (tagFilter === 'All') return true;
        if (!thesis.approved_at) return false;
        const approvedDate = new Date(thesis.approved_at);
        return approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
      })();

      return matchesSearch && matchesProgram && matchesTag;
    });
  }, [programFilter, searchTerm, tagFilter, theses]);

  const stats = useMemo(() => {
    const now = new Date();
    const approvedThisMonth = theses.filter((thesis) => {
      if (!thesis.approved_at) return false;
      const approvedDate = new Date(thesis.approved_at);
      return approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
    }).length;
    const archived = theses.filter((thesis) => thesis.is_archived).length;

    const latestApproval = theses
      .map((thesis) => thesis.approved_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    return [
      { label: 'Approved This Month', value: String(approvedThisMonth), icon: CheckCircle2, tone: 'sage' },
      { label: 'Archived', value: String(archived), icon: Files, tone: 'maroon' },
      { label: 'Recently Approved', value: formatRelativeSync(latestApproval), icon: Clock3, tone: 'gold' },
      { label: 'Departments', value: String(new Set(theses.map((item) => item.department).filter(Boolean)).size), icon: LibraryBig, tone: 'terracotta' },
    ] as const;
  }, [theses]);

  return (
    <FacultyLayout
      title="Approved Theses"
      description="Recently approved works curated by faculty for the shared archive."
    >
      <div className="space-y-5">
        {success ? <div className="rounded-xl bg-[rgba(61,139,74,0.10)] px-4 py-3 text-sm font-medium text-[var(--sage)]">{success}</div> : null}
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}

        <section className="grid gap-3 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-text-secondary">{label}</p>
                  <h2 className="mb-0 text-2xl leading-none text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>{value}</h2>
                </div>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background:
                      tone === 'maroon' ? 'rgba(139,35,50,0.08)'
                        : tone === 'gold' ? 'rgba(201,150,58,0.10)'
                          : tone === 'terracotta' ? 'rgba(196,101,74,0.10)'
                            : 'rgba(61,139,74,0.10)',
                    color:
                      tone === 'maroon' ? 'var(--maroon)'
                        : tone === 'gold' ? 'var(--gold)'
                          : tone === 'terracotta' ? 'var(--terracotta)'
                            : 'var(--sage)',
                  }}
                >
                  <Icon size={18} />
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(139,35,50,0.08)] text-[var(--maroon)]">
                <Files size={20} />
              </span>
              <h2 className="mb-0 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Approved Thesis Library</h2>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between faculty-directory-filter-row">
            <div className="grid gap-3 md:grid-cols-2 xl:w-[48%] faculty-directory-filter-group">
              <input
                className="w-full faculty-directory-filter-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, author, program..."
              />
              <select
                className="w-full faculty-directory-filter-select"
                value={programFilter}
                onChange={(event) => setProgramFilter(event.target.value)}
              >
                {programs.map((program) => <option key={program} value={program}>{program}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 faculty-directory-filter-chips">
              {(['All', 'This Month'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`chip faculty-directory-chip${tagFilter === filter ? ' active' : ''}`}
                  onClick={() => setTagFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="vpaa-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Thesis Title</th>
                  <th style={{ textAlign: 'center' }}>Author</th>
                  <th style={{ textAlign: 'center' }}>Program</th>
                  <th style={{ textAlign: 'center' }}>Approved By</th>
                  <th style={{ textAlign: 'center' }}>Date Approved</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center text-text-secondary">Loading approved theses...</td>
                  </tr>
                ) : null}

                {!isLoading && !filteredTheses.length ? (
                  <tr>
                    <td colSpan={7} className="text-center text-text-secondary">No approved theses match the current filters.</td>
                  </tr>
                ) : null}

                {filteredTheses.slice(0, 8).map((thesis) => (
                  <tr key={thesis.id}>
                    <td className="max-w-[360px] truncate font-semibold text-text-primary">{thesis.title}</td>
                    <td>{thesis.authors?.join(', ') || thesis.submitter?.name || 'Unknown author'}</td>
                    <td>
                      <span className="rounded-xl bg-[rgba(139,35,50,0.06)] px-3 py-1 text-xs font-semibold text-[var(--maroon)]">
                        {getProgramBadge(thesis.program)}
                      </span>
                    </td>
                    <td>{thesis.adviser?.name || 'Faculty Archive'}</td>
                    <td>{formatApprovedDate(thesis.approved_at)}</td>
                    <td>
                      <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${thesis.is_archived ? 'bg-[rgba(61,139,74,0.10)] text-[var(--sage)]' : 'bg-[rgba(201,150,58,0.10)] text-[var(--gold)]'}`}>
                        {thesis.is_archived ? 'Archived' : 'Approved'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className={`mx-auto grid min-w-[220px] max-w-[260px] gap-2 ${thesis.is_archived ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <button
                          type="button"
                          className="inline-flex min-h-[38px] w-full items-center justify-center whitespace-nowrap rounded-xl bg-[var(--maroon)] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(139,35,50,0.16)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(139,35,50,0.2)]"
                          onClick={() => void handleOpenManuscript(thesis)}
                        >
                          View Manuscript
                        </button>
                        {!thesis.is_archived ? (
                          <button
                            type="button"
                            className="inline-flex min-h-[38px] w-full items-center justify-center whitespace-nowrap rounded-xl border border-[var(--maroon)] bg-[rgba(139,35,50,0.04)] px-3 py-2 text-xs font-semibold text-[var(--maroon)] transition hover:-translate-y-[1px] hover:bg-[rgba(139,35,50,0.08)]"
                            onClick={() => void handleArchiveThesis(thesis)}
                            disabled={archivingId === thesis.id}
                          >
                            {archivingId === thesis.id ? 'Archiving...' : 'Archive Thesis'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </FacultyLayout>
  );
}
