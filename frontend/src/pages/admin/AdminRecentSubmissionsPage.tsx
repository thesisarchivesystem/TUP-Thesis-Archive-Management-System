import { ChevronDown, FileText, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import { adminService, type AdminDashboardResponse, type AdminStructureCollege } from '../../services/adminService';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

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

type AdminThesisRecord = AdminDashboardResponse['recent_uploads'][number];

export default function AdminRecentSubmissionsPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [structure, setStructure] = useState<AdminStructureCollege[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void Promise.all([
      adminService.getDashboard({ recent_uploads_limit: 50 }),
      adminService.listStructure(),
    ])
      .then(([response, structureResponse]) => {
        if (!active) return;
        setData(response);
        setStructure(structureResponse);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load thesis records.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const uploads = data?.recent_uploads ?? [];

  const colleges = useMemo(
    () => structure.map((college) => college.name),
    [structure],
  );

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

  const collegeByDepartment = useMemo(() => {
    const entries = structure.flatMap((college) =>
      college.departments.map((department) => [department.name, college.name] as const),
    );

    return new Map(entries);
  }, [structure]);

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

  if (error) return <div className="admin-alert">{error}</div>;
  if (loading || !data) return <SectionLoadingScreen label="Loading thesis management..." />;

  return (
    <div className="admin-page admin-thesis-page">
      <div className="admin-page-intro admin-thesis-intro">
        <div>
          <h1>Thesis Management</h1>
          <p>Manage submitted theses, records, and archive details.</p>
        </div>
      </div>

      <section className="admin-panel admin-thesis-list-panel">
        <div className="admin-panel-head admin-thesis-list-head">
          <div className="admin-thesis-list-title">
            <span className="admin-thesis-list-icon"><FileText size={16} /></span>
            <h3>Thesis List</h3>
          </div>

          <button type="button" className="admin-btn admin-thesis-create-btn">
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
                    <button type="button" className="admin-structure-edit-btn">Edit</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="admin-table-empty">No thesis records matched the current filters.</td>
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
              ‹
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
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
