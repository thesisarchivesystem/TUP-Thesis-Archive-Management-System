import { ChevronDown, FolderOpen, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService, type AdminCategory } from '../../services/adminService';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];
const FEEDBACK_DISMISS_DELAY = 4000;

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
};

const normalize = (value: string) => value.trim().toLowerCase();

const totalPagesFor = (totalItems: number, pageSize: number) => Math.max(1, Math.ceil(totalItems / pageSize));

const pageLabel = (totalItems: number, page: number, pageSize: number) => {
  if (!totalItems) return 'Showing 0 to 0 of 0 categories';

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `Showing ${start} to ${end} of ${totalItems} categories`;
};

export default function AdminCategoriesPage() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => adminService.listCategories().then(setCategories);

  useEffect(() => {
    void load().catch(() => setError('Failed to load categories.'));
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (!successMessage && !error) return undefined;

    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
      setError(null);
    }, FEEDBACK_DISMISS_DELAY);

    return () => window.clearTimeout(timeout);
  }, [error, successMessage]);

  const filteredCategories = useMemo(() => {
    const query = normalize(search);
    if (!query) return categories;

    return categories.filter((category) =>
      normalize(`${category.name} ${category.slug} ${category.description ?? ''}`).includes(query),
    );
  }, [categories, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, search, filteredCategories.length]);

  const totalPages = totalPagesFor(filteredCategories.length, pageSize);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [currentPage, filteredCategories, pageSize]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  const closeFormModal = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      sort_order: category.sort_order,
    });
    setError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        sort_order: Number(form.sort_order) || 0,
      };

      if (!payload.name) {
        setSuccessMessage(null);
        setError('Category name is required.');
        return;
      }

      if (!payload.slug) {
        setSuccessMessage(null);
        setError('Slug is required.');
        return;
      }

      if (editingId) {
        await adminService.updateCategory(editingId, payload);
        setSuccessMessage('Category updated successfully.');
      } else {
        await adminService.createCategory(payload);
        setSuccessMessage('Category created successfully.');
      }

      closeFormModal();
      setError(null);
      await load();
    } catch (err: any) {
      setSuccessMessage(null);
      setError(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const toggleCategoryStatus = async (category: AdminCategory) => {
    try {
      await adminService.updateCategory(category.id, {
        name: category.name,
        description: category.description ?? '',
        sort_order: category.sort_order,
        is_active: !category.is_active,
      });
      setSuccessMessage(`Category ${category.is_active ? 'disabled' : 'enabled'} successfully.`);
      setError(null);
      await load();
    } catch (err: any) {
      setSuccessMessage(null);
      setError(err.response?.data?.message || 'Failed to update category status.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <h1>Category Management</h1>
          <p>Manage thesis categories and classification tags.</p>
        </div>
      </div>

      {successMessage ? <div className="admin-success">{successMessage}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-panel admin-categories-panel">
        <div className="admin-panel-head admin-categories-head">
          <div className="admin-categories-title">
            <span className="admin-categories-list-icon"><FolderOpen size={16} /></span>
            <h3>Category List</h3>
          </div>

          <button type="button" className="admin-btn admin-categories-create-btn" onClick={openCreate}>
            <Plus size={15} />
            <span>Create Category</span>
          </button>
        </div>

        <div className="admin-categories-toolbar">
          <label className="admin-users-select admin-categories-page-size">
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <ChevronDown size={16} />
          </label>

          <label className="admin-users-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search category name..."
            />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-categories-table">
            <thead>
              <tr>
                <th>Display Order</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Enabled</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length > 0 ? paginatedCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.sort_order}</td>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.slug}</td>
                  <td>{category.description || 'No description provided.'}</td>
                  <td className="admin-categories-toggle-cell">
                    <button
                      type="button"
                      className={`admin-status-switch ${category.is_active ? 'active' : ''}`}
                      onClick={() => void toggleCategoryStatus(category)}
                      aria-label={`${category.is_active ? 'Disable' : 'Enable'} ${category.name}`}
                    >
                      <span />
                    </button>
                  </td>
                  <td className="admin-categories-action-cell">
                    <button
                      type="button"
                      className="admin-structure-edit-btn"
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="admin-table-empty">No categories matched the current search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-users-pagination">
          <p>{pageLabel(filteredCategories.length, currentPage, pageSize)}</p>

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

      {formOpen ? (
        <div className="admin-modal-backdrop" onClick={closeFormModal}>
          <div className="admin-modal-card admin-categories-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-head admin-categories-modal-head">
              <div>
                <h3>{editingId ? 'Edit Category' : 'Create Category'}</h3>
                <p>{editingId ? 'Update the selected category details and visibility.' : 'Add a new category for thesis classification.'}</p>
              </div>
              <button type="button" className="admin-view-all" onClick={closeFormModal}>Close</button>
            </div>

            <div className="admin-form-grid admin-categories-form-grid">
              <label className="admin-field admin-modal-field">
                <span>Category Name <em>*</em></span>
                <input
                  type="text"
                  value={form.name}
                  placeholder="Enter category name"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label className="admin-field admin-modal-field">
                <span>Slug <em>*</em></span>
                <input
                  type="text"
                  value={form.slug}
                  placeholder="Enter category slug"
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                />
              </label>

              <label className="admin-field admin-modal-field">
                <span>Display Order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  placeholder="0"
                  onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
                />
              </label>

              <label className="admin-field admin-modal-field admin-categories-description-field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  maxLength={255}
                  placeholder="Enter a short category description"
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
            </div>

            <div className="admin-actions admin-structure-modal-actions admin-categories-modal-actions">
              <button type="button" className="admin-btn admin-categories-cancel-btn" onClick={closeFormModal}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => void submit()}>
                {editingId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
