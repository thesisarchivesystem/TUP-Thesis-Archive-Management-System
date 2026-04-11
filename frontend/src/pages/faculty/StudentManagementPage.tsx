import { useEffect, useState } from 'react';
import { GraduationCap, Mail, School, UserPlus, Users } from 'lucide-react';
import { studentManagementService, type StudentAccountPayload } from '../../services/studentManagementService';
import type { StudentProfile } from '../../types/user.types';

const initialForm: StudentAccountPayload = {
  name: '',
  email: '',
  temporary_password: '',
  student_id: '',
  department: '',
  program: '',
  year_level: 1,
};

export default function StudentManagementPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<StudentAccountPayload>(initialForm);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const records = await studentManagementService.listStudents();
      setStudents(records);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await studentManagementService.createStudentAccount({
        ...form,
        year_level: Number(form.year_level) || undefined,
      });
      setSuccess('Student account created in Supabase.');
      setForm(initialForm);
      await loadStudents();
    } catch (err: any) {
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message || 'Unable to create student account.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Faculty Controls</p>
              <h1 className="mb-2 text-4xl text-text-primary">Student Account Creation</h1>
              <p className="max-w-2xl text-text-secondary">
                Faculty can create student access accounts so advisees can sign in, submit work, and view archive records.
              </p>
            </div>
            <a href="/faculty/dashboard" className="text-sm font-semibold text-[var(--maroon)]">
              Back to dashboard
            </a>
          </div>

          {error ? <div className="mb-4 rounded-2xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}
          {success ? <div className="mb-4 rounded-2xl bg-[rgba(61,139,74,0.12)] px-4 py-3 text-sm font-medium text-[var(--sage)]">{success}</div> : null}

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student full name" disabled={submitting} required />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Student email" type="email" disabled={submitting} required />
            <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="Student ID" disabled={submitting} required />
            <input value={form.temporary_password} onChange={(e) => setForm({ ...form, temporary_password: e.target.value })} placeholder="Temporary password" type="password" disabled={submitting} required />
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" disabled={submitting} required />
            <input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="Program" disabled={submitting} required />
            <input
              value={form.year_level ?? ''}
              onChange={(e) => setForm({ ...form, year_level: Number(e.target.value) })}
              placeholder="Year level"
              type="number"
              min="1"
              max="6"
              disabled={submitting}
            />
            <div className="flex items-center text-sm text-text-secondary">Accounts created here are tied to the logged-in faculty adviser.</div>
            <div className="md:col-span-2">
              <button className="rounded-2xl bg-[var(--sky)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Student Account'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="mb-1 text-2xl text-text-primary">My Student Accounts</h2>
              <p className="text-sm text-text-secondary">These records come from Supabase `users` and `student_profiles`.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--stat-sky-bg)] px-4 py-2 text-sm font-semibold text-[var(--sky)]">
              <Users size={16} />
              <span>{students.length} students</span>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-text-secondary">Loading student accounts...</div>
          ) : (
            <div className="grid gap-4">
              {students.map((student) => (
                <article key={student.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card-alt)] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h3 className="mb-0 text-xl text-text-primary">{student.user.name}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-2"><Mail size={14} />{student.user.email}</span>
                        <span className="inline-flex items-center gap-2"><School size={14} />{student.department}</span>
                        <span className="inline-flex items-center gap-2"><GraduationCap size={14} />{student.program}</span>
                      </div>
                      <p className="text-sm text-text-secondary">Student ID: {student.student_id}</p>
                      <p className="text-sm text-text-secondary">Year Level: {student.year_level ?? 'Not set'}</p>
                    </div>
                  </div>
                </article>
              ))}

              {!students.length ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-text-secondary">
                  <UserPlus className="mx-auto mb-3" size={34} />
                  No student accounts yet. Create the first advisee account above.
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
