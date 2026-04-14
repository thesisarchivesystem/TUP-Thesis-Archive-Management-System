import FacultyLayout from '../../components/faculty/FacultyLayout';
import SupportCenterContent from '../../components/support/SupportCenterContent';
import { useAuth } from '../../hooks/useAuth';

export default function FacultySupportPage() {
  const { user } = useAuth();

  return (
    <FacultyLayout
      title="Support Center"
      description="Get help with advising workflows, archive access, and thesis review concerns."
    >
      <SupportCenterContent role="faculty" initialName={user?.name || ''} initialEmail={user?.email || ''} />
    </FacultyLayout>
  );
}
