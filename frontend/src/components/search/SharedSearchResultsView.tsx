import { useEffect, useMemo, useState } from 'react';
import { FileText, MessageSquare, SearchX, UserRound, X } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ThesisArchiveCover from '../thesis/ThesisArchiveCover';
import { messageService } from '../../services/messageService';
import {
  searchService,
  type SearchResponse,
  type SearchUserContributionItem,
  type SearchUserItem,
} from '../../services/searchService';

const formatProgram = (program?: string | null) => {
  if (!program) return null;
  return /computer science/i.test(program) ? 'CS' : program;
};

const formatContributionTime = (value?: string | null) => {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getContributionBadgeTone = (status?: string) => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized.includes('approved')) return 'status-approved';
  if (normalized.includes('shared')) return 'status-pending';
  return 'status-revision';
};

export default function SharedSearchResultsView() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = searchParams.get('q')?.trim() ?? '';
  const [results, setResults] = useState<SearchResponse['results']>({ theses: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchUserItem | null>(null);
  const [startingConversation, setStartingConversation] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (query.length < 2) {
      setResults({ theses: [], users: [] });
      setSelectedUser(null);
      setError('');
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    setError('');

    void searchService.search(query)
      .then((response) => {
        if (!isMounted) return;
        setResults(response.results ?? { theses: [], users: [] });
        setSelectedUser((current) => {
          if (!current) return null;
          return response.results?.users?.find((item) => item.id === current.id) ?? null;
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setResults({ theses: [], users: [] });
        setSelectedUser(null);
        setError('Unable to load search results right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  const totalResults = (results.theses?.length ?? 0) + (results.users?.length ?? 0);
  const routeBase = `/${location.pathname.split('/').filter(Boolean)[0] ?? 'faculty'}`;

  const userContributionItems = useMemo<SearchUserContributionItem[]>(
    () => selectedUser
      ? [...selectedUser.recent_contributions.theses, ...selectedUser.recent_contributions.shared_files]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      : [],
    [selectedUser],
  );

  const openConversation = async (user: SearchUserItem) => {
    setStartingConversation(user.id);
    try {
      const response = await messageService.startConversation(user.id);
      navigate(`${routeBase}/messages`, { state: { conversationId: response.data?.id } });
    } catch {
      setError('Unable to start a conversation with this user right now.');
    } finally {
      setStartingConversation(null);
    }
  };

  const handleThesisClick = (thesisId: string) => {
    void searchService.trackClick(thesisId, query).catch(() => {
      // Keep navigation responsive even if analytics logging fails.
    });
  };

  if (query.length < 2) {
    return (
      <div className="vpaa-card vpaa-search-results-empty">
        <SearchX size={20} />
        <div>
          <strong>Enter at least 2 characters</strong>
          <p>Use the search bar to find theses and user profiles across the archive.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="vpaa-card">Searching the archive for "{query}"...</div>;
  }

  return (
    <div className="vpaa-search-results-shell">
      {error ? <div className="vpaa-banner-error">{error}</div> : null}

      <div className="vpaa-search-results-summary">
        <span className="vpaa-search-results-count">{`${totalResults} result${totalResults === 1 ? '' : 's'} for`}</span>
        <strong className="vpaa-search-results-query">"{query}"</strong>
      </div>

      {!totalResults ? (
        <div className="vpaa-card vpaa-search-results-empty vpaa-search-results-empty-hero">
          <div className="vpaa-search-results-empty-icon">
            <SearchX size={20} />
          </div>
          <div className="vpaa-search-results-empty-copy">
            <strong>No matches found</strong>
            <p>Try a different keyword, thesis title, user name, or email.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {results.users.length ? (
            <section className="space-y-3">
              <div className="vpaa-search-results-summary">
                <span className="vpaa-search-results-count">Users</span>
                <strong className="vpaa-search-results-query">{results.users.length}</strong>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="vpaa-search-user-card"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="vpaa-search-user-card-banner">
                      <div className="vpaa-search-user-card-kicker">Profile Card</div>
                      <div className="vpaa-search-user-card-top">
                        <div className="vpaa-search-user-card-icon">
                          <UserRound size={20} />
                        </div>
                        <div className="vpaa-search-user-card-copy">
                          <div className="vpaa-search-user-card-name">{user.name}</div>
                          <div className="vpaa-search-user-card-email">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="vpaa-search-user-card-body">
                      <div className="vpaa-search-user-card-pills">
                        <span className="vpaa-search-user-pill">{user.role_label}</span>
                        {user.department ? <span className="vpaa-search-user-pill">{user.department}</span> : null}
                        {!user.department && user.college ? <span className="vpaa-search-user-pill">{user.college}</span> : null}
                        {user.department && user.college ? <span className="vpaa-search-user-pill">{user.college}</span> : null}
                      </div>

                      <div className="vpaa-search-user-card-stats">
                        <div className="vpaa-search-user-card-stat">
                          <strong>{user.contributions.theses}</strong>
                          <span>Theses</span>
                        </div>
                        <div className="vpaa-search-user-card-stat">
                          <strong>{user.contributions.approved_theses}</strong>
                          <span>Approved</span>
                        </div>
                        <div className="vpaa-search-user-card-stat">
                          <strong>{user.contributions.shared_files}</strong>
                          <span>Shared</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="vpaa-search-user-card-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          void openConversation(user);
                        }}
                        disabled={startingConversation === user.id}
                      >
                        <MessageSquare size={16} />
                        <span>{startingConversation === user.id ? 'Opening...' : 'Message User'}</span>
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {results.theses.length ? (
            <section className="space-y-3">
              <div className="vpaa-search-results-summary">
                <span className="vpaa-search-results-count">Theses</span>
                <strong className="vpaa-search-results-query">{results.theses.length}</strong>
              </div>

              <div className="recent-added-grid">
                {results.theses.map((result) => (
                  <Link
                    className="recent-added-card"
                    key={result.id}
                    to={`${routeBase}/theses/${encodeURIComponent(result.id)}`}
                    state={{ thesis: result }}
                    onClick={() => handleThesisClick(result.id)}
                  >
                    <ThesisArchiveCover
                      className="recent-added-card-cover"
                      compact
                      title={result.title}
                      college={result.college}
                      department={result.department}
                      author={result.author}
                      authors={result.authors}
                      year={result.year}
                      categories={result.categories?.length
                        ? result.categories
                        : [formatProgram(result.program), ...(result.keywords ?? [])]
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((tag, index) => ({ id: `${result.id}-${index}`, name: String(tag) }))}
                    />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {selectedUser ? (
        <div className="vpaa-thesis-modal-backdrop" onClick={() => setSelectedUser(null)} role="presentation">
          <div className="vpaa-thesis-modal vpaa-user-search-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="user-search-profile-title">
            <div className="vpaa-thesis-modal-header vpaa-user-search-modal-header">
              <div className="vpaa-user-search-modal-header-copy">
                <div className="vpaa-thesis-modal-kicker">User Profile</div>
                <h2 id="user-search-profile-title">{selectedUser.name}</h2>
              </div>
              <button type="button" className="vpaa-thesis-modal-close vpaa-user-search-modal-close" onClick={() => setSelectedUser(null)} aria-label="Close user profile">
                <X size={18} />
              </button>
            </div>

            <div className="vpaa-user-search-modal-body">
              <section className="vpaa-user-search-modal-profile">
                <div className="vpaa-user-search-modal-fields">
                  <div className="vpaa-user-search-modal-field vpaa-user-search-modal-field-full">
                    <span>Email</span>
                    <strong>{selectedUser.email}</strong>
                  </div>
                  {selectedUser.department ? (
                    <div className="vpaa-user-search-modal-field">
                      <span>Department</span>
                      <strong>{selectedUser.department}</strong>
                    </div>
                  ) : null}
                  {selectedUser.program ? (
                    <div className="vpaa-user-search-modal-field">
                      <span>Program</span>
                      <strong>{selectedUser.program}</strong>
                    </div>
                  ) : null}
                  {!selectedUser.program && selectedUser.college ? (
                    <div className="vpaa-user-search-modal-field">
                      <span>College</span>
                      <strong>{selectedUser.college}</strong>
                    </div>
                  ) : null}
                </div>
                <div className="vpaa-user-search-modal-pills">
                  <span className="vpaa-user-search-modal-pill">{selectedUser.role_label}</span>
                  {selectedUser.department ? <span className="vpaa-user-search-modal-pill">{selectedUser.department}</span> : null}
                  {selectedUser.college ? <span className="vpaa-user-search-modal-pill">{selectedUser.college}</span> : null}
                </div>
              </section>

              <section className="vpaa-user-search-modal-contributions">
                <div className="vpaa-user-search-modal-section-heading">Contributions</div>
                <div className="vpaa-user-search-modal-stats">
                  <div className="vpaa-user-search-modal-stat">
                    <strong>{selectedUser.contributions.theses}</strong>
                    <span>Theses</span>
                  </div>
                  <div className="vpaa-user-search-modal-stat">
                    <strong>{selectedUser.contributions.approved_theses}</strong>
                    <span>Approved</span>
                  </div>
                  <div className="vpaa-user-search-modal-stat">
                    <strong>{selectedUser.contributions.shared_files}</strong>
                    <span>Shared Files</span>
                  </div>
                </div>

                <div className="vpaa-user-search-modal-contribution-list">
                  {!userContributionItems.length ? (
                    <p className="text-sm text-text-secondary">No recorded contributions yet.</p>
                  ) : userContributionItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="vpaa-user-search-modal-contribution-item">
                      <div className="vpaa-user-search-modal-contribution-icon">
                        <FileText size={18} />
                      </div>
                      <div className="vpaa-user-search-modal-contribution-copy">
                        <div className="vpaa-user-search-modal-contribution-title">{item.title}</div>
                        <div className="vpaa-user-search-modal-contribution-meta">
                          <span className={`status-badge ${getContributionBadgeTone(item.status)}`}>{item.status}</span>
                          <span>{formatContributionTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="vpaa-user-search-modal-message"
                  onClick={() => void openConversation(selectedUser)}
                  disabled={startingConversation === selectedUser.id}
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare size={16} />
                    {startingConversation === selectedUser.id ? 'Opening...' : 'Message User'}
                  </span>
                </button>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
