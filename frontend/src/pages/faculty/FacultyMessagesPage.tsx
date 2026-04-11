import SharedMessagesView from '../../components/messages/SharedMessagesView';

export default function FacultyMessagesPage() {
  return (
    <div className="min-h-screen bg-page-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Messages</h1>
          <p className="text-text-secondary">Review student conversations using the same live Supabase-backed message interface.</p>
        </div>

        <SharedMessagesView />
      </div>
    </div>
  );
}
