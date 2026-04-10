import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Eye,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Plus,
  Share2,
} from 'lucide-react';
import StatCard from "../../components/StatCard";
import { useAuth } from '../../hooks/useAuth';
import { studentDashboardService } from '../../services/studentDashboardService';

interface StudentDashboardStats {
  mySubmissions: number;
  totalViews: number;
  pendingReview: number;
  approved: number;
}

interface MySubmission {
  id: string;
  title: string;
  abstract: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string | null;
  views: number;
  adviser: {
    name: string;
    email: string;
  } | null;
  rejectionReason?: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, submissionsRes] = await Promise.all([
          studentDashboardService.getDashboard(),
          studentDashboardService.getMySubmissions(),
        ]);

        setStats(dashboardRes);
        setSubmissions(submissionsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'student') {
      fetchDashboardData();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300';
      case 'rejected':
        return 'bg-primary-maroon/10 text-primary-maroon';
      case 'under_review':
        return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
      case 'submitted':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'draft':
        return 'bg-text-tertiary/10 text-text-secondary';
      default:
        return 'bg-text-tertiary/10 text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={16} />;
      case 'rejected':
        return <AlertCircle size={16} />;
      case 'under_review':
        return <Clock size={16} />;
      case 'submitted':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-sage"></div>
          <p className="mt-4 text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-card-bg rounded-lg border border-primary-sage/20 p-6">
            <p className="text-primary-sage font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Welcome, {user?.name || 'Student'}
          </h1>
          <p className="text-text-secondary">
            Track your thesis submissions and their progress
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText size={24} />}
            label="My Submissions"
            value={stats?.mySubmissions || 0}
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<Eye size={24} />}
            label="Total Views"
            value={stats?.totalViews || 0}
            trend={15}
            trendLabel="this month"
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="Pending Review"
            value={stats?.pendingReview || 0}
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            label="Approved"
            value={stats?.approved || 0}
            trend={5}
            trendLabel="this semester"
            bgColor="var(--stat-bg-light)"
          />
        </div>

        {/* Upload CTA */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary-sage/10 to-primary-sage/5 border border-primary-sage/20 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Ready to submit?</h3>
            <p className="text-sm text-text-secondary mt-1">
              Upload your thesis and start your review process
            </p>
          </div>
          <a
            href="/student/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-sage hover:bg-primary-sage/90 text-white font-semibold transition-colors flex-shrink-0"
          >
            <Plus size={20} />
            New Submission
          </a>
        </div>

        {/* My Submissions */}
        <div className="bg-white dark:bg-card-bg rounded-xl shadow-md border border-text-tertiary/10 overflow-hidden">
          <div className="p-6 border-b border-text-tertiary/10">
            <h2 className="text-2xl font-bold text-text-primary">My Submissions</h2>
          </div>

          {submissions.length > 0 ? (
            <div className="divide-y divide-text-tertiary/10">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-6 hover:bg-text-tertiary/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary truncate">
                          {submission.title}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {getStatusIcon(submission.status)}
                          {getStatusLabel(submission.status)}
                        </span>
                      </div>

                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {submission.abstract}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-text-secondary mb-3">
                        <div className="flex items-center gap-2">
                          <Eye size={16} />
                          <span>{submission.views} views</span>
                        </div>

                        {submission.adviser && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">Adviser:</span>
                            <span>{submission.adviser.name}</span>
                          </div>
                        )}

                        {submission.submittedAt && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Rejection reason */}
                      {submission.status === 'rejected' && submission.rejectionReason && (
                        <div className="mt-3 p-3 rounded-lg bg-primary-maroon/5 border border-primary-maroon/20">
                          <p className="text-xs font-semibold text-primary-maroon mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-text-secondary">
                            {submission.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {submission.status === 'draft' && (
                        <a
                          href={`/student/edit-submission/${submission.id}`}
                          className="px-4 py-2 rounded-lg border border-text-tertiary/30 hover:bg-text-tertiary/10 text-text-primary font-medium text-sm transition-colors"
                        >
                          Edit
                        </a>
                      )}
                      {submission.status === 'rejected' && (
                        <a
                          href={`/student/resubmit/${submission.id}`}
                          className="px-4 py-2 rounded-lg bg-primary-sage hover:bg-primary-sage/90 text-white font-medium text-sm transition-colors"
                        >
                          Resubmit
                        </a>
                      )}
                      {submission.status === 'approved' && (
                        <button className="px-4 py-2 rounded-lg border border-text-tertiary/30 hover:bg-text-tertiary/10 text-text-primary font-medium text-sm transition-colors flex items-center gap-2">
                          <Share2 size={16} />
                          Share
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <BookOpen size={48} className="mx-auto text-text-tertiary mb-4" />
              <p className="text-text-secondary mb-4">No submissions yet</p>
              <a
                href="/student/upload"
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-sage hover:bg-primary-sage/90 text-white font-semibold transition-colors"
              >
                <Plus size={18} />
                Create Your First Submission
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
