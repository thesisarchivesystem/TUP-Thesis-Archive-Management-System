import { useCallback } from 'react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import DashboardCollectionPageHeader from '../../components/dashboard/DashboardCollectionPageHeader';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { vpaaDashboardService } from '../../services/vpaaDashboardService';

export default function VpaaTopSearchesPage() {
  const fetchItems = useCallback(async () => (await vpaaDashboardService.getDashboard()).top_searches ?? [], []);

  return (
    <VpaaLayout
      title="Top Searches"
      description="Browse all archived theses most often opened from search results."
      hidePageIntro
    >
      <DashboardCollectionPageHeader
        role="vpaa"
        title="Top Searches"
        description="Browse all archived theses most often opened from search results."
      />
      <SharedDashboardThesisCollectionView
        emptyMessage="No top searches available yet."
        fetchItems={fetchItems}
        role="vpaa"
        section="top-searches"
      />
    </VpaaLayout>
  );
}
