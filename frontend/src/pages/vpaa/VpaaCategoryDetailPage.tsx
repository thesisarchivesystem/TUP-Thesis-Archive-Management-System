import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedCategoryDetailView from '../../components/categories/SharedCategoryDetailView';

export default function VpaaCategoryDetailPage() {
  return (
    <VpaaLayout title="Category" description="Browse archived theses in this category." hidePageIntro>
      <SharedCategoryDetailView role="vpaa" />
    </VpaaLayout>
  );
}
