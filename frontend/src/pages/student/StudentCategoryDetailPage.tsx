import StudentLayout from '../../components/student/StudentLayout';
import SharedCategoryDetailView from '../../components/categories/SharedCategoryDetailView';

export default function StudentCategoryDetailPage() {
  return (
    <StudentLayout title="Category" description="Browse archived theses in this category." hidePageIntro>
      <SharedCategoryDetailView role="student" />
    </StudentLayout>
  );
}
