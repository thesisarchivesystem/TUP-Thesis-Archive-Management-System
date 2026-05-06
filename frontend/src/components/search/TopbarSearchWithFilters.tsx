import { Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type TopbarSearchWithFiltersProps = {
  basePath: '/student' | '/faculty' | '/vpaa';
};

type SearchFilters = {
  year: string;
  category: string;
  program: string;
};

const emptyFilters: SearchFilters = {
  year: '',
  category: '',
  program: '',
};

const getFiltersFromParams = (searchParams: URLSearchParams): SearchFilters => ({
  year: searchParams.get('year') ?? '',
  category: searchParams.get('category') ?? '',
  program: searchParams.get('program') ?? '',
});

const countActiveFilters = (filters: SearchFilters) =>
  Object.values(filters).filter((value) => value.trim() !== '').length;

export default function TopbarSearchWithFilters({ basePath }: TopbarSearchWithFiltersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<SearchFilters>(() => getFiltersFromParams(searchParams));

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
    setFilters(getFiltersFromParams(searchParams));
  }, [searchParams]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const navigateToSearch = (nextQuery: string, nextFilters: SearchFilters) => {
    const trimmedQuery = nextQuery.trim();
    const trimmedFilters = {
      year: nextFilters.year.trim(),
      category: nextFilters.category.trim(),
      program: nextFilters.program.trim(),
    };
    const hasFilters = countActiveFilters(trimmedFilters) > 0;

    if (trimmedQuery.length < 2 && !hasFilters) return;

    const params = new URLSearchParams();
    if (trimmedQuery.length >= 2) params.set('q', trimmedQuery);
    if (trimmedFilters.year) params.set('year', trimmedFilters.year);
    if (trimmedFilters.category) params.set('category', trimmedFilters.category);
    if (trimmedFilters.program) params.set('program', trimmedFilters.program);

    navigate(`${basePath}/search?${params.toString()}`);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(searchQuery, filters);
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
    navigateToSearch(searchQuery, filters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    setIsFilterOpen(false);
    navigateToSearch(searchQuery, emptyFilters);
  };

  return (
    <div className="vpaa-topbar-search-group" onClick={(event) => event.stopPropagation()}>
      <form className="vpaa-search-bar" onSubmit={handleSearchSubmit}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Search the thesis archive, categories, or records..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </form>

      <div className="vpaa-search-filter-wrap">
        <button
          type="button"
          className={`vpaa-search-filter-button${activeFilterCount ? ' active' : ''}`}
          aria-label="Open search filters"
          aria-expanded={isFilterOpen}
          onClick={() => setIsFilterOpen((current) => !current)}
        >
          <Filter size={16} />
          {activeFilterCount ? <span>{activeFilterCount}</span> : null}
        </button>

        <div className={`vpaa-search-filter-panel${isFilterOpen ? ' open' : ''}`}>
          <div className="vpaa-search-filter-panel-head">
            <strong>Search Filters</strong>
            <button type="button" onClick={() => setIsFilterOpen(false)} aria-label="Close search filters">
              <X size={15} />
            </button>
          </div>

          <label className="vpaa-search-filter-field">
            <span>Year</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 2026"
              value={filters.year}
              onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
            />
          </label>

          <label className="vpaa-search-filter-field">
            <span>Category</span>
            <input
              type="text"
              placeholder="e.g. Artificial Intelligence"
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            />
          </label>

          <label className="vpaa-search-filter-field">
            <span>Program</span>
            <input
              type="text"
              placeholder="e.g. BSCS"
              value={filters.program}
              onChange={(event) => setFilters((current) => ({ ...current, program: event.target.value }))}
            />
          </label>

          <div className="vpaa-search-filter-actions">
            <button type="button" className="vpaa-search-filter-clear" onClick={handleClearFilters}>
              Clear
            </button>
            <button type="button" className="vpaa-search-filter-apply" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
