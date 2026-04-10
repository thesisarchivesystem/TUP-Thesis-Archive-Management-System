import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Eye,
  Download,
} from 'lucide-react';
import StatCard from "../../components/StatCard";
import { useAuth } from '../../hooks/useAuth';
import { facultyDashboardService } from '../../services/facultyDashboardService';

interface FacultyDashboardStats {
  assignedStudents: number;
  pendingReviews: number;
  approvedThesis: number;
  totalSubmissions: number;
}

interface Submission {
  id: string;
  title: string;
  studentName: string;
  studentEmail: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  views: number;
}

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FacultyDashboardStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, submissionsRes] = await Promise.all([
          facultyDashboardService.getDashboard(),
          facultyDashboardService.getRecentSubmissions(),
        ]);

        setStats(dashboardRes);
        setRecentSubmissions(submissionsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'faculty') {
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
      default:
        return 'bg-text-tertiary/10 text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-sky"></div>
          <p className="mt-4 text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-card-bg rounded-lg border border-primary-sky/20 p-6">
            <p className="text-primary-sky font-semibold">{error}</p>
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
            Welcome, {user?.name || 'Faculty'}
          </h1>
          <p className="text-text-secondary">
            Manage your students and thesis submissions
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users size={24} />}
            label="Assigned Students"
            value={stats?.assignedStudents || 0}
            trend={4}
            trendLabel="new this month"
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="Pending Reviews"
            value={stats?.pendingReviews || 0}
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            label="Approved Thesis"
            value={stats?.approvedThesis || 0}
            trend={18}
            trendLabel="this semester"
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<BookOpen size={24} />}
            label="Total Submissions"
            value={stats?.totalSubmissions || 0}
            bgColor="var(--stat-bg-light)"
          />
        </div>

        {/* Recent Submissions */}
        <div className="bg-white dark:bg-card-bg rounded-xl shadow-md border border-text-tertiary/10 overflow-hidden">
          <div className="p-6 border-b border-text-tertiary/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Recent Submissions</h2>
              <a
                href="/faculty/submissions"
                className="text-primary-sky hover:text-primary-sky/80 text-sm font-semibold transition-colors"
              >
                View all →
              </a>
            </div>
          </div>

          {recentSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-text-tertiary/5 border-b border-text-tertiary/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-text-tertiary/10 hover:bg-text-tertiary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <FileText
                            size={18}
                            className="text-primary-sky mt-1 flex-shrink-0"
                          />
                          <div>
                            <p className="font-medium text-text-primary line-clamp-1">
                              {submission.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-text-primary">
                            {submission.studentName}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {submission.studentEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-text-secondary">
                          <Eye size={16} />
                          <span className="text-sm">{submission.views}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BookOpen size={48} className="mx-auto text-text-tertiary mb-4" />
              <p className="text-text-secondary">No submissions yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/faculty/students"
            className="p-6 rounded-xl bg-white dark:bg-card-bg border border-text-tertiary/20 hover:border-primary-sky/40 hover:shadow-md transition-all group"
          >
            <Users className="text-primary-sky mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-text-primary mb-1">My Students</h3>
            <p className="text-sm text-text-secondary">View and manage your assigned students</p>
          </a>

          <a
            href="/faculty/submissions"
            className="p-6 rounded-xl bg-white dark:bg-card-bg border border-text-tertiary/20 hover:border-primary-sky/40 hover:shadow-md transition-all group"
          >
            <FileText className="text-primary-sky mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-text-primary mb-1">Review Submissions</h3>
            <p className="text-sm text-text-secondary">Review and approve pending submissions</p>
          </a>

          <a
            href="/faculty/settings"
            className="p-6 rounded-xl bg-white dark:bg-card-bg border border-text-tertiary/20 hover:border-primary-sky/40 hover:shadow-md transition-all group"
          >
            <Download className="text-primary-sky mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-text-primary mb-1">My Profile</h3>
            <p className="text-sm text-text-secondary">Update your profile and preferences</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
