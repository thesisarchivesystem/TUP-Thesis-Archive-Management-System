import { useEffect, useState } from 'react';
import { SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { searchService, type SearchResultItem } from '../../services/searchService';

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

export default function SharedSearchResultsView() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (query.length < 2) {
      setResults([]);
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
        setResults(response.results ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setResults([]);
        setError('Unable to load search results right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (query.length < 2) {
    return (
      <div className="vpaa-card vpaa-search-results-empty">
        <SearchX size={20} />
        <div>
          <strong>Enter at least 2 characters</strong>
          <p>Use the search bar to find approved theses across the archive.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="vpaa-card">Searching the archive for "{query}"...</div>;
  }

  if (error) {
    return <div className="vpaa-banner-error">{error}</div>;
  }

  const resultLabel = `${results.length} result${results.length === 1 ? '' : 's'} for`;

  return (
    <div className="vpaa-search-results-shell">
      <div className="vpaa-search-results-summary">
        <span className="vpaa-search-results-count">{resultLabel}</span>
        <strong className="vpaa-search-results-query">"{query}"</strong>
      </div>

      {!results.length ? (
        <div className="vpaa-card vpaa-search-results-empty vpaa-search-results-empty-hero">
          <div className="vpaa-search-results-empty-icon">
            <SearchX size={20} />
          </div>
          <div className="vpaa-search-results-empty-copy">
            <strong>No theses matched your search</strong>
            <p>Try a different keyword, thesis title, or topic phrase.</p>
          </div>
        </div>
      ) : (
        <div className="vpaa-category-thesis-grid">
          {results.map((result) => (
            <article className="vpaa-category-thesis-card" key={result.id}>
              <div className="vpaa-cover vpaa-category-thesis-cover">
                <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                <div className="vpaa-cover-meta">Computer Studies Department</div>
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
