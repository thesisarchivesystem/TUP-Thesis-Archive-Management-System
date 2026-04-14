import { Link } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedCategoriesView from '../../components/categories/SharedCategoriesView';

export default function FacultyCategoriesPage() {
  return (
    <FacultyLayout
      title="Explore by Category"
      description="Select a category to view the latest thesis titles and related research themes."
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Link
          to="/faculty/support"
          className="btn-primary"
        >
          Submit a Ticket
        </Link>
      </div>

      <SharedCategoriesView role="faculty" />
    </FacultyLayout>
  );
}
