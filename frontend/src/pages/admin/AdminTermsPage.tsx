import TermsAndConditionsContent from '../../components/info/TermsAndConditionsContent';

export default function AdminTermsPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <h1>Terms &amp; <em>Conditions</em></h1>
          <p>Archive responsibilities, submission rules, and institutional data handling in one clear view.</p>
        </div>
      </div>

      <TermsAndConditionsContent />
    </div>
  );
}
