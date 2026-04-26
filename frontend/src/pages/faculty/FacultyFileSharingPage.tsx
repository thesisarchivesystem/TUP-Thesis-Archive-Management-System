import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, Clock3, Files, Layers3, Paperclip, Search, Upload, UserRound, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { useAuth } from '../../hooks/useAuth';
import {
  facultyLibraryService,
  type FacultyLibraryItem,
  type FacultyLibraryResponse,
  type ShareUserOption,
} from '../../services/facultyLibraryService';

const truncateTitle = (value: string, maxLength = 24) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;

const getCurrentSchoolYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

const initialForm = {
  title: '',
  type: 'Book',
  categoryIds: [] as string[],
  college: '',
  department: '',
  author: '',
  shareScope: 'specific_department' as 'all_colleges' | 'all_departments' | 'specific_college' | 'specific_department' | 'specific_users',
  targetCollege: '',
  targetDepartment: '',
  schoolYear: getCurrentSchoolYear(),
  fileName: '',
  file: null as File | null,
  notes: '',
  userSearch: '',
};

export default function FacultyFileSharingPage() {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state as { draft?: FacultyLibraryItem } | null;
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [libraryDepartment, setLibraryDepartment] = useState('');
  const [libraryCollege, setLibraryCollege] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryItems, setLibraryItems] = useState<FacultyLibraryItem[]>([]);
  const [userResults, setUserResults] = useState<ShareUserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ShareUserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const [departmentsByCollege, setDepartmentsByCollege] = useState<Record<string, string[]>>({});
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
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_CATEGORY_SELECTIONS = 5;
  const filteredUserResults = userResults.filter((candidate) => {
    const query = form.userSearch.trim().toLowerCase();
    if (!query) return true;

    return [
      candidate.name,
      candidate.email,
      candidate.role,
      candidate.department,
    ].join(' ').toLowerCase().includes(query);
  });
  const showUserResults = form.shareScope === 'specific_users' && form.userSearch.trim().length > 0;

  const createDepartmentOptions = useMemo(
    () => departmentsByCollege[form.targetCollege || ''] ?? [],
    [departmentsByCollege, form.targetCollege],
  );

  const loadLibrary = async () => {
    const response: FacultyLibraryResponse = await facultyLibraryService.getLibrary();
    setLibraryDepartment(response.department);
    setLibraryCollege(response.college ?? '');
    setLibraryStats({
      ...response.stats,
      last_sync: response.stats.last_sync ?? null,
    });
    setAvailableColleges(response.share_options?.colleges ?? []);
    setDepartmentsByCollege(response.share_options?.departments_by_college ?? {});
    setLibraryItems(response.items);
  };

  useEffect(() => {
    let isMounted = true;

    void categoryService.list()
      .then((records) => {
        if (!isMounted) return;
        setCategories(records);
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
      college: current.college || libraryCollege,
      department: current.department || libraryDepartment,
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

  useEffect(() => {
    const draft = locationState?.draft;
    if (!draft) return;

    setEditingDraftId(draft.id);
    setFormOpen(true);
    setForm({
      title: draft.title ?? '',
      type: draft.type ?? 'Book',
      categoryIds: draft.category_ids?.length
        ? draft.category_ids
        : [draft.category_id ?? ''].filter(Boolean),
      college: draft.college ?? '',
      department: draft.department ?? '',
      author: draft.authors?.filter(Boolean).join(', ') || draft.author || '',
      shareScope: (draft.share_scope as typeof initialForm.shareScope) ?? 'specific_department',
      targetCollege: draft.target_college ?? '',
      targetDepartment: draft.target_department ?? '',
      schoolYear: draft.school_year ?? getCurrentSchoolYear(),
      fileName: draft.file_name ?? '',
      file: null,
      notes: draft.abstract ?? '',
      userSearch: '',
    });
    setSelectedUsers(draft.shared_with_users ?? []);
    setUserResults([]);
  }, [locationState?.draft]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      author: user?.name ?? '',
      college: libraryCollege,
      department: libraryDepartment,
      targetCollege: libraryCollege,
      targetDepartment: libraryDepartment,
    });
    setEditingDraftId(null);
    setSelectedUsers([]);
    setUserResults([]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleSave = async (mode: 'draft' | 'share') => {
    setSubmittingAction(mode);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: form.title,
        resource_type: form.type,
        abstract: form.notes,
        college: form.college || undefined,
        department: form.department || undefined,
        category_id: form.categoryIds[0] ?? '',
        category_ids: form.categoryIds,
        school_year: form.schoolYear,
        authors: form.author ? [form.author] : [],
        share_scope: form.shareScope,
        target_college: form.shareScope === 'specific_college' ? form.targetCollege : undefined,
        target_department: form.shareScope === 'specific_department' ? form.targetDepartment : undefined,
        recipient_ids: form.shareScope === 'specific_users' ? selectedUsers.map((entry) => entry.id) : undefined,
        file: form.file,
        file_name: form.fileName || undefined,
        is_draft: mode === 'draft',
      };
      const response = editingDraftId
        ? await facultyLibraryService.updateLibraryItem(editingDraftId, payload)
        : await facultyLibraryService.createLibraryItem(payload);

      if (!response?.data?.id) {
        throw new Error('The file was submitted, but no database record ID was returned.');
      }

      setSuccess(
        mode === 'share'
          ? (editingDraftId ? 'Draft updated and shared successfully.' : 'File shared successfully and recipients were saved to the database.')
          : (editingDraftId ? 'Draft updated successfully in the database.' : 'File draft saved successfully to the database.'),
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
              <Link
                key={item.id}
                to={`/faculty/students/${encodeURIComponent(item.id)}`}
                state={{ file: item }}
                className="min-w-0 rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-[var(--shadow-sm)] transition-transform duration-200 hover:-translate-y-1"
              >
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
              </Link>
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
              <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(139,35,50,0.05),rgba(139,35,50,0.01))] p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="mb-1 text-lg text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>File Details</h3>
                    <p className="mb-0 text-sm text-text-secondary">Add the core metadata so the file is easy to find in the department archive.</p>
                  </div>
                  <div className="inline-flex w-fit items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--maroon)] shadow-[var(--shadow-sm)]">
                    Department Library Entry
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block xl:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Title</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      placeholder="Enter file title"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Files size={14} className="text-[var(--maroon)]" /> Type</span>
                    </span>
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
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Clock3 size={14} className="text-[var(--maroon)]" /> School Year</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.schoolYear}
                      readOnly
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> College</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.college}
                      readOnly
                      placeholder="No college assigned"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Department</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none"
                      value={form.department}
                      readOnly
                      placeholder="No department assigned"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><UserRound size={14} className="text-[var(--maroon)]" /> Author / Owner</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.author}
                      readOnly
                      placeholder="Current account owner"
                    />
                  </label>

                  <div className="block md:col-span-2 xl:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Layers3 size={14} className="text-[var(--maroon)]" /> Category</span>
                    </span>
                    <details className="student-upload-multi-dropdown faculty-file-category-dropdown">
                      <summary className="student-upload-multi-dropdown-trigger">
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
                      <div className="student-upload-multi-dropdown-menu faculty-file-category-menu">
                        {!categories.length ? <div className="student-upload-search-empty">No categories available.</div> : null}
                        {categories.map((category) => (
                          <label key={category.id} className={`student-upload-option-chip faculty-file-category-option${form.categoryIds.includes(category.id) ? ' active' : ''}`}>
                            <input
                              type="checkbox"
                              checked={form.categoryIds.includes(category.id)}
                              disabled={categoriesLoading || !categories.length}
                              onChange={() => setForm((current) => {
                                if (current.categoryIds.includes(category.id)) {
                                  return {
                                    ...current,
                                    categoryIds: current.categoryIds.filter((id) => id !== category.id),
                                  };
                                }

                                if (current.categoryIds.length >= MAX_CATEGORY_SELECTIONS) {
                                  return current;
                                }

                                return {
                                  ...current,
                                  categoryIds: [...current.categoryIds, category.id],
                                };
                              })}
                            />
                            <span>{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-card-alt)] p-4 md:p-5">
                <div className="mb-4">
                  <h3 className="mb-1 text-lg text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Sharing Setup</h3>
                  <p className="mb-0 text-sm text-text-secondary">Choose where this file should appear and who should be able to access it.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Upload size={14} className="text-[var(--maroon)]" /> Share Scope</span>
                    </span>
                    <select
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.shareScope}
                      onChange={(event) => setForm({
                        ...form,
                        shareScope: event.target.value as typeof form.shareScope,
                        targetCollege: event.target.value === 'specific_college' || event.target.value === 'specific_department' ? form.targetCollege : '',
                        targetDepartment: event.target.value === 'specific_department' ? form.targetDepartment : '',
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

                {form.shareScope === 'specific_college' ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Target College</span>
                    </span>
                    <select
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.targetCollege}
                      onChange={(event) => setForm({ ...form, targetCollege: event.target.value, targetDepartment: '' })}
                    >
                      <option value="">Select college</option>
                      {availableColleges.map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {form.shareScope === 'specific_department' ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-text-secondary">
                        <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> College</span>
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                        value={form.targetCollege}
                        onChange={(event) => setForm({ ...form, targetCollege: event.target.value, targetDepartment: '' })}
                      >
                        <option value="">Select college</option>
                        {availableColleges.map((college) => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-text-secondary">
                        <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Target Department</span>
                      </span>
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

                {form.shareScope === 'specific_users' ? (
                  <div className="block md:col-span-2 xl:col-span-3">
                    <label className="student-upload-field full">
                      <span><UserRound size={14} /> Specific User</span>
                      <div className="student-upload-searchbox">
                        <input
                          value={form.userSearch}
                          onChange={(event) => setForm({ ...form, userSearch: event.target.value })}
                          placeholder="Search user by name, email, role, or department"
                        />
                        {showUserResults ? (
                          <div className="student-upload-search-results">
                            {userSearchLoading ? <div className="student-upload-search-empty">Searching users...</div> : null}
                            {!userSearchLoading && filteredUserResults.map((candidate) => (
                              <button
                                key={candidate.id}
                                type="button"
                                className="student-upload-search-option"
                                onClick={() => {
                                  setSelectedUsers((current) => [...current, candidate]);
                                  setUserResults((current) => current.filter((entry) => entry.id !== candidate.id));
                                  setForm((current) => ({ ...current, userSearch: '' }));
                                }}
                              >
                                <strong>{candidate.name}</strong>
                                <span>{candidate.email} - {candidate.role}{candidate.department ? ` - ${candidate.department}` : ''}</span>
                              </button>
                            ))}
                            {!userSearchLoading && !filteredUserResults.length ? <div className="student-upload-search-empty">No user found.</div> : null}
                          </div>
                        ) : null}
                        {selectedUsers.length ? (
                          <div className="student-upload-author-tags">
                            {selectedUsers.map((candidate) => (
                              <span className="student-upload-author-chip" key={candidate.id}>
                                {candidate.name} - {candidate.role}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUsers((current) => current.filter((entry) => entry.id !== candidate.id));
                                  }}
                                  aria-label={`Remove ${candidate.name}`}
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <small>Search and choose one or more specific users.</small>
                    </label>
                  </div>
                ) : null}

                {false ? (
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
              </div>

              <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(139,35,50,0.05),rgba(139,35,50,0.01))] p-4 md:p-5">
                <div className="mb-4">
                  <h3 className="mb-1 text-lg text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>Attachment and Notes</h3>
                  <p className="mb-0 text-sm text-text-secondary">Upload the file, add a filename if needed, and include tags or context for recipients.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Paperclip size={14} className="text-[var(--maroon)]" /> File Name</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.fileName}
                      onChange={(event) => setForm({ ...form, fileName: event.target.value })}
                      placeholder="library-resource.pdf"
                    />
                  </label>

                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Upload size={14} className="text-[var(--maroon)]" /> Attachment</span>
                    </span>
                    <div className="student-upload-file-row">
                      <div className="student-upload-file-label">{form.file?.name || 'No file chosen'}</div>
                      <div className="student-upload-file-actions">
                        <label className="student-upload-file-btn">
                          <input
                            ref={attachmentInputRef}
                            type="file"
                            hidden
                            onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })}
                          />
                          Choose File
                        </label>
                        {form.file ? (
                          <button
                            type="button"
                            className="student-upload-file-remove"
                            onClick={() => {
                              setForm({ ...form, file: null });
                              if (attachmentInputRef.current) attachmentInputRef.current.value = '';
                            }}
                            aria-label="Remove selected file"
                          >
                            x
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </label>

                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Abstract / Notes</span>
                    </span>
                    <textarea
                      className="min-h-[132px] w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      placeholder="Short description to help users understand the resource."
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-2xl border border-[var(--input-border)] bg-white px-6 py-3 text-sm font-semibold text-text-primary"
                  onClick={() => void handleSave('draft')}
                  disabled={
                    submittingAction !== null
                    || categoriesLoading
                    || !form.categoryIds.length
                    || !form.title
                    || !form.college
                    || !form.department
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
                    || !form.categoryIds.length
                    || !form.title
                    || !form.college
                    || !form.department
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
