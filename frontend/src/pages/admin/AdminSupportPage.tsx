import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SupportCenterContent from '../../components/support/SupportCenterContent';

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <h1>Support <em>Center</em></h1>
          <p>Get help with archive records, account access, approvals, and administrative issues.</p>
        </div>
      </div>

      <SupportCenterContent
        role="admin"
        initialName={user?.name || ''}
        initialEmail={user?.email || ''}
        initialCategory={searchParams.get('category') ?? ''}
        initialMessage={searchParams.get('message') ?? ''}
      />
    </div>
  );
}
