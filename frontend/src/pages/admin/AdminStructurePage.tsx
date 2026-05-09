import { Building2, ChevronDown, GraduationCap, Plus, Search, School2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminService, type AdminStructureCollege } from '../../services/adminService';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const ALERT_TIMEOUT_MS = 4000;

type CollegeFormState = {
  id?: string;
  name: string;
  code: string;
  dean_head: string;
  dean_head_email: string;
  description: string;
  office_location: string;
  contact_number: string;
};

type DepartmentFormState = {
  id?: string;
  college_id: string;
  name: string;
  code: string;
  chairperson: string;
  chairperson_email: string;
  description: string;
  office_location: string;
  contact_number: string;
};

type ProgramFormState = {
  id?: string;
  college_id: string;
  department_id: string;
  name: string;
  code: string;
  coordinator: string;
  contact_email: string;
  description: string;
  curriculum_type: string;
  year_duration: string;
};

type FormErrors<T extends string> = Partial<Record<T, string>>;

const emptyCollegeForm: CollegeFormState = {
  name: '',
  code: '',
  dean_head: '',
  dean_head_email: '',
  description: '',
  office_location: '',
  contact_number: '',
};

const emptyDepartmentForm: DepartmentFormState = {
  college_id: '',
  name: '',
  code: '',
  chairperson: '',
  chairperson_email: '',
  description: '',
  office_location: '',
  contact_number: '',
};

const emptyProgramForm: ProgramFormState = {
  college_id: '',
  department_id: '',
  name: '',
  code: '',
  coordinator: '',
  contact_email: '',
  description: '',
  curriculum_type: '',
  year_duration: '',
};

const normalize = (value: string) => value.trim().toLowerCase();

const paginate = <T,>(items: T[], page: number, size: number) => {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
};

const totalPagesFor = (totalItems: number, pageSize: number) => Math.max(1, Math.ceil(totalItems / pageSize));

const pageLabel = (totalItems: number, page: number, pageSize: number, unit: string) => {
  if (!totalItems) return `Showing 0 to 0 of 0 ${unit}`;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `Showing ${start} to ${end} of ${totalItems} ${unit}`;
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

export default function AdminStructurePage() {
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [collegePageSize, setCollegePageSize] = useState(10);
  const [departmentPageSize, setDepartmentPageSize] = useState(10);
  const [programPageSize, setProgramPageSize] = useState(10);

  const [collegePage, setCollegePage] = useState(1);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [programPage, setProgramPage] = useState(1);

  const [collegeSearch, setCollegeSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');

  const [departmentCollegeFilter, setDepartmentCollegeFilter] = useState('');
  const [programCollegeFilter, setProgramCollegeFilter] = useState('');
  const [programDepartmentFilter, setProgramDepartmentFilter] = useState('');

  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [programModalOpen, setProgramModalOpen] = useState(false);

  const [collegeForm, setCollegeForm] = useState<CollegeFormState>(emptyCollegeForm);
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(emptyDepartmentForm);
  const [programForm, setProgramForm] = useState<ProgramFormState>(emptyProgramForm);

  const [collegeErrors, setCollegeErrors] = useState<FormErrors<keyof CollegeFormState>>({});
  const [departmentErrors, setDepartmentErrors] = useState<FormErrors<keyof DepartmentFormState>>({});
  const [programErrors, setProgramErrors] = useState<FormErrors<keyof ProgramFormState>>({});

  const load = async () => {
    const structureResponse = await adminService.listStructure();
    setStructure(structureResponse);
  };

  useEffect(() => {
    void load().catch(() => setError('Failed to load academic structure.'));
  }, []);

  useEffect(() => {
    if (!error && !successMessage) return undefined;

    const timeout = window.setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, ALERT_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [error, successMessage]);

  useEffect(() => {
    setCollegePage(1);
  }, [collegeSearch, collegePageSize, structure.length]);

  useEffect(() => {
    setDepartmentPage(1);
  }, [departmentSearch, departmentCollegeFilter, departmentPageSize, structure.length]);

  useEffect(() => {
    setProgramPage(1);
  }, [programSearch, programCollegeFilter, programDepartmentFilter, programPageSize, structure.length]);

  const collegeOptions = useMemo(
    () => structure.map((college) => ({ id: college.id, name: college.name })),
    [structure],
  );

  const departments = useMemo(
    () => structure.flatMap((college) => college.departments.map((department) => ({
      id: department.id,
      name: department.name,
      code: department.code ?? '',
      is_active: department.is_active,
      collegeId: college.id,
      collegeName: college.name,
      chairperson: 'Not assigned',
      programs: department.programs,
    }))),
    [structure],
  );

  const programDepartmentOptions = useMemo(() => {
    if (!programForm.college_id) return [];
    return structure.find((college) => college.id === programForm.college_id)?.departments ?? [];
  }, [programForm.college_id, structure]);

  const filteredProgramDepartmentOptions = useMemo(() => {
    if (!programCollegeFilter) return departments;
    return departments.filter((department) => department.collegeId === programCollegeFilter);
  }, [departments, programCollegeFilter]);

  const programs = useMemo(
    () => structure.flatMap((college) => college.departments.flatMap((department) => department.programs.map((program) => ({
      id: program.id,
      name: program.name,
      code: program.code ?? '',
      is_active: program.is_active,
      collegeId: college.id,
      collegeName: college.name,
      departmentId: department.id,
      departmentName: department.name,
      sectionCount: program.sections.length,
    })))),
    [structure],
  );

  const visibleColleges = useMemo(() => {
    const query = normalize(collegeSearch);
    if (!query) return structure;
    return structure.filter((college) => normalize(`${college.name} ${college.code ?? ''}`).includes(query));
  }, [collegeSearch, structure]);

  const visibleDepartments = useMemo(() => {
    const query = normalize(departmentSearch);
    return departments.filter((department) => {
      const matchesSearch = !query || normalize(`${department.name} ${department.code} ${department.collegeName}`).includes(query);
      const matchesCollege = !departmentCollegeFilter || department.collegeId === departmentCollegeFilter;
      return matchesSearch && matchesCollege;
    });
  }, [departmentCollegeFilter, departmentSearch, departments]);

  const visiblePrograms = useMemo(() => {
    const query = normalize(programSearch);
    return programs.filter((program) => {
      const matchesSearch = !query || normalize(`${program.name} ${program.code} ${program.collegeName} ${program.departmentName}`).includes(query);
      const matchesCollege = !programCollegeFilter || program.collegeId === programCollegeFilter;
      const matchesDepartment = !programDepartmentFilter || program.departmentId === programDepartmentFilter;
      return matchesSearch && matchesCollege && matchesDepartment;
    });
  }, [programCollegeFilter, programDepartmentFilter, programSearch, programs]);

  const collegeTotalPages = totalPagesFor(visibleColleges.length, collegePageSize);
  const departmentTotalPages = totalPagesFor(visibleDepartments.length, departmentPageSize);
  const programTotalPages = totalPagesFor(visiblePrograms.length, programPageSize);

  const paginatedColleges = paginate(visibleColleges, collegePage, collegePageSize);
  const paginatedDepartments = paginate(visibleDepartments, departmentPage, departmentPageSize);
  const paginatedPrograms = paginate(visiblePrograms, programPage, programPageSize);

  const openCreateCollege = () => {
    setCollegeForm(emptyCollegeForm);
    setCollegeErrors({});
    setCollegeModalOpen(true);
  };

  const openCreateDepartment = () => {
    setDepartmentForm({
      ...emptyDepartmentForm,
      college_id: departmentCollegeFilter || '',
    });
    setDepartmentErrors({});
    setDepartmentModalOpen(true);
  };

  const openCreateProgram = () => {
    setProgramForm({
      ...emptyProgramForm,
      college_id: programCollegeFilter || '',
      department_id: programDepartmentFilter || '',
    });
    setProgramErrors({});
    setProgramModalOpen(true);
  };

  const validateCollege = () => {
    const nextErrors: FormErrors<keyof CollegeFormState> = {};

    if (!collegeForm.name.trim()) nextErrors.name = 'College name is required.';
    if (!collegeForm.code.trim()) nextErrors.code = 'College code is required.';
    if (!collegeForm.dean_head.trim()) nextErrors.dean_head = 'Dean or head is required.';
    if (collegeForm.dean_head_email.trim() && !isValidEmail(collegeForm.dean_head_email)) {
      nextErrors.dean_head_email = 'Enter a valid email address.';
    }
    if (collegeForm.description.length > 500) nextErrors.description = 'Description must be 500 characters or fewer.';

    setCollegeErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateDepartment = () => {
    const nextErrors: FormErrors<keyof DepartmentFormState> = {};

    if (!departmentForm.name.trim()) nextErrors.name = 'Department name is required.';
    if (!departmentForm.college_id) nextErrors.college_id = 'Please select a college.';
    if (!departmentForm.chairperson.trim()) nextErrors.chairperson = 'Chairperson is required.';
    if (departmentForm.chairperson_email.trim() && !isValidEmail(departmentForm.chairperson_email)) {
      nextErrors.chairperson_email = 'Enter a valid email address.';
    }
    if (departmentForm.description.length > 500) nextErrors.description = 'Description must be 500 characters or fewer.';

    setDepartmentErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateProgram = () => {
    const nextErrors: FormErrors<keyof ProgramFormState> = {};

    if (!programForm.name.trim()) nextErrors.name = 'Program name is required.';
    if (!programForm.code.trim()) nextErrors.code = 'Degree code is required.';
    if (!programForm.college_id) nextErrors.college_id = 'Please select a college.';
    if (!programForm.department_id) nextErrors.department_id = 'Please select a department.';
    if (programForm.contact_email.trim() && !isValidEmail(programForm.contact_email)) {
      nextErrors.contact_email = 'Enter a valid email address.';
    }
    if (programForm.description.length > 500) nextErrors.description = 'Description must be 500 characters or fewer.';

    setProgramErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveCollege = async () => {
    if (!validateCollege()) {
      setSuccessMessage(null);
      setError('Please correct the highlighted college fields.');
      return;
    }

    try {
      const payload = {
        name: collegeForm.name.trim(),
        code: collegeForm.code.trim(),
      };

      if (collegeForm.id) {
        await adminService.updateCollege(collegeForm.id, payload);
        setSuccessMessage('College updated successfully.');
      } else {
        await adminService.createCollege(payload);
        setSuccessMessage('College created successfully.');
      }

      setCollegeModalOpen(false);
      setCollegeErrors({});
      setError(null);
      await load();
    } catch (saveError) {
      setSuccessMessage(null);
      setError(getErrorMessage(saveError, 'Failed to save college.'));
    }
  };

  const saveDepartment = async () => {
    if (!validateDepartment()) {
      setSuccessMessage(null);
      setError('Please correct the highlighted department fields.');
      return;
    }

    try {
      const payload = {
        college_id: departmentForm.college_id,
        name: departmentForm.name.trim(),
        code: departmentForm.code.trim() || null,
      };

      if (departmentForm.id) {
        await adminService.updateDepartment(departmentForm.id, payload);
        setSuccessMessage('Department updated successfully.');
      } else {
        await adminService.createDepartment(payload);
        setSuccessMessage('Department created successfully.');
      }

      setDepartmentModalOpen(false);
      setDepartmentErrors({});
      setError(null);
      await load();
    } catch (saveError) {
      setSuccessMessage(null);
      setError(getErrorMessage(saveError, 'Failed to save department.'));
    }
  };

  const saveProgram = async () => {
    if (!validateProgram()) {
      setSuccessMessage(null);
      setError('Please correct the highlighted program fields.');
      return;
    }

    try {
      const payload = {
        department_id: programForm.department_id,
        name: programForm.name.trim(),
        code: programForm.code.trim(),
      };

      if (programForm.id) {
        await adminService.updateProgram(programForm.id, payload);
        setSuccessMessage('Program updated successfully.');
      } else {
        await adminService.createProgram(payload);
        setSuccessMessage('Program created successfully.');
      }

      setProgramModalOpen(false);
      setProgramErrors({});
      setError(null);
      await load();
    } catch (saveError) {
      setSuccessMessage(null);
      setError(getErrorMessage(saveError, 'Failed to save program.'));
    }
  };

  const toggleCollegeStatus = async (collegeId: string, nextState: boolean) => {
    try {
      await adminService.updateCollege(collegeId, { is_active: nextState });
      setSuccessMessage(`College ${nextState ? 'enabled' : 'disabled'} successfully.`);
      setError(null);
      await load();
    } catch (saveError) {
      setSuccessMessage(null);
      setError(getErrorMessage(saveError, 'Failed to update college status.'));
    }
  };

  const toggleDepartmentStatus = async (departmentId: string, nextState: boolean) => {
    try {
      await adminService.updateDepartment(departmentId, { is_active: nextState });
      setSuccessMessage(`Department ${nextState ? 'enabled' : 'disabled'} successfully.`);
      setError(null);
      await load();
    } catch (saveError) {
      setSuccessMessage(null);
      setError(getErrorMessage(saveError, 'Failed to update department status.'));
    }
  };

  const toggleProgramStatus = async (programId: string, nextState: boolean) => {
    try {
      await adminService.updateProgram(programId, { is_active: nextState });
      setSuccessMessage(`Course ${nextState ? 'enabled' : 'disabled'} successfully.`);
      setError(null);
      await load();
    } catch (saveError) {
      setSuccessMessage(null);
      setError(getErrorMessage(saveError, 'Failed to update course status.'));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <h1>Academic Management</h1>
          <p>Manage colleges, departments, and courses.</p>
        </div>
      </div>

      <div className="admin-structure-shell">
        {successMessage ? <div className="admin-success admin-structure-toast">{successMessage}</div> : null}
        {error ? <div className="admin-alert admin-structure-toast">{error}</div> : null}

        <section className="admin-panel admin-structure-list-panel">
          <div className="admin-panel-head admin-structure-list-head">
            <div className="admin-structure-title">
              <span className="admin-structure-list-icon"><Building2 size={16} /></span>
              <h3>College List</h3>
            </div>
            <button type="button" className="admin-btn admin-structure-create-btn" onClick={openCreateCollege}>
              <Plus size={15} />
              <span>Create College</span>
            </button>
          </div>

          <div className="admin-structure-toolbar">
            <label className="admin-users-select admin-structure-page-size">
              <select value={collegePageSize} onChange={(event) => setCollegePageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-search">
              <Search size={15} />
              <input value={collegeSearch} onChange={(event) => setCollegeSearch(event.target.value)} placeholder="Search college name..." />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-structure-table">
              <thead>
                <tr>
                  <th>College Name</th>
                  <th>Code</th>
                  <th>Dean / Head</th>
                  <th>Enabled</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedColleges.length ? paginatedColleges.map((college) => (
                  <tr key={college.id}>
                    <td>{college.name}</td>
                    <td>{college.code || 'N/A'}</td>
                    <td>Not assigned</td>
                    <td className="admin-structure-toggle-cell">
                      <button
                        type="button"
                        className={`admin-status-switch ${college.is_active ? 'active' : ''}`}
                        onClick={() => void toggleCollegeStatus(college.id, !college.is_active)}
                        aria-label={`${college.is_active ? 'Disable' : 'Enable'} ${college.name}`}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="admin-structure-action-cell">
                      <button
                        type="button"
                        className="admin-structure-edit-btn"
                        onClick={() => {
                          setCollegeForm({
                            ...emptyCollegeForm,
                            id: college.id,
                            name: college.name,
                            code: college.code ?? '',
                          });
                          setCollegeErrors({});
                          setCollegeModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">No colleges matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination">
            <p>{pageLabel(visibleColleges.length, collegePage, collegePageSize, 'colleges')}</p>
            <div className="admin-users-pagination-controls">
              <button type="button" className="admin-users-page-btn" disabled={collegePage === 1} onClick={() => setCollegePage((page) => Math.max(1, page - 1))}>‹</button>
              <button type="button" className="admin-users-page-btn active">{collegePage}</button>
              <button type="button" className="admin-users-page-btn" disabled={collegePage === collegeTotalPages} onClick={() => setCollegePage((page) => Math.min(collegeTotalPages, page + 1))}>›</button>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-structure-list-panel">
          <div className="admin-panel-head admin-structure-list-head">
            <div className="admin-structure-title">
              <span className="admin-structure-list-icon"><School2 size={16} /></span>
              <h3>Department List</h3>
            </div>
            <button type="button" className="admin-btn admin-structure-create-btn" onClick={openCreateDepartment}>
              <Plus size={15} />
              <span>Create Department</span>
            </button>
          </div>

          <div className="admin-structure-toolbar admin-structure-toolbar-wide">
            <label className="admin-users-select admin-structure-page-size">
              <select value={departmentPageSize} onChange={(event) => setDepartmentPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-search">
              <Search size={15} />
              <input value={departmentSearch} onChange={(event) => setDepartmentSearch(event.target.value)} placeholder="Search department name..." />
            </label>

            <label className="admin-users-select">
              <select value={departmentCollegeFilter} onChange={(event) => setDepartmentCollegeFilter(event.target.value)}>
                <option value="">All Colleges</option>
                {collegeOptions.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-structure-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>College</th>
                  <th>Chairperson</th>
                  <th>Enabled</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.length ? paginatedDepartments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.name}</td>
                    <td>{department.collegeName}</td>
                    <td>{department.chairperson}</td>
                    <td className="admin-structure-toggle-cell">
                      <button
                        type="button"
                        className={`admin-status-switch ${department.is_active ? 'active' : ''}`}
                        onClick={() => void toggleDepartmentStatus(department.id, !department.is_active)}
                        aria-label={`${department.is_active ? 'Disable' : 'Enable'} ${department.name}`}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="admin-structure-action-cell">
                      <button
                        type="button"
                        className="admin-structure-edit-btn"
                        onClick={() => {
                          setDepartmentForm({
                            ...emptyDepartmentForm,
                            id: department.id,
                            college_id: department.collegeId,
                            name: department.name,
                            code: department.code,
                          });
                          setDepartmentErrors({});
                          setDepartmentModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">No departments matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination">
            <p>{pageLabel(visibleDepartments.length, departmentPage, departmentPageSize, 'departments')}</p>
            <div className="admin-users-pagination-controls">
              <button type="button" className="admin-users-page-btn" disabled={departmentPage === 1} onClick={() => setDepartmentPage((page) => Math.max(1, page - 1))}>‹</button>
              <button type="button" className="admin-users-page-btn active">{departmentPage}</button>
              <button type="button" className="admin-users-page-btn" disabled={departmentPage === departmentTotalPages} onClick={() => setDepartmentPage((page) => Math.min(departmentTotalPages, page + 1))}>›</button>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-structure-list-panel">
          <div className="admin-panel-head admin-structure-list-head">
            <div className="admin-structure-title">
              <span className="admin-structure-list-icon"><GraduationCap size={16} /></span>
              <h3>Course List</h3>
            </div>
            <button type="button" className="admin-btn admin-structure-create-btn" onClick={openCreateProgram}>
              <Plus size={15} />
              <span>Create Course</span>
            </button>
          </div>

          <div className="admin-structure-toolbar admin-structure-toolbar-programs">
            <label className="admin-users-select admin-structure-page-size">
              <select value={programPageSize} onChange={(event) => setProgramPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-search">
              <Search size={15} />
              <input value={programSearch} onChange={(event) => setProgramSearch(event.target.value)} placeholder="Search course name..." />
            </label>

            <label className="admin-users-select">
              <select
                value={programCollegeFilter}
                onChange={(event) => {
                  setProgramCollegeFilter(event.target.value);
                  setProgramDepartmentFilter('');
                }}
              >
                <option value="">All Colleges</option>
                {collegeOptions.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-select">
              <select value={programDepartmentFilter} onChange={(event) => setProgramDepartmentFilter(event.target.value)}>
                <option value="">All Departments</option>
                {filteredProgramDepartmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-structure-table admin-structure-program-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Degree Code</th>
                  <th>College</th>
                  <th>Department</th>
                  <th>Enabled</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrograms.length ? paginatedPrograms.map((program) => (
                  <tr key={program.id}>
                    <td>{program.name}</td>
                    <td>{program.code || 'N/A'}</td>
                    <td>{program.collegeName}</td>
                    <td>{program.departmentName}</td>
                    <td className="admin-structure-toggle-cell">
                      <button
                        type="button"
                        className={`admin-status-switch ${program.is_active ? 'active' : ''}`}
                        onClick={() => void toggleProgramStatus(program.id, !program.is_active)}
                        aria-label={`${program.is_active ? 'Disable' : 'Enable'} ${program.name}`}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="admin-structure-action-cell">
                      <button
                        type="button"
                        className="admin-structure-edit-btn"
                        onClick={() => {
                          setProgramForm({
                            ...emptyProgramForm,
                            id: program.id,
                            college_id: program.collegeId,
                            department_id: program.departmentId,
                            name: program.name,
                            code: program.code,
                          });
                          setProgramErrors({});
                          setProgramModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">No courses matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination">
            <p>{pageLabel(visiblePrograms.length, programPage, programPageSize, 'courses')}</p>
            <div className="admin-users-pagination-controls">
              <button type="button" className="admin-users-page-btn" disabled={programPage === 1} onClick={() => setProgramPage((page) => Math.max(1, page - 1))}>‹</button>
              <button type="button" className="admin-users-page-btn active">{programPage}</button>
              <button type="button" className="admin-users-page-btn" disabled={programPage === programTotalPages} onClick={() => setProgramPage((page) => Math.min(programTotalPages, page + 1))}>›</button>
            </div>
          </div>
        </section>
      </div>

      {collegeModalOpen ? (
        <div className="admin-modal-backdrop" onClick={() => setCollegeModalOpen(false)}>
          <div className="admin-modal-card admin-structure-modal admin-structure-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-head">
              <div>
                <h3>{collegeForm.id ? 'Edit College' : 'Create College'}</h3>
                <p>{collegeForm.id ? 'Update college details and leadership information.' : 'Add a new college to the academic structure.'}</p>
              </div>
              <button type="button" className="admin-view-all" onClick={() => setCollegeModalOpen(false)}>Close</button>
            </div>
            <div className="admin-structure-modal-grid">
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>College Name <em>*</em></span>
                <input
                  className={collegeErrors.name ? 'admin-field-invalid' : ''}
                  value={collegeForm.name}
                  placeholder="Enter college name"
                  onChange={(event) => setCollegeForm((current) => ({ ...current, name: event.target.value }))}
                />
                {collegeErrors.name ? <small className="admin-field-error">{collegeErrors.name}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>College Code <em>*</em></span>
                <input
                  className={collegeErrors.code ? 'admin-field-invalid' : ''}
                  value={collegeForm.code}
                  placeholder="Enter college code (e.g., COS)"
                  onChange={(event) => setCollegeForm((current) => ({ ...current, code: event.target.value }))}
                />
                {collegeErrors.code ? <small className="admin-field-error">{collegeErrors.code}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Dean / Head <em>*</em></span>
                <input
                  className={collegeErrors.dean_head ? 'admin-field-invalid' : ''}
                  value={collegeForm.dean_head}
                  placeholder="Enter dean or head name"
                  onChange={(event) => setCollegeForm((current) => ({ ...current, dean_head: event.target.value }))}
                />
                {collegeErrors.dean_head ? <small className="admin-field-error">{collegeErrors.dean_head}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Dean / Head Email</span>
                <input
                  className={collegeErrors.dean_head_email ? 'admin-field-invalid' : ''}
                  value={collegeForm.dean_head_email}
                  placeholder="Enter dean or head email address"
                  onChange={(event) => setCollegeForm((current) => ({ ...current, dean_head_email: event.target.value }))}
                />
                {collegeErrors.dean_head_email ? <small className="admin-field-error">{collegeErrors.dean_head_email}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span admin-structure-textarea-field">
                <span>Description</span>
                <textarea
                  className={collegeErrors.description ? 'admin-field-invalid' : ''}
                  value={collegeForm.description}
                  maxLength={500}
                  placeholder="Enter a short description about the college..."
                  onChange={(event) => setCollegeForm((current) => ({ ...current, description: event.target.value }))}
                />
                <small className="admin-structure-char-count">{collegeForm.description.length} / 500</small>
                {collegeErrors.description ? <small className="admin-field-error">{collegeErrors.description}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Office Location</span>
                <input
                  value={collegeForm.office_location}
                  placeholder="Enter office location"
                  onChange={(event) => setCollegeForm((current) => ({ ...current, office_location: event.target.value }))}
                />
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Contact Number</span>
                <input
                  value={collegeForm.contact_number}
                  placeholder="Enter contact number"
                  onChange={(event) => setCollegeForm((current) => ({ ...current, contact_number: event.target.value }))}
                />
              </label>
            </div>
            <div className="admin-actions admin-structure-modal-actions">
              <button type="button" className="admin-btn" onClick={() => setCollegeModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => void saveCollege()}>{collegeForm.id ? 'Save Changes' : 'Create College'}</button>
            </div>
          </div>
        </div>
      ) : null}

      {departmentModalOpen ? (
        <div className="admin-modal-backdrop" onClick={() => setDepartmentModalOpen(false)}>
          <div className="admin-modal-card admin-structure-modal admin-structure-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-head">
              <div>
                <h3>{departmentForm.id ? 'Edit Department' : 'Create Department'}</h3>
                <p>{departmentForm.id ? 'Update department details and assignment.' : 'Add a new department under a college.'}</p>
              </div>
              <button type="button" className="admin-view-all" onClick={() => setDepartmentModalOpen(false)}>Close</button>
            </div>
            <div className="admin-structure-modal-grid">
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Department Name <em>*</em></span>
                <input
                  className={departmentErrors.name ? 'admin-field-invalid' : ''}
                  value={departmentForm.name}
                  placeholder="Enter department name"
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                />
                {departmentErrors.name ? <small className="admin-field-error">{departmentErrors.name}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Department Code</span>
                <input
                  value={departmentForm.code}
                  placeholder="Enter department code (e.g., CSD)"
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, code: event.target.value }))}
                />
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Select College <em>*</em></span>
                <select
                  className={departmentErrors.college_id ? 'admin-field-invalid' : ''}
                  value={departmentForm.college_id}
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, college_id: event.target.value }))}
                >
                  <option value="">Select a college</option>
                  {collegeOptions.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                </select>
                {departmentErrors.college_id ? <small className="admin-field-error">{departmentErrors.college_id}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Chairperson <em>*</em></span>
                <input
                  className={departmentErrors.chairperson ? 'admin-field-invalid' : ''}
                  value={departmentForm.chairperson}
                  placeholder="Enter chairperson name"
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, chairperson: event.target.value }))}
                />
                {departmentErrors.chairperson ? <small className="admin-field-error">{departmentErrors.chairperson}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Chairperson Email</span>
                <input
                  className={departmentErrors.chairperson_email ? 'admin-field-invalid' : ''}
                  value={departmentForm.chairperson_email}
                  placeholder="Enter chairperson email address"
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, chairperson_email: event.target.value }))}
                />
                {departmentErrors.chairperson_email ? <small className="admin-field-error">{departmentErrors.chairperson_email}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span admin-structure-textarea-field">
                <span>Description</span>
                <textarea
                  className={departmentErrors.description ? 'admin-field-invalid' : ''}
                  value={departmentForm.description}
                  maxLength={500}
                  placeholder="Enter a short description about the department..."
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))}
                />
                <small className="admin-structure-char-count">{departmentForm.description.length} / 500</small>
                {departmentErrors.description ? <small className="admin-field-error">{departmentErrors.description}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Office Location</span>
                <input
                  value={departmentForm.office_location}
                  placeholder="Enter office location"
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, office_location: event.target.value }))}
                />
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Contact Number</span>
                <input
                  value={departmentForm.contact_number}
                  placeholder="Enter contact number"
                  onChange={(event) => setDepartmentForm((current) => ({ ...current, contact_number: event.target.value }))}
                />
              </label>
            </div>
            <div className="admin-actions admin-structure-modal-actions">
              <button type="button" className="admin-btn" onClick={() => setDepartmentModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => void saveDepartment()}>{departmentForm.id ? 'Save Changes' : 'Create Department'}</button>
            </div>
          </div>
        </div>
      ) : null}

      {programModalOpen ? (
        <div className="admin-modal-backdrop" onClick={() => setProgramModalOpen(false)}>
          <div className="admin-modal-card admin-structure-modal admin-structure-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-head">
              <div>
                <h3>{programForm.id ? 'Edit Course' : 'Create Course'}</h3>
                <p>{programForm.id ? 'Update course details and academic assignment.' : 'Add a new course to the academic structure.'}</p>
              </div>
              <button type="button" className="admin-view-all" onClick={() => setProgramModalOpen(false)}>Close</button>
            </div>
            <div className="admin-structure-modal-grid">
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Course Name <em>*</em></span>
                <input
                  className={programErrors.name ? 'admin-field-invalid' : ''}
                  value={programForm.name}
                  placeholder="Enter course name"
                  onChange={(event) => setProgramForm((current) => ({ ...current, name: event.target.value }))}
                />
                {programErrors.name ? <small className="admin-field-error">{programErrors.name}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Degree Code <em>*</em></span>
                <input
                  className={programErrors.code ? 'admin-field-invalid' : ''}
                  value={programForm.code}
                  placeholder="Enter degree code (e.g., BSCS)"
                  onChange={(event) => setProgramForm((current) => ({ ...current, code: event.target.value }))}
                />
                {programErrors.code ? <small className="admin-field-error">{programErrors.code}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Select College <em>*</em></span>
                <select
                  className={programErrors.college_id ? 'admin-field-invalid' : ''}
                  value={programForm.college_id}
                  onChange={(event) => setProgramForm((current) => ({
                    ...current,
                    college_id: event.target.value,
                    department_id: '',
                  }))}
                >
                  <option value="">Select college</option>
                  {collegeOptions.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                </select>
                {programErrors.college_id ? <small className="admin-field-error">{programErrors.college_id}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Select Department <em>*</em></span>
                <select
                  className={programErrors.department_id ? 'admin-field-invalid' : ''}
                  value={programForm.department_id}
                  onChange={(event) => setProgramForm((current) => ({ ...current, department_id: event.target.value }))}
                >
                  <option value="">Select department</option>
                  {programDepartmentOptions.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                {programErrors.department_id ? <small className="admin-field-error">{programErrors.department_id}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Course Chair / Coordinator</span>
                <input
                  value={programForm.coordinator}
                  placeholder="Enter course chair or coordinator name"
                  onChange={(event) => setProgramForm((current) => ({ ...current, coordinator: event.target.value }))}
                />
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Contact Email</span>
                <input
                  className={programErrors.contact_email ? 'admin-field-invalid' : ''}
                  value={programForm.contact_email}
                  placeholder="Enter contact email address"
                  onChange={(event) => setProgramForm((current) => ({ ...current, contact_email: event.target.value }))}
                />
                {programErrors.contact_email ? <small className="admin-field-error">{programErrors.contact_email}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span admin-structure-textarea-field">
                <span>Description</span>
                <textarea
                  className={programErrors.description ? 'admin-field-invalid' : ''}
                  value={programForm.description}
                  maxLength={500}
                  placeholder="Enter a short description about the course..."
                  onChange={(event) => setProgramForm((current) => ({ ...current, description: event.target.value }))}
                />
                <small className="admin-structure-char-count">{programForm.description.length} / 500</small>
                {programErrors.description ? <small className="admin-field-error">{programErrors.description}</small> : null}
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Curriculum Type</span>
                <select
                  value={programForm.curriculum_type}
                  onChange={(event) => setProgramForm((current) => ({ ...current, curriculum_type: event.target.value }))}
                >
                  <option value="">Select curriculum type</option>
                  <option value="semester">Semester</option>
                  <option value="trimester">Trimester</option>
                  <option value="quarter">Quarter</option>
                </select>
              </label>
              <label className="admin-field admin-modal-field admin-structure-field-span">
                <span>Year Level / Duration</span>
                <input
                  value={programForm.year_duration}
                  placeholder="Enter year level or duration (e.g., 4 years)"
                  onChange={(event) => setProgramForm((current) => ({ ...current, year_duration: event.target.value }))}
                />
              </label>
            </div>
            <div className="admin-actions admin-structure-modal-actions">
              <button type="button" className="admin-btn" onClick={() => setProgramModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => void saveProgram()}>{programForm.id ? 'Save Changes' : 'Create Course'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
