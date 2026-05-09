import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, FileText, List, Search, UserPlus, Users2 } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import type { AdminStructureCollege } from '../../services/adminService';
import { academicStructureService } from '../../services/academicStructureService';
import { facultyAdviseesService, type FacultyAdviseeRecord, type FacultyAdviseesResponse, type StudentAccountPayload } from '../../services/facultyAdviseesService';
import { findProgramInDepartment, getDepartmentProgramOptions, resolveProgramDisplayValue } from '../../utils/programs';

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const EDIT_PANEL_CLOSE_DELAY = 280;
const EDIT_PANEL_SHELL_CLOSE_DELAY = 180;
const SUCCESS_MESSAGE_DURATION = 5000;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
type AdviseePanelMode = 'view' | 'edit';

const initialForm: StudentAccountPayload = {
  first_name: '',
  last_name: '',
  suffix: '',
  email: '',
  temporary_password: generateTemporaryPassword(),
  student_id: '',
  college: '',
  department: '',
  program: '',
  year_level: 4,
  section: '',
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatYearLevel = (value?: number | null) => {
  if (!value) return 'Not set';
  if (value === 1) return '1st Year';
  if (value === 2) return '2nd Year';
  if (value === 3) return '3rd Year';
  return `${value}th Year`;
};

const getInitials = (name: string) => {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'ST';
};

const getPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | string> = [1];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  if (windowStart > 2) {
    items.push('ellipsis-left');
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page);
  }

  if (windowEnd < totalPages - 1) {
    items.push('ellipsis-right');
  }

  items.push(totalPages);
  return items;
};

const findStructureMatch = (structure: AdminStructureCollege[], departmentName?: string, programName?: string) => {
  for (const college of structure) {
    for (const department of college.departments) {
      const departmentMatches = departmentName ? department.name === departmentName : false;
      const matchedProgram = findProgramInDepartment(department, programName);

      if (departmentMatches || matchedProgram) {
        return {
          college,
          department,
          program: matchedProgram,
        };
      }
    }
  }

  return {
    college: null,
    department: null,
    program: null,
  };
};

export default function FacultyAdviseesPage() {
  const { confirm } = useConfirmDialog();
  const [adviseesData, setAdviseesData] = useState<FacultyAdviseesResponse | null>(null);
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editShellOpen, setEditShellOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<AdviseePanelMode>('edit');
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
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
        student_id: current.student_id || response.next_student_id || '',
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
    void academicStructureService.list()
      .then((records) => setStructure(records))
      .catch(() => setStructure([]));
  }, []);

  useEffect(() => () => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!success) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccess('');
    }, SUCCESS_MESSAGE_DURATION);

    return () => window.clearTimeout(timeoutId);
  }, [success]);

  useEffect(() => {
    if (!editSuccess) return undefined;

    const timeoutId = window.setTimeout(() => {
      setEditSuccess('');
    }, SUCCESS_MESSAGE_DURATION);

    return () => window.clearTimeout(timeoutId);
  }, [editSuccess]);

  useEffect(() => {
    if (!createOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCreateOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createOpen]);

  useEffect(() => {
    if (!editingId || !editOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingId, editOpen]);

  const advisees = adviseesData?.advisees ?? [];
  const summary = adviseesData?.summary;
  const getAdviseeCollege = (advisee: FacultyAdviseeRecord) => (
    advisee.college
    || findStructureMatch(structure, advisee.department, advisee.program).college?.name
    || 'Not set'
  );

  const collegeOptions = useMemo(
    () => ['All Colleges', ...Array.from(new Set([
      ...structure.map((college) => college.name).filter(Boolean),
      ...advisees.map((item) => getAdviseeCollege(item)).filter((value) => value && value !== 'Not set'),
    ])).sort((left, right) => left.localeCompare(right))],
    [advisees, structure],
  );

  const createStructureMatch = useMemo(
    () => findStructureMatch(structure, form.department, form.program),
    [form.department, form.program, structure],
  );

  const createCollegeName = createStructureMatch.college?.name || '';
  const createProgramOptions = useMemo(
    () => getDepartmentProgramOptions(createStructureMatch.department),
    [createStructureMatch.department],
  );
  const editStructureMatch = useMemo(
    () => findStructureMatch(structure, editForm.department, editForm.program),
    [editForm.department, editForm.program, structure],
  );
  const editCollegeName = editStructureMatch.college?.name || editForm.college || '';
  const editProgramOptions = useMemo(
    () => getDepartmentProgramOptions(editStructureMatch.department),
    [editStructureMatch.department],
  );

  const filteredAdvisees = useMemo(() => advisees.filter((advisee) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      advisee.student_name,
      advisee.student_id,
      getAdviseeCollege(advisee),
      advisee.program,
      advisee.department,
    ].join(' ').toLowerCase().includes(normalizedSearch);

    const adviseeCollege = getAdviseeCollege(advisee);
    const matchesCollege = collegeFilter === 'All Colleges' || adviseeCollege === collegeFilter;

    return matchesSearch && matchesCollege;
  }), [advisees, collegeFilter, search, structure]);

  useEffect(() => {
    setCurrentPage(1);
  }, [collegeFilter, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAdvisees.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const normalizedProgram = resolveProgramDisplayValue(createStructureMatch.department, form.program);

    if (normalizedProgram && normalizedProgram !== form.program) {
      setForm((current) => (
        current.program === form.program
          ? { ...current, program: normalizedProgram }
          : current
      ));
    }
  }, [createStructureMatch.department, form.program]);

  useEffect(() => {
    const normalizedProgram = resolveProgramDisplayValue(editStructureMatch.department, editForm.program);

    if (normalizedProgram && normalizedProgram !== editForm.program) {
      setEditForm((current) => (
        current.program === editForm.program
          ? { ...current, program: normalizedProgram }
          : current
      ));
    }
  }, [editForm.program, editStructureMatch.department]);

  const paginatedAdvisees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAdvisees.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredAdvisees, pageSize]);

  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);

  const showingCountLabel = filteredAdvisees.length
    ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredAdvisees.length)} of ${filteredAdvisees.length} advisees`
    : 'Showing 0 to 0 of 0 advisees';

  const stats = [
    { label: 'Total Advisees', value: summary?.total_advisees ?? 0, icon: <Users2 size={20} />, tone: 'si-sky' },
    { label: 'Active Proposals', value: summary?.active_proposals ?? 0, icon: <FileText size={20} />, tone: 'si-gold' },
    { label: 'New This Term', value: summary?.new_this_term ?? 0, icon: <UserPlus size={20} />, tone: 'si-maroon' },
    { label: 'For Defense', value: summary?.for_defense ?? 0, icon: <CheckCircle2 size={20} />, tone: 'si-sage' },
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
          student_id: adviseesData?.next_student_id || '',
          department: adviseesData?.department || '',
        });
        setPanelMode('edit');
        setEditingId(null);
        editCloseTimeoutRef.current = null;
      }, EDIT_PANEL_SHELL_CLOSE_DELAY);
    }, EDIT_PANEL_CLOSE_DELAY);
  };

  const resetCreateForm = () => {
    setForm({
      ...initialForm,
      temporary_password: generateTemporaryPassword(),
      student_id: adviseesData?.next_student_id || '',
      department: adviseesData?.department || '',
    });
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
  };

  const openAdviseePanel = (advisee: FacultyAdviseeRecord, mode: AdviseePanelMode) => {
    if (editCloseTimeoutRef.current) {
      window.clearTimeout(editCloseTimeoutRef.current);
      editCloseTimeoutRef.current = null;
    }

    const [fallbackFirstName = '', ...restName] = advisee.student_name.split(' ').filter(Boolean);
    const collegeName = getAdviseeCollege(advisee);

    setEditingId(advisee.id);
    setEditShellOpen(true);
    setPanelMode(mode);
    setEditSuccess('');
    setEditError('');
    setEditForm({
      first_name: advisee.first_name || fallbackFirstName,
      last_name: advisee.last_name || restName.join(' '),
      email: advisee.email || '',
      temporary_password: '',
      student_id: advisee.student_id,
      college: collegeName === 'Not set' ? '' : collegeName,
      department: advisee.department || adviseesData?.department || '',
      program: advisee.program || '',
      year_level: advisee.year_level ?? 4,
      section: '',
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
        college: createCollegeName || undefined,
        program: form.program.trim(),
        department: form.department || adviseesData?.department || '',
        section: form.section?.trim() || undefined,
      });
      setSuccess('Student account created successfully.');
      setForm({
        ...initialForm,
        temporary_password: generateTemporaryPassword(),
        student_id: '',
        department: adviseesData?.department || '',
      });
      setCreateOpen(false);
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
        college: editCollegeName || undefined,
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
      <div className="faculty-advisees-page">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {success ? <div className="vpaa-banner-success">{success}</div> : null}

        <div className="vpaa-grid-4 student-submissions-stats faculty-advisees-stats">
          {stats.map((card) => (
            <article className="student-submissions-stat-card vpaa-card vpaa-activity-summary-card faculty-advisees-stat-card" key={card.label}>
              <div className="student-submissions-stat-copy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              <span className={`student-submissions-stat-icon faculty-advisees-stat-icon ${card.tone}`}>{card.icon}</span>
            </article>
          ))}
        </div>

        <section className="review-panel faculty-activity-log-panel faculty-advisees-board">
          <div className="ra-header faculty-activity-log-header faculty-advisees-board-header">
            <div className="ra-header-left faculty-activity-log-header-left">
              <span className="panel-header-icon phi-maroon"><List size={17} /></span>
              <h3 className="panel-title">Advisee List</h3>
            </div>

            <button
              type="button"
              className={`faculty-advisees-create-button${createOpen ? ' active' : ''}`}
              onClick={() => setCreateOpen(true)}
            >
              <UserPlus size={18} />
              <span>Create Student Account</span>
            </button>
          </div>

          <div className="filter-row faculty-activity-log-filters faculty-advisees-toolbar">
            <div className="filter-group faculty-activity-log-filter-group faculty-advisees-toolbar-main">
              <select className="filter-select faculty-advisees-page-size" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>

              <label className="vpaa-activity-search faculty-advisees-search">
                <Search size={16} />
                <input
                  className="filter-input"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student ID, name, college, or department..."
                />
              </label>

              <select className="filter-select faculty-advisees-filter-select" value={collegeFilter} onChange={(event) => setCollegeFilter(event.target.value)}>
                {collegeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div className="faculty-advisees-table-wrap">
            <table className="review-table faculty-advisees-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>College</th>
                  <th>Department</th>
                  <th>Course</th>
                  <th>Year Level</th>
                  <th>Last Update</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="vpaa-activity-empty">Loading advisees...</td>
                  </tr>
                ) : paginatedAdvisees.length ? paginatedAdvisees.map((advisee) => (
                  <tr key={advisee.id}>
                    <td>
                      <div className="faculty-advisees-student">
                        <span className="faculty-advisees-avatar">{getInitials(advisee.student_name)}</span>
                        <div className="faculty-advisees-student-copy">
                          <span className="faculty-advisees-student-name">{advisee.student_name}</span>
                          <span className="faculty-advisees-student-id">{advisee.student_id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{getAdviseeCollege(advisee)}</td>
                    <td>{advisee.department || 'Not set'}</td>
                    <td>{advisee.program || 'Not set'}</td>
                    <td>{formatYearLevel(advisee.year_level)}</td>
                    <td>{formatDate(advisee.last_update)}</td>
                    <td className="table-actions">
                      <div className="faculty-advisees-action-group">
                        <button type="button" className="faculty-advisees-action-button" onClick={() => openAdviseePanel(advisee, 'view')} disabled={removingId === advisee.id}>
                          View
                        </button>
                        <button type="button" className="faculty-advisees-action-button faculty-advisees-action-button-primary" onClick={() => openAdviseePanel(advisee, 'edit')} disabled={removingId === advisee.id}>
                          Edit
                        </button>
                      </div>
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

          <div className="faculty-advisees-footer">
            <p className="faculty-advisees-footer-meta">{showingCountLabel}</p>

            {filteredAdvisees.length > 0 ? (
              <div className="faculty-advisees-pagination">
                <button
                  type="button"
                  className="faculty-advisees-page-button faculty-advisees-page-button-nav"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {paginationItems.map((item) => (
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      className={`faculty-advisees-page-button${currentPage === item ? ' active' : ''}`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="faculty-advisees-page-ellipsis">...</span>
                  )
                ))}

                <button
                  type="button"
                  className="faculty-advisees-page-button faculty-advisees-page-button-nav"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {createOpen ? (
          <div className="vpaa-thesis-modal-backdrop faculty-advisees-create-backdrop" onClick={closeCreateModal} role="presentation">
            <div
              className="vpaa-thesis-modal faculty-advisees-create-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="faculty-create-student-title"
            >
              <div className="faculty-advisees-create-modal-header">
                <div>
                  <h2 id="faculty-create-student-title">Create Student Account</h2>
                  <p>Set up a student login and academic profile for one of your advisees.</p>
                </div>
              </div>

              {error ? <div className="vpaa-banner-error">{error}</div> : null}

              <form onSubmit={handleSubmit} className="faculty-advisees-create-modal-form">
                <section className="faculty-advisees-modal-section">
                  <div className="faculty-advisees-modal-section-head">
                    <span>Basic Information</span>
                  </div>
                  <div className="form-grid faculty-advisees-modal-grid">
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
                      <input value={form.suffix ?? ''} onChange={(event) => setForm({ ...form, suffix: event.target.value })} placeholder="Optional" />
                    </label>
                  </div>
                </section>

                <section className="faculty-advisees-modal-section">
                  <div className="faculty-advisees-modal-section-head">
                    <span>Account Information</span>
                  </div>
                  <div className="form-grid faculty-advisees-modal-grid">
                    <label className="form-field">
                      Institutional Email
                      <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="student@tup.edu.ph" required />
                    </label>
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
                      Temporary Password
                      <div className="faculty-advisees-password-row">
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
                </section>

                <section className="faculty-advisees-modal-section">
                  <div className="faculty-advisees-modal-section-head">
                    <span>Academic Information</span>
                  </div>
                  <div className="form-grid faculty-advisees-modal-grid">
                    <label className="form-field">
                      Adviser
                      <input value={adviseesData?.adviser_name ?? 'Faculty Adviser'} readOnly />
                    </label>
                    <label className="form-field">
                      College
                      <input value={createCollegeName} readOnly placeholder="College will be set automatically" />
                    </label>
                    <label className="form-field">
                      Department
                      <input value={form.department} readOnly required />
                    </label>
                    <label className="form-field">
                      Course
                      <select
                        value={form.program}
                        onChange={(event) => setForm({ ...form, program: event.target.value, section: '' })}
                        required
                      >
                        <option value="">Select course</option>
                        {createProgramOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      Year Level
                      <select value={String(form.year_level ?? 4)} onChange={(event) => setForm({ ...form, year_level: Number(event.target.value) })}>
                        {yearLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      Section
                      <input
                        value={form.section ?? ''}
                        onChange={(event) => setForm({ ...form, section: event.target.value })}
                        placeholder="Enter section"
                      />
                    </label>
                  </div>
                </section>

                <div className="form-actions faculty-advisees-modal-actions">
                  <button className="btn-secondary" type="button" onClick={resetCreateForm}>Clear Form</button>
                  <div className="faculty-advisees-modal-submit-group">
                    <button className="btn-secondary" type="button" onClick={closeCreateModal}>Cancel</button>
                    <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {editingId ? (
          <div className={`edit-panel-shell${editShellOpen ? ' open' : ''}`}>
            <div className="section-spacer" />

            <div className="review-panel" ref={editPanelRef}>
              <div className="ra-header">
                <button type="button" className="vpaa-panel-toggle" onClick={() => setEditOpen((current) => !current)} aria-expanded={editOpen}>
                    <span className="ra-header-left">
                      <span className="panel-header-icon phi-maroon"><UserPlus size={17} /></span>
                    <span className="panel-title">{panelMode === 'view' ? 'View Student Account' : 'Edit Student Account'}</span>
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
                        <input value={editForm.student_id ?? ''} onChange={(event) => setEditForm({ ...editForm, student_id: event.target.value })} readOnly={panelMode === 'view'} required />
                      </label>
                      <label className="form-field">
                        Institutional Email
                        <input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="student@tup.edu.ph" readOnly={panelMode === 'view'} required />
                      </label>
                      <label className="form-field">
                        Adviser
                        <input value={adviseesData?.adviser_name ?? 'Faculty Adviser'} readOnly />
                      </label>
                      <label className="form-field">
                        College
                        <input value={editCollegeName} readOnly placeholder="College will be set automatically" />
                      </label>
                      <label className="form-field">
                        First Name
                        <input value={editForm.first_name} onChange={(event) => setEditForm({ ...editForm, first_name: event.target.value })} placeholder="Juan" readOnly={panelMode === 'view'} required />
                      </label>
                      <label className="form-field">
                        Last Name
                        <input value={editForm.last_name} onChange={(event) => setEditForm({ ...editForm, last_name: event.target.value })} placeholder="Dela Cruz" readOnly={panelMode === 'view'} required />
                      </label>
                      <label className="form-field">
                        Suffix
                        <input value={editForm.suffix ?? ''} onChange={(event) => setEditForm({ ...editForm, suffix: event.target.value })} placeholder="Jr." readOnly={panelMode === 'view'} />
                      </label>
                      <label className="form-field">
                        Year Level
                        <select value={String(editForm.year_level ?? 4)} onChange={(event) => setEditForm({ ...editForm, year_level: Number(event.target.value) })} disabled={panelMode === 'view'}>
                          {yearLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label className="form-field">
                        Course
                        <select value={editForm.program} onChange={(event) => setEditForm({ ...editForm, program: event.target.value })} disabled={panelMode === 'view'} required>
                          <option value="">Select course</option>
                          {editProgramOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="form-field">
                        Department
                        <input value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })} readOnly={panelMode === 'view'} required />
                      </label>
                      <label className="form-field">
                        Temporary Password
                        <div className="faculty-advisees-password-row">
                          <input
                            type="text"
                            value={editForm.temporary_password}
                            onChange={(event) => setEditForm({ ...editForm, temporary_password: event.target.value })}
                            placeholder="Leave blank to keep the current password"
                            readOnly={panelMode === 'view'}
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setEditForm({ ...editForm, temporary_password: generateTemporaryPassword() })}
                            disabled={panelMode === 'view'}
                          >
                            Generate
                          </button>
                        </div>
                      </label>
                      {selectedAdvisee && panelMode === 'edit' ? (
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
                      <button className="btn-secondary" type="button" onClick={resetEditForm}>{panelMode === 'view' ? 'Close' : 'Cancel'}</button>
                      {panelMode === 'view' ? (
                        <button className="btn-primary" type="button" onClick={() => setPanelMode('edit')}>
                          Edit Account
                        </button>
                      ) : (
                        <button className="btn-primary" type="submit" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
                      )}
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
