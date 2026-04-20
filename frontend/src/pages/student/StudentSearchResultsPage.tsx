import StudentLayout from '../../components/student/StudentLayout';
import SharedSearchResultsView from '../../components/search/SharedSearchResultsView';

export default function StudentSearchResultsPage() {
  return (
    <StudentLayout
      title="Search the Archive"
      description="Browse approved thesis records based on your latest search."
    >
      <SharedSearchResultsView />
    </StudentLayout>
  );
}
