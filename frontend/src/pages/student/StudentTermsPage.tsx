import TermsAndConditionsContent from '../../components/info/TermsAndConditionsContent';
import StudentLayout from '../../components/student/StudentLayout';

export default function StudentTermsPage() {
  return (
    <StudentLayout
      title="Terms & Conditions"
      description="Archive responsibilities, submission rules, and institutional data handling in one clear view."
    >
      <TermsAndConditionsContent />
    </StudentLayout>
  );
}
