import axios from 'axios';
import {
  BookOpenText,
  ChevronDown,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers3,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import {
  adminService,
  type AdminBestThesisAward,
  type AdminCategory,
  type AdminManagedUser,
  type AdminStructureCollege,
  type AdminThesisDetail,
  type AdminThesisRecord,
} from '../../services/adminService';
import { compactFileName, compactFileNameList } from '../../utils/fileNames';
import { getDepartmentProgramOptions, normalizeProgramValue, resolveProgramDisplayValue } from '../../utils/programs';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const MAX_CATEGORY_SELECTIONS = 5;
const SCHOOL_YEAR_START = 2022;
const CURRENT_SCHOOL_YEAR = new Date().getFullYear();
const SCHOOL_YEAR_OPTIONS = Array.from(
  { length: Math.max(CURRENT_SCHOOL_YEAR - SCHOOL_YEAR_START + 1, 1) },
  (_, index) => String(SCHOOL_YEAR_START + index),
);

const statusLabel = (status: string) =>
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusToneClass = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized === 'approved') return 'approved';
  if (normalized === 'archived') return 'archived';
  if (normalized === 'under_review' || normalized === 'pending') return 'under_review';
  if (normalized === 'revision_needed' || normalized === 'rejected') return 'revision_needed';
  return 'pending';
};

const extractYear = (createdAt?: string | null) => {
  if (!createdAt) return 'N/A';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return String(date.getFullYear());
};

const formatBytes = (value?: number | null) => {
  if (!value || value <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** power;
  return `${size.toFixed(power === 0 ? 0 : size >= 10 ? 1 : 2)} ${units[power]}`;
};

const sortNewestThesesFirst = (items: AdminThesisRecord[]) => (
  [...items].sort((first, second) => {
    const firstTime = first.created_at ? new Date(first.created_at).getTime() : 0;
    const secondTime = second.created_at ? new Date(second.created_at).getTime() : 0;
    return secondTime - firstTime;
  })
);

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

type EditFormState = {
  title: string;
  college: string;
  department: string;
  program: string;
  schoolYear: string;
  categoryIds: string[];
  authors: string[];
  adviserId: string;
  abstract: string;
  isBestThesis: boolean;
  confirmOriginal: boolean;
  allowReview: boolean;
};

type EditFieldErrors = Partial<Record<
  'title' | 'college' | 'department' | 'program' | 'schoolYear' | 'categoryIds' | 'authors' | 'abstract' | 'manuscript' | 'confirmations',
  string
>>;

const initialEditForm: EditFormState = {
  title: '',
  college: '',
  department: '',
  program: '',
  schoolYear: '',
  categoryIds: [],
  authors: [],
  adviserId: '',
  abstract: '',
  isBestThesis: false,
  confirmOriginal: true,
  allowReview: true,
};

export default function AdminRecentSubmissionsPage() {
  const [uploads, setUploads] = useState<AdminThesisRecord[]>([]);
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [bestThesisAwards, setBestThesisAwards] = useState<AdminBestThesisAward[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<AdminManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingThesis, setEditingThesis] = useState<AdminThesisDetail | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm);
  const [editFieldErrors, setEditFieldErrors] = useState<EditFieldErrors>({});
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalSaving, setEditModalSaving] = useState(false);
  const [editModalDeleting, setEditModalDeleting] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [adviserSearch, setAdviserSearch] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [replacementManuscript, setReplacementManuscript] = useState<File | null>(null);
  const [newSupplementaryFiles, setNewSupplementaryFiles] = useState<File[]>([]);
  const manuscriptInputRef = useRef<HTMLInputElement | null>(null);
  const supplementaryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void Promise.all([
      adminService.listTheses(),
      adminService.listStructure(),
    ])
      .then(([thesesResponse, structureResponse]) => {
        if (!active) return;
        setUploads(sortNewestThesesFirst(thesesResponse));
        setStructure(structureResponse);
      })
      .catch((err) => {
        if (!active) return;
        setError(extractApiErrorMessage(err, 'Failed to load thesis records.'));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!success) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccess(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [success]);

  useEffect(() => {
    let active = true;

    void adminService.listCategories()
      .then((response) => {
        if (!active) return;
        setCategories(response);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
      });

    void adminService.listUsers('faculty')
      .then((response) => {
        if (!active) return;
        setFacultyUsers(response);
      })
      .catch(() => {
        if (!active) return;
        setFacultyUsers([]);
      });

    void adminService.getBestTheses()
      .then((response) => {
        if (!active) return;
        setBestThesisAwards(response.awards);
      })
      .catch(() => {
        if (!active) return;
        setBestThesisAwards([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const colleges = useMemo(
    () => structure.map((college) => college.name),
    [structure],
  );

  const collegeByDepartment = useMemo(() => {
    const entries = structure.flatMap((college) =>
      college.departments.map((department) => [department.name, college.name] as const),
    );

    return new Map(entries);
  }, [structure]);

  const programsByCollege = useMemo(() => {
    return new Map(
      structure.map((college) => [
        college.name,
        college.departments.flatMap((department) =>
          department.programs.map((program) => program.code?.trim() || program.name),
        ),
      ] as const),
    );
  }, [structure]);

  const visiblePrograms = useMemo(() => {
    if (!collegeFilter) return [];
    return programsByCollege.get(collegeFilter) ?? [];
  }, [collegeFilter, programsByCollege]);

  const programDisplayByName = useMemo(() => {
    const entries = structure.flatMap((college) =>
      college.departments.flatMap((department) =>
        department.programs.flatMap((program) => {
          const display = program.code?.trim() || program.name;
          return [
            [program.name, display] as const,
            [display, display] as const,
          ];
        }),
      ),
    );

    return new Map(entries);
  }, [structure]);

  const filteredUploads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return uploads.filter((item) => {
      const resolvedCollege = item.department ? (collegeByDepartment.get(item.department) || 'College of Science') : '';
      const resolvedProgram = item.program ? (programDisplayByName.get(item.program) || item.program) : '';
      const matchesSearch = !query || [
        item.title,
        item.author,
        item.department,
        resolvedProgram,
        item.category,
        item.status,
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
      const matchesCollege = !collegeFilter || resolvedCollege === collegeFilter;
      const matchesProgram = !programFilter || resolvedProgram === programFilter;
      const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesCollege && matchesProgram && matchesStatus;
    });
  }, [collegeByDepartment, collegeFilter, programDisplayByName, programFilter, search, statusFilter, uploads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, search, collegeFilter, programFilter, statusFilter, filteredUploads.length]);

  useEffect(() => {
    setProgramFilter('');
  }, [collegeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUploads.length / pageSize));
  const paginatedUploads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUploads.slice(start, start + pageSize);
  }, [currentPage, filteredUploads, pageSize]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  const pageLabel = filteredUploads.length
    ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredUploads.length)} of ${filteredUploads.length} theses`
    : 'Showing 0 to 0 of 0 theses';
  const isCreateMode = editingId === null;

  const selectedCollegeRecord = useMemo(
    () => structure.find((college) => college.name === editForm.college),
    [editForm.college, structure],
  );

  const selectedDepartmentRecord = useMemo(
    () => selectedCollegeRecord?.departments.find((department) => department.name === editForm.department),
    [editForm.department, selectedCollegeRecord],
  );

  const programOptions = useMemo(
    () => getDepartmentProgramOptions(selectedDepartmentRecord),
    [selectedDepartmentRecord],
  );

  const activeAdvisers = useMemo(
    () => facultyUsers.filter((user) => user.is_active),
    [facultyUsers],
  );

  const selectedAdviser = useMemo(
    () => activeAdvisers.find((adviser) => adviser.id === editForm.adviserId) ?? null,
    [activeAdvisers, editForm.adviserId],
  );

  const filteredAdvisers = useMemo(() => {
    const query = adviserSearch.trim().toLowerCase();
    if (!query) return [];

    return activeAdvisers.filter((adviser) => (
      [
        adviser.name,
        adviser.email,
        adviser.department,
        adviser.faculty_role,
      ].filter(Boolean).join(' ').toLowerCase().includes(query)
    ));
  }, [activeAdvisers, adviserSearch]);

  const showAdviserResults = adviserSearch.trim().length > 0 && (!selectedAdviser || adviserSearch.trim() !== selectedAdviser.name);

  const selectedCategories = useMemo(
    () => categories.filter((category) => editForm.categoryIds.includes(category.id)),
    [categories, editForm.categoryIds],
  );

  const editingBestThesisAward = useMemo(
    () => bestThesisAwards.find((award) => award.thesis?.id === editingId) ?? null,
    [bestThesisAwards, editingId],
  );

  const bestThesisIds = useMemo(
    () => new Set(bestThesisAwards.map((award) => award.thesis?.id).filter(Boolean)),
    [bestThesisAwards],
  );

  const selectedYearBestThesisAward = useMemo(
    () => bestThesisAwards.find((award) => award.school_year === editForm.schoolYear) ?? null,
    [bestThesisAwards, editForm.schoolYear],
  );

  useEffect(() => {
    if (!selectedDepartmentRecord) return;

    if (!editForm.program && programOptions.length) {
      setEditForm((current) => ({
        ...current,
        program: current.program || programOptions[0] || '',
      }));
      return;
    }

    const normalizedProgram = resolveProgramDisplayValue(selectedDepartmentRecord, editForm.program);
    if (normalizedProgram && normalizedProgram !== editForm.program) {
      setEditForm((current) => (
        current.program === editForm.program
          ? { ...current, program: normalizedProgram }
          : current
      ));
    }
  }, [editForm.program, programOptions, selectedDepartmentRecord]);

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingId(null);
    setEditingThesis(null);
    setEditForm(initialEditForm);
    setEditFieldErrors({});
    setEditModalError(null);
    setEditModalLoading(false);
    setEditModalSaving(false);
    setEditModalDeleting(false);
    setAuthorInput('');
    setAdviserSearch('');
    setCategoryMenuOpen(false);
    setReplacementManuscript(null);
    setNewSupplementaryFiles([]);
    if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
    if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
  };

  const handleOpenCreateModal = () => {
    setSuccess(null);
    setEditModalOpen(true);
    setEditingId(null);
    setEditingThesis(null);
    setEditForm(initialEditForm);
    setEditFieldErrors({});
    setEditModalError(null);
    setEditModalLoading(false);
    setEditModalSaving(false);
    setEditModalDeleting(false);
    setAuthorInput('');
    setAdviserSearch('');
    setCategoryMenuOpen(false);
    setReplacementManuscript(null);
    setNewSupplementaryFiles([]);
    if (manuscriptInputRef.current) manuscriptInputRef.current.value = '';
    if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
  };

  const handleOpenEditModal = async (item: AdminThesisRecord) => {
    setSuccess(null);
    setEditModalOpen(true);
    setEditingId(item.id);
    setEditingThesis(null);
    setEditModalError(null);
    setEditModalLoading(true);
    setEditFieldErrors({});
    setAuthorInput('');
    setAdviserSearch('');
    setCategoryMenuOpen(false);
    setReplacementManuscript(null);
    setNewSupplementaryFiles([]);

    try {
      const thesis = await adminService.getThesis(item.id);
      const resolvedCollege = thesis.department ? (collegeByDepartment.get(thesis.department) || '') : '';

      setEditingThesis(thesis);
      setEditForm({
        title: thesis.title ?? '',
        college: resolvedCollege,
        department: thesis.department ?? '',
        program: normalizeProgramValue(thesis.program) || '',
        schoolYear: thesis.school_year ?? String(CURRENT_SCHOOL_YEAR),
        categoryIds: thesis.category_ids?.length
          ? thesis.category_ids
          : [thesis.category_id ?? ''].filter(Boolean),
        authors: thesis.authors ?? [],
        adviserId: thesis.adviser_id ?? '',
        abstract: thesis.abstract ?? '',
        isBestThesis: bestThesisAwards.some((award) => award.thesis?.id === thesis.id),
        confirmOriginal: true,
        allowReview: true,
      });
    } catch (err) {
      setEditModalError(extractApiErrorMessage(err, 'Unable to load thesis details right now.'));
    } finally {
      setEditModalLoading(false);
    }
  };

  const addAuthor = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;

    setEditForm((current) => {
      if (current.authors.includes(normalized)) {
        return current;
      }

      return { ...current, authors: [...current.authors, normalized] };
    });
    setAuthorInput('');
    setEditFieldErrors((current) => ({ ...current, authors: undefined }));
  };

  const removeAuthor = (authorToRemove: string) => {
    setEditForm((current) => ({
      ...current,
      authors: current.authors.filter((author) => author !== authorToRemove),
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setEditForm((current) => {
      if (current.categoryIds.includes(categoryId)) {
        return {
          ...current,
          categoryIds: current.categoryIds.filter((id) => id !== categoryId),
        };
      }

      if (current.categoryIds.length >= MAX_CATEGORY_SELECTIONS) {
        return current;
      }

      return {
        ...current,
        categoryIds: [...current.categoryIds, categoryId],
      };
    });
    setEditFieldErrors((current) => ({ ...current, categoryIds: undefined }));
  };

  const validateEditForm = () => {
    const nextErrors: EditFieldErrors = {};

    if (!editForm.title.trim()) nextErrors.title = 'Please enter the thesis title.';
    if (!editForm.college.trim()) nextErrors.college = 'Please choose a college.';
    if (!editForm.department.trim()) nextErrors.department = 'Please choose a department.';
    if (!editForm.schoolYear.trim()) nextErrors.schoolYear = 'Please choose the publication year.';
    if (!editForm.categoryIds.length) nextErrors.categoryIds = 'Please select at least one category.';
    if (editForm.categoryIds.length > MAX_CATEGORY_SELECTIONS) nextErrors.categoryIds = `You can select up to ${MAX_CATEGORY_SELECTIONS} categories only.`;
    if (!editForm.authors.length) nextErrors.authors = 'Please add at least one author.';
    if (isCreateMode && !replacementManuscript) nextErrors.manuscript = 'Please choose a thesis manuscript PDF.';
    if (isCreateMode && (!editForm.confirmOriginal || !editForm.allowReview)) {
      nextErrors.confirmations = 'Please confirm both submission statements before adding the thesis.';
    }

    setEditFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateEditForm()) return;

    setEditModalSaving(true);
    setEditModalError(null);
    setSuccess(null);

    try {
      const payload = {
        title: editForm.title.trim(),
        abstract: editForm.abstract.trim(),
        department: editForm.department,
        program: editForm.program.trim(),
        category_id: editForm.categoryIds[0] ?? '',
        category_ids: editForm.categoryIds,
        school_year: editForm.schoolYear,
        authors: editForm.authors,
        adviser_id: editForm.adviserId || '',
        confirm_original: editForm.confirmOriginal,
        allow_review: editForm.allowReview,
        manuscript: replacementManuscript,
        supplementary_files: newSupplementaryFiles,
      };
      const updated = editingId
        ? await adminService.updateThesis(editingId, payload)
        : await adminService.createThesis(payload);

      const previousAward = editingId
        ? bestThesisAwards.find((award) => award.thesis?.id === editingId) ?? null
        : null;

      if (editForm.isBestThesis) {
        await adminService.appointBestThesis({
          school_year: updated.school_year,
          thesis_id: updated.id,
        });

        if (previousAward && previousAward.school_year !== updated.school_year) {
          await adminService.removeBestThesis(previousAward.school_year);
        }
      } else if (previousAward) {
        await adminService.removeBestThesis(previousAward.school_year);
      }

      const bestThesisResponse = await adminService.getBestTheses();
      setBestThesisAwards(bestThesisResponse.awards);

      setUploads((current) => sortNewestThesesFirst(
        editingId
          ? current.map((record) => (
              record.id === updated.id
                ? {
                    ...record,
                    title: updated.title,
                    author: updated.authors.join(', ') || record.author,
                    category: updated.categories[0]?.name ?? record.category,
                    status: updated.is_archived ? 'archived' : updated.status,
                    is_archived: updated.is_archived,
                    department: updated.department,
                    program: updated.program ?? record.program,
                  }
                : record
            ))
          : [
              {
                id: updated.id,
                title: updated.title,
                author: updated.authors.join(', '),
                category: updated.categories[0]?.name ?? null,
                status: updated.is_archived ? 'archived' : updated.status,
                is_archived: updated.is_archived,
                department: updated.department,
                program: updated.program ?? null,
                created_at: updated.created_at ?? new Date().toISOString(),
              },
              ...current,
            ]
      ));

      setSuccess(editingId ? 'Thesis updated successfully.' : 'Thesis added successfully.');
      closeEditModal();
    } catch (err) {
      setEditModalError(extractApiErrorMessage(err, editingId ? 'Unable to save thesis changes right now.' : 'Unable to add this thesis right now.'));
    } finally {
      setEditModalSaving(false);
    }
  };

  const handleDeleteThesis = async () => {
    if (!editingId || !editingThesis) return;

    const confirmed = window.confirm(`Delete "${editingThesis.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setEditModalDeleting(true);
    setEditModalError(null);
    setSuccess(null);

    try {
      await adminService.deleteThesis(editingId);
      setUploads((current) => current.filter((record) => record.id !== editingId));
      setBestThesisAwards((current) => current.filter((award) => award.thesis?.id !== editingId));
      setSuccess('Thesis deleted successfully.');
      closeEditModal();
    } catch (err) {
      setEditModalError(extractApiErrorMessage(err, 'Unable to delete this thesis right now.'));
    } finally {
      setEditModalDeleting(false);
    }
  };

  if (error) return <div className="admin-alert">{error}</div>;
  if (loading) return <SectionLoadingScreen label="Loading thesis management..." />;

  return (
    <div className="admin-page admin-thesis-page">
      <div className="admin-page-intro admin-thesis-intro">
        <div>
          <h1>Thesis Management</h1>
          <p>Manage submitted theses, records, and archive details.</p>
        </div>
      </div>

      {success ? <div className="admin-success">{success}</div> : null}

      <section className="admin-panel admin-thesis-list-panel">
        <div className="admin-panel-head admin-thesis-list-head">
          <div className="admin-thesis-list-title">
            <span className="admin-thesis-list-icon"><FileText size={16} /></span>
            <h3>Thesis List</h3>
          </div>

          <button type="button" className="admin-btn admin-thesis-create-btn" onClick={handleOpenCreateModal}>
            <Plus size={15} />
            <span>Add Thesis</span>
          </button>
        </div>

        <div className="admin-thesis-toolbar">
          <label className="admin-users-select admin-thesis-page-size">
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="admin-users-search admin-thesis-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search thesis title, author, adviser, or keywords..."
            />
          </label>

          <label className="admin-users-select">
            <select value={collegeFilter} onChange={(event) => setCollegeFilter(event.target.value)}>
              <option value="">All Colleges</option>
              {colleges.map((college) => <option key={college} value={college}>{college}</option>)}
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="admin-users-select">
            <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
              <option value="">All Programs</option>
              {visiblePrograms.map((program) => <option key={program} value={program}>{program}</option>)}
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="admin-users-select">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="under_review">Under Review</option>
              <option value="revision_needed">Revision Needed</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-thesis-table">
            <thead>
              <tr>
                <th>Best</th>
                <th>Thesis Title</th>
                <th>Author/s</th>
                <th>College</th>
                <th>Program</th>
                <th>Year</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUploads.length > 0 ? paginatedUploads.map((item: AdminThesisRecord) => (
                <tr key={item.id}>
                  <td className="admin-thesis-best-cell">
                    {bestThesisIds.has(item.id) ? (
                      <span className="admin-thesis-best-star" title="Best Thesis" aria-label="Best Thesis">
                        <Star size={16} fill="currentColor" />
                      </span>
                    ) : null}
                  </td>
                  <td className="admin-thesis-title-cell">
                    <Link
                      to={`/admin/thesis/${encodeURIComponent(item.id)}`}
                      state={{
                        thesis: {
                          id: item.id,
                          title: item.title,
                          author: item.author,
                          category: item.category ?? null,
                          department: item.department ?? 'Computer Studies Department',
                          program: item.program ?? null,
                          created_at: item.created_at ?? null,
                          status: item.status,
                          college: item.department ? (collegeByDepartment.get(item.department) || 'College of Science') : 'College of Science',
                        },
                      }}
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td>{item.author}</td>
                  <td>{item.department ? (collegeByDepartment.get(item.department) || 'College of Science') : 'Unassigned'}</td>
                  <td>{item.program ? (programDisplayByName.get(item.program) || item.program) : 'N/A'}</td>
                  <td>{extractYear(item.created_at)}</td>
                  <td>
                    <span className={`admin-status-badge admin-thesis-status-badge ${statusToneClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="admin-thesis-action-cell">
                    <button type="button" className="admin-structure-edit-btn" onClick={() => void handleOpenEditModal(item)}>Edit</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="admin-table-empty">No thesis records matched the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-users-pagination">
          <p>{pageLabel}</p>
          <div className="admin-users-pagination-controls">
            <button
              type="button"
              className="admin-users-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              {'<'}
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`admin-users-page-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="admin-users-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              {'>'}
            </button>
          </div>
        </div>
      </section>

      {editModalOpen ? (
        <div className="admin-modal-backdrop" onClick={closeEditModal}>
          <div className="admin-modal-card admin-thesis-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-thesis-edit-head">
              <div className="admin-thesis-edit-title-wrap">
                <span className="admin-thesis-edit-icon"><BookOpenText size={22} /></span>
                <div>
                  <h3>{isCreateMode ? 'Add Thesis' : 'Edit Thesis'}</h3>
                  <p>{isCreateMode ? 'Enter thesis information and upload the required files.' : 'Update thesis information and details.'}</p>
                </div>
              </div>
              <button type="button" className="admin-thesis-edit-close" onClick={closeEditModal} aria-label="Close edit thesis dialog">
                <X size={18} />
              </button>
            </div>

            {editModalLoading ? (
              <div className="admin-thesis-edit-loading">Loading thesis details...</div>
            ) : editModalError ? (
              <div className="admin-alert">{editModalError}</div>
            ) : (
              <>
                <div className="admin-thesis-edit-form">
                  <label className="admin-field admin-modal-field admin-thesis-edit-field-full">
                    <span><FileText size={14} /> Thesis Title</span>
                    <input
                      type="text"
                      value={editForm.title}
                      placeholder={isCreateMode ? 'Enter the full title of the thesis' : undefined}
                      className={editFieldErrors.title ? 'admin-field-invalid' : ''}
                      onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                    />
                    {editFieldErrors.title ? <small className="admin-field-error">{editFieldErrors.title}</small> : null}
                  </label>

                  <label className="admin-field admin-modal-field">
                    <span><GraduationCap size={14} /> College</span>
                    <select
                      value={editForm.college}
                      className={editFieldErrors.college ? 'admin-field-invalid' : ''}
                      onChange={(event) => setEditForm((current) => ({
                        ...current,
                        college: event.target.value,
                        department: '',
                        program: '',
                      }))}
                    >
                      <option value="">Select college</option>
                      {colleges.map((college) => <option key={college} value={college}>{college}</option>)}
                    </select>
                    {editFieldErrors.college ? <small className="admin-field-error">{editFieldErrors.college}</small> : null}
                  </label>

                  <label className="admin-field admin-modal-field">
                    <span><UserRound size={14} /> Department</span>
                    <select
                      value={editForm.department}
                      className={editFieldErrors.department ? 'admin-field-invalid' : ''}
                      onChange={(event) => setEditForm((current) => ({
                        ...current,
                        department: event.target.value,
                        program: '',
                      }))}
                    >
                      <option value="">Select department</option>
                      {(selectedCollegeRecord?.departments ?? []).map((department) => (
                        <option key={department.id} value={department.name}>{department.name}</option>
                      ))}
                    </select>
                    {editFieldErrors.department ? <small className="admin-field-error">{editFieldErrors.department}</small> : null}
                  </label>

                  <label className="admin-field admin-modal-field">
                    <span><Layers3 size={14} /> Program</span>
                    <input
                      type="text"
                      value={editForm.program}
                      placeholder={isCreateMode ? 'e.g., BSCS' : 'Enter or choose a program'}
                      onChange={(event) => setEditForm((current) => ({ ...current, program: event.target.value }))}
                      list="admin-thesis-program-options"
                    />
                    <datalist id="admin-thesis-program-options">
                      {programOptions.map((program) => <option key={program} value={program} />)}
                    </datalist>
                  </label>

                  <label className="admin-field admin-modal-field">
                    <span><BookOpenText size={14} /> Year</span>
                    <select
                      value={editForm.schoolYear}
                      className={editFieldErrors.schoolYear ? 'admin-field-invalid' : ''}
                      onChange={(event) => setEditForm((current) => ({ ...current, schoolYear: event.target.value }))}
                    >
                      <option value="">Select year</option>
                      {SCHOOL_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                    {editFieldErrors.schoolYear ? <small className="admin-field-error">{editFieldErrors.schoolYear}</small> : null}
                  </label>

                  <label className="admin-thesis-checkbox admin-thesis-edit-field-full">
                    <input
                      type="checkbox"
                      checked={editForm.isBestThesis}
                      disabled={!isCreateMode && (editingThesis?.status !== 'approved' || editingThesis?.is_archived === false)}
                      onChange={(event) => setEditForm((current) => ({ ...current, isBestThesis: event.target.checked }))}
                    />
                    <span>
                      Set this thesis as Best Thesis for {editForm.schoolYear || 'the selected school year'}.
                      {selectedYearBestThesisAward?.thesis && selectedYearBestThesisAward.thesis.id !== editingId
                        ? ` This will replace "${selectedYearBestThesisAward.thesis.title}".`
                        : ''}
                      {editingBestThesisAward && !editForm.isBestThesis
                        ? ` Unchecking will remove its Best Thesis selection for ${editingBestThesisAward.school_year}.`
                        : ''}
                    </span>
                  </label>

                  <div className="admin-field admin-modal-field admin-thesis-edit-field-full">
                    <span><Layers3 size={14} /> Category</span>
                    <div
                      className={`admin-thesis-multi-select${categoryMenuOpen ? ' open' : ''}${editFieldErrors.categoryIds ? ' invalid' : ''}`}
                      onClick={() => setCategoryMenuOpen((current) => !current)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setCategoryMenuOpen((current) => !current);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="admin-thesis-multi-select-values">
                        {selectedCategories.length ? selectedCategories.map((category) => (
                          <span key={category.id} className="admin-thesis-chip">
                            {category.name}
                            <button type="button" onClick={(event) => {
                              event.stopPropagation();
                              toggleCategory(category.id);
                            }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        )) : <span className="admin-thesis-placeholder">Select thesis categories</span>}
                      </div>
                      <span className="admin-thesis-multi-select-count">{editForm.categoryIds.length}/{MAX_CATEGORY_SELECTIONS}</span>
                    </div>
                    {categoryMenuOpen ? (
                      <div className="admin-thesis-category-menu">
                        {categories.map((category) => (
                          <label key={category.id} className={`admin-thesis-category-option${editForm.categoryIds.includes(category.id) ? ' active' : ''}`}>
                            <input
                              type="checkbox"
                              checked={editForm.categoryIds.includes(category.id)}
                              onChange={() => toggleCategory(category.id)}
                            />
                            <span>{category.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                    {editFieldErrors.categoryIds ? <small className="admin-field-error">{editFieldErrors.categoryIds}</small> : <small>Select up to 5 categories.</small>}
                  </div>

                  <div className="admin-field admin-modal-field admin-thesis-edit-field-full">
                    <span><UserRound size={14} /> Authors</span>
                    <div className={`admin-thesis-token-input${editFieldErrors.authors ? ' invalid' : ''}`}>
                      {editForm.authors.map((author) => (
                        <span key={author} className="admin-thesis-chip admin-thesis-author-chip">
                          {author}
                          <button type="button" onClick={() => removeAuthor(author)} aria-label={`Remove ${author}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={authorInput}
                        placeholder={editForm.authors.length ? '' : 'Type an author name and press Enter'}
                        onChange={(event) => setAuthorInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addAuthor(authorInput);
                          }
                        }}
                        onBlur={() => addAuthor(authorInput)}
                      />
                    </div>
                    {editFieldErrors.authors ? <small className="admin-field-error">{editFieldErrors.authors}</small> : <small>Press Enter after each author name to add another one.</small>}
                  </div>

                  <label className="admin-field admin-modal-field admin-thesis-edit-field-full">
                    <span><UserRound size={14} /> Thesis Adviser</span>
                    <div className="admin-thesis-searchbox">
                      <input
                        type="text"
                        value={adviserSearch}
                        placeholder={isCreateMode ? 'Search and select adviser' : 'Search adviser by name, email, or department'}
                        onChange={(event) => {
                          setAdviserSearch(event.target.value);
                          if (editForm.adviserId) {
                            setEditForm((current) => ({ ...current, adviserId: '' }));
                          }
                        }}
                      />
                      {showAdviserResults ? (
                        <div className="admin-thesis-search-results">
                          {filteredAdvisers.map((adviser) => (
                            <button
                              key={adviser.id}
                              type="button"
                              className={`admin-thesis-search-option${editForm.adviserId === adviser.id ? ' active' : ''}`}
                              onClick={() => {
                                setEditForm((current) => ({ ...current, adviserId: adviser.id }));
                                setAdviserSearch('');
                              }}
                            >
                              <strong>{adviser.name}</strong>
                              <span>{adviser.email}{adviser.department ? ` - ${adviser.department}` : ''}</span>
                            </button>
                          ))}
                          {!filteredAdvisers.length ? <div className="admin-thesis-search-empty">No adviser found.</div> : null}
                        </div>
                      ) : null}
                    </div>
                    {selectedAdviser ? (
                      <div className="admin-thesis-selected-row">
                        <span className="admin-thesis-selected-chip">
                          <span className="admin-thesis-selected-avatar">
                            {selectedAdviser.name
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part.charAt(0).toUpperCase())
                              .join('') || 'NA'}
                          </span>
                          <span className="admin-thesis-selected-name">{selectedAdviser.name}</span>
                          <button
                            type="button"
                            className="admin-thesis-selected-remove"
                            onClick={() => {
                              setEditForm((current) => ({ ...current, adviserId: '' }));
                              setAdviserSearch('');
                            }}
                            aria-label={`Remove ${selectedAdviser.name}`}
                          >
                            x
                          </button>
                        </span>
                      </div>
                    ) : null}
                    <small>Choose from active faculty profiles in the database.</small>
                  </label>

                  <label className="admin-field admin-modal-field admin-thesis-edit-field-full">
                    <span><FileText size={14} /> Abstract</span>
                    <textarea
                      value={editForm.abstract}
                      placeholder={isCreateMode ? 'Enter an abstract of the thesis. Include the main objectives, methodology, results, and conclusions.' : undefined}
                      onChange={(event) => setEditForm((current) => ({ ...current, abstract: event.target.value }))}
                    />
                  </label>

                  <div className="admin-field admin-modal-field admin-thesis-edit-field-full">
                    <span><Upload size={14} /> Upload Files</span>
                    <div className="admin-thesis-file-panel">
                      <div className="admin-thesis-file-row">
                        <div className="admin-thesis-file-meta">
                          <strong>Upload PDF <em>(Required)</em></strong>
                          <p>
                            {replacementManuscript
                              ? `${compactFileName(replacementManuscript.name)}${replacementManuscript.size ? ` (${formatBytes(replacementManuscript.size)})` : ''}`
                              : editingThesis?.file_name
                                ? `${compactFileName(editingThesis.file_name)}${editingThesis.file_size ? ` (${formatBytes(editingThesis.file_size)})` : ''}`
                                : isCreateMode
                                  ? 'Accepted format: .pdf'
                                  : 'No manuscript uploaded yet'}
                          </p>
                        </div>
                        <button type="button" className="admin-btn admin-thesis-file-btn" onClick={() => manuscriptInputRef.current?.click()}>
                          <Upload size={14} />
                          <span>{isCreateMode ? 'Choose PDF' : editingThesis?.file_name ? 'Replace PDF' : 'Upload PDF'}</span>
                        </button>
                        <input
                          ref={manuscriptInputRef}
                          type="file"
                          accept="application/pdf"
                          hidden
                          onChange={(event) => setReplacementManuscript(event.target.files?.[0] ?? null)}
                        />
                      </div>

                      <div className="admin-thesis-file-row">
                        <div className="admin-thesis-file-meta">
                          <strong>Supplementary Files <em>(Optional)</em></strong>
                          <p>
                            {newSupplementaryFiles.length
                              ? compactFileNameList(newSupplementaryFiles.map((file) => file.name))
                              : editingThesis?.supplementary_files?.length
                                ? compactFileNameList(editingThesis.supplementary_files.map((file) => file.name))
                                : isCreateMode
                                  ? 'Add supporting documents if needed.'
                                  : 'No supplementary files uploaded yet'}
                          </p>
                        </div>
                        <button type="button" className="admin-btn admin-thesis-file-btn" onClick={() => supplementaryInputRef.current?.click()}>
                          <FolderOpen size={14} />
                          <span>Add Files</span>
                        </button>
                        <input
                          ref={supplementaryInputRef}
                          type="file"
                          multiple
                          hidden
                          onChange={(event) => setNewSupplementaryFiles(Array.from(event.target.files ?? []))}
                        />
                      </div>
                    </div>
                    {editFieldErrors.manuscript ? <small className="admin-field-error">{editFieldErrors.manuscript}</small> : null}
                  </div>

                  <label className="admin-thesis-checkbox">
                    <input
                      type="checkbox"
                      checked={editForm.confirmOriginal}
                      onChange={(event) => setEditForm((current) => ({ ...current, confirmOriginal: event.target.checked }))}
                    />
                    <span>I confirm that this submission is original, properly cited, and approved for upload to the thesis archive.</span>
                  </label>

                  <label className="admin-thesis-checkbox">
                    <input
                      type="checkbox"
                      checked={editForm.allowReview}
                      onChange={(event) => setEditForm((current) => ({ ...current, allowReview: event.target.checked }))}
                    />
                    <span>I agree to share the thesis for academic purposes and allow the archive committee to review the content.</span>
                  </label>
                  {editFieldErrors.confirmations ? <small className="admin-field-error admin-thesis-checkbox-error">{editFieldErrors.confirmations}</small> : null}
                </div>

                <div className="admin-thesis-edit-actions">
                  {!isCreateMode ? (
                    <button
                      type="button"
                      className="admin-btn admin-thesis-delete-btn"
                      onClick={() => void handleDeleteThesis()}
                      disabled={editModalSaving || editModalDeleting}
                    >
                      <Trash2 size={15} />
                      <span>{editModalDeleting ? 'Deleting...' : 'Delete Thesis'}</span>
                    </button>
                  ) : <span />}

                  <div className="admin-thesis-edit-action-group">
                    <button type="button" className="admin-btn" onClick={closeEditModal} disabled={editModalDeleting}>Cancel</button>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={() => void handleSaveChanges()} disabled={editModalSaving || editModalDeleting}>
                      {editModalSaving ? (isCreateMode ? 'Adding...' : 'Saving...') : (isCreateMode ? 'Add Thesis' : 'Save Changes')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
