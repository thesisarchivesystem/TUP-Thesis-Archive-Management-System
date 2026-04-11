import SharedCategoriesView from '../../components/categories/SharedCategoriesView';

export default function FacultyCategoriesPage() {
  return (
    <div className="min-h-screen bg-page-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Explore by Category</h1>
          <p className="text-text-secondary">Browse the same thesis categories and research themes available across the archive.</p>
        </div>

        <SharedCategoriesView />
      </div>
    </div>
  );
}
