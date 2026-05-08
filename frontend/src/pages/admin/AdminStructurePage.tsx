import { useEffect, useState } from 'react';
import { adminService, type AdminStructureCollege } from '../../services/adminService';

export default function AdminStructurePage() {
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [collegeForm, setCollegeForm] = useState({ name: '', code: '' });
  const [departmentForm, setDepartmentForm] = useState({ college_id: '', name: '', code: '' });
  const [programForm, setProgramForm] = useState({ department_id: '', name: '', code: '' });
  const [sectionForm, setSectionForm] = useState({ program_id: '', name: '', code: '' });

  const load = () => adminService.listStructure().then(setStructure);

  useEffect(() => {
    void load().catch(() => setError('Failed to load academic structure.'));
  }, []);

  const departmentOptions = structure.flatMap((college) => college.departments);
  const programOptions = departmentOptions.flatMap((department) => department.programs);

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <span className="admin-kicker">Academic Structure</span>
          <h1>Structure Management</h1>
          <p>Maintain the institution hierarchy for colleges, departments, programs, and sections so user assignments stay consistent across the archive.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-panel">
        <div className="admin-panel-head"><h3>Add Academic Structure</h3></div>
        <div className="admin-structure-forms">
          <div className="admin-subpanel">
            <h4>College</h4>
            <input placeholder="College name" value={collegeForm.name} onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })} />
            <input placeholder="Code" value={collegeForm.code} onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })} />
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => void adminService.createCollege(collegeForm).then(load)}>Add College</button>
          </div>
          <div className="admin-subpanel">
            <h4>Department</h4>
            <select value={departmentForm.college_id} onChange={(e) => setDepartmentForm({ ...departmentForm, college_id: e.target.value })}>
              <option value="">Select college</option>
              {structure.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
            </select>
            <input placeholder="Department name" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} />
            <input placeholder="Code" value={departmentForm.code} onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })} />
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => void adminService.createDepartment(departmentForm).then(load)}>Add Department</button>
          </div>
          <div className="admin-subpanel">
            <h4>Program</h4>
            <select value={programForm.department_id} onChange={(e) => setProgramForm({ ...programForm, department_id: e.target.value })}>
              <option value="">Select department</option>
              {departmentOptions.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <input placeholder="Program name" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} />
            <input placeholder="Code" value={programForm.code} onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })} />
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => void adminService.createProgram(programForm).then(load)}>Add Program</button>
          </div>
          <div className="admin-subpanel">
            <h4>Section</h4>
            <select value={sectionForm.program_id} onChange={(e) => setSectionForm({ ...sectionForm, program_id: e.target.value })}>
              <option value="">Select program</option>
              {programOptions.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
            <input placeholder="Section name" value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} />
            <input placeholder="Code" value={sectionForm.code} onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value })} />
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => void adminService.createSection(sectionForm).then(load)}>Add Section</button>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head"><h3>Structure Overview</h3></div>
        <div className="admin-structure-tree">
          {structure.map((college) => (
            <article key={college.id} className="admin-tree-card">
              <h4>{college.name}</h4>
              <p>{college.code || 'No code assigned'}</p>
              {college.departments.map((department) => (
                <div key={department.id} className="admin-tree-node">
                  <strong>{department.name}</strong>
                  {department.programs.map((program) => (
                    <div key={program.id} className="admin-tree-leaf">
                      <span>{program.name}</span>
                      <small>{program.sections.map((section) => section.name).join(', ') || 'No sections yet'}</small>
                    </div>
                  ))}
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
