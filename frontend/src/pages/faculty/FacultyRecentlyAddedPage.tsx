import { useCallback } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { facultyDashboardService } from '../../services/facultyDashboardService';

export default function FacultyRecentlyAddedPage() {
  const fetchItems = useCallback(async () => (await facultyDashboardService.getDashboard()).recent_theses ?? [], []);

  return (
    <FacultyLayout
      title="Recently Added"
      description="Browse all archived theses that were added most recently to the public archive."
    >
      <SharedDashboardThesisCollectionView
        emptyMessage="No recently added theses are available yet."
        fetchItems={fetchItems}
        role="faculty"
        section="recently-added"
      />
    </FacultyLayout>
  );
}
