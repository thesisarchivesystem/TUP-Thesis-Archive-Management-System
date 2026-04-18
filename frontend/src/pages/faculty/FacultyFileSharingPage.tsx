import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Clock3, Files, Layers3, Package2, Upload } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { useAuth } from '../../hooks/useAuth';
import { facultyLibraryService, type FacultyLibraryItem } from '../../services/facultyLibraryService';

const truncateTitle = (value: string, maxLength = 24) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;

const formatSyncLabel = (value?: string | null) => {
  if (!value) return 'No sync yet';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'No sync yet';

  const diffHours = Math.max(1, Math.round((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
};

const initialForm = {
  title: '',
  type: 'Book',
  categoryId: '',
  program: 'BS Computer Science',
  department: 'Computer Studies Department',
  author: '',
  visibility: 'Same Faculty Only',
  tags: 'AI, Analytics, Security',
  schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  fileUrl: '',
  fileName: '',
  notes: '',
};

export default function FacultyFileSharingPage() {
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [libraryDepartment, setLibraryDepartment] = useState('Faculty Department');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryItems, setLibraryItems] = useState<FacultyLibraryItem[]>([]);
  const [libraryStats, setLibraryStats] = useState({
    total_files: 0,
    shared_libraries: 0,
    files_needing_review: 0,
    storage_used: 0,
    last_sync: null as string | null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittingAction, setSubmittingAction] = useState<'draft' | 'share' | null>(null);

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
        setError('Unable to load backend categories for this form.');
      })
      .finally(() => {
        if (isMounted) setCategoriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void facultyLibraryService.getLibrary()
      .then((response) => {
        if (!isMounted) return;
        setLibraryDepartment(response.department);
        setLibraryStats({
          ...response.stats,
          last_sync: response.stats.last_sync ?? null,
        });
        setLibraryItems(response.items);
      })
      .catch(() => {
        if (!isMounted) return;
        setError((current) => current || 'Unable to load library items from the backend.');
      })
      .finally(() => {
        if (isMounted) setLibraryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setForm({
      ...initialForm,
      author: user?.name ?? '',
      categoryId: categories[0]?.id ?? '',
    });
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      author: current.author || user?.name || '',
    }));
  }, [user?.name]);

  const handleSave = async (mode: 'draft' | 'share') => {
    setSubmittingAction(mode);
    setError('');
    setSuccess('');

    try {
      await facultyLibraryService.createLibraryItem({
        title: form.title,
        abstract: form.notes,
        keywords: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        program: form.program,
        category_id: form.categoryId,
        school_year: form.schoolYear,
        authors: form.author ? [form.author] : [],
        file_url: form.fileUrl || undefined,
        file_name: form.fileName || undefined,
      });

      setSuccess(
        mode === 'share'
          ? `Library item shared within ${libraryDepartment}.`
          : `Library item saved to ${libraryDepartment}.`,
      );

      setLibraryLoading(true);
      try {
        const response = await facultyLibraryService.getLibrary();
        setLibraryDepartment(response.department);
        setLibraryStats({
          ...response.stats,
          last_sync: response.stats.last_sync ?? null,
        });
        setLibraryItems(response.items);
      } finally {
        setLibraryLoading(false);
      }

      resetForm();
      setFormOpen(false);
    } catch (err: any) {
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.error
            ?? err.response?.data?.message
            ?? 'Unable to save this library item to the backend.',
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const statCards = useMemo(
    () => [
      { label: 'Total Files', value: String(libraryStats.total_files), icon: Files, tone: 'maroon' },
      { label: 'Shared Libraries', value: String(libraryStats.shared_libraries), icon: Layers3, tone: 'sky' },
      { label: 'Files Needing Review', value: String(libraryStats.files_needing_review), icon: Clock3, tone: 'gold' },
      { label: 'Storage Used', value: `${libraryStats.storage_used}%`, icon: Package2, tone: 'terracotta' },
      { label: 'Last Sync', value: formatSyncLabel(libraryStats.last_sync), icon: Clock3, tone: 'sage' },
    ],
    [libraryStats],
  );

  return (
    <FacultyLayout
      title="Department File Sharing"
      description={`Upload and share research files within the ${libraryDepartment}. Student-facing archive pages do not use this library feed.`}
    >
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}
        {success ? <div className="rounded-xl bg-[rgba(61,139,74,0.12)] px-4 py-3 text-sm font-medium text-[var(--sage)]">{success}</div> : null}

        <section className="grid gap-3 xl:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <article
              key={label}
              className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-text-secondary">{label}</p>
                  <h2 className="mb-0 text-3xl leading-none text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>{value}</h2>
                </div>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background:
                      tone === 'maroon' ? 'rgba(139,35,50,0.08)'
                        : tone === 'sky' ? 'rgba(74,143,181,0.10)'
                          : tone === 'gold' ? 'rgba(201,150,58,0.10)'
                            : tone === 'terracotta' ? 'rgba(196,101,74,0.10)'
                              : 'rgba(61,139,74,0.10)',
                    color:
                      tone === 'maroon' ? 'var(--maroon)'
                        : tone === 'sky' ? 'var(--sky)'
                          : tone === 'gold' ? 'var(--gold)'
                            : tone === 'terracotta' ? 'var(--terracotta)'
                              : 'var(--sage)',
                  }}
                >
                  <Icon size={18} />
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(139,35,50,0.08)] text-[var(--maroon)]">
                <BookOpen size={20} />
              </span>
              <div>
                <h2 className="mb-0 text-2xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Department Library</h2>
                <p className="text-sm text-text-secondary">{libraryDepartment}</p>
              </div>
            </div>
            <button type="button" className="text-sm font-semibold text-[var(--maroon)]">
              Manage Library -&gt;
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {libraryLoading ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary md:col-span-2 xl:col-span-5">
                Loading library items from the backend...
              </div>
            ) : null}

            {!libraryLoading && !libraryItems.length ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary md:col-span-2 xl:col-span-5">
                No department library items are available yet.
              </div>
            ) : null}

            {libraryItems.slice(0, 5).map((item) => (
              <article key={item.id} className="min-w-0">
                <div className="flex h-[184px] flex-col justify-between rounded-[14px] bg-[linear-gradient(180deg,#8b2332_0%,#6f1e2a_100%)] p-3.5 text-white shadow-[var(--shadow-md)]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">{item.department || 'Faculty Library'}</div>
                  <h3 className="mb-0 text-lg leading-tight" style={{ fontFamily: 'DM Serif Display, serif' }}>{item.title}</h3>
                </div>
                <div className="px-1 pt-2.5">
                  <div className="truncate text-base font-semibold text-text-primary">{truncateTitle(item.title)}</div>
                  <div className="text-sm text-text-secondary">
                    {(item.author || 'Unknown author')}
                    {item.year ? `, ${item.year}` : ''}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => setFormOpen((current) => !current)}
              className="flex items-center gap-4 text-left"
              aria-expanded={formOpen}
              aria-controls="faculty-library-form"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(139,35,50,0.06)] text-[var(--maroon)]">
                <Upload size={18} />
              </span>
              <div className="flex items-center gap-3">
                <h2 className="mb-0 text-2xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Add Department File</h2>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            <button type="button" className="text-sm font-semibold text-[var(--maroon)]">
              View Policies -&gt;
            </button>
          </div>

          {formOpen ? (
            <form
              id="faculty-library-form"
              className="mt-6 space-y-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Title</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Enter file title"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Type</span>
                  <select
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                  >
                    <option>Book</option>
                    <option>Dissertation</option>
                    <option>Research File</option>
                    <option>Manuscript</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Category</span>
                  <select
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.categoryId}
                    onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                    disabled={categoriesLoading || !categories.length}
                  >
                    {!categories.length ? <option value="">No categories available</option> : null}
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Program</span>
                  <select
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.program}
                    onChange={(event) => setForm({ ...form, program: event.target.value })}
                  >
                    <option>BS Computer Science</option>
                    <option>BS Information Technology</option>
                    <option>Master in Information Systems</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Department</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none"
                    value={libraryDepartment}
                    disabled
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Author / Owner</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.author}
                    onChange={(event) => setForm({ ...form, author: event.target.value })}
                    placeholder="Author or submitting admin"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">School Year</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.schoolYear}
                    onChange={(event) => setForm({ ...form, schoolYear: event.target.value })}
                    placeholder="2026-2027"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Visibility</span>
                  <select
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.visibility}
                    onChange={(event) => setForm({ ...form, visibility: event.target.value })}
                  >
                    <option>Same Faculty Only</option>
                    <option>All Faculty</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">File URL</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.fileUrl}
                    onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
                    placeholder="https://example.com/library-item.pdf"
                  />
                </label>

                <label className="block md:col-span-2 xl:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">File Name</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.fileName}
                    onChange={(event) => setForm({ ...form, fileName: event.target.value })}
                    placeholder="library-resource.pdf"
                  />
                </label>

                <label className="block md:col-span-2 xl:col-span-3">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Tags</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    placeholder="AI, Analytics, Security"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-secondary">Abstract / Notes</span>
                <textarea
                  className="min-h-[132px] w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Short description to help admins understand the resource."
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-2xl border border-[var(--input-border)] bg-white px-6 py-3 text-sm font-semibold text-text-primary"
                  onClick={() => void handleSave('draft')}
                  disabled={submittingAction !== null || categoriesLoading || !form.categoryId || !form.title}
                >
                  {submittingAction === 'draft' ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--maroon)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)]"
                  onClick={() => void handleSave('share')}
                  disabled={submittingAction !== null || categoriesLoading || !form.categoryId || !form.title}
                >
                  {submittingAction === 'share' ? 'Sharing...' : 'Share With Department'}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </FacultyLayout>
  );
}
