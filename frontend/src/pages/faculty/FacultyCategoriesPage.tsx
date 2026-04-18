import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedCategoriesView from '../../components/categories/SharedCategoriesView';

export default function FacultyCategoriesPage() {
  return (
    <FacultyLayout
      title="Explore by Category"
      description="Select a category to view the latest thesis titles and related research themes."
    >
      <SharedCategoriesView role="faculty" />
    </FacultyLayout>
  );
}
