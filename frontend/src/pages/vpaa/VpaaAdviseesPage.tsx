import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Clock3, List, Plus, Upload, Users2 } from 'lucide-react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import { facultyManagementService, type FacultyAccountPayload } from '../../services/facultyManagementService';
import type { FacultyProfile } from '../../types/user.types';

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const generateNextFacultyId = (faculty: FacultyProfile[]) => {
  const yearCode = new Date().getFullYear().toString().slice(-2);
  const prefix = `FAC-${yearCode}-`;
  const maxSequence = faculty.reduce((highest, member) => {
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
  rank: '',
  faculty_role: 'Adviser',
  assigned_chair_id: '',
};

const roleTagClass = (role: string) => {
  if (role.includes('Chair')) return 'tag-cs';
  if (role.includes('Co')) return 'tag-is';
  return 'tag-it';
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
  if (role === 'Department Chair') return 'CHAIR';
  if (role === 'Co-Adviser') return 'CO-ADV';
  return 'ADV';
};

export default function VpaaAdviseesPage() {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'chairs' | 'changes' | 'new'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const editPanelRef = useRef<HTMLDivElement | null>(null);
  const editCloseTimeoutRef = useRef<number | null>(null);

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
  }, []);

  useEffect(() => {
    if (!editingId || !editOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingId, editOpen]);

  const chairs = useMemo(() => faculty.filter((member) => member.faculty_role === 'Department Chair'), [faculty]);
  const nextFacultyId = useMemo(() => generateNextFacultyId(faculty), [faculty]);

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

    setEditForm({
      ...initialForm,
      temporary_password: generateTemporaryPassword(),
      faculty_id: '',
    });
    setEditingId(null);
    setEditOpen(false);
  };

  const startEdit = (member: FacultyProfile) => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
      editCloseTimeoutRef.current = null;
    }

    setEditingId(member.id);
    setEditOpen(true);
    setEditSuccess('');
    setEditError('');
    setEditForm({
      first_name: member.user.first_name || member.user.name.split(' ')[0] || '',
      last_name: member.user.last_name || member.user.name.split(' ').slice(1).join(' '),
      email: member.user.email,
      temporary_password: '',
      faculty_id: member.faculty_id,
      department: member.department,
      rank: member.rank || '',
      faculty_role: member.faculty_role || 'Adviser',
      assigned_chair_id: member.assigned_chair_id || '',
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
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
        const matchesQuick = quickFilter === 'all'
          || (quickFilter === 'chairs' && member.faculty_role === 'Department Chair')
          || (quickFilter === 'changes' && false)
          || (quickFilter === 'new' && new Date(member.user.created_at).getTime() >= Date.now() - (1000 * 60 * 60 * 24 * 30));

        return matchesSearch && matchesRole && matchesStatus && matchesQuick;
      }),
    [faculty, quickFilter, roleFilter, search, statusFilter],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await facultyManagementService.createFacultyAccount({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        faculty_id: nextFacultyId,
        rank: form.rank || undefined,
        department: form.department.trim(),
        assigned_chair_id: form.assigned_chair_id || undefined,
        temporary_password: form.temporary_password,
      });
      setSuccess('Faculty account created and stored in Supabase.');
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

    try {
      await facultyManagementService.updateFacultyAccount(editingId, {
        ...editForm,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        faculty_id: (editForm.faculty_id ?? '').trim(),
        rank: editForm.rank || undefined,
        department: editForm.department.trim(),
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
    }
  };

  const stats = [
    { label: 'Total Faculty', value: faculty.length, icon: <Users2 size={20} />, tone: 'si-sky' },
    { label: 'Department Chairs', value: chairs.length, icon: <Clock3 size={20} />, tone: 'si-gold' },
    { label: 'Role Changes', value: 0, icon: <CheckCircle2 size={20} />, tone: 'si-sage' },
    { label: 'New Accounts', value: faculty.filter((member) => new Date(member.user.created_at).getTime() >= Date.now() - (1000 * 60 * 60 * 24 * 30)).length, icon: <Upload size={20} />, tone: 'si-terracotta' },
    { label: 'On Leave', value: faculty.filter((member) => member.status === 'on_leave').length, icon: <Plus size={20} />, tone: 'si-maroon' },
  ];

  return (
    <VpaaLayout title="Faculty Oversight" description="Create faculty accounts, assign roles by department, and manage faculty access.">
      <div className="vpaa-grid-5" style={{ marginBottom: 24 }}>
        {stats.map((card) => (
          <div className="vpaa-card vpaa-stat-card" key={card.label}>
            <div>
              <div className="vpaa-stat-label">{card.label}</div>
              <div className="vpaa-stat-value">{card.value}</div>
            </div>
            <div className={`vpaa-stat-icon ${card.tone}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="review-panel">
        <div className="ra-header">
          <button type="button" className="vpaa-panel-toggle" onClick={() => setCreateOpen((current) => !current)} aria-expanded={createOpen}>
            <span className="ra-header-left">
              <span className="panel-header-icon phi-maroon"><Users2 size={17} /></span>
              <span className="panel-title">Create Faculty Account</span>
            </span>
            <span className="vpaa-panel-toggle-actions">
              <span className="recent-see-all">Bulk Import ?</span>
              <ChevronDown size={18} className={`vpaa-panel-chevron${createOpen ? ' open' : ''}`} />
            </span>
          </button>
        </div>

        <div className={`vpaa-collapsible${createOpen ? ' open' : ''}`}>
          <div className="vpaa-collapsible-body">
            {error ? <div className="vpaa-banner-error">{error}</div> : null}
            {success ? <div className="vpaa-banner-success">{success}</div> : null}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="form-field">
                    Faculty ID
                    <input value={nextFacultyId} readOnly />
                  </label>
                <label className="form-field">
                  Institutional Email
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="faculty@tup.edu.ph" required />
                </label>
                <label className="form-field">
                  Role
                  <select value={form.faculty_role} onChange={(event) => setForm({ ...form, faculty_role: event.target.value })}>
                    <option value="Department Chair">Department Chair</option>
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
                <label className="form-field">
                  Rank
                  <input value={form.rank} onChange={(event) => setForm({ ...form, rank: event.target.value })} placeholder="Instructor I" />
                </label>
                <label className="form-field">
                  Department
                  <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Computer Studies Department" required />
                </label>
                <label className="form-field">
                  Assigned Chair
                  <select value={form.assigned_chair_id} onChange={(event) => setForm({ ...form, assigned_chair_id: event.target.value })}>
                    <option value="">Select assigned chair</option>
                    {chairs.map((member) => (
                      <option key={member.id} value={member.user_id}>{member.user.name}</option>
                    ))}
                  </select>
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
              <span className="recent-see-all">Export List ?</span>
              <ChevronDown size={18} className={`vpaa-panel-chevron${directoryOpen ? ' open' : ''}`} />
            </span>
          </button>
        </div>

        <div className={`vpaa-collapsible${directoryOpen ? ' open' : ''}`}>
          <div className="vpaa-collapsible-body">
            <div className="filter-row">
              <div className="filter-group">
                <input className="filter-input" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search faculty, ID, or role..." />
                <select className="filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="Department Chair">Department Chair</option>
                  <option value="Adviser">Adviser</option>
                  <option value="Co-Adviser">Co-Adviser</option>
                </select>
                <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Access Review</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div className="filter-chips">
                <button type="button" className={`chip${quickFilter === 'all' ? ' active' : ''}`} onClick={() => setQuickFilter('all')}>All</button>
                <button type="button" className={`chip${quickFilter === 'chairs' ? ' active' : ''}`} onClick={() => setQuickFilter('chairs')}>Department Chairs</button>
                <button type="button" className={`chip${quickFilter === 'changes' ? ' active' : ''}`} onClick={() => setQuickFilter('changes')}>Role Changes</button>
                <button type="button" className={`chip${quickFilter === 'new' ? ' active' : ''}`} onClick={() => setQuickFilter('new')}>New Accounts</button>
              </div>
            </div>

            <div className="review-table-wrap">
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Role</th>
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
                      <td><span className={`role-tag ${roleTagClass(member.faculty_role)}`}>{roleShortLabel(member.faculty_role)}</span></td>
                      <td>{member.department}</td>
                      <td>{member.faculty_role === 'Department Chair' ? 'Admin' : member.status === 'inactive' ? 'Access Review' : 'Standard'}</td>
                      <td>{new Date(member.user.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                      <td><span className={`status-badge ${statusBadgeClass(member.status)}`}>{statusLabel(member.status)}</span></td>
                      <td className="table-actions"><button type="button" className="btn-review" onClick={() => startEdit(member)}>{member.status === 'inactive' ? 'Review' : 'Edit'}</button></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="vpaa-activity-empty">No faculty matched the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingId ? (
        <>
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
                      <select value={editForm.faculty_role} onChange={(event) => setEditForm({ ...editForm, faculty_role: event.target.value })}>
                        <option value="Department Chair">Department Chair</option>
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
                    <label className="form-field">
                      Rank
                      <input value={editForm.rank} onChange={(event) => setEditForm({ ...editForm, rank: event.target.value })} placeholder="Instructor I" />
                    </label>
                    <label className="form-field">
                      Department
                      <input value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })} placeholder="Computer Studies Department" required />
                    </label>
                    <label className="form-field">
                      Assigned Chair
                      <select value={editForm.assigned_chair_id} onChange={(event) => setEditForm({ ...editForm, assigned_chair_id: event.target.value })}>
                        <option value="">Select assigned chair</option>
                        {chairs.map((member) => (
                          <option key={member.id} value={member.user_id}>{member.user.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button className="btn-secondary" type="button" onClick={resetEditForm}>Cancel</button>
                    <button className="btn-primary" type="submit">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </VpaaLayout>
  );
}
