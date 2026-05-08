import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedFavoritesPage from '../../components/dashboard/SharedFavoritesPage';

export default function FacultyFavoritesPage() {
  return (
    <FacultyLayout
      title="My Favorites"
      description="Revisit the archive records you pinned for quick review."
      hidePageIntro
    >
      <SharedFavoritesPage
        role="faculty"
        title="My Favorites"
        description="Revisit the archive records you pinned for quick review."
      />
    </FacultyLayout>
  );
}
