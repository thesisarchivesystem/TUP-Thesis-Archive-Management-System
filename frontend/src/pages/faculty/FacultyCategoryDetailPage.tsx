import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedCategoryDetailView from '../../components/categories/SharedCategoryDetailView';

export default function FacultyCategoryDetailPage() {
  return (
    <FacultyLayout title="Category" description="Browse archived theses in this category." hidePageIntro>
      <SharedCategoryDetailView role="faculty" />
    </FacultyLayout>
  );
}
