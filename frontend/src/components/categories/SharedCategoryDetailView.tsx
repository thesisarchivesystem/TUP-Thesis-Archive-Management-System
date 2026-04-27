import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import SectionLoadingScreen from '../SectionLoadingScreen';
import ThesisArchiveCover from '../thesis/ThesisArchiveCover';
import { vpaaCategoriesService } from '../../services/vpaaCategoriesService';
import type { UserRole } from '../../types/user.types';

type Props = {
  role: UserRole;
};

const formatDocumentCount = (count: number) => `${count}+ document${count === 1 ? '' : 's'}`;

export default function SharedCategoryDetailView({ role }: Props) {
  const { slug = '' } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<Awaited<ReturnType<typeof vpaaCategoriesService.list>>[number] | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError('');

    void vpaaCategoriesService.list(role)
      .then((response) => {
        if (!isMounted) return;
        setCategory(response.find((item) => item.slug === slug) ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load this category right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [role, slug]);

  const thesisBasePath = role === 'vpaa' ? '/vpaa/theses' : role === 'faculty' ? '/faculty/theses' : '/student/theses';
  const categoriesBasePath = role === 'vpaa' ? '/vpaa/categories' : role === 'faculty' ? '/faculty/categories' : '/student/categories';

  const theses = useMemo(() => (category?.theses ?? []).slice().sort((left, right) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })), [category]);

  if (isLoading) return <SectionLoadingScreen label="Loading category..." />;
  if (error) return <div className="vpaa-banner-error">{error}</div>;
  if (!category) return <div className="vpaa-card">Category not found.</div>;

  return (
    <div className="space-y-4">
      <div className="vpaa-page-intro">
        <Link
          to={categoriesBasePath}
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--maroon)] no-underline transition hover:translate-x-[-2px]"
        >
          <ArrowLeft size={16} />
          <span>Back to Categories</span>
        </Link>
        <h1>{category.label}</h1>
        <p>{category.description || `Browse all theses under ${category.label}.`}</p>
      </div>

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3>{category.label}</h3>
          <span
            className="inline-flex items-center rounded-full border border-[rgba(139,35,50,0.12)] bg-[rgba(139,35,50,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--maroon)]"
          >
            {formatDocumentCount(theses.length)}
          </span>
        </div>
        {theses.length ? (
          <div className="vpaa-category-thesis-grid">
            {theses.map((thesis) => (
              <Link
                className="vpaa-category-thesis-card"
                key={thesis.id}
                to={`${thesisBasePath}/${encodeURIComponent(thesis.id)}`}
                state={{ thesis }}
              >
                <ThesisArchiveCover
                  className="vpaa-category-thesis-cover"
                  compact
                  title={thesis.title}
                  college={thesis.college}
                  department={thesis.department}
                  author={thesis.author}
                  authors={thesis.authors}
                  year={thesis.year}
                  categories={thesis.categories?.length
                    ? thesis.categories
                    : [category.label, ...(thesis.keywords.length ? thesis.keywords : [thesis.program || thesis.school_year || thesis.department])]
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((tag, index) => ({ id: `${thesis.id}-${index}`, name: String(tag) }))}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No thesis has been assigned to this category yet.</div>
        )}
      </div>
    </div>
  );
}
