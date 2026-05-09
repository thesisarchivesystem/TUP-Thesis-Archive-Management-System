import { useEffect, useMemo, useState } from 'react';
import { adminService, type AdminManagedUser, type AdminStructureCollege } from '../../services/adminService';

const emptyForm = {
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [roleFilter, setRoleFilter] = useState<'faculty' | 'student' | ''>('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Record<string, any>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCollege = useMemo(
    () => structure.find((college) => college.id === form.college_id),
    [form.college_id, structure],
  );
  const selectedDepartment = useMemo(
    () => selectedCollege?.departments.find((department) => department.id === form.department_id),
    [form.department_id, selectedCollege],
  );
  const selectedProgram = useMemo(
    () => selectedDepartment?.programs.find((program) => program.id === form.program_id),
    [form.program_id, selectedDepartment],
  );

  const load = () =>
    Promise.all([
      adminService.listUsers(roleFilter || undefined, search || undefined),
      adminService.listStructure(),
    ]).then(([usersResponse, structureResponse]) => {
      setUsers(usersResponse);
      setStructure(structureResponse);
    });

  useEffect(() => {
    void load().catch(() => setError('Failed to load user management data.'));
  }, []);

  const submit = async () => {
    const payload = {
      ...form,
      year_level: form.year_level ? Number(form.year_level) : null,
    };

    try {
      if (editingId) {
        await adminService.updateUser(editingId, payload);
      } else {
        await adminService.createUser(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setError(null);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <span className="admin-kicker">Internal Accounts</span>
          <h1>User Management</h1>
          <p>Create faculty and student accounts, assign their academic placement, and control access without exposing self-registration.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>{editingId ? 'Edit User' : 'Create User'}</h3>
        </div>
        <div className="admin-form-grid">
          {[
            ['first_name', 'First Name'],
            ['last_name', 'Last Name'],
            ['suffix', 'Suffix'],
            ['email', 'Email'],
            ['temporary_password', editingId ? 'New Password (optional)' : 'Temporary Password'],
            ['rank', 'Rank'],
            ['faculty_role', 'Faculty Role'],
            ['student_id', 'Student ID'],
            ['faculty_id', 'Faculty ID'],
            ['section', 'Section Label'],
            ['year_level', 'Year Level'],
          ].map(([key, label]) => (
            <label key={key} className="admin-field">
              <span>{label}</span>
              <input
                type={key === 'temporary_password' ? 'password' : 'text'}
                value={form[key] ?? ''}
                onChange={(event) => setForm((current: any) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}

          <label className="admin-field">
            <span>Role</span>
            <select value={form.role} onChange={(event) => setForm((current: any) => ({ ...current, role: event.target.value }))}>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </label>

          <label className="admin-field">
            <span>College</span>
            <select
              value={form.college_id}
              onChange={(event) => setForm((current: any) => ({
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

          <label className="admin-field">
            <span>Department</span>
            <select
              value={form.department_id}
              onChange={(event) => setForm((current: any) => ({ ...current, department_id: event.target.value, program_id: '', section_id: '' }))}
            >
              <option value="">Select department</option>
              {(selectedCollege?.departments ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>

          <label className="admin-field">
            <span>Program</span>
            <select
              value={form.program_id}
              onChange={(event) => setForm((current: any) => ({ ...current, program_id: event.target.value, section_id: '' }))}
            >
              <option value="">Select program</option>
              {(selectedDepartment?.programs ?? []).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
          </label>

          <label className="admin-field">
            <span>Section Record</span>
            <select value={form.section_id} onChange={(event) => setForm((current: any) => ({ ...current, section_id: event.target.value }))}>
              <option value="">Select section</option>
              {(selectedProgram?.sections ?? []).map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
          </label>

          <label className="admin-field admin-field-check">
            <span>Active Account</span>
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(event) => setForm((current: any) => ({ ...current, is_active: event.target.checked }))}
            />
          </label>
        </div>
        <div className="admin-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => void submit()}>
            {editingId ? 'Update User' : 'Create User'}
          </button>
          <button type="button" className="admin-btn" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
            Clear
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>User Directory</h3>
          <div className="admin-inline-filters">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as any)}>
              <option value="">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" />
            <button type="button" className="admin-btn" onClick={() => void load()}>Filter</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Academic Assignment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <div>{user.email}</div>
                  </td>
                  <td>{user.role}</td>
                  <td>{[user.college, user.department, user.program, user.section].filter(Boolean).join(' / ') || 'Unassigned'}</td>
                  <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => {
                          setEditingId(user.id);
                          setForm({
                            ...emptyForm,
                            ...user,
                            temporary_password: '',
                            is_active: user.is_active,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => void adminService.updateUserStatus(user.id, !user.is_active).then(load)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
