import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SupportCenterContent from '../../components/support/SupportCenterContent';
import { useAuth } from '../../hooks/useAuth';

export default function VpaaSupportPage() {
  const { user } = useAuth();

  return (
    <VpaaLayout title="Support Center" description="Get help with submissions, approvals, account access, and archive policies.">
      <SupportCenterContent role="vpaa" initialName={user?.name || ''} initialEmail={user?.email || ''} />
    </VpaaLayout>
  );
}
