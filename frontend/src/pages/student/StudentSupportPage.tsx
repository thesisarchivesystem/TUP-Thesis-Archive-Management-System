import StudentLayout from '../../components/student/StudentLayout';
import SupportCenterContent from '../../components/support/SupportCenterContent';
import { useAuth } from '../../hooks/useAuth';

export default function StudentSupportPage() {
  const { user } = useAuth();

  return (
    <StudentLayout
      title="Support Center"
      description="Submit questions about thesis uploads, archive access, approvals, or account issues."
    >
      <SupportCenterContent role="student" initialName={user?.name || ''} initialEmail={user?.email || ''} />
    </StudentLayout>
  );
}
