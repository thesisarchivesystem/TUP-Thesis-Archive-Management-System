import { useCallback } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import DashboardCollectionPageHeader from '../../components/dashboard/DashboardCollectionPageHeader';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { studentDashboardService } from '../../services/studentDashboardService';

export default function StudentRecentlyAddedPage() {
  const fetchItems = useCallback(async () => (await studentDashboardService.getDashboard()).recent_theses ?? [], []);

  return (
    <StudentLayout
      title="Recently Added"
      description="Browse all archived theses that were added most recently to the public archive."
      hidePageIntro
    >
      <DashboardCollectionPageHeader
        role="student"
        title="Recently Added"
        description="Browse all archived theses that were added most recently to the public archive."
      />
      <SharedDashboardThesisCollectionView
        emptyMessage="No recently added theses are available yet."
        fetchItems={fetchItems}
        role="student"
        section="recently-added"
      />
    </StudentLayout>
  );
}
