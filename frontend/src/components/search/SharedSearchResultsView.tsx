import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, SearchX, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { messageService } from '../../services/messageService';
import {
  searchService,
  type SearchResponse,
  type SearchResultItem,
  type SearchUserContributionItem,
  type SearchUserItem,
} from '../../services/searchService';

const formatProgram = (program?: string | null) => {
  if (!program) return null;
  return /computer science/i.test(program) ? 'CS' : program;
};

const formatResultMeta = (result: SearchResultItem) => {
  const parts = [
    result.authors?.filter(Boolean).join(', ') || result.submitter?.name,
    result.created_at ? new Date(result.created_at).getFullYear() : null,
  ].filter(Boolean);

  return parts.join(' - ');
};

const formatContributionTime = (value?: string | null) => {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getUserRoleBadgeTone = (role: SearchUserItem['role']) => {
  if (role === 'faculty') return 'status-approved';
  if (role === 'student') return 'status-pending';
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
                    className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left shadow-[var(--shadow-sm)]"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(139,35,50,0.08)] text-[var(--maroon)]">
                        <UserRound size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-text-primary">{user.name}</div>
                        <div className="truncate text-sm text-text-secondary">{user.email}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`status-badge ${getUserRoleBadgeTone(user.role)}`}>{user.role_label}</span>
                          {user.department ? <span className="vpaa-pill vpaa-category-tag">{user.department}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[var(--bg-input)] px-2 py-2">
                        <strong className="block text-sm text-text-primary">{user.contributions.theses}</strong>
                        <span className="text-[11px] text-text-secondary">Theses</span>
                      </div>
                      <div className="rounded-xl bg-[var(--bg-input)] px-2 py-2">
                        <strong className="block text-sm text-text-primary">{user.contributions.approved_theses}</strong>
                        <span className="text-[11px] text-text-secondary">Approved</span>
                      </div>
                      <div className="rounded-xl bg-[var(--bg-input)] px-2 py-2">
                        <strong className="block text-sm text-text-primary">{user.contributions.shared_files}</strong>
                        <span className="text-[11px] text-text-secondary">Shared</span>
                      </div>
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

              <div className="vpaa-category-thesis-grid">
                {results.theses.map((result) => (
                  <Link className="vpaa-category-thesis-card" key={result.id} to={`${routeBase}/theses/${encodeURIComponent(result.id)}`} state={{ thesis: result }}>
                    <div className="vpaa-cover vpaa-category-thesis-cover">
                      <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                      <div className="vpaa-cover-meta">{result.department || 'Archive Department'}</div>
                      <div className="vpaa-cover-title">{result.title}</div>
                    </div>

                    <div className="vpaa-category-thesis-body">
                      <h3>{result.title}</h3>
                      <p>{formatResultMeta(result)}</p>
                      <div className="vpaa-category-tags">
                        {[formatProgram(result.program), ...(result.keywords ?? [])]
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((tag) => (
                            <span className="vpaa-pill vpaa-category-tag" key={tag}>{tag}</span>
                          ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {selectedUser ? (
        <div className="vpaa-thesis-modal-backdrop" onClick={() => setSelectedUser(null)} role="presentation">
          <div className="vpaa-thesis-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="user-search-profile-title">
            <div className="vpaa-thesis-modal-header">
              <div>
                <div className="vpaa-thesis-modal-kicker">User Profile</div>
                <h2 id="user-search-profile-title">{selectedUser.name}</h2>
              </div>
              <button type="button" className="vpaa-thesis-modal-close" onClick={() => setSelectedUser(null)} aria-label="Close user profile">×</button>
            </div>

            <div className="vpaa-thesis-modal-grid">
              <section className="vpaa-thesis-modal-section">
                <h3>Profile Details</h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Role:</strong> {selectedUser.role_label}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  {selectedUser.department ? <p><strong>Department:</strong> {selectedUser.department}</p> : null}
                  {selectedUser.college ? <p><strong>College:</strong> {selectedUser.college}</p> : null}
                  {selectedUser.program ? <p><strong>Program:</strong> {selectedUser.program}</p> : null}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-2xl bg-[var(--maroon)] px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => void openConversation(selectedUser)}
                    disabled={startingConversation === selectedUser.id}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MessageSquare size={16} />
                      {startingConversation === selectedUser.id ? 'Opening...' : 'Message User'}
                    </span>
                  </button>
                </div>
              </section>

              <section className="vpaa-thesis-modal-section">
                <h3>Contributions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[var(--bg-input)] px-3 py-3 text-center">
                    <strong className="block text-lg text-text-primary">{selectedUser.contributions.theses}</strong>
                    <span className="text-xs text-text-secondary">Theses</span>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-input)] px-3 py-3 text-center">
                    <strong className="block text-lg text-text-primary">{selectedUser.contributions.approved_theses}</strong>
                    <span className="text-xs text-text-secondary">Approved</span>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-input)] px-3 py-3 text-center">
                    <strong className="block text-lg text-text-primary">{selectedUser.contributions.shared_files}</strong>
                    <span className="text-xs text-text-secondary">Shared Files</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {!userContributionItems.length ? (
                    <p className="text-sm text-text-secondary">No recorded contributions yet.</p>
                  ) : userContributionItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                          <div className="text-xs text-text-secondary">{item.type} • {item.status}</div>
                        </div>
                        <div className="text-xs text-text-secondary">{formatContributionTime(item.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
