import { ChevronDown, Eye, EyeOff, GraduationCap, Plus, Search, User, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { adminService, type AdminManagedUser, type AdminStructureCollege } from '../../services/adminService';

const FEEDBACK_DISMISS_DELAY = 4000;

type AdminUserRole = 'faculty' | 'student';
type AdminUserSort = 'newest' | 'oldest' | 'name_asc' | 'name_desc';
type FacultyRoleOption = 'Adviser' | 'Chairperson' | 'Dean/Head';

const FACULTY_ROLE_OPTIONS: FacultyRoleOption[] = ['Adviser', 'Chairperson', 'Dean/Head'];

type AdminUserForm = {
  role: AdminUserRole;
  first_name: string;
  last_name: string;
  suffix: string;
  email: string;
  temporary_password: string;
  faculty_id: string;
  student_id: string;
  college_id: string;
  department_id: string;
  program_id: string;
  section_id: string;
  section: string;
  department: string;
  college: string;
  program: string;
  faculty_role: string;
  rank: string;
  year_level: string | number | null;
  is_active: boolean;
};

const emptyForm: AdminUserForm = {
  role: 'faculty',
  first_name: '',
  last_name: '',
  suffix: '',
  email: '',
  temporary_password: '',
  faculty_id: '',
  student_id: '',
  college_id: '',
  department_id: '',
  program_id: '',
  section_id: '',
  section: '',
  department: '',
  college: '',
  program: '',
  faculty_role: '',
  rank: '',
  year_level: '',
  is_active: true,
};

const toInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const getUserCreatedTime = (user: AdminManagedUser) => (
  user.created_at ? new Date(user.created_at).getTime() : 0
);

export default function AdminUsersPage() {
  const { confirm } = useConfirmDialog();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<AdminUserSort>('newest');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<AdminUserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const selectedCollege = useMemo(
    () => structure.find((college) => college.id === form.college_id),
    [form.college_id, structure],
  );
  const selectedDepartment = useMemo(
    () => selectedCollege?.departments.find((department) => department.id === form.department_id),
    [form.department_id, selectedCollege],
  );
  const programCodeById = useMemo(() => {
    const entries = structure.flatMap((college) =>
      college.departments.flatMap((department) =>
        department.programs.map((program) => [program.id, program.code?.trim() || program.name] as const),
      ),
    );

    return new Map(entries);
  }, [structure]);

  const sortedUsers = useMemo(() => {
    const collator = new Intl.Collator('en', { sensitivity: 'base' });
    const sorted = [...users];

    sorted.sort((left, right) => {
      switch (sortBy) {
        case 'oldest':
          return getUserCreatedTime(left) - getUserCreatedTime(right);
        case 'newest':
          return getUserCreatedTime(right) - getUserCreatedTime(left);
        case 'name_desc':
          return collator.compare(right.name, left.name);
        case 'name_asc':
        default:
          return collator.compare(left.name, right.name);
      }
    });

    return sorted;
  }, [sortBy, users]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedUsers]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  const load = () =>
    Promise.all([
      adminService.listUsers(roleFilter || undefined, search || undefined),
      adminService.listStructure(),
    ]).then(([usersResponse, structureResponse]) => {
      setUsers(usersResponse);
      setStructure(structureResponse);
    });

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    void load().catch(() => setError('Failed to load user management data.'));
  }, [roleFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, roleFilter, search, sortBy, users.length]);

  useEffect(() => {
    if (!successMessage && !error) return undefined;

    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, FEEDBACK_DISMISS_DELAY);

    return () => window.clearTimeout(timeout);
  }, [error, successMessage]);

  const submit = async () => {
    const payload: Omit<AdminUserForm, 'year_level'> & { year_level: number | null } = {
      ...form,
      year_level: form.year_level ? Number(form.year_level) : null,
    };

    try {
      if (editingId) {
        await adminService.updateUser(editingId, payload);
        setSuccessMessage('User changes were saved successfully.');
      } else {
        await adminService.createUser(payload);
        setSuccessMessage('User account created successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
      setError(null);
      await load();
    } catch (err: any) {
      setSuccessMessage(null);
      setError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setShowPassword(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, faculty_role: 'Adviser' });
    setShowPassword(false);
    setSuccessMessage(null);
    setFormOpen(true);
  };

  const openEdit = (user: AdminManagedUser) => {
    setEditingId(user.id);
    setForm({
      ...emptyForm,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      suffix: user.suffix ?? '',
      email: user.email,
      faculty_id: user.faculty_id ?? '',
      student_id: user.student_id ?? '',
      college_id: user.college_id ?? '',
      department_id: user.department_id ?? '',
      program_id: user.course_id ?? user.program_id ?? '',
      section_id: user.section_id ?? '',
      section: user.section ?? '',
      department: user.department ?? '',
      college: user.college ?? '',
      program: user.course ?? user.program ?? '',
      faculty_role: user.faculty_role ?? '',
      rank: user.rank ?? '',
      year_level: user.year_level ?? '',
      temporary_password: '',
      is_active: user.is_active,
    });
    setShowPassword(false);
    setFormOpen(true);
  };

  const toggleUserStatus = async (user: AdminManagedUser) => {
    const nextIsActive = !user.is_active;

    if (!nextIsActive) {
      const confirmed = await confirm({
        title: 'Disable Account',
        message: `Are you sure you want to disable ${user.name}'s account?\n\nIf the user is currently logged in, they will be signed out of the browser shortly after this change.`,
        confirmLabel: 'OK',
        cancelLabel: 'Cancel',
        tone: 'danger',
      });

      if (!confirmed) {
        return;
      }
    }

    setError(null);
    setSuccessMessage(null);
    setTogglingUserId(user.id);

    try {
      const updatedUser = await adminService.updateUserStatus(user.id, nextIsActive);
      setUsers((current) => current.map((entry) => (entry.id === user.id ? updatedUser : entry)));
      setSuccessMessage(`User ${updatedUser.is_active ? 'enabled' : 'disabled'} successfully.`);

      if (editingId === user.id) {
        setForm((current) => ({ ...current, is_active: updatedUser.is_active }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const isStudent = form.role === 'student';
  const modalVerb = editingId ? 'Edit' : 'Create';
  const modalRoleLabel = isStudent ? 'Student' : 'Faculty';
  const modalDescription = isStudent
    ? 'Update student account details and enrollment information.'
    : 'Update faculty account details and teaching assignment information.';

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <h1>User Management</h1>
          <p>Create faculty and student accounts, assign academic placement, and control internal access.</p>
        </div>
      </div>

      {successMessage ? <div className="admin-success">{successMessage}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-panel admin-users-list-panel">
        <div className="admin-panel-head admin-users-list-head">
          <div className="admin-users-list-title">
            <span className="admin-users-list-icon"><Users size={16} /></span>
            <h3>User List</h3>
          </div>

          <div className="admin-users-head-actions">
            <button type="button" className="admin-btn admin-users-create-btn" onClick={openCreate}>
              <Plus size={15} />
              <span>Create User</span>
            </button>
          </div>
        </div>

        <div className="admin-users-toolbar">
          <label className="admin-users-select admin-users-page-size">
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="admin-users-search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, ID, or email..." />
          </label>

          <label className="admin-users-select">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as AdminUserSort)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="admin-users-select">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as AdminUserRole | '')}>
              <option value="">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-users-table admin-users-table-polished">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>College</th>
                <th>Department</th>
                <th>Course</th>
                <th>Enabled</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-cell">
                      <span className="admin-user-avatar-chip">{toInitials(user.name)}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <div>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`admin-role-badge ${user.role}`}>{user.role}</span></td>
                  <td>{user.college || 'Unassigned'}</td>
                  <td className="admin-user-assignment">{user.department || 'Unassigned'}</td>
                  <td>{programCodeById.get(user.course_id ?? user.program_id ?? '') || user.course || user.program || 'Unassigned'}</td>
                  <td className="admin-user-enabled-cell">
                    <button
                      type="button"
                      className={`admin-status-switch ${user.is_active ? 'active' : ''}`}
                      onClick={() => void toggleUserStatus(user)}
                      aria-label={`Toggle ${user.name} account status`}
                      disabled={togglingUserId === user.id}
                    >
                      <span />
                    </button>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="admin-table-empty">No users matched the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-users-pagination">
          <p>{`Showing ${sortedUsers.length ? ((currentPage - 1) * pageSize) + 1 : 0} to ${Math.min(currentPage * pageSize, sortedUsers.length)} of ${sortedUsers.length} users`}</p>

          <div className="admin-users-pagination-controls">
            <button
              type="button"
              className="admin-users-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`admin-users-page-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="admin-users-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {formOpen ? (
        <div className="admin-modal-backdrop" onClick={closeFormModal}>
          <div className="admin-modal-card admin-user-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-head">
              <div>
                <h3>{`${modalVerb} ${modalRoleLabel} User`}</h3>
                <p>{modalDescription}</p>
              </div>
              <button type="button" className="admin-view-all" onClick={closeFormModal}>Close</button>
            </div>

            <div className="admin-user-role-toggle">
              <button
                type="button"
                className={!isStudent ? 'active' : ''}
                disabled={Boolean(editingId)}
                onClick={() => setForm((current) => ({ ...current, role: 'faculty', faculty_role: current.faculty_role || 'Adviser' }))}
              >
                <User size={16} />
                <span>Faculty</span>
              </button>
              <button
                type="button"
                className={isStudent ? 'active' : ''}
                disabled={Boolean(editingId)}
                onClick={() => setForm((current) => ({ ...current, role: 'student', faculty_role: '' }))}
              >
                <GraduationCap size={16} />
                <span>Student</span>
              </button>
            </div>
            {editingId ? <p className="admin-user-role-lock-note">Role cannot be changed while editing an existing user.</p> : null}

            <div className="admin-user-form-shell-stacked">
              <section className="admin-user-form-section">
                <div className="admin-user-section-head">
                  <span>Basic Information</span>
                </div>
                <div className="admin-form-grid admin-user-form-grid">
                  <label className="admin-field admin-modal-field">
                    <span>First Name <em>*</em></span>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                    />
                  </label>
                  <label className="admin-field admin-modal-field">
                    <span>Last Name <em>*</em></span>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                    />
                  </label>
                  <label className="admin-field admin-modal-field">
                    <span>Suffix</span>
                    <input
                      type="text"
                      placeholder="Enter suffix (optional)"
                      value={form.suffix}
                      onChange={(event) => setForm((current) => ({ ...current, suffix: event.target.value }))}
                    />
                  </label>
                  <label className="admin-field admin-modal-field">
                    <span>Email <em>*</em></span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section className="admin-user-form-section">
                <div className="admin-user-section-head">
                  <span>Account Information</span>
                </div>
                <div className="admin-form-grid admin-user-form-grid">
                  <label className="admin-field admin-modal-field">
                    <span>{editingId ? 'New Password (optional)' : 'Temporary Password'}</span>
                    <div className="admin-password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.temporary_password}
                        onChange={(event) => setForm((current) => ({ ...current, temporary_password: event.target.value }))}
                      />
                      <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {editingId ? <small>Leave blank to keep current password</small> : null}
                  </label>

                  {isStudent ? (
                    <label className="admin-field admin-modal-field admin-modal-field-compact">
                      <span>Student ID <em>*</em></span>
                      <input
                        type="text"
                        value={form.student_id}
                        onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}
                      />
                    </label>
                  ) : (
                    <label className="admin-field admin-modal-field">
                      <span>Faculty ID <em>*</em></span>
                      <input
                        type="text"
                        value={form.faculty_id}
                        onChange={(event) => setForm((current) => ({ ...current, faculty_id: event.target.value }))}
                      />
                    </label>
                  )}
                </div>
              </section>

              {isStudent ? (
                <section className="admin-user-form-section">
                  <div className="admin-user-section-head">
                    <span>Student Information</span>
                  </div>
                  <div className="admin-form-grid admin-user-form-grid">
                    <label className="admin-field admin-modal-field">
                      <span>Year Level <em>*</em></span>
                      <select
                        value={form.year_level ?? ''}
                        onChange={(event) => setForm((current) => ({ ...current, year_level: event.target.value }))}
                      >
                        <option value="">Select year level</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                      </select>
                    </label>
                    <label className="admin-field admin-modal-field">
                      <span>Section Label</span>
                      <input
                        type="text"
                        value={form.section}
                        onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
                      />
                    </label>
                  </div>
                </section>
              ) : (
                <section className="admin-user-form-section">
                  <div className="admin-user-section-head">
                    <span>Faculty Information</span>
                  </div>
                  <div className="admin-form-grid admin-user-form-grid">
                    <label className="admin-field admin-modal-field">
                      <span>Rank</span>
                      <input
                        type="text"
                        value={form.rank}
                        onChange={(event) => setForm((current) => ({ ...current, rank: event.target.value }))}
                      />
                    </label>
                    <label className="admin-field admin-modal-field">
                      <span>Faculty Role <em>*</em></span>
                      <select
                        value={FACULTY_ROLE_OPTIONS.includes(form.faculty_role as FacultyRoleOption) ? form.faculty_role : ''}
                        onChange={(event) => setForm((current) => ({ ...current, faculty_role: event.target.value }))}
                      >
                        <option value="">Select faculty role</option>
                        {FACULTY_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              <section className="admin-user-form-section">
                <div className="admin-user-section-head">
                  <span>Academic Information</span>
                </div>
                <div className="admin-form-grid admin-user-form-grid">
                  <label className="admin-field admin-modal-field">
                    <span>College <em>*</em></span>
                    <select
                      value={form.college_id}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        college_id: event.target.value,
                        department_id: '',
                        program_id: '',
                        section_id: '',
                      }))}
                    >
                      <option value="">Select college</option>
                      {structure.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                    </select>
                  </label>

                  <label className="admin-field admin-modal-field">
                    <span>Department <em>*</em></span>
                    <select
                      value={form.department_id}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        department_id: event.target.value,
                        program_id: '',
                        section_id: '',
                      }))}
                    >
                      <option value="">Select department</option>
                      {(selectedCollege?.departments ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </label>

                  {isStudent ? (
                    <>
                      <label className="admin-field admin-modal-field">
                        <span>Course <em>*</em></span>
                        <select
                          value={form.program_id}
                          onChange={(event) => setForm((current) => ({ ...current, program_id: event.target.value, section_id: '', section: '' }))}
                        >
                          <option value="">Select course</option>
                          {(selectedDepartment?.programs ?? []).map((program) => (
                            <option key={program.id} value={program.id}>
                              {program.code?.trim() || program.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="admin-field admin-modal-field">
                        <span>Section <em>*</em></span>
                        <input
                          type="text"
                          value={form.section}
                          onChange={(event) => setForm((current) => ({ ...current, section_id: '', section: event.target.value }))}
                          placeholder="Enter section"
                        />
                      </label>
                    </>
                  ) : null}
                </div>
              </section>

            </div>

            <div className="admin-actions">
              <button type="button" className="admin-btn" onClick={closeFormModal}>
                Cancel
              </button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => void submit()}>
                {editingId ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
