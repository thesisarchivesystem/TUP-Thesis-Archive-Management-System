import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, Users, XCircle } from 'lucide-react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';
import { vpaaDashboardService, type DailyQuote, type VpaaDashboardStats, type VpaaDashboardThesis } from '../../services/vpaaDashboardService';

const fallbackQuote = {
  body: "There is more treasure in books than in all the pirate's loot on Treasure Island.",
  author: 'Walt Disney',
};

export default function VpaaDashboard() {
  const [stats, setStats] = useState<VpaaDashboardStats | null>(null);
  const [recentTheses, setRecentTheses] = useState<VpaaDashboardThesis[]>([]);
  const [topSearches, setTopSearches] = useState<VpaaDashboardThesis[]>([]);
  const [quote, setQuote] = useState<DailyQuote | null>(null);

  useEffect(() => {
    void vpaaDashboardService.getDashboard().then((dashboardResponse) => {
      setStats(dashboardResponse.stats);
      setRecentTheses(dashboardResponse.recent_theses ?? []);
      setTopSearches(dashboardResponse.top_searches ?? []);
    }).catch(() => {
      setStats(null);
      setRecentTheses([]);
      setTopSearches([]);
    });
  }, []);

  useEffect(() => {
    void vpaaDashboardService.getDailyQuote().then(setQuote).catch(() => setQuote(null));
  }, []);

  const statCards = [
    { label: 'Total Faculty', value: stats?.total_faculty ?? 0, icon: <Users size={20} />, tone: 'si-sky' },
    { label: 'Department Chairs', value: stats?.department_chairs ?? 0, icon: <CheckCircle2 size={20} />, tone: 'si-sage' },
    { label: 'Role Changes', value: stats?.role_changes_this_month ?? 0, icon: <XCircle size={20} />, tone: 'si-maroon' },
    { label: 'New Accounts', value: stats?.new_accounts_this_month ?? 0, icon: <Clock3 size={20} />, tone: 'si-gold' },
    { label: 'On Leave', value: stats?.on_leave ?? 0, icon: <BookOpen size={20} />, tone: 'si-terracotta' },
  ];

  const recentCards = useMemo(() => recentTheses.slice(0, 8), [recentTheses]);
  const topSearchCards = useMemo(() => topSearches.slice(0, 8), [topSearches]);

  return (
    <VpaaLayout
      title={<><span>Welcome back, </span><em>VPAA</em></>}
      description="Here’s your dashboard overview for thesis approvals, archive activity, faculty oversight, and department updates."
    >
      <div className="vpaa-hero-row">
        <div className="vpaa-quote-banner">
          <div>Today&apos;s Quote</div>
          <p className="vpaa-quote-body">&quot;{quote?.body || fallbackQuote.body}&quot;</p>
          <span>- {quote?.author || fallbackQuote.author}</span>
        </div>

        <div className="vpaa-cover-strip">
          <div className="vpaa-cover-strip-label">Recently Added</div>
          <div className="vpaa-cover-scroll">
            {recentCards.slice(0, 4).map((item) => (
              <div className="vpaa-cover" key={item.id}>
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">{item.department || item.program || 'Research Archive'}</div>
                <div className="vpaa-cover-title">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="vpaa-grid-5" style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <div className="vpaa-card vpaa-stat-card" key={card.label}>
            <div>
              <div className="vpaa-stat-label">{card.label}</div>
              <div className="vpaa-stat-value">{card.value}</div>
            </div>
            <div className={`vpaa-stat-icon ${card.tone}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="vpaa-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Top Searches</h3>
          <span style={{ color: 'var(--maroon)', fontWeight: 700 }}>Show All</span>
        </div>
        <div className="vpaa-grid-4">
          {topSearchCards.map((item) => (
            <div className="vpaa-list-card" key={item.id}>
              <div className="vpaa-cover" style={{ width: '100%', minWidth: 'unset', height: 220 }}>
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">{item.department || item.program || 'Research Archive'}</div>
                <div className="vpaa-cover-title">{item.title}</div>
              </div>
              <div style={{ marginTop: 10, fontWeight: 700 }}>{item.title}</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{item.author}, {item.year}</div>
            </div>
          ))}
        </div>
      </div>
    </VpaaLayout>
  );
}
