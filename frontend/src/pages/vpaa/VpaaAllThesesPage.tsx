import { useCallback } from 'react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import DashboardCollectionPageHeader from '../../components/dashboard/DashboardCollectionPageHeader';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { thesisService } from '../../services/thesisService';

export default function VpaaAllThesesPage() {
  const fetchItems = useCallback(async () => (await thesisService.list({ per_page: 200, sort: 'title' })).data ?? [], []);

  return (
    <VpaaLayout
      title="All Theses"
      description="Browse all archived theses in alphabetical order."
      hidePageIntro
    >
      <DashboardCollectionPageHeader
        role="vpaa"
        title="All Theses"
        description="Browse all archived theses in alphabetical order."
      />
      <SharedDashboardThesisCollectionView
        emptyMessage="No archived theses are available yet."
        fetchItems={fetchItems}
        role="vpaa"
        section="all"
      />
    </VpaaLayout>
  );
}
