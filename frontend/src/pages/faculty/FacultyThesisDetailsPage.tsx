import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedThesisDetailsPage from '../../components/thesis/SharedThesisDetailsPage';

export default function FacultyThesisDetailsPage() {
  return (
    <SharedThesisDetailsPage
      role="faculty"
      title="Archived Thesis"
      description="Review the archived thesis metadata and full research details."
      backTo="/faculty/dashboard"
      backLabel="Back to Faculty Dashboard"
      Layout={FacultyLayout}
    />
  );
}

