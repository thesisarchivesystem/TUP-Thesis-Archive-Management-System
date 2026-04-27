import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, Clock3, Files, Layers3, Paperclip, Search, Upload, UserRound, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import ThesisArchiveCover from '../../components/thesis/ThesisArchiveCover';
import { categoryService, type CategoryOption } from '../../services/categoryService';
import { useAuth } from '../../hooks/useAuth';
import {
  facultyLibraryService,
  type FacultyLibraryItem,
  type FacultyLibraryResponse,
  type ShareUserOption,
} from '../../services/facultyLibraryService';

const renderShareFieldWarning = (message: string) => (
  <div className="faculty-submission-review-warning faculty-file-share-warning" role="alert">
    <span className="faculty-submission-review-warning-icon">!</span>
    <span>{message}</span>
  </div>
);

const truncateTitle = (value: string, maxLength = 24) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

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

type ShareValidationField =
  | 'title'
  | 'category'
  | 'targetCollege'
  | 'targetDepartment'
  | 'specificUser'
  | 'fileName'
  | 'attachment'
  | 'notes'
  | null;

export default function FacultyFileSharingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [shareWarning, setShareWarning] = useState('');
  const [shareValidationField, setShareValidationField] = useState<ShareValidationField>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const titleFieldRef = useRef<HTMLLabelElement | null>(null);
  const categoryFieldRef = useRef<HTMLDivElement | null>(null);
  const targetCollegeFieldRef = useRef<HTMLLabelElement | null>(null);
  const targetDepartmentFieldRef = useRef<HTMLLabelElement | null>(null);
  const specificUserFieldRef = useRef<HTMLDivElement | null>(null);
  const fileNameFieldRef = useRef<HTMLLabelElement | null>(null);
  const attachmentFieldRef = useRef<HTMLLabelElement | null>(null);
  const notesFieldRef = useRef<HTMLLabelElement | null>(null);
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
  const visibleLibraryItems = useMemo(() => libraryItems.slice(0, 6), [libraryItems]);

  const getMissingShareField = () => {
    if (!form.title.trim()) {
      return { field: 'title' as const, message: 'Please fill out the required field: title.' };
    }

    if (!form.categoryIds.length) {
      return { field: 'category' as const, message: 'Please fill out the required field: category.' };
    }

    if (form.shareScope === 'specific_college' && !form.targetCollege.trim()) {
      return { field: 'targetCollege' as const, message: 'Please fill out the required field: target college.' };
    }

    if (form.shareScope === 'specific_department' && !form.targetCollege.trim()) {
      return { field: 'targetCollege' as const, message: 'Please fill out the required field: college.' };
    }

    if (form.shareScope === 'specific_department' && !form.targetDepartment.trim()) {
      return { field: 'targetDepartment' as const, message: 'Please fill out the required field: target department.' };
    }

    if (form.shareScope === 'specific_users' && !selectedUsers.length) {
      return { field: 'specificUser' as const, message: 'Please fill out the required field: specific user.' };
    }

    if (!form.fileName.trim()) {
      return { field: 'fileName' as const, message: 'Please fill out the required field: file name.' };
    }

    if (!form.file) {
      return { field: 'attachment' as const, message: 'Please fill out the required field: attachment.' };
    }

    if (!form.notes.trim()) {
      return { field: 'notes' as const, message: 'Please fill out the required field: abstract / notes.' };
    }

    return null;
  };

  const scrollToValidationField = (field: ShareValidationField) => {
    const fieldMap: Record<Exclude<ShareValidationField, null>, HTMLElement | null> = {
      title: titleFieldRef.current,
      category: categoryFieldRef.current,
      targetCollege: targetCollegeFieldRef.current,
      targetDepartment: targetDepartmentFieldRef.current,
      specificUser: specificUserFieldRef.current,
      fileName: fileNameFieldRef.current,
      attachment: attachmentFieldRef.current,
      notes: notesFieldRef.current,
    };

    fieldMap[field]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
    setShareWarning('');
    setShareValidationField(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleSave = async (mode: 'draft' | 'share') => {
    if (mode === 'share') {
      const missingField = getMissingShareField();
      if (missingField) {
        setShareValidationField(missingField.field);
        setShareWarning(missingField.message);
        scrollToValidationField(missingField.field);
        return;
      }
    }

    setSubmittingAction(mode);
    setError('');
    setSuccess('');
    setShareWarning('');
    setShareValidationField(null);

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

        <section className="student-submissions-stats">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="student-submissions-stat-card">
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <span
                className="student-submissions-stat-icon"
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
            {!libraryLoading && libraryItems.length > 6 ? (
              <button
                type="button"
                className="vpaa-button-ghost faculty-shared-files-toggle"
                onClick={() => navigate('/faculty/students/all')}
              >
                View All
              </button>
            ) : null}
          </div>

          <div className="faculty-shared-files-grid">
            {libraryLoading ? (
              <div className="faculty-shared-files-empty rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary">
                Loading shared files...
              </div>
            ) : null}

            {!libraryLoading && !libraryItems.length ? (
              <div className="faculty-shared-files-empty rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary">
                No shared files are available yet.
              </div>
            ) : null}

            {visibleLibraryItems.map((item) => (
              <Link
                key={item.id}
                to={`/faculty/students/${encodeURIComponent(item.id)}`}
                state={{ file: item }}
                className="faculty-shared-file-card"
              >
                <ThesisArchiveCover
                  className="faculty-shared-file-cover"
                  compact
                  title={truncateTitle(item.title, 18)}
                  college={item.college}
                  department={item.department || 'Faculty Library'}
                  author={item.author || item.authors?.filter(Boolean).join(', ') || 'Unknown author'}
                  authors={item.authors ?? undefined}
                  year={item.year || item.school_year || ''}
                  categories={item.categories?.length
                    ? item.categories
                    : (item.keywords?.length
                      ? item.keywords
                      : [item.category, item.type, item.program]
                    )
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((tag, index) => ({ id: `${item.id}-tag-${index}`, name: String(tag) }))}
                />
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
                  <label className={`block xl:col-span-2${shareValidationField === 'title' ? ' student-upload-field has-error' : ''}`} ref={titleFieldRef}>
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Title</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.title}
                      onChange={(event) => {
                        setShareWarning('');
                        setShareValidationField((current) => (current === 'title' ? null : current));
                        setForm({ ...form, title: event.target.value });
                      }}
                      placeholder="Enter file title"
                    />
                    {shareValidationField === 'title' ? renderShareFieldWarning(shareWarning) : null}
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

                  <div className={`block md:col-span-2 xl:col-span-2${shareValidationField === 'category' ? ' student-upload-field has-error' : ''}`} ref={categoryFieldRef}>
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
                                setShareWarning('');
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
                    {shareValidationField === 'category' ? renderShareFieldWarning(shareWarning) : null}
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
                      onChange={(event) => {
                        setShareWarning('');
                        setForm({
                          ...form,
                          shareScope: event.target.value as typeof form.shareScope,
                          targetCollege: event.target.value === 'specific_college' || event.target.value === 'specific_department' ? form.targetCollege : '',
                          targetDepartment: event.target.value === 'specific_department' ? form.targetDepartment : '',
                          userSearch: '',
                        });
                      }}
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
                          onChange={(event) => {
                            setShareWarning('');
                            setShareValidationField((current) => (current === 'targetCollege' ? null : current));
                            setForm({ ...form, targetCollege: event.target.value, targetDepartment: '' });
                          }}
                    >
                      <option value="">Select college</option>
                      {availableColleges.map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                    {shareValidationField === 'targetCollege' ? renderShareFieldWarning(shareWarning) : null}
                  </label>
                ) : null}

                {form.shareScope === 'specific_department' ? (
                  <>
                    <label className={`block${shareValidationField === 'targetCollege' ? ' student-upload-field has-error' : ''}`} ref={targetCollegeFieldRef}>
                      <span className="mb-2 block text-sm font-medium text-text-secondary">
                        <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> College</span>
                      </span>
                      <select
                        className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                        value={form.targetCollege}
                        onChange={(event) => {
                          setShareWarning('');
                          setShareValidationField((current) => (current === 'targetCollege' ? null : current));
                          setForm({ ...form, targetCollege: event.target.value, targetDepartment: '' });
                        }}
                      >
                        <option value="">Select college</option>
                        {availableColleges.map((college) => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                      {shareValidationField === 'targetCollege' ? renderShareFieldWarning(shareWarning) : null}
                    </label>

                    <label className={`block${shareValidationField === 'targetDepartment' ? ' student-upload-field has-error' : ''}`} ref={targetDepartmentFieldRef}>
                      <span className="mb-2 block text-sm font-medium text-text-secondary">
                        <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Target Department</span>
                      </span>
                      {createDepartmentOptions.length ? (
                        <select
                          className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                          value={form.targetDepartment}
                          onChange={(event) => {
                            setShareWarning('');
                            setShareValidationField((current) => (current === 'targetDepartment' ? null : current));
                            setForm({ ...form, targetDepartment: event.target.value });
                          }}
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
                          onChange={(event) => {
                            setShareWarning('');
                            setShareValidationField((current) => (current === 'targetDepartment' ? null : current));
                            setForm({ ...form, targetDepartment: event.target.value });
                          }}
                          placeholder="Computer Studies Department"
                        />
                      )}
                      {shareValidationField === 'targetDepartment' ? renderShareFieldWarning(shareWarning) : null}
                    </label>
                  </>
                ) : null}

                {form.shareScope === 'specific_users' ? (
                  <div className="block md:col-span-2 xl:col-span-3" ref={specificUserFieldRef}>
                    <label className={`student-upload-field full${shareValidationField === 'specificUser' ? ' has-error' : ''}`}>
                      <span><UserRound size={14} /> Specific User</span>
                      <div className="student-upload-searchbox">
                        <input
                          value={form.userSearch}
                          onChange={(event) => {
                            setShareWarning('');
                            setShareValidationField((current) => (current === 'specificUser' ? null : current));
                            setForm({ ...form, userSearch: event.target.value });
                          }}
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
                                  setShareWarning('');
                                  setShareValidationField((current) => (current === 'specificUser' ? null : current));
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
                              <span className="student-upload-adviser-chip" key={candidate.id}>
                                <span className="student-upload-adviser-avatar">{getInitials(candidate.name) || 'US'}</span>
                                <span className="student-upload-adviser-name">{candidate.name}</span>
                                <button
                                  type="button"
                                  className="student-upload-adviser-remove"
                                  onClick={() => {
                                    setShareWarning('');
                                    setShareValidationField((current) => (current === 'specificUser' ? null : current));
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
                      {shareValidationField === 'specificUser' ? renderShareFieldWarning(shareWarning) : null}
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
                  <label className={`block md:col-span-2 xl:col-span-3${shareValidationField === 'fileName' ? ' student-upload-field has-error' : ''}`} ref={fileNameFieldRef}>
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><Paperclip size={14} className="text-[var(--maroon)]" /> File Name</span>
                    </span>
                    <input
                      className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.fileName}
                      onChange={(event) => {
                        setShareWarning('');
                        setShareValidationField((current) => (current === 'fileName' ? null : current));
                        setForm({ ...form, fileName: event.target.value });
                      }}
                      placeholder="library-resource.pdf"
                    />
                    {shareValidationField === 'fileName' ? renderShareFieldWarning(shareWarning) : null}
                  </label>

                  <label className={`block md:col-span-2 xl:col-span-3${shareValidationField === 'attachment' ? ' student-upload-field has-error' : ''}`} ref={attachmentFieldRef}>
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
                            onChange={(event) => {
                              setShareWarning('');
                              setShareValidationField((current) => (current === 'attachment' ? null : current));
                              setForm({ ...form, file: event.target.files?.[0] ?? null });
                            }}
                          />
                          Choose File
                        </label>
                        {form.file ? (
                          <button
                            type="button"
                            className="student-upload-file-remove"
                            onClick={() => {
                              setShareWarning('');
                              setShareValidationField((current) => (current === 'attachment' ? null : current));
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
                    {shareValidationField === 'attachment' ? renderShareFieldWarning(shareWarning) : null}
                  </label>

                  <label className={`block md:col-span-2 xl:col-span-3${shareValidationField === 'notes' ? ' student-upload-field has-error' : ''}`} ref={notesFieldRef}>
                    <span className="mb-2 block text-sm font-medium text-text-secondary">
                      <span className="inline-flex items-center gap-2"><BookOpen size={14} className="text-[var(--maroon)]" /> Abstract / Notes</span>
                    </span>
                    <textarea
                      className="min-h-[132px] w-full rounded-2xl border border-[var(--input-border)] bg-[var(--bg-input)] px-4 py-3 text-base text-text-primary outline-none transition focus:border-[var(--maroon)]"
                      value={form.notes}
                      onChange={(event) => {
                        setShareWarning('');
                        setShareValidationField((current) => (current === 'notes' ? null : current));
                        setForm({ ...form, notes: event.target.value });
                      }}
                      placeholder="Short description to help users understand the resource."
                    />
                    {shareValidationField === 'notes' ? renderShareFieldWarning(shareWarning) : null}
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
                    submittingAction !== null || categoriesLoading
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
