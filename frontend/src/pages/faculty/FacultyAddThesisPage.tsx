import { useEffect, useRef, useState } from 'react';
import { BookOpenText, ClipboardList, FileText, FolderOpen, GraduationCap, Layers3, LibraryBig, ShieldCheck, Sparkles, Tags, UserRound } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { facultyThesisService } from '../../services/facultyThesisService';
import type { StudentAdviserOption } from '../../services/thesisService';

const checklistItems = ['Signed Endorsement', 'Plagiarism Report', 'Final Manuscript', 'Title Page', 'Appendices'];

type UploadFieldErrors = Partial<Record<
  'title' | 'program' | 'department' | 'schoolYear' | 'categoryId' | 'authors' | 'adviserId' | 'abstract' | 'keywords' | 'manuscript' | 'confirmations',
  string
>>;

const initialForm = {
  title: '',
  program: 'BS Computer Science',
  department: 'Computer Studies Department',
  schoolYear: String(new Date().getFullYear()),
  categoryId: '',
  authors: [] as string[],
  adviserId: '',
  abstract: '',
  keywords: '',
  confirmOriginal: false,
  allowReview: false,
};

export default function FacultyAddThesisPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [advisers, setAdvisers] = useState<StudentAdviserOption[]>([]);
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
  const manuscriptInputRef = useRef<HTMLInputElement | null>(null);
  const supplementaryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    void categoryService.list()
      .then((records) => {
        if (!isMounted) return;
        setCategories(records);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || records[0]?.id || '',
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
      categoryId: categories[0]?.id ?? '',
      adviserId: advisers[0]?.id ?? '',
    });
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
    if (!form.program.trim()) nextErrors.program = 'Please enter the program.';
    if (!form.department.trim()) nextErrors.department = 'Please enter the department.';
    if (!form.schoolYear.trim()) nextErrors.schoolYear = 'Please enter the school year.';
    if (!form.categoryId.trim()) nextErrors.categoryId = 'Please select a category.';

    if (mode === 'submit') {
      if (!form.authors.length) nextErrors.authors = 'Please list at least one author.';
      if (!form.adviserId.trim()) nextErrors.adviserId = 'Please select a thesis adviser.';
      if (!form.abstract.trim()) nextErrors.abstract = 'Please enter the thesis abstract.';
      if (!form.keywords.trim()) nextErrors.keywords = 'Please enter at least one keyword.';
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
        keywords: form.keywords,
        program: form.program,
        category_id: form.categoryId,
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

  const handleChange = (field: 'title' | 'program' | 'department' | 'schoolYear' | 'categoryId' | 'adviserId' | 'abstract' | 'keywords') => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setForm((current) => ({ ...current, [field]: event.target.value }));
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
              <label className={`student-upload-field${fieldErrors.program ? ' has-error' : ''}`}>
                <span><GraduationCap size={14} /> Program</span>
                <input value={form.program} onChange={handleChange('program')} aria-invalid={Boolean(fieldErrors.program)} />
                {fieldErrors.program ? <small className="student-upload-field-error">{fieldErrors.program}</small> : null}
              </label>

              <label className={`student-upload-field${fieldErrors.department ? ' has-error' : ''}`}>
                <span><LibraryBig size={14} /> Department</span>
                <input value={form.department} onChange={handleChange('department')} aria-invalid={Boolean(fieldErrors.department)} />
                {fieldErrors.department ? <small className="student-upload-field-error">{fieldErrors.department}</small> : null}
              </label>

              <label className={`student-upload-field${fieldErrors.schoolYear ? ' has-error' : ''}`}>
                <span><ClipboardList size={14} /> Year</span>
                <input value={form.schoolYear} onChange={handleChange('schoolYear')} placeholder="2026" aria-invalid={Boolean(fieldErrors.schoolYear)} />
                {fieldErrors.schoolYear ? <small className="student-upload-field-error">{fieldErrors.schoolYear}</small> : null}
              </label>

              <label className={`student-upload-field${fieldErrors.categoryId ? ' has-error' : ''}`}>
                <span><Layers3 size={14} /> Category</span>
                <select value={form.categoryId} onChange={handleChange('categoryId')} disabled={loadingCategories || !categories.length} aria-invalid={Boolean(fieldErrors.categoryId)}>
                  {!categories.length ? <option value="">No categories available</option> : <option value="">Select a category</option>}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {fieldErrors.categoryId ? <small className="student-upload-field-error">{fieldErrors.categoryId}</small> : null}
              </label>
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
              <select value={form.adviserId} onChange={handleChange('adviserId')} disabled={loadingAdvisers || !advisers.length} aria-invalid={Boolean(fieldErrors.adviserId)}>
                {!advisers.length ? <option value="">No advisers available</option> : <option value="">Select an adviser</option>}
                {advisers.map((adviser) => (
                  <option key={adviser.id} value={adviser.id}>
                    {adviser.name} - {adviser.faculty_role}
                  </option>
                ))}
              </select>
              {fieldErrors.adviserId ? <small className="student-upload-field-error">{fieldErrors.adviserId}</small> : <small>
                {form.adviserId
                  ? advisers.find((adviser) => adviser.id === form.adviserId)?.email || 'Selected adviser'
                  : 'Choose from active faculty profiles in the database.'}
              </small>}
            </label>

            <label className={`student-upload-field full${fieldErrors.abstract ? ' has-error' : ''}`}>
              <span><FileText size={14} /> Abstract</span>
              <textarea value={form.abstract} onChange={handleChange('abstract')} placeholder="Paste your abstract here" rows={6} aria-invalid={Boolean(fieldErrors.abstract)} />
              {fieldErrors.abstract ? <small className="student-upload-field-error">{fieldErrors.abstract}</small> : null}
            </label>

            <label className={`student-upload-field full${fieldErrors.keywords ? ' has-error' : ''}`}>
              <span><Tags size={14} /> Keywords</span>
              <input value={form.keywords} onChange={handleChange('keywords')} placeholder="E.g. LMS, adaptive learning, analytics" aria-invalid={Boolean(fieldErrors.keywords)} />
              {fieldErrors.keywords ? <small className="student-upload-field-error">{fieldErrors.keywords}</small> : null}
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
