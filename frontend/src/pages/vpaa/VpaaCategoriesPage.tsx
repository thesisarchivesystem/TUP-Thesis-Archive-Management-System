import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedCategoriesView from '../../components/categories/SharedCategoriesView';

export default function VpaaCategoriesPage() {
  return (
    <VpaaLayout
      title="Explore by Category"
      description="Select a category to view the latest thesis titles and related research themes."
    >
      <SharedCategoriesView />
    </VpaaLayout>
  );
}
