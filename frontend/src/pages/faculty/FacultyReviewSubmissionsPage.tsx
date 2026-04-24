import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, FileText, PencilLine, Send } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { thesisService } from '../../services/thesisService';
import { extensionRequestService } from '../../services/extensionRequestService';
import { facultyDashboardService } from '../../services/facultyDashboardService';
import type { Thesis } from '../../types/thesis.types';
import type { FacultyExtensionRequest } from '../../types/faculty-extension-request.types';

const formatDate = (value?: string) => {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const getProgramLabel = (program?: string | null) => {
  if (!program) return 'General';
  if (program.toLowerCase().includes('computer science')) return 'CS';
  return program;
};

export default function FacultyReviewSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Thesis[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<FacultyExtensionRequest[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_submissions: 0,
    approved_thesis: 0,
    pending_reviews: 0,
    rejected_thesis: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const navigate = useNavigate();
  const location = useLocation();
  const highlightedExtensionRequestId = (location.state as { extensionRequestId?: string } | null)?.extensionRequestId ?? '';

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      thesisService.pendingReview(),
      extensionRequestService.listForFaculty(),
      facultyDashboardService.getDashboard(),
    ])
      .then(([submissionsResponse, extensionResponse, dashboardResponse]) => {
        if (!isMounted) return;
        setSubmissions(submissionsResponse.data ?? []);
        setExtensionRequests(extensionResponse.data ?? []);
        setDashboardStats({
          total_submissions: dashboardResponse.stats?.total_submissions ?? 0,
          approved_thesis: dashboardResponse.stats?.approved_thesis ?? 0,
          pending_reviews: dashboardResponse.stats?.pending_reviews ?? 0,
          rejected_thesis: dashboardResponse.stats?.rejected_thesis ?? 0,
        });
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
      return matchesSearch && matchesProgram && matchesStatus;
    });
  }, [programFilter, searchTerm, statusFilter, submissions]);

  const stats = useMemo(() => {
    return [
      { label: 'Total Submissions', value: String(dashboardStats.total_submissions), icon: FileText, tone: 'maroon' },
      { label: 'Approved', value: String(dashboardStats.approved_thesis), icon: Check, tone: 'sage' },
      { label: 'Under Review', value: String(dashboardStats.pending_reviews), icon: Clock3, tone: 'sky' },
      { label: 'Revisions Needed', value: String(dashboardStats.rejected_thesis), icon: PencilLine, tone: 'terracotta' },
    ] as const;
  }, [dashboardStats]);

  return (
    <FacultyLayout
      title="Review Submissions"
      description="Student thesis uploads awaiting faculty review and approval."
    >
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}

        <section className="grid gap-4 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-4 text-sm font-medium text-text-secondary">{label}</p>
                  <h2 className="mb-0 text-[2.1rem] leading-none text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>{isLoading ? '--' : value}</h2>
                </div>
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      tone === 'maroon' ? 'rgba(139,35,50,0.08)'
                        : tone === 'sky' ? 'rgba(74,143,181,0.10)'
                          : tone === 'terracotta' ? 'rgba(196,101,74,0.10)'
                            : 'rgba(61,139,74,0.10)',
                    color:
                      tone === 'maroon' ? 'var(--maroon)'
                        : tone === 'sky' ? 'var(--sky)'
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
          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(139,35,50,0.08)] text-[var(--maroon)]">
                <FileText size={20} />
              </span>
              <h2 className="mb-0 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Submission Queue</h2>
            </div>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-text-secondary">Loading review queue...</td>
                  </tr>
                ) : null}

                {!isLoading && !filteredSubmissions.length ? (
                  <tr>
                    <td colSpan={6} className="text-center text-text-secondary">No submissions match the current filters.</td>
                  </tr>
                ) : null}

                {filteredSubmissions.slice(0, 8).map((submission) => {
                  const statusLabel = submission.status === 'rejected' ? 'Revision' : submission.status === 'under_review' ? 'Pending' : 'Pending';

                  return (
                    <tr key={submission.id}>
                      <td className="max-w-[360px] truncate font-semibold text-text-primary">{submission.title}</td>
                      <td>{submission.submitter?.name || submission.authors?.join(', ') || 'Student'}</td>
                      <td>
                        <span className="rounded-xl bg-[rgba(139,35,50,0.06)] px-3 py-1 text-xs font-semibold text-[var(--maroon)]">
                          {getProgramLabel(submission.program)}
                        </span>
                      </td>
                      <td>{formatDate(submission.submitted_at ?? submission.created_at)}</td>
                      <td>
                        <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${submission.status === 'rejected' ? 'bg-[rgba(196,101,74,0.08)] text-[var(--terracotta)]' : 'bg-[rgba(201,150,58,0.08)] text-[var(--gold)]'}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="rounded-xl bg-[var(--maroon)] px-4 py-2 text-sm font-semibold text-white"
                          onClick={() => navigate(`/faculty/manage-thesis/review/${submission.id}`, { state: { submission } })}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(196,101,74,0.10)] text-[var(--terracotta)]">
              <Send size={20} />
            </span>
            <div>
              <h2 className="mb-0 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Extension Requests</h2>
              <p className="mt-1 text-sm text-text-secondary">Student requests for additional revision time.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="vpaa-table">
              <thead>
                <tr>
                  <th>Thesis Title</th>
                  <th>Student</th>
                  <th>Requested Deadline</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-text-secondary">Loading extension requests...</td>
                  </tr>
                ) : null}

                {!isLoading && !extensionRequests.length ? (
                  <tr>
                    <td colSpan={5} className="text-center text-text-secondary">No extension requests yet.</td>
                  </tr>
                ) : null}

                {extensionRequests.map((request) => (
                  <tr key={request.id} style={request.id === highlightedExtensionRequestId ? { background: 'rgba(196,101,74,0.06)' } : undefined}>
                    <td className="max-w-[280px] truncate font-semibold text-text-primary">{request.thesis?.title || 'Untitled thesis'}</td>
                    <td>{request.student?.name || 'Student'}</td>
                    <td>{formatDate(request.requested_deadline)}</td>
                    <td className="max-w-[360px]">{request.reason}</td>
                    <td>
                      <span className="rounded-xl bg-[rgba(196,101,74,0.08)] px-3 py-1 text-xs font-semibold text-[var(--terracotta)]">
                        {request.status}
                      </span>
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
