import StudentLayout from '../../components/student/StudentLayout';
import SharedThesisDetailsPage from '../../components/thesis/SharedThesisDetailsPage';

export default function StudentThesisDetailsPage() {
  return (
    <SharedThesisDetailsPage
      role="student"
      title="Archived Thesis"
      description="Review the archived thesis metadata and full research details."
      backTo="/student/dashboard"
      backLabel="Back to Student Dashboard"
      Layout={StudentLayout}
    />
  );
}
