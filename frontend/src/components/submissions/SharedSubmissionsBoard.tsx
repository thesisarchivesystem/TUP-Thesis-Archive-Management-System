import type { ReactNode } from 'react';
import { CalendarDays, Check, Clock3, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Thesis } from '../../types/thesis.types';

type FilterOption = {
  key: string;
  label: string;
};

type StatCard = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

type SummaryCard = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export type SubmissionTimelineStep = {
  label: string;
  tone: 'done' | 'current' | 'pending';
};

type SubmissionMeta = {
  submittedLabel: string;
  dueLabel: string;
};

type SharedSubmissionsBoardProps = {
  stats: StatCard[];
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  newSubmissionTo: string;
  loading: boolean;
  items: Thesis[];
  emptyMessage: string;
  summaryTitle: string;
  summaryDescription: string;
  summaryCards: SummaryCard[];
  getStatusLabel: (item: Thesis) => string;
  getStatusBadgeClass: (item: Thesis) => string;
  getMeta: (item: Thesis) => SubmissionMeta;
  getTimeline: (item: Thesis) => SubmissionTimelineStep[];
  onViewDetails: (item: Thesis) => void;
  renderActions: (item: Thesis) => ReactNode;
};

const getTimelineNodeContent = (tone: SubmissionTimelineStep['tone']) => {
  if (tone === 'pending') {
    return <span className="student-submission-timeline-node-dot" />;
  }

  return <Check size={18} strokeWidth={2.5} />;
};

export default function SharedSubmissionsBoard({
  stats,
  filters,
  activeFilter,
  onFilterChange,
  newSubmissionTo,
  loading,
  items,
  emptyMessage,
  summaryTitle,
  summaryDescription,
  summaryCards,
  getStatusLabel,
  getStatusBadgeClass,
  getMeta,
  getTimeline,
  onViewDetails,
  renderActions,
}: SharedSubmissionsBoardProps) {
  return (
    <div className="student-submissions-shell">
      <div className="student-submissions-stats">
        {stats.map((stat) => (
          <article key={stat.label} className="student-submissions-stat-card vpaa-card">
            <div className="student-submissions-stat-copy">
              <span>{stat.label}</span>
              <strong>{loading ? '--' : stat.value}</strong>
            </div>
            <span className="student-submissions-stat-icon">{stat.icon}</span>
          </article>
        ))}
      </div>

      <div className="student-submissions-layout">
        <section className="student-submissions-main">
          <div className="student-submissions-toolbar">
            <div className="student-submissions-filters">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`student-submissions-filter${activeFilter === filter.key ? ' active' : ''}`}
                  onClick={() => onFilterChange(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <Link to={newSubmissionTo} className="student-submissions-primary">
              <Plus size={16} />
              New Submission
            </Link>
          </div>

          {loading ? (
            <div className="student-submissions-empty vpaa-card">Loading your submissions...</div>
          ) : items.length ? (
            <div className="student-submissions-list">
              {items.map((item) => {
                const meta = getMeta(item);

                return (
                  <article
                    key={item.id}
                    className={`student-submission-list-card vpaa-card${item.status === 'approved' ? ' student-submission-list-card-approved' : ''}${item.is_archived ? ' student-submission-list-card-archived' : ''}`}
                  >
                    <div className="student-submission-list-head">
                      <div className="student-submission-list-copy">
                        <h3>{item.title}</h3>
                        <div className="student-submission-meta-strip">
                          <span><CalendarDays size={14} /> {meta.submittedLabel}</span>
                          <span><Clock3 size={14} /> {meta.dueLabel}</span>
                        </div>
                      </div>
                      <span className={`${getStatusBadgeClass(item)} student-submission-list-status`}>{getStatusLabel(item)}</span>
                    </div>

                    <div className="student-submission-timeline">
                      {getTimeline(item).map((step, index, steps) => (
                        <div key={step.label} className={`student-submission-timeline-step ${step.tone}`}>
                          <div className="student-submission-timeline-rail">
                            <span className="student-submission-timeline-node">
                              {getTimelineNodeContent(step.tone)}
                            </span>
                            {index < steps.length - 1 ? <span className="student-submission-timeline-line" /> : null}
                          </div>
                          <span className="student-submission-timeline-label">{step.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="student-submission-actions">
                      <button
                        type="button"
                        className="student-submissions-secondary"
                        onClick={() => onViewDetails(item)}
                      >
                        <span className="student-submissions-action-icon"><Eye size={18} /></span>
                        View Details
                      </button>
                      {renderActions(item)}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="student-submissions-empty vpaa-card">{emptyMessage}</div>
          )}
        </section>

        <aside className="student-submissions-side vpaa-card submission-accent-panel submissions-summary-panel">
          <div className="student-submissions-summary-head submissions-summary-head">
            <div>
              <h2>{summaryTitle}</h2>
              <p>{summaryDescription}</p>
            </div>
          </div>

          <div className="student-submissions-summary-grid submission-summary-grid">
            {summaryCards.map((card) => (
              <div key={card.label} className="student-submissions-summary-box">
                <div className="student-submissions-summary-box-head">
                  <span className="student-submissions-summary-icon">{card.icon}</span>
                  <small>{card.label}</small>
                </div>
                <strong>{loading ? '--' : card.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
