import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Files, LibraryBig, UsersRound } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis.types';

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
  if (!program) return 'GEN';
  return program
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 3);
};

const matchesDatasetTag = (thesis: Thesis) =>
  (thesis.keywords ?? []).some((keyword) => keyword.toLowerCase().includes('data'));

export default function FacultyApprovedThesesPage() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [tagFilter, setTagFilter] = useState<'All' | 'This Month' | 'Most Shared' | 'With Datasets'>('All');

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

  const programs = useMemo(
    () => ['All Programs', ...Array.from(new Set(theses.map((item) => item.program).filter(Boolean) as string[]))],
    [theses],
  );

  const departments = useMemo(
    () => ['All Departments', ...Array.from(new Set(theses.map((item) => item.department).filter(Boolean)))],
    [theses],
  );

  const filteredTheses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return theses.filter((thesis) => {
      const matchesSearch = !normalizedSearch || [
        thesis.title,
        thesis.program,
        thesis.department,
        thesis.submitter?.name,
        thesis.authors?.join(', '),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesProgram = programFilter === 'All Programs' || thesis.program === programFilter;
      const matchesDepartment = departmentFilter === 'All Departments' || thesis.department === departmentFilter;

      const matchesTag = (() => {
        if (tagFilter === 'All') return true;
        if (tagFilter === 'Most Shared') return (thesis.view_count ?? 0) > 0;
        if (tagFilter === 'With Datasets') return matchesDatasetTag(thesis);
        if (!thesis.approved_at) return false;
        const approvedDate = new Date(thesis.approved_at);
        return approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
      })();

      return matchesSearch && matchesProgram && matchesDepartment && matchesTag;
    });
  }, [departmentFilter, programFilter, searchTerm, tagFilter, theses]);

  const stats = useMemo(() => {
    const now = new Date();
    const approvedThisMonth = theses.filter((thesis) => {
      if (!thesis.approved_at) return false;
      const approvedDate = new Date(thesis.approved_at);
      return approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
    }).length;

    const latestApproval = theses
      .map((thesis) => thesis.approved_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    return [
      { label: 'Approved This Month', value: String(approvedThisMonth), icon: CheckCircle2, tone: 'sage' },
      { label: 'Total Approved', value: String(theses.length), icon: Files, tone: 'maroon' },
      { label: 'Recently Approved', value: formatRelativeSync(latestApproval), icon: Clock3, tone: 'gold' },
      { label: 'Departments', value: String(new Set(theses.map((item) => item.department).filter(Boolean)).size), icon: LibraryBig, tone: 'terracotta' },
      { label: 'Shared With Admins', value: String(theses.filter((item) => (item.view_count ?? 0) > 0).length), icon: UsersRound, tone: 'sky' },
    ] as const;
  }, [theses]);

  return (
    <FacultyLayout
      title="Approved Theses"
      description="Recently approved works curated by faculty for the shared archive."
    >
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}

        <section className="grid gap-3 xl:grid-cols-5">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-text-secondary">{label}</p>
                  <h2 className="mb-0 text-3xl leading-none text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>{value}</h2>
                </div>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background:
                      tone === 'maroon' ? 'rgba(139,35,50,0.08)'
                        : tone === 'sky' ? 'rgba(74,143,181,0.10)'
                          : tone === 'gold' ? 'rgba(201,150,58,0.10)'
                            : tone === 'terracotta' ? 'rgba(196,101,74,0.10)'
                              : 'rgba(61,139,74,0.10)',
                    color:
                      tone === 'maroon' ? 'var(--maroon)'
                        : tone === 'sky' ? 'var(--sky)'
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

        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(139,35,50,0.08)] text-[var(--maroon)]">
                <Files size={20} />
              </span>
              <h2 className="mb-0 text-2xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Approved Thesis Library</h2>
            </div>
            <button type="button" className="text-sm font-semibold text-[var(--maroon)]">Export List ?</button>
          </div>

          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-3 md:grid-cols-3 xl:w-[58%]">
              <input
                className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, author, program..."
              />
              <select
                className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                value={programFilter}
                onChange={(event) => setProgramFilter(event.target.value)}
              >
                {programs.map((program) => <option key={program} value={program}>{program}</option>)}
              </select>
              <select
                className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['All', 'This Month', 'Most Shared', 'With Datasets'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${tagFilter === filter ? 'border-[var(--maroon)] bg-[rgba(139,35,50,0.06)] text-[var(--maroon)]' : 'border-[var(--border)] bg-white text-text-secondary'}`}
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
                  <th>Thesis Title</th>
                  <th>Author</th>
                  <th>Program</th>
                  <th>Approved By</th>
                  <th>Date Approved</th>
                  <th>Status</th>
                  <th>Action</th>
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
                      <span className="rounded-xl bg-[rgba(61,139,74,0.10)] px-3 py-1 text-xs font-semibold text-[var(--sage)]">Approved</span>
                    </td>
                    <td>
                      <button type="button" className="rounded-xl bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white">View</button>
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
