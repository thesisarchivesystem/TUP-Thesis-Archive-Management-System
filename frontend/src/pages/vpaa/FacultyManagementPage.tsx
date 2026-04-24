import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Mail, ShieldCheck, UserRoundPlus, Users } from 'lucide-react';
import { facultyManagementService, type FacultyAccountPayload } from '../../services/facultyManagementService';
import type { FacultyProfile } from '../../types/user.types';

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const collegeOptions = [
  'COLLEGE OF ARCHITECTURE AND FINE ARTS',
  'COLLEGE OF ENGINEERING',
  'COLLEGE OF INDUSTRIAL EDUCATION',
  'COLLEGE OF INDUSTRIAL TECHNOLOGY',
  'COLLEGE OF SCIENCE',
];

const departmentOptionsByCollege: Record<string, string[]> = {
  'COLLEGE OF ARCHITECTURE AND FINE ARTS': [
    'Architecture Department',
    'Fine Arts Department',
    'Graphics Department',
  ],
  'COLLEGE OF SCIENCE': [
    'Mathematics Department',
    'Chemistry Department',
    'Physics Department',
    'Computer Studies Department',
  ],
  'COLLEGE OF INDUSTRIAL EDUCATION': [
    'Student Teaching Department',
    'Technical Arts Department',
    'Home Economics Department',
    'Professional Industrial Education',
  ],
  'COLLEGE OF ENGINEERING': [
    'Electrical Engineering',
    'Electronics Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ],
  'COLLEGE OF INDUSTRIAL TECHNOLOGY': [
    'Basic Industrial Technology',
    'Civil Engineering Technology',
    'Food and Apparel Technology',
    'Graphic Arts and Printing Technology',
    'Mechanical Engineering Technology',
    'Power Plant Engineering Technology',
  ],
  'COLLEGE OF LIBERAL ARTS': [
    'Languages Department',
    'Entrepreneurship and Management Department',
    'Social Science Department',
    'Physical Education',
    'Hospitality Management Department',
  ],
};

const generateNextFacultyId = (faculty: FacultyProfile[], role: string) => {
  const yearCode = new Date().getFullYear().toString().slice(-2);
  const prefix = role === 'Dean' ? `DEAN-${yearCode}-` : `FAC-${yearCode}-`;
  const maxSequence = faculty.reduce((highest, member) => {
    if (!member.faculty_id.startsWith(prefix)) return highest;
    const match = member.faculty_id.match(/(\d+)$/);
    if (!match) return highest;
    const numericPart = Number(match[1]);
    return Number.isFinite(numericPart) ? Math.max(highest, numericPart) : highest;
  }, 0);

  return `${prefix}${String(maxSequence + 1).padStart(4, '0')}`;
};

const initialForm: FacultyAccountPayload = {
  first_name: '',
  last_name: '',
  email: '',
  temporary_password: generateTemporaryPassword(),
  faculty_id: '',
  department: '',
  college: '',
  rank: '',
  faculty_role: 'Adviser',
  assigned_chair_id: '',
};

const statusLabel: Record<FacultyProfile['status'], string> = {
  active: 'Active',
  on_leave: 'On Leave',
  inactive: 'Inactive',
};

const roleLabel = (role: FacultyProfile['faculty_role']) => role;

const needsAssignedDean = (role: string) => role !== 'Dean';

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      setError('');
      const records = await facultyManagementService.listFaculty();
      setFaculty(records);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load faculty accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFaculty();
  }, []);

  const chairOptions = useMemo(
    () => faculty.filter((member) => member.faculty_role === 'Dean' && member.status === 'active'),
    [faculty],
  );
  const departmentOptions = useMemo(
    () => departmentOptionsByCollege[form.college || ''] ?? [],
    [form.college],
  );
  const nextFacultyId = useMemo(() => generateNextFacultyId(faculty, form.faculty_role), [faculty, form.faculty_role]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      temporary_password: generateTemporaryPassword(),
    });
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await facultyManagementService.updateFacultyAccount(editingId, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          temporary_password: form.temporary_password.trim() || undefined,
          faculty_id: form.faculty_id ?? '',
          department: form.department.trim(),
          college: form.college?.trim() || undefined,
          rank: form.rank || undefined,
          faculty_role: form.faculty_role,
          assigned_chair_id: form.assigned_chair_id || undefined,
        });
        setSuccess('Faculty account updated.');
      } else {
        await facultyManagementService.createFacultyAccount({
          ...form,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          faculty_id: nextFacultyId,
          college: form.college?.trim() || undefined,
          rank: form.rank || undefined,
          assigned_chair_id: form.assigned_chair_id || undefined,
        });
        setSuccess('Faculty account created in Supabase.');
      }

      resetForm();
      await loadFaculty();
    } catch (err: any) {
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message || 'Unable to save faculty account.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (member: FacultyProfile) => {
    setEditingId(member.id);
    setSuccess('');
    setError('');
    const [firstName = '', ...lastNameParts] = member.user.name.split(' ');
    setForm({
      first_name: firstName,
      last_name: lastNameParts.join(' '),
      email: member.user.email,
      temporary_password: '',
      faculty_id: member.faculty_id,
      department: member.department,
      college: member.college || '',
      rank: member.rank || '',
      faculty_role: member.faculty_role || 'Adviser',
      assigned_chair_id: member.assigned_chair_id || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = async (id: string, status: FacultyProfile['status']) => {
    try {
      setError('');
      setSuccess('');
      await facultyManagementService.updateFacultyStatus(id, { status });
      setFaculty((current) => current.map((member) => (member.id === id ? { ...member, status } : member)));
      setSuccess(`Faculty status changed to ${statusLabel[status]}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update faculty status.');
    }
  };

  return (
    <div className="min-h-screen bg-page-bg px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">VPAA Controls</p>
              <h1 className="mb-2 text-4xl text-text-primary">Faculty Account Management</h1>
              <p className="max-w-2xl text-text-secondary">
                VPAA is the only role allowed to create faculty accounts, assign faculty roles, and update account status.
              </p>
            </div>
            <a href="/vpaa/dashboard" className="text-sm font-semibold text-[var(--maroon)]">
              Back to dashboard
            </a>
          </div>

          {error ? <div className="mb-4 rounded-2xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}
          {success ? <div className="mb-4 rounded-2xl bg-[rgba(61,139,74,0.12)] px-4 py-3 text-sm font-medium text-[var(--sage)]">{success}</div> : null}

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" disabled={submitting} required />
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" disabled={submitting} required />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Faculty email" type="email" disabled={submitting} required />
            <input value={editingId ? form.faculty_id : nextFacultyId} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} placeholder="Faculty ID" disabled={submitting || !editingId} />
            <select value={form.college || ''} onChange={(e) => setForm({ ...form, college: e.target.value, department: '' })} disabled={submitting}>
              <option value="">Select college</option>
              {collegeOptions.map((college) => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
            {departmentOptions.length ? (
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} disabled={submitting} required>
                <option value="">Select department</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            ) : (
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" disabled={submitting} required />
            )}
            <input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="Academic rank" disabled={submitting} />
            <div className="flex gap-3">
              <input value={form.temporary_password} onChange={(e) => setForm({ ...form, temporary_password: e.target.value })} placeholder={editingId ? 'Leave blank to keep the current password' : 'Temporary password'} type="text" disabled={submitting} required={!editingId} />
              <button className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-text-secondary" type="button" onClick={() => setForm({ ...form, temporary_password: generateTemporaryPassword() })}>
                Generate
              </button>
            </div>
            <select
              value={form.faculty_role}
              onChange={(e) => setForm({
                ...form,
                faculty_role: e.target.value,
                assigned_chair_id: e.target.value === 'Dean' ? '' : form.assigned_chair_id,
              })}
              disabled={submitting}
            >
              <option value="Dean">Dean</option>
              <option value="Adviser">Adviser</option>
              <option value="Co-Adviser">Co-Adviser</option>
            </select>
            {needsAssignedDean(form.faculty_role) ? (
              <select value={form.assigned_chair_id} onChange={(e) => setForm({ ...form, assigned_chair_id: e.target.value })} disabled={submitting}>
                <option value="">Assigned dean (optional)</option>
                {chairOptions.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-[var(--maroon)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Save Faculty Changes' : 'Create Faculty Account'}
              </button>
              {editingId ? (
                <button className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-text-secondary" type="button" onClick={resetForm}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-md)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="mb-1 text-2xl text-text-primary">Faculty Directory</h2>
              <p className="text-sm text-text-secondary">Each record below is backed by Supabase `users` and `faculty_profiles` tables.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--stat-maroon-bg)] px-4 py-2 text-sm font-semibold text-[var(--maroon)]">
              <Users size={16} />
              <span>{faculty.length} faculty accounts</span>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-text-secondary">Loading faculty accounts...</div>
          ) : (
            <div className="grid gap-4">
              {faculty.map((member) => (
                <article key={member.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card-alt)] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="mb-0 text-xl text-text-primary">{member.user.name}</h3>
                        <span className="rounded-full bg-[var(--stat-sky-bg)] px-3 py-1 text-xs font-semibold text-[var(--sky)]">{roleLabel(member.faculty_role)}</span>
                        <span className="rounded-full bg-[var(--stat-gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">{statusLabel[member.status]}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-2"><Mail size={14} />{member.user.email}</span>
                        <span className="inline-flex items-center gap-2"><Briefcase size={14} />{member.college || 'No college set'}</span>
                        <span className="inline-flex items-center gap-2"><Briefcase size={14} />{member.department}</span>
                        <span className="inline-flex items-center gap-2"><ShieldCheck size={14} />{member.rank || 'No rank set'}</span>
                      </div>
                      <p className="text-sm text-text-secondary">Faculty ID: {member.faculty_id}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-text-primary" type="button" onClick={() => startEdit(member)}>
                        Edit Role
                      </button>
                      <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--sage)]" type="button" onClick={() => handleStatusChange(member.id, 'active')}>
                        Set Active
                      </button>
                      <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--gold)]" type="button" onClick={() => handleStatusChange(member.id, 'on_leave')}>
                        Set On Leave
                      </button>
                      <button className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--maroon)]" type="button" onClick={() => handleStatusChange(member.id, 'inactive')}>
                        Set Inactive
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {!faculty.length ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-text-secondary">
                  <UserRoundPlus className="mx-auto mb-3" size={34} />
                  No faculty accounts yet. Use the form above to create the first one.
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
