import { Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type HTMLAttributes } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchService, type SearchFilterField } from '../../services/searchService';

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

const filterLabels: Record<SearchFilterField, string> = {
  year: 'Year',
  category: 'Category',
  program: 'Program',
};

export default function TopbarSearchWithFilters({ basePath }: TopbarSearchWithFiltersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<SearchFilters>(() => getFiltersFromParams(searchParams));
  const [focusedFilter, setFocusedFilter] = useState<SearchFilterField | null>(null);
  const [filterSuggestions, setFilterSuggestions] = useState<string[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
    setFilters(getFiltersFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (!isFilterOpen || !focusedFilter) {
      setFilterSuggestions([]);
      setIsSuggestionLoading(false);
      return;
    }

    let isCurrent = true;
    const searchValue = filters[focusedFilter].trim();

    const timeout = window.setTimeout(() => {
      setIsSuggestionLoading(true);

      void searchService.getFilterSuggestions(focusedFilter, searchValue)
        .then((suggestions) => {
          if (!isCurrent) return;

          const normalizedValue = searchValue.toLowerCase();
          setFilterSuggestions(
            suggestions
              .filter((suggestion) => suggestion.trim() !== '')
              .filter((suggestion) => suggestion.toLowerCase() !== normalizedValue)
              .slice(0, 8),
          );
        })
        .catch(() => {
          if (isCurrent) setFilterSuggestions([]);
        })
        .finally(() => {
          if (isCurrent) setIsSuggestionLoading(false);
        });
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [filters.category, filters.program, filters.year, focusedFilter, isFilterOpen]);

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
    setFocusedFilter(null);

    if (searchQuery.trim().length >= 2) {
      navigateToSearch(searchQuery, emptyFilters);
      return;
    }

    navigate(`${basePath}/search`);
  };

  const handleSuggestionSelect = (field: SearchFilterField, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setFilterSuggestions([]);
    setFocusedFilter(field);
  };

  const renderFilterField = (
    field: SearchFilterField,
    placeholder: string,
    inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'],
  ) => {
    const fieldValue = filters[field];
    const showSuggestions = focusedFilter === field
      && (isSuggestionLoading || filterSuggestions.length > 0 || fieldValue.trim().length > 0);

    return (
      <label className="vpaa-search-filter-field">
        <span>{filterLabels[field]}</span>
        <div className="vpaa-search-filter-input-wrap">
          <input
            type="text"
            inputMode={inputMode}
            placeholder={placeholder}
            value={fieldValue}
            autoComplete="off"
            onFocus={() => setFocusedFilter(field)}
            onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))}
          />
          {showSuggestions ? (
            <div className="vpaa-search-filter-suggestions" role="listbox" aria-label={`${filterLabels[field]} suggestions`}>
              {isSuggestionLoading ? (
                <div className="vpaa-search-filter-suggestion-empty">Loading choices...</div>
              ) : filterSuggestions.length ? (
                filterSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    role="option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(field, suggestion)}
                  >
                    {suggestion}
                  </button>
                ))
              ) : (
                <div className="vpaa-search-filter-suggestion-empty">No matching choices</div>
              )}
            </div>
          ) : null}
        </div>
      </label>
    );
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

          {renderFilterField('year', 'e.g. 2026', 'numeric')}
          {renderFilterField('category', 'e.g. Artificial Intelligence')}
          {renderFilterField('program', 'e.g. BSCS')}

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
