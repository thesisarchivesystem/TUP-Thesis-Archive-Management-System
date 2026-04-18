import VpaaLayout from '../../components/vpaa/VpaaLayout';
import TermsAndConditionsContent from '../../components/info/TermsAndConditionsContent';

export default function VpaaTermsPage() {
  return (
    <VpaaLayout title="Terms & Conditions" description="Archive responsibilities, submission rules, and institutional data handling in one clear view.">
      <TermsAndConditionsContent />
    </VpaaLayout>
  );
}
