import SupportCenterContent from '../../components/support/SupportCenterContent';
import { useAuth } from '../../hooks/useAuth';

export default function StudentSupportPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-page-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Support Center</h1>
          <p className="text-text-secondary">
            Submit questions about thesis uploads, archive access, approvals, or account issues.
          </p>
        </div>

        <SupportCenterContent role="student" initialName={user?.name || ''} initialEmail={user?.email || ''} />
      </div>
    </div>
  );
}
