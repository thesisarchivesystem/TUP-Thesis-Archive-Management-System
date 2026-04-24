import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedThesisDetailsPage from '../../components/thesis/SharedThesisDetailsPage';

export default function VpaaThesisDetailsPage() {
  return (
    <SharedThesisDetailsPage
      role="vpaa"
      title="Archived Thesis"
      description="Review the archived thesis metadata and full research details."
      backTo="/vpaa/dashboard"
      backLabel="Back to VPAA Dashboard"
      Layout={VpaaLayout}
    />
  );
}

