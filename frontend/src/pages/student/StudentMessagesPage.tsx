import StudentLayout from '../../components/student/StudentLayout';
import SharedMessagesView from '../../components/messages/SharedMessagesView';

export default function StudentMessagesPage() {
  return (
    <StudentLayout
      title="Messages"
      description="View adviser and archive conversations with the same live backend-backed message interface."
      hidePageIntro
    >
      <SharedMessagesView />
    </StudentLayout>
  );
}
