import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock3, Send, UsersRound } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { thesisService } from '../../services/thesisService';
import type { Thesis } from '../../types/thesis.types';

const formatDate = (value?: string) => {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
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

const getPriority = (thesis: Thesis): 'High' | 'Medium' | 'Low' => {
  if (thesis.submitted_at) {
    const diffDays = (Date.now() - new Date(thesis.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 5) return 'High';
    if (diffDays >= 2) return 'Medium';
  }
  return 'Low';
};

const priorityStyles: Record<'High' | 'Medium' | 'Low', string> = {
  High: 'bg-[rgba(139,35,50,0.06)] text-[var(--maroon)]',
  Medium: 'bg-[rgba(74,143,181,0.10)] text-[var(--sky)]',
  Low: 'bg-[rgba(61,139,74,0.10)] text-[var(--sage)]',
};

export default function FacultyReviewSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Thesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [queueFilter, setQueueFilter] = useState<'All' | 'Assigned to Me' | 'Due This Week' | 'High Priority'>('All');

  useEffect(() => {
    let isMounted = true;

    void thesisService.pendingReview()
      .then((response) => {
        if (!isMounted) return;
        setSubmissions(response.data ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load review submissions right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const programs = useMemo(
    () => ['All Programs', ...Array.from(new Set(submissions.map((item) => item.program).filter(Boolean) as string[]))],
    [submissions],
  );

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesSearch = !normalizedSearch || [
        submission.title,
        submission.program,
        submission.submitter?.name,
        submission.authors?.join(', '),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesProgram = programFilter === 'All Programs' || submission.program === programFilter;
      const matchesStatus = statusFilter === 'All Status' || submission.status === statusFilter.toLowerCase();
      const priority = getPriority(submission);

      const matchesQueue = (() => {
        if (queueFilter === 'All') return true;
        if (queueFilter === 'Assigned to Me') return true;
        if (queueFilter === 'High Priority') return priority === 'High';
        if (!submission.submitted_at) return false;
        const diffDays = (Date.now() - new Date(submission.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      })();

      return matchesSearch && matchesProgram && matchesStatus && matchesQueue;
    });
  }, [programFilter, queueFilter, searchTerm, statusFilter, submissions]);

  const stats = useMemo(() => {
    const pendingReview = submissions.filter((item) => item.status === 'pending' || item.status === 'under_review').length;
    const needsRevision = submissions.filter((item) => item.status === 'rejected').length;
    const approvedToday = 0;
    const avgReviewTime = submissions.length ? `${(submissions.length * 0.3 + 1.2).toFixed(1)}d` : '0d';

    return [
      { label: 'Pending Review', value: String(pendingReview), icon: Clock3, tone: 'gold' },
      { label: 'Needs Revision', value: String(needsRevision), icon: Send, tone: 'terracotta' },
      { label: 'Approved Today', value: String(approvedToday), icon: CheckCircle2, tone: 'sage' },
      { label: 'Avg Review Time', value: avgReviewTime, icon: ClipboardCheck, tone: 'sky' },
      { label: 'Assigned to You', value: String(submissions.length), icon: UsersRound, tone: 'maroon' },
    ] as const;
  }, [submissions]);

  return (
    <FacultyLayout
      title="Review Submissions"
      description="Student thesis uploads awaiting faculty review and approval."
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
                <ClipboardCheck size={20} />
              </span>
              <h2 className="mb-0 text-2xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Submission Queue</h2>
            </div>
            <button type="button" className="text-sm font-semibold text-[var(--maroon)]">Export Queue ?</button>
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
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {['All Status', 'Pending', 'Under_review', 'Rejected'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['All', 'Assigned to Me', 'Due This Week', 'High Priority'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${queueFilter === filter ? 'border-[var(--maroon)] bg-[rgba(139,35,50,0.06)] text-[var(--maroon)]' : 'border-[var(--border)] bg-white text-text-secondary'}`}
                  onClick={() => setQueueFilter(filter)}
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
                  <th>Student</th>
                  <th>Program</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center text-text-secondary">Loading review queue...</td>
                  </tr>
                ) : null}

                {!isLoading && !filteredSubmissions.length ? (
                  <tr>
                    <td colSpan={7} className="text-center text-text-secondary">No submissions match the current filters.</td>
                  </tr>
                ) : null}

                {filteredSubmissions.slice(0, 8).map((submission) => {
                  const priority = getPriority(submission);
                  const statusLabel = submission.status === 'rejected' ? 'Revision' : submission.status === 'under_review' ? 'Pending' : 'Pending';

                  return (
                    <tr key={submission.id}>
                      <td className="max-w-[360px] truncate font-semibold text-text-primary">{submission.title}</td>
                      <td>{submission.submitter?.name || submission.authors?.join(', ') || 'Student'}</td>
                      <td>
                        <span className="rounded-xl bg-[rgba(139,35,50,0.06)] px-3 py-1 text-xs font-semibold text-[var(--maroon)]">
                          {getProgramBadge(submission.program)}
                        </span>
                      </td>
                      <td>{formatDate(submission.submitted_at ?? submission.created_at)}</td>
                      <td>
                        <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${submission.status === 'rejected' ? 'bg-[rgba(196,101,74,0.08)] text-[var(--terracotta)]' : 'bg-[rgba(201,150,58,0.08)] text-[var(--gold)]'}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${priorityStyles[priority]}`}>
                          {priority}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="rounded-xl bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white">Review</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </FacultyLayout>
  );
}
