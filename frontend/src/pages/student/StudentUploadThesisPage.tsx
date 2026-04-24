import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, ClipboardList, FileText, FolderOpen, ShieldCheck, Sparkles, Tags, UserRound } from 'lucide-react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import { thesisService, type StudentAdviserOption } from '../../services/thesisService';
import { vpaaCategoriesService, type VpaaCategory } from '../../services/vpaaCategoriesService';
import type { Thesis } from '../../types/thesis.types';

type UploadFormState = {
  title: string;
  program: string;
  department: string;
  school_year: string;
  category_id: string;
  authors: string[];
  adviser_id: string;
  abstract: string;
  keywords: string;
};

const initialFormState: UploadFormState = {
  title: '',
  program: 'BS Computer Science',
  department: 'Computer Studies Department',
  school_year: '2026',
  category_id: '',
  authors: [],
  adviser_id: '',
  abstract: '',
  keywords: '',
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
  const [confirmOriginal, setConfirmOriginal] = useState(false);
  const [allowReview, setAllowReview] = useState(false);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [supplementaryFiles, setSupplementaryFiles] = useState<File[]>([]);
  const [authorInput, setAuthorInput] = useState('');
  const isRevisionMode = loadedStatus === 'rejected';

  useEffect(() => {
    void vpaaCategoriesService.list('student')
      .then((response) => {
        setCategories(response);
        setForm((current) => ({
          ...current,
          category_id: current.category_id || response[0]?.id || '',
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
        setForm((current) => ({
          ...current,
          adviser_id: current.adviser_id || response[0]?.id || '',
        }));
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
        program: draft.program ?? 'BS Computer Science',
        department: draft.department ?? 'Computer Studies Department',
        school_year: draft.school_year ?? '2026',
        category_id: draft.category?.id ?? draft.category_id ?? '',
        authors: draft.authors ?? [],
        adviser_id: draft.adviser?.id ?? '',
        abstract: draft.abstract ?? '',
        keywords: draft.keywords?.join(', ') ?? '',
      });
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

  const checklistItems = useMemo(
    () => ['Signed Endorsement', 'Plagiarism Report', 'Final Manuscript', 'Title Page', 'Appendices'],
    [],
  );

  const handleChange = (field: keyof UploadFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validateSubmissionForm = (mode: 'draft' | 'submit') => {
    if (!form.title.trim()) return 'Please enter the thesis title.';
    if (!form.department.trim()) return 'Please enter the department.';
    if (!form.school_year.trim()) return 'Please enter the school year.';
    if (!form.category_id) return 'Please select a category.';

    if (mode === 'submit') {
      if (!form.authors.length) return 'Please list at least one author.';
      if (!form.adviser_id) return 'Please select a thesis adviser.';
      if (!form.abstract.trim()) return 'Please enter the thesis abstract.';
      if (!form.keywords.trim()) return 'Please enter at least one keyword.';
    }

    return '';
  };

  const buildUploadPayload = () => ({
    title: form.title,
    abstract: form.abstract,
    department: form.department,
    program: form.program,
    category_id: form.category_id,
    school_year: form.school_year,
    authors: form.authors,
    adviser_id: form.adviser_id,
    keywords: form.keywords,
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

  const handleDraftSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const validationError = validateSubmissionForm('draft');
      if (validationError) {
        setError(validationError);
        return;
      }

      await persistDraft();
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

      if (!confirmOriginal || !allowReview) {
        setError('Please confirm the submission statements before submitting.');
        return;
      }

      const validationError = validateSubmissionForm('submit');
      if (validationError) {
        setError(validationError);
        return;
      }

      if (!manuscriptFile) {
        if (existingManuscriptName) {
          // Existing draft manuscript can still be submitted without re-uploading.
        } else {
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
      navigate('/student/my-submissions');
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
            <label className="student-upload-field full">
              <span>Thesis Title</span>
              <input value={form.title} onChange={handleChange('title')} placeholder="Enter full thesis title" />
            </label>

            <div className="student-upload-grid">
              <label className="student-upload-field">
                <span>Program</span>
                <input value={form.program} onChange={handleChange('program')} />
              </label>

              <label className="student-upload-field">
                <span>Department</span>
                <input value={form.department} onChange={handleChange('department')} />
              </label>

              <label className="student-upload-field">
                <span>Year</span>
                <input value={form.school_year} onChange={handleChange('school_year')} />
              </label>

              <label className="student-upload-field">
                <span>Category</span>
                <select value={form.category_id} onChange={handleChange('category_id')}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="student-upload-field full">
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
              <small>Press Enter after each author name to add another one.</small>
            </label>

            <label className="student-upload-field full">
              <span><UserRound size={14} /> Thesis Adviser</span>
              <select value={form.adviser_id} onChange={handleChange('adviser_id')}>
                <option value="">Select an adviser</option>
                {advisers.map((adviser) => (
                  <option key={adviser.id} value={adviser.id}>
                    {adviser.name} - {adviser.faculty_role}
                  </option>
                ))}
              </select>
              <small>
                {form.adviser_id
                  ? advisers.find((adviser) => adviser.id === form.adviser_id)?.email || 'Selected adviser'
                  : 'Choose from active faculty profiles in the database.'}
              </small>
            </label>

            <label className="student-upload-field full">
              <span><FileText size={14} /> Abstract</span>
              <textarea value={form.abstract} onChange={handleChange('abstract')} placeholder="Paste your abstract here" rows={6} />
            </label>

            <label className="student-upload-field full">
              <span><Tags size={14} /> Keywords</span>
              <input value={form.keywords} onChange={handleChange('keywords')} placeholder="E.g. LMS, adaptive learning, analytics" />
            </label>

            <div className="student-upload-field full">
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

            <label className="student-upload-check">
              <input type="checkbox" checked={confirmOriginal} onChange={(event) => setConfirmOriginal(event.target.checked)} />
              <span>I confirm that this submission is original, properly cited, and approved for upload to the thesis archive. <strong className="student-upload-required">*</strong></span>
            </label>

            <label className="student-upload-check">
              <input type="checkbox" checked={allowReview} onChange={(event) => setAllowReview(event.target.checked)} />
              <span>I agree to share the thesis for academic purposes and allow the archive committee to review the content. <strong className="student-upload-required">*</strong></span>
            </label>

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
              <li className="is-complete">Profile and program details</li>
              <li>Files added (PDF, supplementary)</li>
              <li>Adviser approval and consent</li>
            </ul>
          </div>

          <div className="student-upload-note">
            Submissions are reviewed within 3-5 working days. You will receive a notification once the archive team approves your thesis.
          </div>

          <div className="student-upload-note">
            Need help? Visit the Support page or contact your department coordinator for submission guidelines.
          </div>
        </aside>
      </div>
    </StudentLayout>
  );
}
