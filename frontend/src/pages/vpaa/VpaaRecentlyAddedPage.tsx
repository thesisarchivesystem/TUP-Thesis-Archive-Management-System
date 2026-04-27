import { useCallback } from 'react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { vpaaDashboardService } from '../../services/vpaaDashboardService';

export default function VpaaRecentlyAddedPage() {
  const fetchItems = useCallback(async () => (await vpaaDashboardService.getDashboard()).recent_theses ?? [], []);

  return (
    <VpaaLayout
      title="Recently Added"
      description="Browse all archived theses that were added most recently to the public archive."
    >
      <SharedDashboardThesisCollectionView
        emptyMessage="No recently added theses are available yet."
        fetchItems={fetchItems}
        role="vpaa"
        section="recently-added"
      />
    </VpaaLayout>
  );
}
