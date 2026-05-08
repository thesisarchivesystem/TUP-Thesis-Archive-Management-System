import { useEffect, useState } from 'react';
import { adminService, type AdminCategory } from '../../services/adminService';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0, is_active: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => adminService.listCategories().then(setCategories);

  useEffect(() => {
    void load().catch(() => setError('Failed to load categories.'));
  }, []);

  const submit = async () => {
    try {
      if (editingId) {
        await adminService.updateCategory(editingId, form);
      } else {
        await adminService.createCategory(form);
      }
      setEditingId(null);
      setForm({ name: '', description: '', sort_order: 0, is_active: true });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <span className="admin-kicker">Archive Taxonomy</span>
          <h1>Category Management</h1>
          <p>Control the categories used across the thesis archive so classification stays clean, searchable, and future-ready.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}
      <section className="admin-panel">
        <div className="admin-panel-head"><h3>{editingId ? 'Edit Category' : 'Create Category'}</h3></div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="admin-field">
            <span>Sort Order</span>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </label>
          <label className="admin-field admin-field-check">
            <span>Active</span>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          </label>
        </div>
        <div className="admin-actions">
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => void submit()}>
            {editingId ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head"><h3>Category List</h3></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => {
                        setEditingId(category.id);
                        setForm({
                          name: category.name,
                          description: category.description ?? '',
                          sort_order: category.sort_order,
                          is_active: category.is_active,
                        });
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
