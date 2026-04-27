import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, CheckCircle2, Clock3, List, UserPlus, Users2 } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { facultyAdviseesService, type FacultyAdviseeRecord, type FacultyAdviseesResponse, type StudentAccountPayload } from '../../services/facultyAdviseesService';

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const defaultProgramOptions = [
  'BSCS',
  'BSIT',
  'BSIS',
];

const EDIT_PANEL_CLOSE_DELAY = 280;
const EDIT_PANEL_SHELL_CLOSE_DELAY = 180;

const initialForm: StudentAccountPayload = {
  first_name: '',
  last_name: '',
  suffix: '',
  email: '',
  temporary_password: generateTemporaryPassword(),
  student_id: '',
  department: '',
  program: '',
  year_level: 4,
};

const statusClassMap: Record<FacultyAdviseeRecord['status_tone'], string> = {
  gold: 'status-pending',
  sage: 'status-approved',
  terracotta: 'status-revision',
};

const yearLevelOptions = [
  { label: '1st Year', value: 1 },
  { label: '2nd Year', value: 2 },
  { label: '3rd Year', value: 3 },
  { label: '4th Year', value: 4 },
  { label: '5th Year', value: 5 },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

export default function FacultyAdviseesPage() {
  const { confirm } = useConfirmDialog();
  const [adviseesData, setAdviseesData] = useState<FacultyAdviseesResponse | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editShellOpen, setEditShellOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All Programs');
  const [quickFilter, setQuickFilter] = useState<'All' | 'New Accounts'>('All');
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [success, setSuccess] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const editPanelRef = useRef<HTMLDivElement | null>(null);
  const editCloseTimeoutRef = useRef<number | null>(null);

  const loadAdvisees = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const response = await facultyAdviseesService.getAdvisees();
      setAdviseesData(response);
      setError('');
      setForm((current) => ({
        ...current,
        department: current.department || response.department || '',
      }));
    } catch {
      setError('Unable to load advisees right now.');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadAdvisees();
  }, []);

  useEffect(() => () => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!editingId || !editOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingId, editOpen]);

  const advisees = adviseesData?.advisees ?? [];
  const summary = adviseesData?.summary;

  const programOptions = useMemo(
    () => ['All Programs', ...Array.from(new Set([...defaultProgramOptions, ...advisees.map((item) => item.program).filter(Boolean)]))],
    [advisees],
  );

  const filteredAdvisees = useMemo(() => advisees.filter((advisee) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      advisee.student_name,
      advisee.student_id,
      advisee.program,
      advisee.department,
    ].join(' ').toLowerCase().includes(normalizedSearch);

    const matchesProgram = programFilter === 'All Programs' || advisee.program === programFilter;
    const matchesQuick = quickFilter === 'All'
      || (quickFilter === 'New Accounts' && advisee.is_recent);

    return matchesSearch && matchesProgram && matchesQuick;
  }), [advisees, adviseesData?.adviser_name, programFilter, quickFilter, search]);

  const stats = [
    { label: 'Total Advisees', value: summary?.total_advisees ?? 0, icon: <Users2 size={20} />, tone: 'si-sky' },
    { label: 'Active Proposals', value: summary?.active_proposals ?? 0, icon: <Clock3 size={20} />, tone: 'si-gold' },
    { label: 'On Track', value: summary?.on_track ?? 0, icon: <CheckCircle2 size={20} />, tone: 'si-sage' },
    { label: 'Account Changed', value: summary?.info_changed ?? 0, icon: <Users2 size={20} />, tone: 'si-maroon' },
  ];
  const selectedAdvisee = editingId ? advisees.find((advisee) => advisee.id === editingId) ?? null : null;

  const resetEditForm = () => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
      editCloseTimeoutRef.current = null;
    }

    setEditOpen(false);

    editCloseTimeoutRef.current = window.setTimeout(() => {
      setEditShellOpen(false);

      editCloseTimeoutRef.current = window.setTimeout(() => {
        setEditForm({
          ...initialForm,
          temporary_password: generateTemporaryPassword(),
          department: adviseesData?.department || '',
        });
        setEditingId(null);
        editCloseTimeoutRef.current = null;
      }, EDIT_PANEL_SHELL_CLOSE_DELAY);
    }, EDIT_PANEL_CLOSE_DELAY);
  };

  const startEdit = (advisee: FacultyAdviseeRecord) => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
      editCloseTimeoutRef.current = null;
    }

    const [fallbackFirstName = '', ...restName] = advisee.student_name.split(' ').filter(Boolean);

    setEditingId(advisee.id);
    setEditShellOpen(true);
    setEditSuccess('');
    setEditError('');
    setEditForm({
      first_name: advisee.first_name || fallbackFirstName,
      last_name: advisee.last_name || restName.join(' '),
      email: advisee.email || '',
      temporary_password: '',
      student_id: advisee.student_id,
      department: advisee.department || adviseesData?.department || '',
      program: advisee.program || '',
      year_level: advisee.year_level ?? 4,
    });

    window.requestAnimationFrame(() => {
      setEditOpen(true);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await facultyAdviseesService.createStudentAccount({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        suffix: form.suffix?.trim() || undefined,
        email: form.email.trim(),
        student_id: form.student_id?.trim(),
        program: form.program.trim(),
        department: form.department || adviseesData?.department || '',
      });
      setSuccess('Student account created successfully.');
      setForm({
        ...initialForm,
        temporary_password: generateTemporaryPassword(),
        department: adviseesData?.department || '',
      });
      setCreateOpen(false);
      setListOpen(true);
      await loadAdvisees({ silent: true });
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      const firstValidationMessage = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;
      setError(String(firstValidationMessage || err.response?.data?.message || err.response?.data?.error || 'Unable to create the student account.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    setEditError('');
    setEditSuccess('');
    setEditSaving(true);

    try {
      await facultyAdviseesService.updateStudentAccount(editingId, {
        ...editForm,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        student_id: editForm.student_id?.trim(),
        program: editForm.program.trim(),
        department: editForm.department.trim(),
        year_level: editForm.year_level,
        temporary_password: editForm.temporary_password.trim(),
      });
      setEditSuccess('Student account updated successfully.');
      await loadAdvisees({ silent: true });
      editCloseTimeoutRef.current = window.setTimeout(() => {
        resetEditForm();
      }, 1400);
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      const firstValidationMessage = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;
      setEditError(String(firstValidationMessage || err.response?.data?.message || err.response?.data?.error || 'Unable to update the student account.'));
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemoveAdvisee = async (advisee: FacultyAdviseeRecord) => {
    const confirmed = await confirm({
      title: 'Delete Student Account',
      message: `Delete ${advisee.student_name}'s student account?\n\nTheir account will be removed, and any thesis records already added to the archive will stay stored.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });

    if (!confirmed) return;

    setError('');
    setSuccess('');
    setRemovingId(advisee.id);

    try {
      await facultyAdviseesService.removeStudentAccount(advisee.id);
      if (editingId === advisee.id) {
        resetEditForm();
      }
      setSuccess(`${advisee.student_name}'s student account was deleted. Thesis records remain preserved.`);
      await loadAdvisees({ silent: true });
    } catch (err: any) {
      setError(String(err.response?.data?.message || err.response?.data?.error || 'Unable to delete this student account right now.'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <FacultyLayout
      title="My Advisees"
      description="Create student accounts, assign advisers, and monitor advisee progress."
    >
      <div className="space-y-5">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {success ? <div className="vpaa-banner-success">{success}</div> : null}

        <div className="vpaa-grid-4 student-submissions-stats vpaa-activity-summary-grid" style={{ marginBottom: 28 }}>
          {stats.map((card) => (
            <article className="student-submissions-stat-card vpaa-card vpaa-activity-summary-card" key={card.label}>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              <span className={`student-submissions-stat-icon ${card.tone}`}>{card.icon}</span>
            </article>
          ))}
        </div>

        <div className="review-panel">
          <div className="ra-header">
            <button type="button" className="vpaa-panel-toggle" onClick={() => setCreateOpen((current) => !current)} aria-expanded={createOpen}>
              <span className="ra-header-left">
                <span className="panel-header-icon phi-maroon"><UserPlus size={17} /></span>
                <span className="panel-title">Create Student Account</span>
              </span>
              <span className="vpaa-panel-toggle-actions">
                <ChevronDown size={18} className={`vpaa-panel-chevron${createOpen ? ' open' : ''}`} />
              </span>
            </button>
          </div>

          <div className={`vpaa-collapsible${createOpen ? ' open' : ''}`}>
            <div className="vpaa-collapsible-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="form-field">
                    Student ID
                    <input
                      value={form.student_id ?? ''}
                      onChange={(event) => setForm({ ...form, student_id: event.target.value })}
                      placeholder="TUPM-00-0000"
                      required
                    />
                  </label>
                  <label className="form-field">
                    Institutional Email
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="student@tup.edu.ph" required />
                  </label>
                  <label className="form-field">
                    Adviser
                    <input value={adviseesData?.adviser_name ?? 'Faculty Adviser'} readOnly />
                  </label>
                  <label className="form-field">
                    First Name
                    <input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} placeholder="Juan" required />
                  </label>
                  <label className="form-field">
                    Last Name
                    <input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} placeholder="Dela Cruz" required />
                  </label>
                  <label className="form-field">
                    Suffix
                    <input value={form.suffix ?? ''} onChange={(event) => setForm({ ...form, suffix: event.target.value })} placeholder="Jr." />
                  </label>
                  <label className="form-field">
                    Year Level
                    <select value={String(form.year_level ?? 4)} onChange={(event) => setForm({ ...form, year_level: Number(event.target.value) })}>
                      {yearLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="form-field">
                    Program
                    <select value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value })} required>
                      <option value="">Select program</option>
                      {programOptions.filter((option) => option !== 'All Programs').map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="form-field">
                    Department
                    <input value={form.department} readOnly required />
                  </label>
                  <label className="form-field">
                    Temporary Password
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                      <input
                        type="text"
                        value={form.temporary_password}
                        onChange={(event) => setForm({ ...form, temporary_password: event.target.value })}
                        placeholder="Temporary password"
                        required
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setForm({ ...form, temporary_password: generateTemporaryPassword() })}
                      >
                        Generate
                      </button>
                    </div>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setForm({ ...initialForm, temporary_password: generateTemporaryPassword(), department: adviseesData?.department || '' })}
                  >
                    Save Draft
                  </button>
                  <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="review-panel">
          <div className="ra-header">
            <button type="button" className="vpaa-panel-toggle" onClick={() => setListOpen((current) => !current)} aria-expanded={listOpen}>
              <span className="ra-header-left">
                <span className="panel-header-icon phi-maroon"><List size={17} /></span>
                <span className="panel-title">Advisee List</span>
              </span>
              <span className="vpaa-panel-toggle-actions">
                <ChevronDown size={18} className={`vpaa-panel-chevron${listOpen ? ' open' : ''}`} />
              </span>
            </button>
          </div>

          <div className={`vpaa-collapsible${listOpen ? ' open' : ''}`}>
            <div className="vpaa-collapsible-body">
              <div className="filter-row">
                <div className="filter-group">
                  <input className="filter-input" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, ID, or title..." />
                  <select className="filter-select" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
                    {programOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>

                <div className="filter-chips">
                  {(['All', 'New Accounts'] as const).map((filter) => (
                    <button key={filter} type="button" className={`chip${quickFilter === filter ? ' active' : ''}`} onClick={() => setQuickFilter(filter)}>
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="review-table-wrap">
                <table className="review-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Program</th>
                      <th>Department</th>
                      <th>Year Level</th>
                      <th>Last Update</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="vpaa-activity-empty">Loading advisees...</td>
                      </tr>
                    ) : filteredAdvisees.length ? filteredAdvisees.map((advisee) => (
                      <tr key={advisee.id}>
                        <td className="rt-title">{advisee.student_name}</td>
                        <td><span className="role-tag tag-cs">{advisee.program || 'Not set'}</span></td>
                        <td>{advisee.department}</td>
                        <td>{advisee.year_level ? `${advisee.year_level}${advisee.year_level === 1 ? 'st' : advisee.year_level === 2 ? 'nd' : advisee.year_level === 3 ? 'rd' : 'th'} Year` : 'Not set'}</td>
                        <td>{formatDate(advisee.last_update)}</td>
                        <td><span className={`status-badge ${statusClassMap[advisee.status_tone]}`}>{advisee.status}</span></td>
                        <td className="table-actions">
                          <button type="button" className="btn-review" onClick={() => startEdit(advisee)} disabled={removingId === advisee.id}>Edit</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="vpaa-activity-empty">No advisees matched the current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {editingId ? (
          <div className={`edit-panel-shell${editShellOpen ? ' open' : ''}`}>
            <div className="section-spacer" />

            <div className="review-panel" ref={editPanelRef}>
            <div className="ra-header">
              <button type="button" className="vpaa-panel-toggle" onClick={() => setEditOpen((current) => !current)} aria-expanded={editOpen}>
                <span className="ra-header-left">
                  <span className="panel-header-icon phi-maroon"><UserPlus size={17} /></span>
                  <span className="panel-title">Edit Student Account</span>
                </span>
                <span className="vpaa-panel-toggle-actions">
                  <span className="recent-see-all">{editForm.first_name || editForm.last_name ? `${editForm.first_name} ${editForm.last_name}`.trim() : 'Selected Student'}</span>
                  <ChevronDown size={18} className={`vpaa-panel-chevron${editOpen ? ' open' : ''}`} />
                </span>
              </button>
            </div>

            <div className={`vpaa-collapsible${editOpen ? ' open' : ''}`}>
              <div className="vpaa-collapsible-body">
                {editError ? <div className="vpaa-banner-error">{editError}</div> : null}
                {editSuccess ? <div className="vpaa-banner-success">{editSuccess}</div> : null}

                <form onSubmit={handleEditSubmit}>
                  <div className="form-grid">
                    <label className="form-field">
                      Student ID
                      <input value={editForm.student_id ?? ''} onChange={(event) => setEditForm({ ...editForm, student_id: event.target.value })} required />
                    </label>
                    <label className="form-field">
                      Institutional Email
                      <input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="student@tup.edu.ph" required />
                    </label>
                    <label className="form-field">
                      Adviser
                      <input value={adviseesData?.adviser_name ?? 'Faculty Adviser'} readOnly />
                    </label>
                    <label className="form-field">
                      First Name
                      <input value={editForm.first_name} onChange={(event) => setEditForm({ ...editForm, first_name: event.target.value })} placeholder="Juan" required />
                    </label>
                    <label className="form-field">
                      Last Name
                      <input value={editForm.last_name} onChange={(event) => setEditForm({ ...editForm, last_name: event.target.value })} placeholder="Dela Cruz" required />
                    </label>
                    <label className="form-field">
                      Suffix
                      <input value={editForm.suffix ?? ''} onChange={(event) => setEditForm({ ...editForm, suffix: event.target.value })} placeholder="Jr." />
                    </label>
                    <label className="form-field">
                      Year Level
                      <select value={String(editForm.year_level ?? 4)} onChange={(event) => setEditForm({ ...editForm, year_level: Number(event.target.value) })}>
                        {yearLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      Program
                      <select value={editForm.program} onChange={(event) => setEditForm({ ...editForm, program: event.target.value })} required>
                        <option value="">Select program</option>
                        {programOptions.filter((option) => option !== 'All Programs').map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      Department
                      <input value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })} required />
                    </label>
                    <label className="form-field">
                      Temporary Password
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                        <input
                          type="text"
                          value={editForm.temporary_password}
                          onChange={(event) => setEditForm({ ...editForm, temporary_password: event.target.value })}
                          placeholder="Leave blank to keep the current password"
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEditForm({ ...editForm, temporary_password: generateTemporaryPassword() })}
                        >
                          Generate
                        </button>
                      </div>
                    </label>
                    {selectedAdvisee ? (
                      <div className="form-field faculty-advisee-delete-field">
                        <span>Delete Student Account</span>
                        <button
                          className="btn-review btn-review-danger faculty-advisee-delete-btn"
                          type="button"
                          onClick={() => handleRemoveAdvisee(selectedAdvisee)}
                          disabled={editSaving || removingId === selectedAdvisee.id}
                        >
                          {removingId === selectedAdvisee.id ? 'Deleting...' : 'Delete Student'}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="form-actions">
                    <button className="btn-secondary" type="button" onClick={resetEditForm}>Cancel</button>
                    <button className="btn-primary" type="submit" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>
            </div>
            </div>
          </div>
        ) : null}
      </div>
    </FacultyLayout>
  );
}
