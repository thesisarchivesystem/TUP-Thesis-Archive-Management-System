import type { ReactNode } from 'react';
import SharedThesisDetailsPage from '../../components/thesis/SharedThesisDetailsPage';

type AdminThesisDetailsLayoutProps = {
  title: ReactNode;
  description: string;
  children: ReactNode;
  hidePageIntro?: boolean;
};

function AdminThesisDetailsLayout({ children }: AdminThesisDetailsLayoutProps) {
  return <div className="admin-page admin-thesis-detail-page">{children}</div>;
}

export default function AdminThesisDetailsPage() {
  return (
    <SharedThesisDetailsPage
      role="admin"
      title="Archived Thesis"
      description="Review the archived thesis metadata and full research details."
      backTo="/admin/submissions"
      backLabel="Back to Thesis List"
      Layout={AdminThesisDetailsLayout}
    />
  );
}
