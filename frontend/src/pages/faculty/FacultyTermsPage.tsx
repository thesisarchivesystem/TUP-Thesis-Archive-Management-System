import FacultyLayout from '../../components/faculty/FacultyLayout';
import TermsAndConditionsContent from '../../components/info/TermsAndConditionsContent';

export default function FacultyTermsPage() {
  return (
    <FacultyLayout
      title="Terms & Conditions"
      description="Archive responsibilities, submission rules, and institutional data handling in one clear view."
    >
      <TermsAndConditionsContent />
    </FacultyLayout>
  );
}
