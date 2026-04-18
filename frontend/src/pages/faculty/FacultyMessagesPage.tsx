import FacultyLayout from '../../components/faculty/FacultyLayout';
import SharedMessagesView from '../../components/messages/SharedMessagesView';

export default function FacultyMessagesPage() {
  return (
    <FacultyLayout
      title="Messages"
      description="Review student conversations and archive-related message threads from the live backend."
      hidePageIntro
    >
      <SharedMessagesView />
    </FacultyLayout>
  );
}
