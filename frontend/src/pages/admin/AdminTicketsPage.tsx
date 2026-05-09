import { ChevronDown, ChevronLeft, ChevronRight, Search, Ticket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import {
  adminService,
  type AdminSupportTicketSummary,
  type AdminSupportTicketsResponse,
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

export default function AdminTicketsPage() {
  const [data, setData] = useState<AdminSupportTicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

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
                          onClick={() => setSelectedTicketId(ticket.id)}
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
    </div>
  );
}
