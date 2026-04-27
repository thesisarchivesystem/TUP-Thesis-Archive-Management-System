import { useCallback } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { facultyDashboardService } from '../../services/facultyDashboardService';

export default function FacultyTopSearchesPage() {
  const fetchItems = useCallback(async () => (await facultyDashboardService.getDashboard()).top_searches ?? [], []);

  return (
    <FacultyLayout
      title="Top Searches"
      description="Browse all archived theses most often opened from search results."
    >
      <SharedDashboardThesisCollectionView
        emptyMessage="No top searches are available yet."
        fetchItems={fetchItems}
        role="faculty"
        section="top-searches"
      />
    </FacultyLayout>
  );
}
