import StudentLayout from '../../components/student/StudentLayout';
import SharedCategoriesView from '../../components/categories/SharedCategoriesView';

export default function StudentCategoriesPage() {
  return (
    <StudentLayout
      title="Explore by Category"
      description="Select a category to view the latest thesis titles and related research themes."
    >
      <SharedCategoriesView role="student" />
    </StudentLayout>
  );
}
