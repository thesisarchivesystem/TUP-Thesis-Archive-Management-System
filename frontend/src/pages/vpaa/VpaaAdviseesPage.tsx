import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, List, UserCheck, UserRoundCog, UserRoundCheck, Users2 } from 'lucide-react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { facultyManagementService, type FacultyAccountPayload } from '../../services/facultyManagementService';
import type { FacultyProfile } from '../../types/user.types';
import { collegeOptions, departmentOptionsByCollege } from '../../constants/academicUnits';

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};


const EDIT_PANEL_CLOSE_DELAY = 280;
const EDIT_PANEL_SHELL_CLOSE_DELAY = 180;
const NEW_ACCOUNT_WINDOW_DAYS = 3;
const SUCCESS_MESSAGE_DISMISS_DELAY = 4200;

const initialForm: FacultyAccountPayload = {
  first_name: '',
  last_name: '',
  suffix: '',
  email: '',
  temporary_password: generateTemporaryPassword(),
  faculty_id: '',
  department: '',
  college: '',
  rank: '',
  faculty_role: 'Adviser',
  assigned_chair_id: '',
};

const roleTagClass = (role: string) => {
  if (role.includes('Chair')) return 'tag-cs';
  if (role.includes('Co')) return 'tag-is';
  return 'tag-it';
};

const displayRoleLabel = (role: string) => {
  return role;
};

const needsAssignedDean = (role: string) => role !== 'Dean';

const isNewAccount = (createdAt?: string) => {
  if (!createdAt) return false;

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return false;

  const now = new Date();
  const ageInMs = now.getTime() - createdDate.getTime();

  return ageInMs >= 0 && ageInMs <= NEW_ACCOUNT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

const statusBadgeClass = (status: FacultyProfile['status']) => {
  if (status === 'active') return 'status-approved';
  if (status === 'on_leave') return 'status-revision';
  return 'status-pending';
};

const statusLabel = (status: FacultyProfile['status']) => {
  if (status === 'on_leave') return 'On Leave';
  if (status === 'inactive') return 'Access Review';
  return 'Active';
};

const roleShortLabel = (role: string) => {
  if (role === 'Dean') return 'DEAN';
  if (role === 'Co-Adviser') return 'CO-ADV';
  return 'ADV';
};

export default function VpaaAdviseesPage() {
  const { confirm } = useConfirmDialog();
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [success, setSuccess] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'new'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editShellOpen, setEditShellOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const editPanelRef = useRef<HTMLDivElement | null>(null);
  const editCloseTimeoutRef = useRef<number | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const successBannerRef = useRef<HTMLDivElement | null>(null);

  const loadFaculty = async () => {
    try {
      const records = await facultyManagementService.listFaculty();
      setFaculty(records);
    } catch {
      setFaculty([]);
    }
  };

  useEffect(() => {
    void loadFaculty();
  }, []);

  useEffect(() => () => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
    }
    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
    }
  }, []);

  const showTransientSuccess = (message: string) => {
    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
    }

    setSuccess(message);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      successBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    successTimeoutRef.current = window.setTimeout(() => {
      setSuccess('');
      successTimeoutRef.current = null;
    }, SUCCESS_MESSAGE_DISMISS_DELAY);
  };

  useEffect(() => {
    if (!editingId || !editOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingId, editOpen]);

  const chairs = useMemo(() => faculty.filter((member) => member.faculty_role === 'Dean'), [faculty]);
  const advisers = useMemo(() => faculty.filter((member) => member.faculty_role === 'Adviser'), [faculty]);
  const coAdvisers = useMemo(() => faculty.filter((member) => member.faculty_role === 'Co-Adviser'), [faculty]);
  const createDepartmentOptions = useMemo(
    () => departmentOptionsByCollege[form.college || ''] ?? [],
    [form.college],
  );
  const editDepartmentOptions = useMemo(
    () => departmentOptionsByCollege[editForm.college || ''] ?? [],
    [editForm.college],
  );
  const resetCreateForm = () => {
    setForm({
      ...initialForm,
      temporary_password: generateTemporaryPassword(),
      faculty_id: '',
    });
  };

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
          faculty_id: '',
        });
        setEditingId(null);
        editCloseTimeoutRef.current = null;
      }, EDIT_PANEL_SHELL_CLOSE_DELAY);
    }, EDIT_PANEL_CLOSE_DELAY);
  };

  const startEdit = (member: FacultyProfile) => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
      editCloseTimeoutRef.current = null;
    }

    setEditingId(member.id);
    setEditShellOpen(true);
    setEditSuccess('');
    setEditError('');
    setEditForm({
      first_name: member.user.first_name || member.user.name.split(' ')[0] || '',
      last_name: member.user.last_name || member.user.name.split(' ').slice(1).join(' '),
      suffix: member.user.suffix || '',
      email: member.user.email,
      temporary_password: '',
      faculty_id: member.faculty_id,
      department: member.department,
      college: member.college || '',
      rank: member.rank || '',
      faculty_role: member.faculty_role || 'Adviser',
      assigned_chair_id: member.assigned_chair_id || '',
    });

    window.requestAnimationFrame(() => {
      setEditOpen(true);
    });
  };

  const filteredFaculty = useMemo(
    () =>
      faculty.filter((member) => {
        const matchesSearch = !search.trim() || [
          member.user.name,
          member.faculty_id,
          member.faculty_role,
          member.department,
        ].join(' ').toLowerCase().includes(search.trim().toLowerCase());

        const matchesRole = roleFilter === 'all' || member.faculty_role === roleFilter;
        const matchesQuick = quickFilter === 'all'
          || (quickFilter === 'new' && isNewAccount(member.user.created_at));

        return matchesSearch && matchesRole && matchesQuick;
      }),
    [faculty, quickFilter, roleFilter, search],
  );

  const selectedFaculty = editingId ? faculty.find((member) => member.id === editingId) ?? null : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await facultyManagementService.createFacultyAccount({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        suffix: form.suffix?.trim() || undefined,
        email: form.email.trim(),
        faculty_id: form.faculty_id?.trim() || undefined,
        rank: form.rank || undefined,
        department: form.department.trim(),
        college: form.college?.trim() || undefined,
        assigned_chair_id: form.assigned_chair_id || undefined,
        temporary_password: form.temporary_password,
      });
      setSuccess('Faculty account successfully created!');
      resetCreateForm();
      await loadFaculty();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to create faculty account.');
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    setEditError('');
    setEditSuccess('');
    setEditSaving(true);

    try {
      await facultyManagementService.updateFacultyAccount(editingId, {
        ...editForm,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        suffix: editForm.suffix?.trim() || undefined,
        email: editForm.email.trim(),
        faculty_id: (editForm.faculty_id ?? '').trim(),
        rank: editForm.rank || undefined,
        department: editForm.department.trim(),
        college: editForm.college?.trim() || undefined,
        assigned_chair_id: editForm.assigned_chair_id || undefined,
        temporary_password: editForm.temporary_password.trim() || undefined,
      });
      setEditSuccess('Faculty account updated successfully.');
      await loadFaculty();
      editCloseTimeoutRef.current = window.setTimeout(() => {
        resetEditForm();
      }, 1400);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Unable to update the faculty account.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemoveFaculty = async (member: FacultyProfile) => {
    const confirmed = await confirm({
      title: 'Delete Faculty Account',
      message: `Delete ${member.user.name}'s faculty account?\n\nTheir account will be removed, and any thesis records already added to the archive will stay stored.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });

    if (!confirmed) return;

    setError('');
    setSuccess('');
    setRemovingId(member.id);

    try {
      await facultyManagementService.removeFacultyAccount(member.id);
      if (editingId === member.id) {
        resetEditForm();
      }
      showTransientSuccess(`${member.user.name}'s faculty account was deleted. Thesis records remain preserved.`);
      await loadFaculty();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to delete this faculty account right now.');
    } finally {
      setRemovingId(null);
    }
  };

  const stats = [
    { label: 'Total Faculty', value: faculty.length, icon: <Users2 size={18} />, tone: 'phi-blue' },
    { label: 'Deans', value: chairs.length, icon: <UserRoundCog size={18} />, tone: 'phi-green' },
    { label: 'Adviser', value: advisers.length, icon: <UserCheck size={18} />, tone: 'phi-red' },
    { label: 'Co-Adviser', value: coAdvisers.length, icon: <UserRoundCheck size={18} />, tone: 'phi-orange' },
  ];

  return (
    <VpaaLayout title="Faculty Oversight" description="Create faculty accounts, assign roles by department, and manage faculty access.">
      <div className="vpaa-grid-4 student-submissions-stats vpaa-activity-summary-grid" style={{ marginBottom: 24 }}>
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

      {success ? (
        <div ref={successBannerRef} className="vpaa-banner-success" style={{ marginBottom: 16 }}>
          {success}
        </div>
      ) : null}

      <div className="review-panel">
        <div className="ra-header">
          <button type="button" className="vpaa-panel-toggle" onClick={() => setCreateOpen((current) => !current)} aria-expanded={createOpen}>
            <span className="ra-header-left">
              <span className="panel-header-icon phi-maroon"><Users2 size={17} /></span>
              <span className="panel-title">Create Faculty Account</span>
            </span>
            <span className="vpaa-panel-toggle-actions">
              <ChevronDown size={18} className={`vpaa-panel-chevron${createOpen ? ' open' : ''}`} />
            </span>
          </button>
        </div>

        <div className={`vpaa-collapsible${createOpen ? ' open' : ''}`}>
          <div className="vpaa-collapsible-body">
            {error ? <div className="vpaa-banner-error">{error}</div> : null}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="form-field">
                    Faculty ID
                    <input
                      value={form.faculty_id ?? ''}
                      onChange={(event) => setForm({ ...form, faculty_id: event.target.value })}
                      placeholder="TUPM-00-000"
                    />
                  </label>
                <label className="form-field">
                  Institutional Email
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="faculty@tup.edu.ph" required />
                </label>
                <label className="form-field">
                  Role
                  <select
                    value={form.faculty_role}
                    onChange={(event) => setForm({
                      ...form,
                      faculty_role: event.target.value,
                      assigned_chair_id: event.target.value === 'Dean' ? '' : form.assigned_chair_id,
                    })}
                  >
                    <option value="Dean">Dean</option>
                    <option value="Adviser">Adviser</option>
                    <option value="Co-Adviser">Co-Adviser</option>
                  </select>
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
                  Rank
                  <input value={form.rank} onChange={(event) => setForm({ ...form, rank: event.target.value })} placeholder="Instructor I" />
                </label>
                <label className="form-field">
                  College
                  <select value={form.college || ''} onChange={(event) => setForm({ ...form, college: event.target.value, department: '' })}>
                    <option value="">Select college</option>
                    {collegeOptions.map((college) => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  Department
                  {createDepartmentOptions.length ? (
                    <select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required>
                      <option value="">Select department</option>
                      {createDepartmentOptions.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Computer Studies Department" required />
                  )}
                </label>
                {needsAssignedDean(form.faculty_role) ? (
                  <label className="form-field">
                    Assigned Dean
                    <select value={form.assigned_chair_id} onChange={(event) => setForm({ ...form, assigned_chair_id: event.target.value })}>
                      <option value="">Select assigned dean</option>
                      {chairs.map((member) => (
                        <option key={member.id} value={member.user_id}>{member.user.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
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
                <button className="btn-primary" type="submit">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="section-spacer" />

      <div className="review-panel">
        <div className="ra-header">
          <button type="button" className="vpaa-panel-toggle" onClick={() => setDirectoryOpen((current) => !current)} aria-expanded={directoryOpen}>
            <span className="ra-header-left">
              <span className="panel-header-icon phi-maroon"><List size={17} /></span>
              <span className="panel-title">Faculty Directory</span>
            </span>
            <span className="vpaa-panel-toggle-actions">
              <ChevronDown size={18} className={`vpaa-panel-chevron${directoryOpen ? ' open' : ''}`} />
            </span>
          </button>
        </div>

        <div className={`vpaa-collapsible${directoryOpen ? ' open' : ''}`}>
          <div className="vpaa-collapsible-body">
            <div className="filter-row faculty-directory-filter-row">
              <div className="filter-group faculty-directory-filter-group">
                <input className="filter-input faculty-directory-filter-input" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search faculty, ID, or role..." />
                <select className="filter-select faculty-directory-filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="Dean">Dean</option>
                  <option value="Adviser">Adviser</option>
                  <option value="Co-Adviser">Co-Adviser</option>
                </select>
              </div>
              <div className="filter-chips faculty-directory-filter-chips">
                <button type="button" className={`chip faculty-directory-chip${quickFilter === 'all' ? ' active' : ''}`} onClick={() => setQuickFilter('all')}>All</button>
                <button type="button" className={`chip faculty-directory-chip${quickFilter === 'new' ? ' active' : ''}`} onClick={() => setQuickFilter('new')}>New Accounts</button>
              </div>
            </div>

            <div className="review-table-wrap">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Role</th>
                    <th>College</th>
                    <th>Department</th>
                    <th>Access</th>
                    <th>Last Update</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.length ? filteredFaculty.map((member) => (
                    <tr key={member.id}>
                      <td className="rt-title">{member.user.name}</td>
                      <td><span className={`role-tag ${roleTagClass(member.faculty_role)}`} title={displayRoleLabel(member.faculty_role)}>{roleShortLabel(member.faculty_role)}</span></td>
                      <td>{member.college || 'Not set'}</td>
                      <td>{member.department}</td>
                      <td>{member.faculty_role === 'Dean' ? 'Admin' : member.status === 'inactive' ? 'Access Review' : 'Standard'}</td>
                      <td>{new Date(member.user.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td><span className={`status-badge ${statusBadgeClass(member.status)}`}>{statusLabel(member.status)}</span></td>
                      <td className="table-actions"><button type="button" className="btn-review" onClick={() => startEdit(member)} disabled={removingId === member.id}>{member.status === 'inactive' ? 'Review' : 'Edit'}</button></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="vpaa-activity-empty">No faculty matched the current filters.</td>
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
                  <span className="panel-header-icon phi-maroon"><Users2 size={17} /></span>
                  <span className="panel-title">Edit Faculty Account</span>
                </span>
                <span className="vpaa-panel-toggle-actions">
                  <span className="recent-see-all">{editForm.first_name || editForm.last_name ? `${editForm.first_name} ${editForm.last_name}`.trim() : 'Selected Faculty'}</span>
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
                      Faculty ID
                      <input value={editForm.faculty_id ?? ''} onChange={(event) => setEditForm({ ...editForm, faculty_id: event.target.value })} required />
                    </label>
                    <label className="form-field">
                      Institutional Email
                      <input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="faculty@tup.edu.ph" required />
                    </label>
                    <label className="form-field">
                      Role
                      <select
                        value={editForm.faculty_role}
                        onChange={(event) => setEditForm({
                          ...editForm,
                          faculty_role: event.target.value,
                          assigned_chair_id: event.target.value === 'Dean' ? '' : editForm.assigned_chair_id,
                        })}
                      >
                        <option value="Dean">Dean</option>
                        <option value="Adviser">Adviser</option>
                        <option value="Co-Adviser">Co-Adviser</option>
                      </select>
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
                      Rank
                      <input value={editForm.rank} onChange={(event) => setEditForm({ ...editForm, rank: event.target.value })} placeholder="Instructor I" />
                    </label>
                    <label className="form-field">
                      College
                      <select value={editForm.college || ''} onChange={(event) => setEditForm({ ...editForm, college: event.target.value, department: '' })}>
                        <option value="">Select college</option>
                        {collegeOptions.map((college) => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      Department
                      {editDepartmentOptions.length ? (
                        <select value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })} required>
                          <option value="">Select department</option>
                          {editDepartmentOptions.map((department) => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      ) : (
                        <input value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })} placeholder="Computer Studies Department" required />
                      )}
                    </label>
                    {needsAssignedDean(editForm.faculty_role) ? (
                      <label className="form-field">
                        Assigned Dean
                        <select value={editForm.assigned_chair_id} onChange={(event) => setEditForm({ ...editForm, assigned_chair_id: event.target.value })}>
                          <option value="">Select assigned dean</option>
                          {chairs.map((member) => (
                            <option key={member.id} value={member.user_id}>{member.user.name}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
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
                    {selectedFaculty ? (
                      <div className="form-field faculty-advisee-delete-field">
                        <span>Delete Faculty Account</span>
                        <button
                          className="btn-review btn-review-danger faculty-advisee-delete-btn"
                          type="button"
                          onClick={() => handleRemoveFaculty(selectedFaculty)}
                          disabled={editSaving || removingId === selectedFaculty.id}
                        >
                          {removingId === selectedFaculty.id ? 'Deleting...' : 'Delete Faculty'}
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
    </VpaaLayout>
  );
}
