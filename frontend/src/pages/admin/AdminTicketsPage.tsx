import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
  FileText,
  Folder,
  Mail,
  Paperclip,
  Search,
  Tag,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import {
  adminService,
  type AdminSupportTicketDetail,
  type AdminSupportTicketSummary,
  type AdminSupportTicketsResponse,
  type AdminTicketStatus,
} from '../../services/adminService';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

type SortOrder = 'newest' | 'oldest';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

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

const getTicketTime = (ticket: AdminSupportTicketSummary) => {
  const time = new Date(ticket.updated_at || ticket.submitted_at || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages] as const;
};

const getAttachmentName = (ticket: AdminSupportTicketSummary | AdminSupportTicketDetail) => {
  const attachment = ticket.attachment_url || ticket.attachment_access_url;
  if (!attachment) return 'Ticket attachment';

  try {
    const parsed = new URL(attachment);
    const name = parsed.pathname.split('/').filter(Boolean).pop();
    return name ? decodeURIComponent(name) : 'Ticket attachment';
  } catch {
    const name = attachment.split('/').filter(Boolean).pop();
    return name ? decodeURIComponent(name.split('?')[0]) : 'Ticket attachment';
  }
};

export default function AdminTicketsPage() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [data, setData] = useState<AdminSupportTicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<AdminTicketStatus | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminService.listSupportTickets();
        setData(response);
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

    void loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const tickets = data?.tickets ?? [];

    return tickets
      .filter((ticket) => {
        const matchesSearch =
          !query ||
          [
            ticket.reference,
            ticket.full_name,
            ticket.email,
            ticket.category,
            ticket.subject,
            ticket.message,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query);

        const matchesStatus = !statusFilter || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        const direction = sortOrder === 'newest' ? -1 : 1;
        return (getTicketTime(left) - getTicketTime(right)) * direction;
      });
  }, [data?.tickets, search, sortOrder, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, search, sortOrder, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const visibleTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [currentPage, filteredTickets, pageSize]);

  const paginationItems = getPaginationItems(currentPage, totalPages);
  const showingStart = filteredTickets.length ? (currentPage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(currentPage * pageSize, filteredTickets.length);
  const fallbackSelectedTicket = useMemo(
    () => data?.tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [data?.tickets, selectedTicketId],
  );
  const viewedTicket = selectedTicket ?? fallbackSelectedTicket;
  const adminNotes = selectedTicket?.replies.filter((reply) => reply.author_role === 'admin' || reply.is_system) ?? [];
  const attachmentUrl = viewedTicket?.attachment_access_url || viewedTicket?.attachment_url || '';

  const openTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSelectedTicket(null);
    setDetailError(null);
  };

  const closeTicket = () => {
    setSelectedTicketId(null);
    setSelectedTicket(null);
    setDetailError(null);
    setUpdatingStatus(null);
    setResolutionNote('');
    setSavingNote(false);
  };

  useEffect(() => {
    if (!selectedTicketId) return;

    let active = true;

    const loadTicketDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const ticket = await adminService.getSupportTicket(selectedTicketId);
        if (active) setSelectedTicket(ticket);
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        if (active) setDetailError(message || 'Failed to load ticket details.');
      } finally {
        if (active) setDetailLoading(false);
      }
    };

    void loadTicketDetail();

    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  const updateTicketStatus = async (status: AdminTicketStatus) => {
    if (!selectedTicketId) return;

    setUpdatingStatus(status);
    setDetailError(null);

    try {
      const updated = await adminService.updateSupportTicket(selectedTicketId, { status });
      setSelectedTicket(updated);
      setData((current) =>
        current
          ? {
              ...current,
              tickets: current.tickets.map((ticket) =>
                ticket.id === updated.id ? { ...ticket, ...updated } : ticket,
              ),
            }
          : current,
      );
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setDetailError(message || 'Failed to update ticket status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const saveResolutionNote = async () => {
    if (!selectedTicketId) return;

    const message = resolutionNote.trim();
    if (!message) return;

    setSavingNote(true);
    setDetailError(null);

    try {
      const updated = await adminService.replySupportTicket(selectedTicketId, { message });
      setSelectedTicket(updated);
      setResolutionNote('');
      setData((current) =>
        current
          ? {
              ...current,
              tickets: current.tickets.map((ticket) =>
                ticket.id === updated.id ? { ...ticket, ...updated } : ticket,
              ),
            }
          : current,
      );
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setDetailError(message || 'Failed to save admin note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) return <SectionLoadingScreen label="Loading ticket list..." />;
  if (error && !data) return <div className="admin-alert">{error}</div>;

  return (
    <div className="admin-page admin-ticket-page">
      <div className="admin-page-intro">
        <div>
          <h1>Ticket Management</h1>
          <p>Review and respond to support concerns from student and faculty.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-ticket-layout">
        <div className="admin-ticket-panel">
          <div className="admin-ticket-panel-head">
            <span className="admin-ticket-title-icon">
              <Ticket size={13} strokeWidth={1.9} />
            </span>
            <h3>Ticket List</h3>
          </div>

          <div className="admin-users-toolbar admin-ticket-toolbar">
            <label className="admin-users-select admin-ticket-select admin-ticket-page-size">
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-search admin-ticket-search">
              <Search size={15} strokeWidth={1.8} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ticket ID, requester, or subject..."
              />
            </label>

            <label className="admin-users-select admin-ticket-select admin-ticket-sort-select">
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="admin-users-select admin-ticket-select admin-ticket-status-select">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          <div className="admin-table-wrap admin-ticket-table-wrap">
            <table className="admin-table admin-ticket-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Requester</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.length ? (
                  visibleTickets.map((ticket) => (
                    <tr key={ticket.id} className={ticket.id === selectedTicketId ? 'active' : undefined}>
                      <td>{ticket.reference}</td>
                      <td>{ticket.full_name}</td>
                      <td>{ticket.category}</td>
                      <td>
                        <span className={`admin-ticket-badge priority-${ticket.priority}`}>
                          {priorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-ticket-badge status-${ticket.status}`}>{statusLabel(ticket.status)}</span>
                      </td>
                      <td>{formatDate(ticket.updated_at || ticket.submitted_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-ticket-view-btn"
                          onClick={() => openTicket(ticket.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="admin-ticket-empty">
                      No tickets matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination admin-ticket-footer">
            <p>
              Showing {showingStart} to {showingEnd} of {filteredTickets.length}{' '}
              {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
            </p>

            <div className="admin-users-pagination-controls admin-ticket-pagination">
              <button
                type="button"
                className="admin-users-page-btn admin-ticket-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              {paginationItems.map((item) =>
                typeof item === 'number' ? (
                  <button
                    type="button"
                    key={item}
                    className={`admin-users-page-btn admin-ticket-page-btn${item === currentPage ? ' active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                    aria-current={item === currentPage ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={item} className="admin-ticket-pagination-ellipsis">
                    ...
                  </span>
                ),
              )}

              <button
                type="button"
                className="admin-users-page-btn admin-ticket-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {selectedTicketId ? (
        <div className="admin-ticket-view-backdrop" onClick={closeTicket} role="presentation">
          <article
            className="admin-ticket-view-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-ticket-view-title"
          >
            <header className="admin-ticket-view-header">
              <div className="admin-ticket-view-title">
                <span className="admin-ticket-title-icon">
                  <Ticket size={16} strokeWidth={1.9} />
                </span>
                <h2 id="admin-ticket-view-title">View Ticket</h2>
              </div>
              <button type="button" className="admin-ticket-view-close" onClick={closeTicket} aria-label="Close ticket">
                <X size={20} />
              </button>
            </header>

            {viewedTicket ? (
              <>
                <section className="admin-ticket-view-card admin-ticket-view-overview">
                  <div className="admin-ticket-view-overview-head">
                    <div>
                      <h3>{viewedTicket.subject}</h3>
                      <p>{viewedTicket.reference}</p>
                    </div>
                    <div className="admin-ticket-view-priority">
                      <span className={`admin-ticket-badge priority-${viewedTicket.priority}`}>
                        {priorityLabel(viewedTicket.priority)}
                      </span>
                      <small>Priority</small>
                    </div>
                  </div>

                  <div className="admin-ticket-view-meta">
                    <div className="admin-ticket-view-meta-item">
                      <UserRound size={18} />
                      <span>Requester</span>
                      <strong>{viewedTicket.full_name}</strong>
                    </div>
                    <div className="admin-ticket-view-meta-item">
                      <Mail size={18} />
                      <span>Email</span>
                      <strong>{viewedTicket.email}</strong>
                    </div>
                    <div className="admin-ticket-view-meta-item">
                      <Tag size={18} />
                      <span>Status</span>
                      <strong>
                        <span className={`admin-ticket-badge status-${viewedTicket.status}`}>
                          {statusLabel(viewedTicket.status)}
                        </span>
                      </strong>
                    </div>
                    <div className="admin-ticket-view-meta-item">
                      <Folder size={18} />
                      <span>Category</span>
                      <strong>{viewedTicket.category}</strong>
                    </div>
                    <div className="admin-ticket-view-meta-item">
                      <CalendarDays size={18} />
                      <span>Submitted</span>
                      <strong>{formatDateTime(viewedTicket.submitted_at)}</strong>
                    </div>
                    <div className="admin-ticket-view-meta-item">
                      <CalendarDays size={18} />
                      <span>Last Updated</span>
                      <strong>{formatDateTime(viewedTicket.updated_at || viewedTicket.submitted_at)}</strong>
                    </div>
                  </div>
                </section>

                <section className="admin-ticket-view-card admin-ticket-view-section">
                  <FileText size={18} />
                  <div>
                    <h3>Concern Details</h3>
                    <p>{viewedTicket.message}</p>
                  </div>
                </section>

                <section className="admin-ticket-view-card admin-ticket-view-section">
                  <Paperclip size={18} />
                  <div>
                    <h3>Attachment ({attachmentUrl ? 1 : 0})</h3>
                    {attachmentUrl ? (
                      <a className="admin-ticket-attachment" href={attachmentUrl} target="_blank" rel="noreferrer">
                        <FileImage size={18} />
                        <span>
                          <strong>{getAttachmentName(viewedTicket)}</strong>
                          <small>Open attached file</small>
                        </span>
                        <Download size={18} />
                      </a>
                    ) : (
                      <p className="admin-ticket-muted">No attachment was provided for this ticket.</p>
                    )}
                  </div>
                </section>

                <section className="admin-ticket-view-card admin-ticket-view-section">
                  <FileText size={18} />
                  <div>
                    <h3>Admin Resolution Notes</h3>
                    {detailLoading ? <p className="admin-ticket-muted">Loading notes...</p> : null}
                    {!detailLoading && adminNotes.length ? (
                      adminNotes.map((reply) => <p key={reply.id}>{reply.message}</p>)
                    ) : null}
                    {!detailLoading && !adminNotes.length ? (
                      <p className="admin-ticket-muted">No admin notes have been added yet.</p>
                    ) : null}
                    <label className="admin-ticket-note-field">
                      <span>Add note</span>
                      <textarea
                        value={resolutionNote}
                        onChange={(event) => setResolutionNote(event.target.value)}
                        placeholder="Type admin resolution notes here..."
                      />
                    </label>
                    <div className="admin-ticket-note-actions">
                      <button
                        type="button"
                        className="admin-ticket-modal-btn progress"
                        disabled={savingNote || !resolutionNote.trim()}
                        onClick={saveResolutionNote}
                      >
                        {savingNote ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="admin-ticket-view-loading">Loading ticket details...</div>
            )}

            {detailError ? <div className="admin-alert admin-ticket-view-alert">{detailError}</div> : null}

            <footer className="admin-ticket-view-actions">
              <button type="button" className="admin-ticket-modal-btn neutral" onClick={closeTicket}>
                Close
              </button>
              <div className="admin-ticket-view-status-actions">
                <button
                  type="button"
                  className="admin-ticket-modal-btn progress"
                  disabled={!viewedTicket || viewedTicket.status === 'in_progress' || updatingStatus !== null}
                  onClick={() => updateTicketStatus('in_progress')}
                >
                  {updatingStatus === 'in_progress' ? 'Updating...' : 'Mark In Progress'}
                </button>
                <button
                  type="button"
                  className="admin-ticket-modal-btn resolve"
                  disabled={!viewedTicket || viewedTicket.status === 'resolved' || updatingStatus !== null}
                  onClick={() => updateTicketStatus('resolved')}
                >
                  {updatingStatus === 'resolved' ? 'Resolving...' : 'Resolve Ticket'}
                </button>
              </div>
            </footer>
          </article>
        </div>
      ) : null}
    </div>
  );
}
