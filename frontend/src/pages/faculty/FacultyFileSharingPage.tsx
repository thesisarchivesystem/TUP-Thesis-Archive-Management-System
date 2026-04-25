import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Clock3, Files, Layers3, Paperclip, Search, Upload, Users } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { useAuth } from '../../hooks/useAuth';
import {
  facultyLibraryService,
  type FacultyLibraryItem,
  type FacultyLibraryResponse,
  type ShareUserOption,
} from '../../services/facultyLibraryService';
import { collegeOptions, departmentOptionsByCollege } from '../../constants/academicUnits';

const truncateTitle = (value: string, maxLength = 24) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;

const initialForm = {
  title: '',
  type: 'Book',
  categoryId: '',
  program: '',
  author: '',
  shareScope: 'specific_department' as 'all_colleges' | 'all_departments' | 'specific_college' | 'specific_department' | 'specific_users',
  targetCollege: '',
  targetDepartment: '',
  tags: '',
  schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  fileUrl: '',
  fileName: '',
  file: null as File | null,
  notes: '',
  userSearch: '',
};

export default function FacultyFileSharingPage() {
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [libraryDepartment, setLibraryDepartment] = useState('Faculty Department');
  const [libraryCollege, setLibraryCollege] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryItems, setLibraryItems] = useState<FacultyLibraryItem[]>([]);
  const [userResults, setUserResults] = useState<ShareUserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ShareUserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
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

  const createDepartmentOptions = useMemo(
    () => departmentOptionsByCollege[form.targetCollege || ''] ?? [],
    [form.targetCollege],
  );

  const loadLibrary = async () => {
    const response: FacultyLibraryResponse = await facultyLibraryService.getLibrary();
    setLibraryDepartment(response.department);
    setLibraryCollege(response.college ?? '');
    setLibraryStats({
      ...response.stats,
      last_sync: response.stats.last_sync ?? null,
    });
    setLibraryItems(response.items);
  };

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

    void loadLibrary()
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

  useEffect(() => {
    setForm((current) => ({
      ...current,
      author: current.author || user?.name || '',
      targetCollege: current.targetCollege || libraryCollege,
      targetDepartment: current.targetDepartment || libraryDepartment,
    }));
  }, [libraryCollege, libraryDepartment, user?.name]);

  useEffect(() => {
    if (form.shareScope !== 'specific_users') return;

    const timer = window.setTimeout(() => {
      setUserSearchLoading(true);
      void facultyLibraryService.searchUsers(form.userSearch.trim())
        .then((records) => {
          setUserResults(records.filter((candidate) => !selectedUsers.some((selected) => selected.id === candidate.id)));
        })
        .catch(() => {
          setUserResults([]);
        })
        .finally(() => {
          setUserSearchLoading(false);
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [form.shareScope, form.userSearch, selectedUsers]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      author: user?.name ?? '',
      categoryId: categories[0]?.id ?? '',
      targetCollege: libraryCollege,
      targetDepartment: libraryDepartment,
    });
    setSelectedUsers([]);
    setUserResults([]);
  };

  const handleSave = async (mode: 'draft' | 'share') => {
    setSubmittingAction(mode);
    setError('');
    setSuccess('');

    try {
      await facultyLibraryService.createLibraryItem({
        title: form.title,
        resource_type: form.type,
        abstract: form.notes,
        keywords: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        program: form.program || undefined,
        category_id: form.categoryId,
        school_year: form.schoolYear,
        authors: form.author ? [form.author] : [],
        share_scope: form.shareScope,
        target_college: form.shareScope === 'specific_college' ? form.targetCollege : undefined,
        target_department: form.shareScope === 'specific_department' ? form.targetDepartment : undefined,
        recipient_ids: form.shareScope === 'specific_users' ? selectedUsers.map((entry) => entry.id) : undefined,
        file: form.file,
        file_url: form.fileUrl || undefined,
        file_name: form.fileName || undefined,
        is_draft: mode === 'draft',
      });

      setSuccess(
        mode === 'share'
          ? 'File shared successfully and recipients were saved to the database.'
          : 'File draft saved successfully to the database.',
      );

      setLibraryLoading(true);
      try {
        await loadLibrary();
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
            ?? 'Unable to save this shared file to the backend.',
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const statCards = useMemo(
    () => [
      { label: 'Total Files', value: String(libraryStats.total_files), icon: Files, tone: 'maroon' },
      { label: 'Shared Files', value: String(libraryStats.shared_libraries), icon: Layers3, tone: 'sky' },
      { label: 'Draft Files', value: String(libraryStats.files_needing_review), icon: Clock3, tone: 'gold' },
      {
        label: 'With Attachments',
        value: String(libraryItems.filter((item) => Boolean(item.file_name || item.file_url)).length),
        icon: Paperclip,
        tone: 'sage',
      },
    ],
    [libraryItems, libraryStats],
  );

  const shareScopeHelp = useMemo(() => {
    switch (form.shareScope) {
      case 'all_colleges':
        return 'This file will be shared broadly across all colleges.';
      case 'all_departments':
        return 'This file will be visible to users across every department.';
      case 'specific_college':
        return 'Choose one college to receive this file.';
      case 'specific_department':
        return 'Choose one department to receive this file.';
      case 'specific_users':
        return 'Search and pick the exact users who should receive this file.';
      default:
        return '';
    }
  }, [form.shareScope]);

  return (
    <FacultyLayout
      title="Department File Sharing"
      description="Upload books, manuscripts, dissertations, and research files, then share them by college, department, or specific user."
    >
      <div className="space-y-5">
        {error ? <div className="rounded-xl bg-[rgba(139,35,50,0.08)] px-4 py-3 text-sm font-medium text-[var(--maroon)]">{error}</div> : null}
        {success ? <div className="rounded-xl bg-[rgba(61,139,74,0.12)] px-4 py-3 text-sm font-medium text-[var(--sage)]">{success}</div> : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <article
              key={label}
              className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-text-secondary">{label}</p>
                  <h2 className="mb-0 text-2xl leading-none text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>{value}</h2>
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
                <h2 className="mb-0 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Shared Files</h2>
                <p className="text-sm text-text-secondary">{libraryDepartment}{libraryCollege ? `, ${libraryCollege}` : ''}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {libraryLoading ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary md:col-span-2 xl:col-span-4">
                Loading shared files from the backend...
              </div>
            ) : null}

            {!libraryLoading && !libraryItems.length ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary md:col-span-2 xl:col-span-4">
                No shared files are available yet.
              </div>
            ) : null}

            {libraryItems.map((item) => (
              <article key={item.id} className="min-w-0 rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-[var(--shadow-sm)]">
                <div className="flex h-[150px] flex-col justify-between rounded-[14px] bg-[linear-gradient(180deg,#8b2332_0%,#6f1e2a_100%)] p-3.5 text-white shadow-[var(--shadow-md)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">{item.department || 'Faculty Library'}</div>
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {item.is_draft ? 'Draft' : item.type}
                    </span>
                  </div>
                  <h3 className="mb-0 text-lg leading-tight" style={{ fontFamily: 'DM Serif Display, serif' }}>{item.title}</h3>
                </div>
                <div className="space-y-2 px-1 pt-3">
                  <div className="truncate text-base font-semibold text-text-primary">{truncateTitle(item.title)}</div>
                  <div className="text-sm text-text-secondary">{item.author || 'Unknown author'}</div>
                  <div className="text-xs text-text-secondary">{item.share_scope_label}</div>
                  {item.shared_with_count ? <div className="text-xs text-text-secondary">Recipients: {item.shared_with_count}</div> : null}
                  <div className="text-xs text-text-secondary">
                    {item.file_name || 'No file attached'}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)] md:p-5">
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
                <h2 className="mb-0 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Add Department File</h2>
                <ChevronDown size={18} className={`transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>

          {formOpen ? (
            <form id="faculty-library-form" className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
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
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.program}
                    onChange={(event) => setForm({ ...form, program: event.target.value })}
                    placeholder="BS Computer Science"
                  />
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
                    placeholder="Author or uploader"
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
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Share Scope</span>
                  <select
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.shareScope}
                    onChange={(event) => setForm({
                      ...form,
                      shareScope: event.target.value as typeof form.shareScope,
                      userSearch: '',
                    })}
                  >
                    <option value="all_colleges">All Colleges</option>
                    <option value="all_departments">All Departments</option>
                    <option value="specific_college">Specific College</option>
                    <option value="specific_department">Specific Department</option>
                    <option value="specific_users">Specific User</option>
                  </select>
                </label>

                <div className="block md:col-span-2 xl:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Sharing Rule</span>
                  <div className="rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-sm text-text-secondary">
                    {shareScopeHelp}
                  </div>
                </div>

                {form.shareScope === 'specific_college' ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">Target College</span>
                    <select
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.targetCollege}
                      onChange={(event) => setForm({ ...form, targetCollege: event.target.value, targetDepartment: '' })}
                    >
                      <option value="">Select college</option>
                      {collegeOptions.map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {form.shareScope === 'specific_department' ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-text-secondary">College</span>
                      <select
                        className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                        value={form.targetCollege}
                        onChange={(event) => setForm({ ...form, targetCollege: event.target.value, targetDepartment: '' })}
                      >
                        <option value="">Select college</option>
                        {collegeOptions.map((college) => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-text-secondary">Target Department</span>
                      {createDepartmentOptions.length ? (
                        <select
                          className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                          value={form.targetDepartment}
                          onChange={(event) => setForm({ ...form, targetDepartment: event.target.value })}
                        >
                          <option value="">Select department</option>
                          {createDepartmentOptions.map((department) => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                          value={form.targetDepartment}
                          onChange={(event) => setForm({ ...form, targetDepartment: event.target.value })}
                          placeholder="Computer Studies Department"
                        />
                      )}
                    </label>
                  </>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">Attachment</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition file:mr-3 file:rounded-xl file:border-0 file:bg-[rgba(139,35,50,0.1)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--maroon)]"
                    type="file"
                    onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null, fileName: event.target.files?.[0]?.name ?? form.fileName })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-secondary">File URL</span>
                  <input
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                    value={form.fileUrl}
                    onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
                    placeholder="Optional public file URL"
                  />
                </label>

                <label className="block md:col-span-2 xl:col-span-3">
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

                {form.shareScope === 'specific_users' ? (
                  <div className="block md:col-span-2 xl:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">Search Specific Users</span>
                    <div className="rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Search size={16} className="text-text-secondary" />
                        <input
                          className="w-full bg-transparent text-base text-text-primary outline-none"
                          value={form.userSearch}
                          onChange={(event) => setForm({ ...form, userSearch: event.target.value })}
                          placeholder="Search by name or email"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                          <Users size={16} />
                          Search Results
                        </div>
                        <div className="space-y-2">
                          {userSearchLoading ? <div className="text-sm text-text-secondary">Searching users...</div> : null}
                          {!userSearchLoading && !userResults.length ? <div className="text-sm text-text-secondary">No users found yet.</div> : null}
                          {userResults.map((candidate) => (
                            <button
                              key={candidate.id}
                              type="button"
                              className="flex w-full items-start justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-left"
                              onClick={() => {
                                setSelectedUsers((current) => [...current, candidate]);
                                setUserResults((current) => current.filter((entry) => entry.id !== candidate.id));
                              }}
                            >
                              <div>
                                <div className="text-sm font-semibold text-text-primary">{candidate.name}</div>
                                <div className="text-xs text-text-secondary">{candidate.email}</div>
                                <div className="text-xs text-text-secondary">{candidate.role} • {candidate.department || 'No department'}</div>
                              </div>
                              <span className="text-xs font-semibold text-[var(--maroon)]">Add</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-3">
                        <div className="mb-2 text-sm font-semibold text-text-primary">Selected Users</div>
                        <div className="space-y-2">
                          {!selectedUsers.length ? <div className="text-sm text-text-secondary">No users selected yet.</div> : null}
                          {selectedUsers.map((candidate) => (
                            <div key={candidate.id} className="flex items-start justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
                              <div>
                                <div className="text-sm font-semibold text-text-primary">{candidate.name}</div>
                                <div className="text-xs text-text-secondary">{candidate.email}</div>
                              </div>
                              <button
                                type="button"
                                className="text-xs font-semibold text-[var(--maroon)]"
                                onClick={() => {
                                  setSelectedUsers((current) => current.filter((entry) => entry.id !== candidate.id));
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-secondary">Abstract / Notes</span>
                <textarea
                  className="min-h-[132px] w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Short description to help users understand the resource."
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-2xl border border-[var(--input-border)] bg-white px-6 py-3 text-sm font-semibold text-text-primary"
                  onClick={() => void handleSave('draft')}
                  disabled={
                    submittingAction !== null
                    || categoriesLoading
                    || !form.categoryId
                    || !form.title
                    || (form.shareScope === 'specific_department' && !form.targetDepartment)
                    || (form.shareScope === 'specific_college' && !form.targetCollege)
                    || (form.shareScope === 'specific_users' && !selectedUsers.length)
                  }
                >
                  {submittingAction === 'draft' ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--maroon)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)]"
                  onClick={() => void handleSave('share')}
                  disabled={
                    submittingAction !== null
                    || categoriesLoading
                    || !form.categoryId
                    || !form.title
                    || (form.shareScope === 'specific_department' && !form.targetDepartment)
                    || (form.shareScope === 'specific_college' && !form.targetCollege)
                    || (form.shareScope === 'specific_users' && !selectedUsers.length)
                  }
                >
                  {submittingAction === 'share' ? 'Sharing...' : 'Share File'}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </FacultyLayout>
  );
}
