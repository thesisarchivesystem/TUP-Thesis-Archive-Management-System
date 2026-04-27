import { useCallback } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import DashboardCollectionPageHeader from '../../components/dashboard/DashboardCollectionPageHeader';
import SharedDashboardThesisCollectionView from '../../components/dashboard/SharedDashboardThesisCollectionView';
import { thesisService } from '../../services/thesisService';

export default function FacultyAllThesesPage() {
  const fetchItems = useCallback(async () => (await thesisService.list({ per_page: 200, sort: 'title' })).data ?? [], []);

  return (
    <FacultyLayout
      title="All Theses"
      description="Browse all archived theses in alphabetical order."
      hidePageIntro
    >
      <DashboardCollectionPageHeader
        role="faculty"
        title="All Theses"
        description="Browse all archived theses in alphabetical order."
      />
      <SharedDashboardThesisCollectionView
        emptyMessage="No archived theses are available yet."
        fetchItems={fetchItems}
        role="faculty"
        section="all"
      />
    </FacultyLayout>
  );
}
