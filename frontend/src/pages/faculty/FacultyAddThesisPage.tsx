import { useEffect, useRef, useState } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { useAuth } from '../../hooks/useAuth';
import { facultyThesisService } from '../../services/facultyThesisService';

const checklistItems = ['Signed Endorsement', 'Plagiarism Report', 'Final Manuscript', 'Title Page', 'Appendices'];

const initialForm = {
  title: '',
  program: 'BS Computer Science',
  department: 'Computer Studies Department',
  schoolYear: String(new Date().getFullYear()),
  categoryId: '',
  authors: '',
  adviser: '',
  abstract: '',
  keywords: '',
  confirmOriginal: false,
  allowReview: false,
};

export default function FacultyAddThesisPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [supplementaryFiles, setSupplementaryFiles] = useState<File[]>([]);
  const manuscriptInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
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

  const resetForm = () => {
    setForm({
      ...initialForm,
      adviser: user?.name ?? '',
      categoryId: categories[0]?.id ?? '',
    });
    setManuscriptFile(null);
    setCoverFile(null);
    setSupplementaryFiles([]);
    if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      adviser: current.adviser || user?.name || '',
    }));
  }, [user?.name]);

  const inputClass = (field: string) =>
    `w-full rounded-2xl border bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)] ${
      invalidFields.includes(field)
        ? 'border-[var(--maroon)] bg-[rgba(139,35,50,0.03)]'
        : 'border-[var(--input-border)]'
    }`;

  const validateSubmit = () => {
    const missing: string[] = [];

    if (!form.title.trim()) missing.push('title');
    if (!form.program.trim()) missing.push('program');
    if (!form.department.trim()) missing.push('department');
    if (!form.schoolYear.trim()) missing.push('schoolYear');
    if (!form.categoryId.trim()) missing.push('categoryId');
    if (!form.authors.trim()) missing.push('authors');
    if (!form.adviser.trim()) missing.push('adviser');
    if (!form.abstract.trim()) missing.push('abstract');
    if (!form.keywords.trim()) missing.push('keywords');
    if (!manuscriptFile) missing.push('manuscript');
    if (!form.confirmOriginal) missing.push('confirmOriginal');
    if (!form.allowReview) missing.push('allowReview');

    setInvalidFields(missing);
    return missing;
  };

  const handleSave = async (mode: 'draft' | 'submit') => {
    setSubmitting(mode);
    setError('');
    setSuccess('');
    setInvalidFields([]);

    if (mode === 'submit') {
      const missing = validateSubmit();

      if (missing.length) {
        const message = 'Please complete all required fields and confirmations before submitting the thesis.';
        setError(message);
        window.alert(message);
        setSubmitting(null);
        return;
      }
    }

    try {
      await facultyThesisService.create({
        title: form.title,
        abstract: form.abstract,
        keywords: form.keywords,
        program: form.program,
        category_id: form.categoryId,
        school_year: form.schoolYear,
        authors: form.authors,
        adviser: form.adviser,
        submission_mode: mode,
        confirm_original: form.confirmOriginal,
        allow_review: form.allowReview,
        manuscript: manuscriptFile,
        cover: coverFile,
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

  return (
    <FacultyLayout
      title="Add Thesis"
      description="Submit a thesis entry with complete metadata, abstract, and required documents for review."
    >
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}
        {success ? <div className="rounded-xl bg-[rgba(61,139,74,0.12)] px-4 py-3 text-sm font-medium text-[var(--sage)]">{success}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
            <div className="mb-5">
              <h2 className="mb-1 text-2xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Thesis Details</h2>
              <p className="text-sm text-text-secondary">Provide accurate information so your work is discoverable in the archive.</p>
            </div>

            <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
              <input ref={manuscriptInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(event) => setManuscriptFile(event.target.files?.[0] ?? null)} />
              <input ref={coverInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" className="hidden" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
              <input ref={supplementaryInputRef} type="file" multiple className="hidden" onChange={(event) => setSupplementaryFiles(Array.from(event.target.files ?? []))} />

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Thesis Title</span>
                <input className={inputClass('title')} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Enter full thesis title" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text-primary">Program</span>
                  <input className={inputClass('program')} value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value })} />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text-primary">Department</span>
                  <input className={inputClass('department')} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text-primary">Year</span>
                  <input className={inputClass('schoolYear')} value={form.schoolYear} onChange={(event) => setForm({ ...form, schoolYear: event.target.value })} placeholder="2026" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text-primary">Category</span>
                  <select className={inputClass('categoryId')} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} disabled={loadingCategories || !categories.length}>
                    {!categories.length ? <option value="">No categories available</option> : null}
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Authors</span>
                <input className={inputClass('authors')} value={form.authors} onChange={(event) => setForm({ ...form, authors: event.target.value })} placeholder="List all authors separated by commas" />
                <span className="mt-2 block text-xs text-text-tertiary">Example: Maria Santos, John Dela Cruz, Faye Lim</span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Thesis Adviser</span>
                <input className={inputClass('adviser')} value={form.adviser} onChange={(event) => setForm({ ...form, adviser: event.target.value })} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Abstract</span>
                <textarea className={`min-h-[132px] ${inputClass('abstract')}`} value={form.abstract} onChange={(event) => setForm({ ...form, abstract: event.target.value })} placeholder="Paste your abstract here" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Keywords</span>
                <input className={inputClass('keywords')} value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="E.g. LMS, adaptive learning, analytics" />
              </label>

              <div className="space-y-3">
                <span className="block text-sm font-semibold text-text-primary">Upload Files</span>

                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input className={inputClass('manuscript')} value={manuscriptFile?.name ?? ''} readOnly placeholder="No file chosen" />
                    <div className="flex gap-2">
                      <button type="button" className="rounded-2xl border border-[var(--input-border)] bg-white px-5 py-3 text-sm font-semibold text-text-primary" onClick={() => manuscriptInputRef.current?.click()}>Select PDF</button>
                      {manuscriptFile ? <button type="button" className="rounded-2xl border border-[rgba(139,35,50,0.18)] bg-[rgba(139,35,50,0.05)] px-4 py-3 text-sm font-semibold text-[var(--maroon)]" onClick={() => { setManuscriptFile(null); if (manuscriptInputRef.current) manuscriptInputRef.current.value = ''; }}>Remove</button> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none" value={coverFile?.name ?? ''} readOnly placeholder="No file chosen" />
                    <div className="flex gap-2">
                      <button type="button" className="rounded-2xl border border-[var(--input-border)] bg-white px-5 py-3 text-sm font-semibold text-text-primary" onClick={() => coverInputRef.current?.click()}>Upload Cover</button>
                      {coverFile ? <button type="button" className="rounded-2xl border border-[rgba(139,35,50,0.18)] bg-[rgba(139,35,50,0.05)] px-4 py-3 text-sm font-semibold text-[var(--maroon)]" onClick={() => { setCoverFile(null); if (coverInputRef.current) coverInputRef.current.value = ''; }}>Remove</button> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none" value={supplementaryFiles.length ? supplementaryFiles.map((file) => file.name).join(', ') : ''} readOnly placeholder="No files chosen" />
                    <div className="flex gap-2">
                      <button type="button" className="rounded-2xl border border-[var(--input-border)] bg-white px-5 py-3 text-sm font-semibold text-text-primary" onClick={() => supplementaryInputRef.current?.click()}>Supplementary Files</button>
                      {supplementaryFiles.length ? <button type="button" className="rounded-2xl border border-[rgba(139,35,50,0.18)] bg-[rgba(139,35,50,0.05)] px-4 py-3 text-sm font-semibold text-[var(--maroon)]" onClick={() => { setSupplementaryFiles([]); if (supplementaryInputRef.current) supplementaryInputRef.current.value = ''; }}>Remove</button> : null}
                    </div>
                  </div>
                </div>
              </div>

              <label className={`flex items-start gap-3 text-sm font-semibold ${invalidFields.includes('confirmOriginal') ? 'text-[var(--maroon)]' : 'text-text-primary'}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--input-border)]" checked={form.confirmOriginal} onChange={(event) => setForm({ ...form, confirmOriginal: event.target.checked })} />
                <span>I confirm that this submission is original, properly cited, and approved for upload to the thesis archive.</span>
              </label>

              <label className={`flex items-start gap-3 text-sm font-semibold ${invalidFields.includes('allowReview') ? 'text-[var(--maroon)]' : 'text-text-primary'}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[var(--input-border)]" checked={form.allowReview} onChange={(event) => setForm({ ...form, allowReview: event.target.checked })} />
                <span>I agree to share the thesis for academic purposes and allow the archive committee to review the content.</span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="rounded-2xl border border-[var(--input-border)] bg-white px-6 py-3 text-sm font-semibold text-text-primary" onClick={() => void handleSave('draft')} disabled={submitting !== null || !form.title || !form.categoryId}>
                  {submitting === 'draft' ? 'Saving...' : 'Save Draft'}
                </button>
                <button type="button" className="rounded-2xl bg-[var(--maroon)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)]" onClick={() => void handleSave('submit')} disabled={submitting !== null || !form.title || !form.categoryId}>
                  {submitting === 'submit' ? 'Submitting...' : 'Submit Thesis'}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
              <div className="mb-5">
                <h2 className="mb-1 text-2xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Submission Checklist</h2>
                <p className="text-sm text-text-secondary">Ensure these items are ready before submitting.</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {checklistItems.map((item) => (
                  <span key={item} className="rounded-full bg-[rgba(139,35,50,0.06)] px-3 py-2 text-sm font-medium text-[var(--maroon)]">{item}</span>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4">
                <div className="mb-3 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Upload Status</div>
                <div className="space-y-3 text-sm text-text-secondary">
                  <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[var(--sage)]" /><span>Profile and program details</span></div>
                  <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[var(--gold)]" /><span>Files added (PDF, cover, supplementary)</span></div>
                  <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[var(--gold)]" /><span>Adviser approval and consent</span></div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[rgba(196,101,74,0.18)] bg-[rgba(196,101,74,0.06)] px-4 py-4 text-sm text-text-secondary">
                Faculty-added theses are automatically approved and published to the archive. No additional review is required.
              </div>

              <div className="mt-4 rounded-2xl border border-[rgba(196,101,74,0.18)] bg-[rgba(196,101,74,0.04)] px-4 py-4 text-sm text-text-secondary">
                Need help? Visit the Support page or contact your department coordinator for submission guidelines.
              </div>
            </section>
          </aside>
        </div>
      </div>
    </FacultyLayout>
  );
}
