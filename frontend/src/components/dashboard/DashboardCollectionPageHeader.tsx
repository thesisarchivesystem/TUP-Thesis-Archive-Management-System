import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type DashboardCollectionPageHeaderProps = {
  role: 'student' | 'faculty' | 'vpaa';
  title: string;
  description: string;
};

export default function DashboardCollectionPageHeader({
  role,
  title,
  description,
}: DashboardCollectionPageHeaderProps) {
  const dashboardPath = `/${role}/dashboard`;
  const dashboardLabel = role === 'student' ? 'Student Dashboard' : role === 'faculty' ? 'Faculty Dashboard' : 'VPAA Dashboard';

  return (
    <div className="vpaa-page-intro">
      <Link
        to={dashboardPath}
        className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--maroon)] no-underline transition hover:translate-x-[-2px]"
      >
        <ArrowLeft size={16} />
        <span>{`Back to ${dashboardLabel}`}</span>
      </Link>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
