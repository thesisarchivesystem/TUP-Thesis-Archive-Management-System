import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchService, type SearchFilterOptionsResponse } from '../../services/searchService';

type TopbarSearchWithFiltersProps = {
  basePath: '/student' | '/faculty' | '/vpaa';
};

type SearchFilters = {
  year: string;
  category: string;
  program: string;
  department: string;
};

const emptyFilters: SearchFilters = {
  year: '',
  category: '',
  program: '',
  department: '',
};

const getFiltersFromParams = (searchParams: URLSearchParams): SearchFilters => ({
  year: searchParams.get('year') ?? '',
  category: searchParams.get('category') ?? '',
  program: searchParams.get('program') ?? '',
  department: searchParams.get('department') ?? '',
});

const countActiveFilters = (filters: SearchFilters) =>
  Object.values(filters).filter((value) => value.trim() !== '').length;

const filterLabels: Record<keyof SearchFilters, string> = {
  year: 'Year',
  category: 'Category',
  program: 'Program',
  department: 'Department',
};

export default function TopbarSearchWithFilters({ basePath }: TopbarSearchWithFiltersProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<SearchFilters>(() => getFiltersFromParams(searchParams));
  const [filterOptions, setFilterOptions] = useState<SearchFilterOptionsResponse>({
    years: [],
    categories: [],
    programs: [],
    departments: [],
  });
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
    setFilters(getFiltersFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (!isFilterOpen || filterOptions.years.length || filterOptions.categories.length || filterOptions.programs.length || filterOptions.departments.length) {
      return;
    }

    let isCurrent = true;
    setIsOptionsLoading(true);

    void searchService.getFilterOptions()
      .then((options) => {
        if (!isCurrent) return;
        setFilterOptions(options);
      })
      .catch(() => {
        if (!isCurrent) return;
        setFilterOptions({
          years: [],
          categories: [],
          programs: [],
          departments: [],
        });
      })
      .finally(() => {
        if (isCurrent) setIsOptionsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [filterOptions.categories.length, filterOptions.departments.length, filterOptions.programs.length, filterOptions.years.length, isFilterOpen]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const navigateToSearch = (nextQuery: string, nextFilters: SearchFilters) => {
    const trimmedQuery = nextQuery.trim();
    const trimmedFilters = {
      year: nextFilters.year.trim(),
      category: nextFilters.category.trim(),
      program: nextFilters.program.trim(),
      department: nextFilters.department.trim(),
    };
    const hasFilters = countActiveFilters(trimmedFilters) > 0;

    if (trimmedQuery.length < 2 && !hasFilters) return;

    const params = new URLSearchParams();
    if (trimmedQuery.length >= 2) params.set('q', trimmedQuery);
    if (trimmedFilters.year) params.set('year', trimmedFilters.year);
    if (trimmedFilters.category) params.set('category', trimmedFilters.category);
    if (trimmedFilters.program) params.set('program', trimmedFilters.program);
    if (trimmedFilters.department) params.set('department', trimmedFilters.department);

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

    if (searchQuery.trim().length >= 2) {
      navigateToSearch(searchQuery, emptyFilters);
      return;
    }

    navigate(`${basePath}/search`);
  };

  const renderFilterField = (field: keyof SearchFilters, options: string[]) => {
    return (
      <label className="vpaa-search-filter-field">
        <span>{filterLabels[field]}</span>
        <div className="vpaa-search-filter-select-wrap">
          <select
            value={filters[field]}
            onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))}
            disabled={isOptionsLoading}
          >
            <option value="">{isOptionsLoading ? 'Loading choices...' : `All ${filterLabels[field]}`}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="vpaa-search-filter-select-icon" aria-hidden="true">
            <ChevronDown size={15} />
          </span>
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

          {renderFilterField('year', filterOptions.years)}
          {renderFilterField('category', filterOptions.categories)}
          {renderFilterField('program', filterOptions.programs)}
          {renderFilterField('department', filterOptions.departments)}

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
