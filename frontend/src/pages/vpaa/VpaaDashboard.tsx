import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, LogIn, Clock, TrendingUp } from 'lucide-react';
import StatCard from "../../components/StatCard";
import { useAuth } from '../../hooks/useAuth';
import { vpaaDashboardService } from '../../services/vpaaDashboardService';

interface DashboardStats {
  totalFaculty: number;
  departmentChairs: number;
  roleChanges: number;
  newAccounts: number;
  onLeave: number;
}

interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

const VpaaDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, activityRes] = await Promise.all([
          vpaaDashboardService.getDashboard(),
          vpaaDashboardService.getActivityLog(),
        ]);

        setStats(dashboardRes);
        setActivityLog(activityRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'vpaa') {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-vpaa"></div>
          <p className="mt-4 text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-card-bg rounded-lg border border-primary-maroon/20 p-6">
            <p className="text-primary-maroon font-semibold">{error}</p>
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
            Welcome back, {user?.name || 'VPAA'}
          </h1>
          <p className="text-text-secondary">
            Here's an overview of your thesis management system
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={<Users size={24} />}
            label="Total Faculty"
            value={stats?.totalFaculty || 0}
            trend={8}
            trendLabel="vs last month"
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<UserCheck size={24} />}
            label="Department Chairs"
            value={stats?.departmentChairs || 0}
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<LogIn size={24} />}
            label="New Accounts"
            value={stats?.newAccounts || 0}
            trend={12}
            trendLabel="this month"
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<Clock size={24} />}
            label="On Leave"
            value={stats?.onLeave || 0}
            bgColor="var(--stat-bg-light)"
          />
          <StatCard
            icon={<UserX size={24} />}
            label="Role Changes"
            value={stats?.roleChanges || 0}
            trend={-2}
            trendLabel="this month"
            bgColor="var(--stat-bg-light)"
          />
        </div>

        {/* Activity Log Section */}
        <div className="bg-white dark:bg-card-bg rounded-xl shadow-md border border-text-tertiary/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Recent Activity</h2>
            <a
              href="/vpaa/activity-log"
              className="text-primary-vpaa hover:text-primary-vpaa/80 text-sm font-semibold transition-colors"
            >
              View full log →
            </a>
          </div>

          {activityLog.length > 0 ? (
            <div className="space-y-4">
              {activityLog.slice(0, 8).map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 pb-4 border-b border-text-tertiary/10 last:border-0"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-vpaa mt-2"></div>
                    {index < activityLog.length - 1 && (
                      <div className="w-0.5 h-12 bg-text-tertiary/20 my-2"></div>
                    )}
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary">
                        {entry.user?.name || 'System'}
                      </p>
                      <span className="text-xs text-text-secondary bg-text-tertiary/10 px-2 py-0.5 rounded">
                        {entry.action}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{entry.description}</p>
                    <p className="text-xs text-text-tertiary mt-2">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-8">No activity yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/vpaa/faculty"
            className="p-6 rounded-xl bg-white dark:bg-card-bg border border-text-tertiary/20 hover:border-primary-vpaa/40 hover:shadow-md transition-all group"
          >
            <Users className="text-primary-vpaa mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-text-primary mb-1">Manage Faculty</h3>
            <p className="text-sm text-text-secondary">Add, edit, or manage faculty members</p>
          </a>

          <a
            href="/vpaa/students"
            className="p-6 rounded-xl bg-white dark:bg-card-bg border border-text-tertiary/20 hover:border-primary-vpaa/40 hover:shadow-md transition-all group"
          >
            <TrendingUp className="text-primary-vpaa mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-text-primary mb-1">Student Analytics</h3>
            <p className="text-sm text-text-secondary">View student enrollment and performance</p>
          </a>

          <a
            href="/vpaa/settings"
            className="p-6 rounded-xl bg-white dark:bg-card-bg border border-text-tertiary/20 hover:border-primary-vpaa/40 hover:shadow-md transition-all group"
          >
            <Clock className="text-primary-vpaa mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h3 className="font-semibold text-text-primary mb-1">System Settings</h3>
            <p className="text-sm text-text-secondary">Configure system preferences</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default VpaaDashboard;
