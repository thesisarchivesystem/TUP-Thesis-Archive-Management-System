import { useCallback } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import DashboardCollectionPageHeader from '../../components/dashboard/DashboardCollectionPageHeader';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { studentDashboardService } from '../../services/studentDashboardService';

export default function StudentTopSearchesPage() {
  const fetchItems = useCallback(async () => (await studentDashboardService.getDashboard()).top_searches ?? [], []);

  return (
    <StudentLayout
      title="Top Searches"
      description="Browse all archived theses most often opened from search results."
      hidePageIntro
    >
      <DashboardCollectionPageHeader
        role="student"
        title="Top Searches"
        description="Browse all archived theses most often opened from search results."
      />
      <SharedDashboardThesisCollectionView
        emptyMessage="No top searches are available yet."
        fetchItems={fetchItems}
        role="student"
        section="top-searches"
      />
    </StudentLayout>
  );
}
