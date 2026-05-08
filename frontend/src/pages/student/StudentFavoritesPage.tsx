import StudentLayout from '../../components/student/StudentLayout';
import SharedFavoritesPage from '../../components/dashboard/SharedFavoritesPage';

export default function StudentFavoritesPage() {
  return (
    <StudentLayout
      title="My Favorites"
      description="Browse the theses you saved for quick access."
      hidePageIntro
    >
      <SharedFavoritesPage
        role="student"
        title="My Favorites"
        description="Browse the theses you saved for quick access."
      />
    </StudentLayout>
  );
}
