import { useCallback } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { thesisService } from '../../services/thesisService';

export default function StudentAllThesesPage() {
  const fetchItems = useCallback(async () => (await thesisService.list({ per_page: 200, sort: 'title' })).data ?? [], []);

  return (
    <StudentLayout
      title="All Theses"
      description="Browse all archived theses in alphabetical order."
    >
      <SharedDashboardThesisCollectionView
        emptyMessage="No archived theses are available yet."
        fetchItems={fetchItems}
        role="student"
        section="all"
      />
    </StudentLayout>
  );
}
