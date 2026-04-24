import StudentLayout from '../../components/student/StudentLayout';
import SupportCenterContent from '../../components/support/SupportCenterContent';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

export default function StudentSupportPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  return (
    <StudentLayout
      title="Support Center"
      description="Submit questions about thesis uploads, archive access, approvals, or account issues."
    >
      <SupportCenterContent
        role="student"
        initialName={user?.name || ''}
        initialEmail={user?.email || ''}
        initialCategory={searchParams.get('category') ?? ''}
        initialMessage={searchParams.get('message') ?? ''}
      />
    </StudentLayout>
  );
}
