import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Download,
  LifeBuoy,
  Plus,
  Search,
  Send,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import {
  adminService,
  type AdminSupportTicketDetail,
  type AdminSupportTicketsResponse,
  type AdminSupportTicketSummary,
} from '../../services/adminService';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const priorityLabel = (priority: string) => priority.replace(/\b\w/g, (letter) => letter.toUpperCase());

const timelineItemsFromTicket = (ticket: AdminSupportTicketDetail) => {
  const createdItem = {
    id: `${ticket.id}-created`,
    title: 'Ticket created',
    description: `by ${ticket.full_name}`,
    timestamp: ticket.submitted_at,
  };

  const replyItems = ticket.replies.map((reply) => ({
    id: reply.id,
    title: reply.is_system ? reply.message : `Replied by ${reply.author_name}`,
    description: reply.is_system ? 'System update' : reply.message,
    timestamp: reply.created_at,
  }));

  return [createdItem, ...replyItems]
    .sort((left, right) => new Date(left.timestamp || 0).getTime() - new Date(right.timestamp || 0).getTime());
};

const downloadTicketsCsv = (tickets: AdminSupportTicketSummary[]) => {
  const rows = [
    ['Reference', 'Requester', 'Email', 'Category', 'Subject', 'Priority', 'Status', 'Updated'],
    ...tickets.map((ticket) => [
      ticket.reference,
      ticket.full_name,
      ticket.email,
      ticket.category,
      ticket.subject,
      priorityLabel(ticket.priority),
      statusLabel(ticket.status),
      formatDateTime(ticket.updated_at),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `support-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminSupportTicketsResponse | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [replyMessage, setReplyMessage] = useState('');
  const [assignTarget, setAssignTarget] = useState('');
  const [busy, setBusy] = useState<'reply' | 'resolve' | 'assign' | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.listSupportTickets();
      setData(response);
      setSelectedTicketId((current) => current ?? response.tickets[0]?.id ?? null);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);

    try {
      const detail = await adminService.getSupportTicket(ticketId);
      setSelectedTicket(detail);
      setAssignTarget(detail.assignee?.id || '');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || 'Failed to load ticket details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }

    void loadTicketDetail(selectedTicketId);
  }, [selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const tickets = data?.tickets ?? [];

    return tickets.filter((ticket) => {
      const matchesSearch = !query || [
        ticket.reference,
        ticket.full_name,
        ticket.email,
        ticket.category,
        ticket.subject,
        ticket.message,
      ].join(' ').toLowerCase().includes(query);

      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [data?.tickets, priorityFilter, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, search, statusFilter, priorityFilter]);

  useEffect(() => {
    if (!filteredTickets.length) return;
    if (!selectedTicketId || !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const visibleTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [currentPage, filteredTickets, pageSize]);

  const currentTicket = selectedTicketId === selectedTicket?.id ? selectedTicket : null;
  const timelineItems = currentTicket ? timelineItemsFromTicket(currentTicket) : [];

  const syncTicketIntoList = (detail: AdminSupportTicketDetail) => {
    setData((current) => {
      if (!current) return current;

      const nextTickets = current.tickets.map((ticket) => (
        ticket.id === detail.id
          ? {
              ...ticket,
              ...detail,
              replies_count: detail.replies.length,
            }
          : ticket
      ));

      const resolvedCount = nextTickets.filter((ticket) => ticket.status === 'resolved').length;
      const openCount = nextTickets.filter((ticket) => ticket.status === 'open').length;
      const inProgressCount = nextTickets.filter((ticket) => ticket.status === 'in_progress').length;

      return {
        ...current,
        tickets: nextTickets,
        stats: {
          ...current.stats,
          total: nextTickets.length,
          open: openCount,
          in_progress: inProgressCount,
          resolved: resolvedCount,
        },
      };
    });
  };

  const handleReply = async () => {
    if (!selectedTicketId || !replyMessage.trim()) return;

    setBusy('reply');
    setError(null);

    try {
      const detail = await adminService.replySupportTicket(selectedTicketId, { message: replyMessage.trim() });
      setSelectedTicket(detail);
      syncTicketIntoList(detail);
      setReplyMessage('');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || 'Failed to send reply.');
    } finally {
      setBusy(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicketId) return;

    setBusy('resolve');
    setError(null);

    try {
      const detail = await adminService.updateSupportTicket(selectedTicketId, { status: 'resolved' });
      setSelectedTicket(detail);
      syncTicketIntoList(detail);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || 'Failed to resolve ticket.');
    } finally {
      setBusy(null);
    }
  };

  const handleAssign = async () => {
    if (!selectedTicketId) return;

    setBusy('assign');
    setError(null);

    try {
      const detail = await adminService.updateSupportTicket(selectedTicketId, {
        assigned_to: assignTarget || null,
        status: currentTicket?.status === 'open' && assignTarget ? 'in_progress' : undefined,
      });
      setSelectedTicket(detail);
      syncTicketIntoList(detail);
      setAssignTarget(detail.assignee?.id || '');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || 'Failed to update assignment.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <SectionLoadingScreen label="Loading ticket management..." />;
  if (error && !data) return <div className="admin-alert">{error}</div>;

  return (
    <div className="admin-page admin-ticket-page">
      <div className="admin-page-intro admin-ticket-intro">
        <div>
          <h1>Ticket Management</h1>
          <p>Review, assign, and respond to support concerns from students and faculty.</p>
        </div>
      </div>

      <section className="admin-ticket-stats-grid">
        <article className="vpaa-card admin-ticket-stat-card">
          <span className="admin-ticket-stat-icon total"><LifeBuoy size={18} /></span>
          <div>
            <small>Total Tickets</small>
            <strong>{data?.stats.total ?? 0}</strong>
            <p>All time tickets</p>
          </div>
        </article>
        <article className="vpaa-card admin-ticket-stat-card">
          <span className="admin-ticket-stat-icon open"><AlertCircle size={18} /></span>
          <div>
            <small>Open</small>
            <strong>{data?.stats.open ?? 0}</strong>
            <p>Require attention</p>
          </div>
        </article>
        <article className="vpaa-card admin-ticket-stat-card">
          <span className="admin-ticket-stat-icon progress"><Clock3 size={18} /></span>
          <div>
            <small>In Progress</small>
            <strong>{data?.stats.in_progress ?? 0}</strong>
            <p>Being handled</p>
          </div>
        </article>
        <article className="vpaa-card admin-ticket-stat-card">
          <span className="admin-ticket-stat-icon resolved"><Check size={18} /></span>
          <div>
            <small>Resolved</small>
            <strong>{data?.stats.resolved ?? 0}</strong>
            <p>Completed</p>
          </div>
        </article>
      </section>

      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-ticket-layout">
        <div className="vpaa-card admin-ticket-panel">
          <div className="admin-ticket-panel-head">
            <h3>Ticket List</h3>
            <div className="admin-ticket-panel-actions">
              <button type="button" className="admin-ticket-secondary-btn" onClick={() => downloadTicketsCsv(filteredTickets)}>
                <Download size={15} />
                <span>Export</span>
              </button>
              <button type="button" className="admin-ticket-primary-btn" onClick={() => navigate('/admin/support')}>
                <Plus size={15} />
                <span>New Ticket</span>
              </button>
            </div>
          </div>

          <div className="admin-ticket-toolbar">
            <label className="admin-users-select admin-ticket-page-size">
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-search admin-ticket-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tickets..."
              />
            </label>

            <label className="admin-users-select">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-select">
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          <div className="admin-ticket-table-wrap">
            <table className="admin-ticket-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Requester</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.length ? visibleTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={ticket.id === selectedTicketId ? 'active' : ''}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <td>{ticket.reference}</td>
                    <td>
                      <strong>{ticket.full_name}</strong>
                      <small>{ticket.requester_role}</small>
                    </td>
                    <td>{ticket.category}</td>
                    <td>{ticket.subject}</td>
                    <td>
                      <span className={`admin-ticket-badge priority-${ticket.priority}`}>{priorityLabel(ticket.priority)}</span>
                    </td>
                    <td>
                      <span className={`admin-ticket-badge status-${ticket.status}`}>{statusLabel(ticket.status)}</span>
                    </td>
                    <td>{formatDateTime(ticket.updated_at)}</td>
                    <td>
                      <button type="button" className="admin-ticket-view-btn" onClick={() => setSelectedTicketId(ticket.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="admin-ticket-empty">No tickets matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-ticket-footer">
            <p>
              {filteredTickets.length
                ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredTickets.length)} of ${filteredTickets.length} entries`
                : 'Showing 0 to 0 of 0 entries'}
            </p>
            <div className="admin-ticket-pagination">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                <ChevronLeft size={14} />
              </button>
              <span>{currentPage}</span>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="vpaa-card admin-ticket-panel admin-ticket-detail-panel">
          <div className="admin-ticket-panel-head">
            <h3>Ticket Details</h3>
          </div>

          {detailLoading ? (
            <div className="admin-ticket-detail-loading">Loading selected ticket...</div>
          ) : currentTicket ? (
            <>
              <div className="admin-ticket-detail-summary">
                <div className="admin-ticket-detail-meta">
                  <div className="admin-ticket-detail-group">
                    <span>Subject</span>
                    <strong>{currentTicket.subject}</strong>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Status</span>
                    <strong className={`admin-ticket-badge status-${currentTicket.status}`}>{statusLabel(currentTicket.status)}</strong>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Submitted by</span>
                    <strong>{currentTicket.full_name}</strong>
                    <small>{currentTicket.email}</small>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Date Submitted</span>
                    <strong>{formatDateTime(currentTicket.submitted_at)}</strong>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Category</span>
                    <strong>{currentTicket.category}</strong>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Assigned To</span>
                    <strong>{currentTicket.assignee?.name || 'Unassigned'}</strong>
                    <small>{currentTicket.assignee?.email || 'Choose an admin below'}</small>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Priority</span>
                    <strong className={`admin-ticket-badge priority-${currentTicket.priority}`}>{priorityLabel(currentTicket.priority)}</strong>
                  </div>
                  <div className="admin-ticket-detail-group">
                    <span>Updated</span>
                    <strong>{formatDateTime(currentTicket.updated_at)}</strong>
                  </div>
                </div>

                <div className="admin-ticket-timeline">
                  <h4>Activity Timeline</h4>
                  <div className="admin-ticket-timeline-list">
                    {timelineItems.map((item) => (
                      <div key={item.id} className="admin-ticket-timeline-item">
                        <span className="admin-ticket-timeline-dot"><CircleDot size={10} /></span>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{formatDateTime(item.timestamp)}</small>
                          <p>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-ticket-conversation">
                <div className="admin-ticket-message-row requester">
                  <span className="admin-ticket-message-avatar">{currentTicket.full_name.slice(0, 2).toUpperCase()}</span>
                  <div className="admin-ticket-message-bubble">
                    <div className="admin-ticket-message-head">
                      <strong>{currentTicket.full_name}</strong>
                      <small>{formatDateTime(currentTicket.submitted_at)}</small>
                    </div>
                    <p>{currentTicket.message}</p>
                  </div>
                </div>

                {currentTicket.replies.map((reply) => (
                  <div key={reply.id} className={`admin-ticket-message-row${reply.is_system ? ' system' : ' admin'}`}>
                    {!reply.is_system ? <span className="admin-ticket-message-avatar admin">{reply.author_name.slice(0, 2).toUpperCase()}</span> : null}
                    <div className={`admin-ticket-message-bubble${reply.is_system ? ' system' : ' admin'}`}>
                      <div className="admin-ticket-message-head">
                        <strong>{reply.author_name}</strong>
                        <small>{formatDateTime(reply.created_at)}</small>
                      </div>
                      <p>{reply.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-ticket-reply-box">
                <label>
                  <span>Reply to Ticket</span>
                  <textarea
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                  />
                </label>
              </div>

              <div className="admin-ticket-detail-actions">
                <button
                  type="button"
                  className="admin-ticket-primary-btn"
                  onClick={() => void handleReply()}
                  disabled={busy !== null || !replyMessage.trim()}
                >
                  <Send size={15} />
                  <span>{busy === 'reply' ? 'Sending...' : 'Send Reply'}</span>
                </button>
                <button
                  type="button"
                  className="admin-ticket-secondary-btn"
                  onClick={() => void handleResolve()}
                  disabled={busy !== null || currentTicket.status === 'resolved'}
                >
                  <Check size={15} />
                  <span>{busy === 'resolve' ? 'Saving...' : 'Mark Resolved'}</span>
                </button>
                <div className="admin-ticket-assign-wrap">
                  <label className="admin-users-select admin-ticket-assign-select">
                    <select value={assignTarget} onChange={(event) => setAssignTarget(event.target.value)}>
                      <option value="">Unassigned</option>
                      {(data?.agents ?? []).map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </label>
                  <button
                    type="button"
                    className="admin-ticket-secondary-btn"
                    onClick={() => void handleAssign()}
                    disabled={busy !== null}
                  >
                    <UserPlus size={15} />
                    <span>{busy === 'assign' ? 'Saving...' : 'Assign'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-ticket-detail-loading">Select a ticket to view details.</div>
          )}
        </div>
      </section>
    </div>
  );
}
