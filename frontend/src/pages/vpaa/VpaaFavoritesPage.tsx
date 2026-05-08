import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedFavoritesPage from '../../components/dashboard/SharedFavoritesPage';

export default function VpaaFavoritesPage() {
  return (
    <VpaaLayout
      title="My Favorites"
      description="Open the archive records you saved for quick access."
      hidePageIntro
    >
      <SharedFavoritesPage
        role="vpaa"
        title="My Favorites"
        description="Open the archive records you saved for quick access."
      />
    </VpaaLayout>
  );
}
