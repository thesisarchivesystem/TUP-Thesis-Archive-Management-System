import { useEffect, useRef, useState } from 'react';
import { BookOpenText, ClipboardList, FileText, FolderOpen, GraduationCap, Layers3, LibraryBig, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { facultyAdviseesService } from '../../services/facultyAdviseesService';
import { facultyLibraryService } from '../../services/facultyLibraryService';
import { facultyThesisService } from '../../services/facultyThesisService';
import type { StudentAdviserOption } from '../../services/thesisService';

const checklistItems = ['Signed Endorsement', 'Plagiarism Report', 'Final Manuscript', 'Title Page', 'Appendices'];

type UploadFieldErrors = Partial<Record<
  'title' | 'program' | 'department' | 'schoolYear' | 'categoryId' | 'authors' | 'adviserId' | 'abstract' | 'manuscript' | 'confirmations',
  string
>>;

const MAX_CATEGORY_SELECTIONS = 5;
const COMPUTER_STUDIES_PROGRAMS = ['BSCS', 'BSIT', 'BSIS'];

const normalizeProgramLabel = (program?: string | null) => {
  const normalized = (program ?? '').trim().toUpperCase();

  if (!normalized) return '';
  if (normalized === 'BSCS' || normalized.includes('COMPUTER SCIENCE')) return 'BSCS';
  if (normalized === 'BSIT' || normalized.includes('INFORMATION TECHNOLOGY')) return 'BSIT';
  if (normalized === 'BSIS' || normalized.includes('INFORMATION SYSTEM')) return 'BSIS';

  return program ?? '';
};

const initialForm = {
  title: '',
  college: '',
  department: '',
  program: '',
  schoolYear: String(new Date().getFullYear()),
  categoryIds: [] as string[],
  authors: [] as string[],
  adviserId: '',
  abstract: '',
  confirmOriginal: false,
  allowReview: false,
};

export default function FacultyAddThesisPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [advisers, setAdvisers] = useState<StudentAdviserOption[]>([]);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const [departmentsByCollege, setDepartmentsByCollege] = useState<Record<string, string[]>>({});
  const [programOptions, setProgramOptions] = useState<string[]>([]);
  const [schoolYearOptions, setSchoolYearOptions] = useState<string[]>([]);
  const [form, setForm] = useState(initialForm);
  const [authorInput, setAuthorInput] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAdvisers, setLoadingAdvisers] = useState(true);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<UploadFieldErrors>({});
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [supplementaryFiles, setSupplementaryFiles] = useState<File[]>([]);
  const [adviserSearch, setAdviserSearch] = useState('');
  const manuscriptInputRef = useRef<HTMLInputElement | null>(null);
  const supplementaryInputRef = useRef<HTMLInputElement | null>(null);
  const availableDepartments = departmentsByCollege[form.college] ?? [];
  const selectedAdviser = advisers.find((adviser) => adviser.id === form.adviserId) ?? null;
  const filteredAdvisers = advisers.filter((adviser) => {
    const query = adviserSearch.trim().toLowerCase();
    if (!query) return true;

    return [
      adviser.name,
      adviser.email,
      adviser.faculty_role,
      adviser.department,
    ].join(' ').toLowerCase().includes(query);
  });

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      facultyLibraryService.getLibrary(),
      facultyAdviseesService.getAdvisees(),
    ])
      .then(([libraryResponse, adviseesResponse]) => {
        if (!isMounted) return;

        const libraryPrograms = libraryResponse.items
          .map((item) => normalizeProgramLabel(item.program))
          .filter(Boolean) as string[];
        const adviseePrograms = adviseesResponse.advisees
          .map((item) => normalizeProgramLabel(item.program))
          .filter(Boolean);
        const yearsFromLibrary = libraryResponse.items.map((item) => item.school_year).filter(Boolean) as string[];
        const fallbackYear = String(new Date().getFullYear());
        const isComputerStudiesDepartment = (libraryResponse.department ?? '').trim().toLowerCase() === 'computer studies department';
        const preferredPrograms = isComputerStudiesDepartment ? COMPUTER_STUDIES_PROGRAMS : [];

        setAvailableColleges(libraryResponse.share_options?.colleges ?? []);
        setDepartmentsByCollege(libraryResponse.share_options?.departments_by_college ?? {});
        setProgramOptions(Array.from(new Set([...preferredPrograms, ...adviseePrograms, ...libraryPrograms])).sort());
        setSchoolYearOptions(Array.from(new Set([fallbackYear, ...yearsFromLibrary])).sort().reverse());
        setForm((current) => ({
          ...current,
          college: current.college || libraryResponse.college || '',
          department: current.department || libraryResponse.department || '',
          program: current.program || preferredPrograms[0] || adviseePrograms[0] || libraryPrograms[0] || '',
          schoolYear: current.schoolYear || fallbackYear,
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setSchoolYearOptions([String(new Date().getFullYear())]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void categoryService.list()
      .then((records) => {
        if (!isMounted) return;
        setCategories(records);
        setForm((current) => ({
          ...current,
          categoryIds: current.categoryIds.length ? current.categoryIds : (records[0]?.id ? [records[0].id] : []),
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load thesis categories right now.');
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void facultyThesisService.advisers()
      .then((records) => {
        if (!isMounted) return;
        setAdvisers(records);
        setForm((current) => ({
          ...current,
          adviserId: current.adviserId || records[0]?.id || '',
        }));
        setAdviserSearch((current) => current || records[0]?.name || '');
      })
      .catch(() => {
        if (!isMounted) return;
        setError((current) => current || 'Unable to load adviser options right now.');
      })
      .finally(() => {
        if (isMounted) setLoadingAdvisers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setForm({
      ...initialForm,
      college: availableColleges[0] ?? '',
      department: departmentsByCollege[availableColleges[0] ?? '']?.[0] ?? '',
      program: programOptions[0] ?? '',
      schoolYear: schoolYearOptions[0] ?? String(new Date().getFullYear()),
      categoryIds: categories[0]?.id ? [categories[0].id] : [],
      adviserId: advisers[0]?.id ?? '',
    });
    setAdviserSearch(advisers[0]?.name ?? '');
    setAuthorInput('');
    setManuscriptFile(null);
    setSupplementaryFiles([]);
    if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
    if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
  };

  const addAuthor = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;

    setForm((current) => {
      if (current.authors.includes(normalized)) {
        return current;
      }

      return { ...current, authors: [...current.authors, normalized] };
    });
    setAuthorInput('');
  };

  const removeAuthor = (authorToRemove: string) => {
    setForm((current) => ({
      ...current,
      authors: current.authors.filter((author) => author !== authorToRemove),
    }));
  };

  const validateSubmit = (mode: 'draft' | 'submit') => {
    const nextErrors: UploadFieldErrors = {};

    if (!form.title.trim()) nextErrors.title = 'Please enter the thesis title.';
    if (!form.college.trim()) nextErrors.department = 'Please select the college.';
    if (!form.program.trim()) nextErrors.program = 'Please enter the program.';
    if (!form.department.trim()) nextErrors.department = 'Please enter the department.';
    if (!form.schoolYear.trim()) nextErrors.schoolYear = 'Please enter the school year.';
    if (!form.categoryIds.length) nextErrors.categoryId = 'Please select at least one category.';
    if (form.categoryIds.length > MAX_CATEGORY_SELECTIONS) nextErrors.categoryId = `You can select up to ${MAX_CATEGORY_SELECTIONS} categories only.`;

    if (mode === 'submit') {
      if (!form.authors.length) nextErrors.authors = 'Please list at least one author.';
      if (!form.adviserId.trim()) nextErrors.adviserId = 'Please select a thesis adviser.';
      if (!form.abstract.trim()) nextErrors.abstract = 'Please enter the thesis abstract.';
      if (!manuscriptFile) nextErrors.manuscript = 'Please attach the thesis PDF before submitting.';
      if (!form.confirmOriginal || !form.allowReview) nextErrors.confirmations = 'Please complete the submission confirmations before submitting the thesis.';
    }

    return nextErrors;
  };

  const handleSave = async (mode: 'draft' | 'submit') => {
    setSubmitting(mode);
    setError('');
    setSuccess('');
    setFieldErrors({});

    const validationErrors = validateSubmit(mode);
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setError(mode === 'submit' ? 'Please complete the required fields before submitting.' : 'Please complete the required fields before saving.');
      setSubmitting(null);
      return;
    }

    try {
      await facultyThesisService.create({
        title: form.title,
        abstract: form.abstract,
        department: form.department,
        program: form.program,
        category_id: form.categoryIds[0] ?? '',
        category_ids: form.categoryIds,
        school_year: form.schoolYear,
        authors: form.authors.join(', '),
        adviser_id: form.adviserId,
        submission_mode: mode,
        confirm_original: form.confirmOriginal,
        allow_review: form.allowReview,
        manuscript: manuscriptFile,
        supplementary_files: supplementaryFiles,
      });

      setSuccess(mode === 'submit' ? 'Thesis submitted and stored in the database.' : 'Thesis draft stored in the database.');
      resetForm();
    } catch (err: any) {
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.error ?? err.response?.data?.message ?? 'Unable to save the thesis entry.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleChange = (field: 'title' | 'college' | 'program' | 'department' | 'schoolYear' | 'adviserId' | 'abstract') => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setForm((current) => {
      if (field === 'college') {
        const nextCollege = event.target.value;
        const nextDepartments = departmentsByCollege[nextCollege] ?? [];
        return {
          ...current,
          college: nextCollege,
          department: nextDepartments.includes(current.department) ? current.department : (nextDepartments[0] ?? ''),
        };
      }

      return { ...current, [field]: event.target.value };
    });
  };

  const toggleCategory = (categoryId: string) => {
    setFieldErrors((current) => ({ ...current, categoryId: undefined }));
    setError((current) => (current.startsWith('You can select up to') ? '' : current));

    setForm((current) => {
      if (current.categoryIds.includes(categoryId)) {
        return { ...current, categoryIds: current.categoryIds.filter((id) => id !== categoryId) };
      }

      if (current.categoryIds.length >= MAX_CATEGORY_SELECTIONS) {
        setError(`You can select up to ${MAX_CATEGORY_SELECTIONS} categories only.`);
        return current;
      }

      return { ...current, categoryIds: [...current.categoryIds, categoryId] };
    });
  };

  return (
    <FacultyLayout
      title="Add Thesis"
      description="Submit a thesis entry with complete metadata, abstract, and required documents for review."
    >
      {error ? <div className="vpaa-banner-error">{error}</div> : null}
      {success ? <div className="vpaa-banner-success">{success}</div> : null}

      <div className="student-upload-shell">
        <section className="student-upload-main vpaa-card">
          <div className="student-upload-section-copy">
            <h2><BookOpenText size={22} /> Thesis Details</h2>
            <p>Provide accurate information so the thesis is discoverable and publication-ready in the archive.</p>
          </div>

          <form className="student-upload-form" onSubmit={(event) => event.preventDefault()}>
            <input ref={manuscriptInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(event) => setManuscriptFile(event.target.files?.[0] ?? null)} />
            <input ref={supplementaryInputRef} type="file" multiple hidden onChange={(event) => setSupplementaryFiles(Array.from(event.target.files ?? []))} />

            <label className={`student-upload-field full${fieldErrors.title ? ' has-error' : ''}`}>
              <span><BookOpenText size={14} /> Thesis Title</span>
              <input value={form.title} onChange={handleChange('title')} placeholder="Enter full thesis title" aria-invalid={Boolean(fieldErrors.title)} />
              {fieldErrors.title ? <small className="student-upload-field-error">{fieldErrors.title}</small> : null}
            </label>

            <div className="student-upload-grid">
              <label className={`student-upload-field${fieldErrors.department ? ' has-error' : ''}`}>
                <span><LibraryBig size={14} /> College</span>
                <select value={form.college} onChange={handleChange('college')} aria-invalid={Boolean(fieldErrors.department)}>
                  <option value="">Select a college</option>
                  {availableColleges.map((college) => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
                {fieldErrors.department ? <small className="student-upload-field-error">{fieldErrors.department}</small> : null}
              </label>

              <label className={`student-upload-field${fieldErrors.department ? ' has-error' : ''}`}>
                <span><LibraryBig size={14} /> Department</span>
                <select value={form.department} onChange={handleChange('department')} aria-invalid={Boolean(fieldErrors.department)}>
                  <option value="">Select a department</option>
                  {availableDepartments.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
                {fieldErrors.department ? <small className="student-upload-field-error">{fieldErrors.department}</small> : null}
              </label>

              <label className={`student-upload-field${fieldErrors.program ? ' has-error' : ''}`}>
                <span><GraduationCap size={14} /> Program</span>
                <select value={form.program} onChange={handleChange('program')} aria-invalid={Boolean(fieldErrors.program)}>
                  <option value="">Select a program</option>
                  {programOptions.map((program) => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
                {fieldErrors.program ? <small className="student-upload-field-error">{fieldErrors.program}</small> : null}
              </label>

              <label className={`student-upload-field${fieldErrors.schoolYear ? ' has-error' : ''}`}>
                <span><ClipboardList size={14} /> Year</span>
                <select value={form.schoolYear} onChange={handleChange('schoolYear')} aria-invalid={Boolean(fieldErrors.schoolYear)}>
                  <option value="">Select year</option>
                  {schoolYearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {fieldErrors.schoolYear ? <small className="student-upload-field-error">{fieldErrors.schoolYear}</small> : null}
              </label>

              <div className={`student-upload-field full${fieldErrors.categoryId ? ' has-error' : ''}`}>
                <span><Layers3 size={14} /> Category</span>
                <details className="student-upload-multi-dropdown">
                  <summary className="student-upload-multi-dropdown-trigger" aria-invalid={Boolean(fieldErrors.categoryId)}>
                    <span className="student-upload-multi-dropdown-value">
                      {form.categoryIds.length
                        ? categories
                            .filter((category) => form.categoryIds.includes(category.id))
                            .map((category) => category.name)
                            .join(', ')
                        : 'Select categories'}
                    </span>
                    <span className="student-upload-multi-dropdown-meta">{form.categoryIds.length}/{MAX_CATEGORY_SELECTIONS}</span>
                  </summary>
                  <div className="student-upload-multi-dropdown-menu">
                    {categories.map((category) => (
                      <label key={category.id} className={`student-upload-option-chip${form.categoryIds.includes(category.id) ? ' active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          disabled={loadingCategories || !categories.length}
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </details>
                {fieldErrors.categoryId ? <small className="student-upload-field-error">{fieldErrors.categoryId}</small> : <small>Select up to 5 categories.</small>}
              </div>
            </div>

            <label className={`student-upload-field full${fieldErrors.authors ? ' has-error' : ''}`}>
              <span><UserRound size={14} /> Authors</span>
              <div className="student-upload-author-box">
                <div className="student-upload-author-tags">
                  {form.authors.map((author) => (
                    <span className="student-upload-author-chip" key={author}>
                      {author}
                      <button type="button" onClick={() => removeAuthor(author)} aria-label={`Remove ${author}`}>
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={authorInput}
                  onChange={(event) => setAuthorInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addAuthor(authorInput);
                    }
                  }}
                  onBlur={() => addAuthor(authorInput)}
                  placeholder="Type an author name, then press Enter"
                />
              </div>
              {fieldErrors.authors ? <small className="student-upload-field-error">{fieldErrors.authors}</small> : <small>Press Enter after each author name to add another one.</small>}
            </label>

            <label className={`student-upload-field full${fieldErrors.adviserId ? ' has-error' : ''}`}>
              <span><UserRound size={14} /> Thesis Adviser</span>
              <div className="student-upload-searchbox">
                <input
                  value={adviserSearch}
                  onChange={(event) => {
                    setAdviserSearch(event.target.value);
                    setFieldErrors((current) => ({ ...current, adviserId: undefined }));
                    if (form.adviserId) {
                      setForm((current) => ({ ...current, adviserId: '' }));
                    }
                  }}
                  placeholder="Search adviser by name, email, or role"
                  aria-invalid={Boolean(fieldErrors.adviserId)}
                  disabled={loadingAdvisers || !advisers.length}
                />
                <div className="student-upload-search-results">
                  {filteredAdvisers.map((adviser) => (
                    <button
                      key={adviser.id}
                      type="button"
                      className={`student-upload-search-option${form.adviserId === adviser.id ? ' active' : ''}`}
                      onClick={() => {
                        setForm((current) => ({ ...current, adviserId: adviser.id }));
                        setAdviserSearch(adviser.name);
                        setFieldErrors((current) => ({ ...current, adviserId: undefined }));
                      }}
                    >
                      <strong>{adviser.name}</strong>
                      <span>{adviser.email} - {adviser.faculty_role}</span>
                    </button>
                  ))}
                  {!filteredAdvisers.length ? <div className="student-upload-search-empty">No adviser found.</div> : null}
                </div>
              </div>
              {fieldErrors.adviserId ? <small className="student-upload-field-error">{fieldErrors.adviserId}</small> : <small>
                {selectedAdviser
                  ? `${selectedAdviser.email} - ${selectedAdviser.faculty_role}`
                  : 'Choose from active faculty profiles in the database.'}
              </small>}
            </label>

            <label className={`student-upload-field full${fieldErrors.abstract ? ' has-error' : ''}`}>
              <span><FileText size={14} /> Abstract</span>
              <textarea value={form.abstract} onChange={handleChange('abstract')} placeholder="Paste your abstract here" rows={6} aria-invalid={Boolean(fieldErrors.abstract)} />
              {fieldErrors.abstract ? <small className="student-upload-field-error">{fieldErrors.abstract}</small> : null}
            </label>

            <div className={`student-upload-field full${fieldErrors.manuscript ? ' has-error' : ''}`}>
              <span><FolderOpen size={14} /> Upload Files</span>

              <div className="student-upload-file-row">
                <div className="student-upload-file-label">{manuscriptFile?.name || 'No file chosen'}</div>
                <div className="student-upload-file-actions">
                  <label className="student-upload-file-btn">
                    <input type="file" accept=".pdf,application/pdf" hidden onChange={(event) => setManuscriptFile(event.target.files?.[0] ?? null)} />
                    Select PDF
                  </label>
                  {manuscriptFile ? (
                    <button type="button" className="student-upload-file-remove" onClick={() => {
                      setManuscriptFile(null);
                      if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
                    }} aria-label="Remove selected PDF">
                      x
                    </button>
                  ) : null}
                </div>
              </div>
              {fieldErrors.manuscript ? <small className="student-upload-field-error">{fieldErrors.manuscript}</small> : null}

              <div className="student-upload-file-row">
                <div className="student-upload-file-label">
                  {supplementaryFiles.length ? supplementaryFiles.map((file) => file.name).join(', ') : 'No files chosen'}
                </div>
                <div className="student-upload-file-actions">
                  <label className="student-upload-file-btn">
                    <input type="file" multiple hidden onChange={(event) => setSupplementaryFiles(Array.from(event.target.files ?? []))} />
                    Supplementary Files
                  </label>
                  {supplementaryFiles.length ? (
                    <button type="button" className="student-upload-file-remove" onClick={() => {
                      setSupplementaryFiles([]);
                      if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
                    }} aria-label="Remove supplementary files">
                      x
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <label className={`student-upload-check${fieldErrors.confirmations ? ' has-error' : ''}`}>
              <input type="checkbox" checked={form.confirmOriginal} onChange={(event) => {
                setFieldErrors((current) => ({ ...current, confirmations: undefined }));
                setForm((current) => ({ ...current, confirmOriginal: event.target.checked }));
              }} />
              <span>I confirm that this submission is original, properly cited, and approved for upload to the thesis archive. <strong className="student-upload-required">*</strong></span>
            </label>

            <label className={`student-upload-check${fieldErrors.confirmations ? ' has-error' : ''}`}>
              <input type="checkbox" checked={form.allowReview} onChange={(event) => {
                setFieldErrors((current) => ({ ...current, confirmations: undefined }));
                setForm((current) => ({ ...current, allowReview: event.target.checked }));
              }} />
              <span>I agree to share the thesis for academic purposes and allow the archive committee to review the content. <strong className="student-upload-required">*</strong></span>
            </label>
            {fieldErrors.confirmations ? <small className="student-upload-field-error">{fieldErrors.confirmations}</small> : null}

            <div className="student-upload-actions">
              <button type="button" className="student-upload-secondary" onClick={() => void handleSave('draft')} disabled={submitting !== null}>
                {submitting === 'draft' ? 'Saving...' : 'Save Draft'}
              </button>
              <button type="button" className="student-upload-primary" onClick={() => void handleSave('submit')} disabled={submitting !== null}>
                {submitting === 'submit' ? 'Submitting...' : 'Submit Thesis'}
              </button>
            </div>
          </form>
        </section>

        <aside className="student-upload-side vpaa-card thesis-details-side-card submission-accent-panel">
          <div className="student-upload-section-copy thesis-details-side-head">
            <div>
              <h2>Submission Checklist</h2>
              <p>Ensure these items are ready before submitting.</p>
            </div>
            <div className="thesis-details-side-graphic" aria-hidden="true">
              <Sparkles size={12} className="thesis-details-side-spark thesis-details-side-spark-left" />
              <Sparkles size={10} className="thesis-details-side-spark thesis-details-side-spark-right" />
              <div className="thesis-details-side-cloud">
                <div className="thesis-details-side-graphic-book">
                  <ClipboardList size={24} />
                </div>
                <div className="thesis-details-side-shield">
                  <ShieldCheck size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="student-upload-chip-row">
            {checklistItems.map((item) => (
              <span key={item} className="student-upload-chip">{item}</span>
            ))}
          </div>

          <div className="student-upload-status">
            <h3>Upload Status</h3>
            <ul>
              <li className="is-complete">Metadata and adviser details</li>
              <li>Files added (PDF, supplementary)</li>
              <li>Faculty publication confirmation</li>
            </ul>
          </div>

          <div className="student-upload-note">
            Faculty-added theses are automatically approved and published to the archive. No additional review is required.
          </div>

          <div className="student-upload-note">
            Need help? Visit the Support page or coordinate with the archive office for publication guidelines.
          </div>
        </aside>
      </div>
    </FacultyLayout>
  );
}
