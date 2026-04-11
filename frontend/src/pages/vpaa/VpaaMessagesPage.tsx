import VpaaLayout from '../../components/vpaa/VpaaLayout';
import SharedMessagesView from '../../components/messages/SharedMessagesView';

export default function VpaaMessagesPage() {
  return (
    <VpaaLayout
      title="Messages"
      description="Use the VPAA message center layout from the prototype to review faculty conversations and archive notices."
      hidePageIntro
    >
      <SharedMessagesView />
    </VpaaLayout>
  );
}
