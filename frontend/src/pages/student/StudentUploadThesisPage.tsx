import { useEffect, useState } from 'react';
import { BookOpenText, ClipboardList, FileText, FolderOpen, GraduationCap, Layers3, LibraryBig, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { departmentOptionsByCollege } from '../../constants/academicUnits';
import StudentLayout from '../../components/student/StudentLayout';
import { studentProfileService } from '../../services/studentProfileService';
import { thesisService, type StudentAdviserOption } from '../../services/thesisService';
import { vpaaCategoriesService, type VpaaCategory } from '../../services/vpaaCategoriesService';
import type { Thesis } from '../../types/thesis.types';

type UploadFormState = {
  title: string;
  program: string;
  department: string;
  school_year: string;
  category_ids: string[];
  authors: string[];
  adviser_id: string;
  abstract: string;
};

type UploadFieldErrors = Partial<Record<
  'title' | 'department' | 'school_year' | 'category_id' | 'authors' | 'adviser_id' | 'abstract' | 'manuscript' | 'confirmations',
  string
>>;

const initialFormState: UploadFormState = {
  title: '',
  program: 'BS Computer Science',
  department: 'Computer Studies Department',
  school_year: '2026',
  category_ids: [],
  authors: [],
  adviser_id: '',
  abstract: '',
};

const MAX_CATEGORY_SELECTIONS = 5;
const SCHOOL_YEAR_START = 2022;
const CURRENT_SCHOOL_YEAR = new Date().getFullYear();
const SCHOOL_YEAR_OPTIONS = Array.from(
  { length: Math.max(CURRENT_SCHOOL_YEAR - SCHOOL_YEAR_START + 1, 1) },
  (_, index) => String(SCHOOL_YEAR_START + index),
);

const getNameInitials = (name?: string | null) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'NA';

const normalizeProgramLabel = (program?: string | null) => {
  const normalized = (program ?? '').trim().toUpperCase();

  if (!normalized) return '';
  if (normalized === 'BSCS' || normalized.includes('COMPUTER SCIENCE')) return 'BSCS';
  if (normalized === 'BSIT' || normalized.includes('INFORMATION TECHNOLOGY')) return 'BSIT';
  if (normalized === 'BSIS' || normalized.includes('INFORMATION SYSTEM')) return 'BSIS';

  return program ?? '';
};

const resolveCollegeFromDepartment = (department: string) => {
  const normalizedDepartment = department.trim().toLowerCase();

  return Object.entries(departmentOptionsByCollege).find(([, departments]) =>
    departments.some((entry) => entry.trim().toLowerCase() === normalizedDepartment),
  )?.[0] ?? '';
};

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: string; message?: string; errors?: Record<string, string[] | string> }
      | undefined;

    if (responseData?.error) return responseData.error;
    if (responseData?.message) return responseData.message;

    const firstFieldError = responseData?.errors
      ? Object.values(responseData.errors).flat().find(Boolean)
      : null;

    if (typeof firstFieldError === 'string') return firstFieldError;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export default function StudentUploadThesisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const draftFromState = (location.state as { draft?: Thesis } | null)?.draft ?? null;
  const draftQueryId = searchParams.get('draft');
  const [form, setForm] = useState<UploadFormState>(initialFormState);
  const [categories, setCategories] = useState<VpaaCategory[]>([]);
  const [advisers, setAdvisers] = useState<StudentAdviserOption[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadedStatus, setLoadedStatus] = useState<Thesis['status'] | null>(draftFromState?.status ?? null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [existingManuscriptName, setExistingManuscriptName] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<UploadFieldErrors>({});
  const [confirmOriginal, setConfirmOriginal] = useState(false);
  const [allowReview, setAllowReview] = useState(false);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [supplementaryFiles, setSupplementaryFiles] = useState<File[]>([]);
  const [authorInput, setAuthorInput] = useState('');
  const [adviserSearch, setAdviserSearch] = useState('');
  const isRevisionMode = loadedStatus === 'rejected';
  const college = resolveCollegeFromDepartment(form.department);
  const selectedAdviser = advisers.find((adviser) => adviser.id === form.adviser_id) ?? null;
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
  const showAdviserResults = adviserSearch.trim().length > 0 && (!selectedAdviser || adviserSearch.trim() !== selectedAdviser.name);

  useEffect(() => {
    void studentProfileService.getProfile()
      .then((profile) => {
        setForm((current) => ({
          ...current,
          department: profile.department || current.department,
          program: normalizeProgramLabel(profile.program) || current.program,
        }));
      })
      .catch(() => {
        // Keep fallback form defaults if the profile cannot be loaded.
      });
  }, []);

  useEffect(() => {
    void vpaaCategoriesService.list('student')
      .then((response) => {
        setCategories(response);
        setForm((current) => ({
          ...current,
          program: current.program || response[0]?.theses[0]?.program || 'BS Computer Science',
        }));
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    void thesisService.advisers()
      .then((response) => {
        setAdvisers(response);
      })
      .catch(() => {
        setAdvisers([]);
      });
  }, []);

  useEffect(() => {
    if (!draftQueryId) {
      setLoadedStatus(null);
      setDraftLoaded(true);
      return;
    }

    const normalizedId = decodeURIComponent(draftQueryId);
    const stateDraft = draftFromState && String(draftFromState.id) === normalizedId ? draftFromState : null;

    const applyDraft = (draft: Thesis) => {
      setDraftId(draft.id);
      setLoadedStatus(draft.status);
      setExistingManuscriptName(draft.file_name ?? '');
      setForm({
        title: draft.title ?? '',
        program: normalizeProgramLabel(draft.program) || 'BSCS',
        department: draft.department ?? 'Computer Studies Department',
        school_year: draft.school_year ?? '2026',
        category_ids: draft.category_ids?.length
          ? draft.category_ids
          : [draft.category?.id ?? draft.category_id ?? ''].filter(Boolean),
        authors: draft.authors ?? [],
        adviser_id: draft.adviser?.id ?? '',
        abstract: draft.abstract ?? '',
      });
      setAdviserSearch('');
      setAuthorInput('');
      setDraftLoaded(true);
    };

    if (stateDraft) {
      applyDraft(stateDraft);
      return;
    }

    setDraftLoaded(false);
    setError('');

    void thesisService.get(normalizedId)
      .then((response) => {
        const data = response?.data ?? response;
        applyDraft(data as Thesis);
      })
      .catch((err) => {
        setError(extractApiErrorMessage(err, 'Unable to load this thesis right now.'));
        setDraftLoaded(true);
      });
  }, [draftFromState, draftQueryId]);

  useEffect(() => {
    if (!message && !error) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [message, error]);

  const submissionGuideItems = [
    {
      title: 'Ownership & Copyright',
      body:
        'You retain full copyright of your research. By submitting to the archive, you grant the University a non-exclusive license to preserve and showcase your work for academic purposes.',
    },
    {
      title: 'Access & Visibility',
      body:
        'Upon approval, your thesis metadata (title and abstract) will be publicly searchable. Access to the full PDF manuscript is restricted to authenticated University students and faculty members only.',
    },
    {
      title: 'Embargo Requests',
      body:
        'If your research contains sensitive data or is subject to a pending patent, please contact your department coordinator to request an "Embargo" (delayed publication) before finalizing your submission.',
    },
    {
      title: 'Review Timeline',
      body:
        'Submissions are reviewed within 3-5 working days. You will receive an automated notification once the archive team approves your thesis or requests a revision.',
    },
    {
      title: 'Support & Guidelines',
      body:
        'Need help? Visit the Support page or contact your department coordinator for official submission guidelines and document templates.',
    },
  ];

  const handleChange = (field: keyof UploadFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validateSubmissionForm = (mode: 'draft' | 'submit') => {
    const nextErrors: UploadFieldErrors = {};

    if (!form.title.trim()) nextErrors.title = 'Please enter the thesis title.';
    if (!form.department.trim()) nextErrors.department = 'Please enter the department.';
    if (!form.school_year.trim()) nextErrors.school_year = 'Please enter the school year.';
    if (!form.category_ids.length) nextErrors.category_id = 'Please select at least one category.';
    if (form.category_ids.length > MAX_CATEGORY_SELECTIONS) nextErrors.category_id = `You can select up to ${MAX_CATEGORY_SELECTIONS} categories only.`;

    if (mode === 'submit') {
      if (!form.authors.length) nextErrors.authors = 'Please list at least one author.';
      if (!form.adviser_id) nextErrors.adviser_id = 'Please select a thesis adviser.';
      if (!form.abstract.trim()) nextErrors.abstract = 'Please enter the thesis abstract.';
    }

    return nextErrors;
  };

  const buildUploadPayload = () => ({
    title: form.title,
    abstract: form.abstract,
    department: form.department,
    program: form.program,
    category_id: form.category_ids[0] ?? '',
    category_ids: form.category_ids,
    school_year: form.school_year,
    authors: form.authors,
    adviser_id: form.adviser_id,
    manuscript: manuscriptFile,
    supplementary_files: supplementaryFiles,
  });

  const persistDraft = async () => {
    const payload = buildUploadPayload();

    if (draftId) {
      const updated = await thesisService.updateStudentUpload(draftId, payload);
      const updatedId = updated?.data?.id ?? draftId;
      setDraftId(updatedId);
      return updatedId;
    }

    const created = await thesisService.createStudentUpload(payload);
    const createdId = created?.data?.id ?? null;
    setDraftId(createdId);
    return createdId;
  };

  const resetDraftForm = () => {
    setForm((current) => ({
      ...initialFormState,
      program: current.program,
      department: current.department,
      school_year: current.school_year,
      category_ids: [],
    }));
    setDraftId(null);
    setLoadedStatus(null);
    setExistingManuscriptName('');
    setConfirmOriginal(false);
    setAllowReview(false);
    setManuscriptFile(null);
    setSupplementaryFiles([]);
    setAuthorInput('');
    setAdviserSearch('');
  };

  const handleDraftSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      setFieldErrors({});

      const validationErrors = validateSubmissionForm('draft');
      if (Object.keys(validationErrors).length) {
        setFieldErrors(validationErrors);
        setError('Please complete the required fields before saving.');
        return;
      }

      await persistDraft();
      resetDraftForm();
      setMessage(isRevisionMode ? 'Revision draft saved successfully.' : 'Draft saved successfully.');
    } catch (err) {
      setError(extractApiErrorMessage(err, isRevisionMode ? 'Unable to save your revision draft.' : 'Unable to save your thesis draft.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      setMessage('');
      setFieldErrors({});

      if (!confirmOriginal || !allowReview) {
        setFieldErrors({ confirmations: 'Please confirm both submission statements before submitting.' });
        setError('Please confirm the submission statements before submitting.');
        return;
      }

      const validationErrors = validateSubmissionForm('submit');
      if (Object.keys(validationErrors).length) {
        setFieldErrors(validationErrors);
        setError('Please complete the required fields before submitting.');
        return;
      }

      if (!manuscriptFile) {
        if (existingManuscriptName) {
          // Existing draft manuscript can still be submitted without re-uploading.
        } else {
          setFieldErrors({ manuscript: 'Please attach the thesis PDF before submitting.' });
          setError('Please attach the thesis PDF before submitting.');
          return;
        }
      }

      let thesisId = draftId;

      thesisId = await persistDraft();

      if (!thesisId) {
        throw new Error('The thesis draft was created but no ID was returned.');
      }

      await thesisService.submit(thesisId);
      setMessage('Thesis submitted successfully.');
      setDraftId(null);
      setExistingManuscriptName('');
      setTimeout(() => navigate('/student/my-submissions'), 1200);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Unable to submit your thesis.'));
    } finally {
      setSubmitting(false);
    }
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

  const toggleCategory = (categoryId: string) => {
    setFieldErrors((current) => ({ ...current, category_id: undefined }));
    setError((current) => (current.startsWith('You can select up to') ? '' : current));

    setForm((current) => {
      if (current.category_ids.includes(categoryId)) {
        return { ...current, category_ids: current.category_ids.filter((id) => id !== categoryId) };
      }

      if (current.category_ids.length >= MAX_CATEGORY_SELECTIONS) {
        setError(`You can select up to ${MAX_CATEGORY_SELECTIONS} categories only.`);
        return current;
      }

      return { ...current, category_ids: [...current.category_ids, categoryId] };
    });
  };

  return (
    <StudentLayout
      title={draftId ? (isRevisionMode ? 'Make Revision' : 'Edit Draft') : 'Upload Thesis'}
      description={draftId ? (isRevisionMode ? 'Revise the rejected submission, update the manuscript if needed, and resubmit it for faculty review.' : 'Update your saved draft and continue preparing it for submission.') : 'Submit your thesis with complete metadata, abstract, and required documents for review.'}
    >
      {message ? <div className="vpaa-banner-success">{message}</div> : null}
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      {!draftLoaded ? <div className="vpaa-card">Loading thesis...</div> : null}

      <div className="student-upload-shell" style={{ display: draftLoaded ? undefined : 'none' }}>
        <section className="student-upload-main vpaa-card">
          <div className="student-upload-section-copy">
            <h2><BookOpenText size={22} /> Thesis Details</h2>
            <p>Provide accurate information so your work is discoverable in the archive.</p>
          </div>

          <div className="student-upload-form">
            <label className={`student-upload-field full${fieldErrors.title ? ' has-error' : ''}`}>
              <span><BookOpenText size={14} /> Thesis Title</span>
              <input value={form.title} onChange={handleChange('title')} placeholder="Enter full thesis title" aria-invalid={Boolean(fieldErrors.title)} />
              {fieldErrors.title ? <small className="student-upload-field-error">{fieldErrors.title}</small> : null}
            </label>

            <div className="student-upload-grid">
              <label className="student-upload-field">
                <span><LibraryBig size={14} /> College</span>
                <input value={college} readOnly />
              </label>

              <label className={`student-upload-field${fieldErrors.department ? ' has-error' : ''}`}>
                <span><LibraryBig size={14} /> Department</span>
                <input value={form.department} readOnly aria-invalid={Boolean(fieldErrors.department)} />
                {fieldErrors.department ? <small className="student-upload-field-error">{fieldErrors.department}</small> : null}
              </label>

              <label className="student-upload-field">
                <span><GraduationCap size={14} /> Program</span>
                <input value={form.program} readOnly />
              </label>

              <label className={`student-upload-field${fieldErrors.school_year ? ' has-error' : ''}`}>
                <span><ClipboardList size={14} /> Year</span>
                <select
                  className="student-upload-year-select"
                  value={form.school_year}
                  onChange={handleChange('school_year')}
                  aria-invalid={Boolean(fieldErrors.school_year)}
                >
                  <option value="" disabled>Select year</option>
                  {SCHOOL_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {fieldErrors.school_year ? <small className="student-upload-field-error">{fieldErrors.school_year}</small> : null}
              </label>

              <div className={`student-upload-field full${fieldErrors.category_id ? ' has-error' : ''}`}>
                <span><Layers3 size={14} /> Category</span>
                <details className="student-upload-multi-dropdown">
                  <summary className="student-upload-multi-dropdown-trigger" aria-invalid={Boolean(fieldErrors.category_id)}>
                    <span className="student-upload-multi-dropdown-value">
                      {form.category_ids.length
                        ? categories
                            .filter((category) => form.category_ids.includes(category.id))
                            .map((category) => category.label)
                            .join(', ')
                        : 'Select categories'}
                    </span>
                    <span className="student-upload-multi-dropdown-meta">{form.category_ids.length}/{MAX_CATEGORY_SELECTIONS}</span>
                  </summary>
                  <div className="student-upload-multi-dropdown-menu">
                    {categories.map((category) => (
                      <label key={category.id} className={`student-upload-option-chip${form.category_ids.includes(category.id) ? ' active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.category_ids.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                        />
                        <span>{category.label}</span>
                      </label>
                    ))}
                  </div>
                </details>
                {fieldErrors.category_id ? <small className="student-upload-field-error">{fieldErrors.category_id}</small> : <small>Select up to 5 categories.</small>}
              </div>
            </div>

            <label className={`student-upload-field full${fieldErrors.authors ? ' has-error' : ''}`}>
              <span><UserRound size={14} /> Authors</span>
              <div className="student-upload-author-box">
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
                <div className="student-upload-author-tags">
                  {form.authors.map((author) => (
                    <span className="student-upload-author-chip student-upload-author-pill" key={author}>
                      <span className="student-upload-author-avatar">{getNameInitials(author)}</span>
                      <span className="student-upload-author-name">{author}</span>
                      <button
                        type="button"
                        className="student-upload-adviser-remove"
                        onClick={() => removeAuthor(author)}
                        aria-label={`Remove ${author}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {fieldErrors.authors ? <small className="student-upload-field-error">{fieldErrors.authors}</small> : <small>Press Enter after each author name to add another one.</small>}
            </label>

            <label className={`student-upload-field full${fieldErrors.adviser_id ? ' has-error' : ''}`}>
              <span><UserRound size={14} /> Thesis Adviser</span>
              <div className="student-upload-searchbox">
                <input
                  value={adviserSearch}
                  onChange={(event) => {
                    setAdviserSearch(event.target.value);
                    setFieldErrors((current) => ({ ...current, adviser_id: undefined }));
                    if (form.adviser_id) {
                      setForm((current) => ({ ...current, adviser_id: '' }));
                    }
                  }}
                  placeholder="Search adviser by name, email, or role"
                  aria-invalid={Boolean(fieldErrors.adviser_id)}
                />
                {showAdviserResults ? (
                  <div className="student-upload-search-results">
                    {filteredAdvisers.map((adviser) => (
                      <button
                        key={adviser.id}
                        type="button"
                        className={`student-upload-search-option${form.adviser_id === adviser.id ? ' active' : ''}`}
                        onClick={() => {
                          setForm((current) => ({ ...current, adviser_id: adviser.id }));
                          setAdviserSearch('');
                          setFieldErrors((current) => ({ ...current, adviser_id: undefined }));
                        }}
                      >
                        <strong>{adviser.name}</strong>
                        <span>{adviser.email} - {adviser.faculty_role}</span>
                      </button>
                    ))}
                    {!filteredAdvisers.length ? <div className="student-upload-search-empty">No adviser found.</div> : null}
                  </div>
                ) : null}
                {selectedAdviser ? (
                  <div className="student-upload-author-tags">
                    <span className="student-upload-adviser-chip">
                      <span className="student-upload-adviser-avatar">{getNameInitials(selectedAdviser.name)}</span>
                      <span className="student-upload-adviser-name">{selectedAdviser.name}</span>
                      <button
                        type="button"
                        className="student-upload-adviser-remove"
                        onClick={() => {
                          setForm((current) => ({ ...current, adviser_id: '' }));
                          setAdviserSearch('');
                        }}
                        aria-label={`Remove ${selectedAdviser.name}`}
                      >
                        x
                      </button>
                    </span>
                  </div>
                ) : null}
              </div>
              {fieldErrors.adviser_id ? <small className="student-upload-field-error">{fieldErrors.adviser_id}</small> : <small>Choose from active faculty profiles in the database.</small>}
            </label>

            <label className={`student-upload-field full${fieldErrors.abstract ? ' has-error' : ''}`}>
              <span><FileText size={14} /> Abstract</span>
              <textarea value={form.abstract} onChange={handleChange('abstract')} placeholder="Paste your abstract here" rows={6} aria-invalid={Boolean(fieldErrors.abstract)} />
              {fieldErrors.abstract ? <small className="student-upload-field-error">{fieldErrors.abstract}</small> : null}
            </label>

            <div className={`student-upload-field full${fieldErrors.manuscript ? ' has-error' : ''}`}>
              <span><FolderOpen size={14} /> Upload Files</span>
              <div className="student-upload-file-row">
                <div className="student-upload-file-label">{manuscriptFile?.name || existingManuscriptName || 'No file chosen'}</div>
                <div className="student-upload-file-actions">
                  <label className="student-upload-file-btn">
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      onChange={(event) => {
                        setManuscriptFile(event.target.files?.[0] ?? null);
                        if (event.target.files?.[0]) {
                          setExistingManuscriptName('');
                        }
                      }}
                    />
                    Select PDF
                  </label>
                  {(manuscriptFile || existingManuscriptName) ? (
                    <button type="button" className="student-upload-file-remove" onClick={() => {
                      setManuscriptFile(null);
                      setExistingManuscriptName('');
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
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={(event) => setSupplementaryFiles(Array.from(event.target.files ?? []))}
                    />
                    Supplementary Files
                  </label>
                  {supplementaryFiles.length ? (
                    <button type="button" className="student-upload-file-remove" onClick={() => setSupplementaryFiles([])} aria-label="Remove supplementary files">
                      x
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <label className={`student-upload-check${fieldErrors.confirmations ? ' has-error' : ''}`}>
              <input type="checkbox" checked={confirmOriginal} onChange={(event) => {
                setConfirmOriginal(event.target.checked);
                setFieldErrors((current) => ({ ...current, confirmations: undefined }));
              }} />
              <span>I confirm that this submission is original, properly cited, and approved for upload to the thesis archive. <strong className="student-upload-required">*</strong></span>
            </label>

            <label className={`student-upload-check${fieldErrors.confirmations ? ' has-error' : ''}`}>
              <input type="checkbox" checked={allowReview} onChange={(event) => {
                setAllowReview(event.target.checked);
                setFieldErrors((current) => ({ ...current, confirmations: undefined }));
              }} />
              <span>I agree to share the thesis for academic purposes and allow the archive committee to review the content. <strong className="student-upload-required">*</strong></span>
            </label>
            {fieldErrors.confirmations ? <small className="student-upload-field-error">{fieldErrors.confirmations}</small> : null}

            <div className="student-upload-actions">
              <button type="button" className="student-upload-secondary" onClick={handleDraftSave} disabled={saving || submitting}>
                {saving ? 'Saving...' : draftId ? (isRevisionMode ? 'Save Revision' : 'Update Draft') : 'Save Draft'}
              </button>
              <button
                type="button"
                className="student-upload-primary"
                onClick={handleSubmit}
                disabled={saving || submitting || !confirmOriginal || !allowReview}
              >
                {submitting ? 'Submitting...' : 'Submit Thesis'}
              </button>
            </div>
          </div>
        </section>

        <aside className="student-upload-side vpaa-card thesis-details-side-card submission-accent-panel">
          <div className="student-upload-section-copy thesis-details-side-head">
            <div>
              <h2>Submission Guide &amp; Status</h2>
              <p>Review the privacy, access, and approval details before finalizing your thesis submission.</p>
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
            {submissionGuideItems.map((item) => (
              <span key={item.title} className="student-upload-chip">{item.title}</span>
            ))}
          </div>

          <div className="student-upload-status">
            <h3>Intellectual Property &amp; Privacy</h3>
            <ul>
              {submissionGuideItems.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <strong>{item.title}.</strong> {item.body}
                </li>
              ))}
            </ul>
          </div>

          <div className="student-upload-status">
            <h3>Important Reminders</h3>
            <ul>
              {submissionGuideItems.slice(3).map((item) => (
                <li key={item.title}>
                  <strong>{item.title}.</strong> {item.body}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </StudentLayout>
  );
}
