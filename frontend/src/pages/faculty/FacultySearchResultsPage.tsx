import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedSearchResultsView from '../../components/search/SharedSearchResultsView';

export default function FacultySearchResultsPage() {
  return (
    <FacultyLayout
      title="Search the Archive"
      description="Browse approved thesis records based on your latest search."
    >
      <SharedSearchResultsView />
    </FacultyLayout>
  );
}
