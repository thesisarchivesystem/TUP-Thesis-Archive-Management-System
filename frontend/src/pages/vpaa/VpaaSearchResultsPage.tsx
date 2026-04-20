import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedSearchResultsView from '../../components/search/SharedSearchResultsView';

export default function VpaaSearchResultsPage() {
  return (
    <VpaaLayout
      title="Search the Archive"
      description="Browse approved thesis records based on your latest search."
    >
      <SharedSearchResultsView />
    </VpaaLayout>
  );
}
