import { Link } from 'react-router-dom';
import SharedCategoriesView from '../../components/categories/SharedCategoriesView';

export default function StudentCategoriesPage() {
  return (
    <div className="min-h-screen bg-page-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Explore by Category</h1>
            <p className="text-text-secondary">Browse the same thesis categories and archive themes available to all signed-in users.</p>
          </div>

          <Link
            to="/student/support"
            className="inline-flex items-center justify-center rounded-lg bg-primary-sage px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-sage/90"
          >
            Submit a Ticket
          </Link>
        </div>

        <SharedCategoriesView role="student" />
      </div>
    </div>
  );
}
