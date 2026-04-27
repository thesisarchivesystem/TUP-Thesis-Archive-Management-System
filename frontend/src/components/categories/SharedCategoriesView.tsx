import { useEffect, useMemo, useRef, useState } from 'react';
import { Blocks, Brain, ChevronRight, Cpu, Database, Globe, Shield, Smartphone, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThesisArchiveCover from '../thesis/ThesisArchiveCover';
import { vpaaCategoriesService, type VpaaCategory } from '../../services/vpaaCategoriesService';
import type { UserRole } from '../../types/user.types';

const categoryIcons = [Globe, Brain, Shield, Cpu, Database, Users2, Smartphone, Blocks];

const formatDocumentCount = (count: number) => `${count}+ document${count === 1 ? '' : 's'}`;

const isSharedLibraryRecord = (thesis: VpaaCategory['theses'][number]) => {
  const normalizedType = (thesis.resource_type ?? thesis.type ?? '').trim().toLowerCase();
  const hasShareScope = Boolean((thesis.share_scope ?? '').trim());
  return hasShareScope || normalizedType === 'book';
};

const formatUpdatedAt = (value?: string | null) => {
  if (!value) return 'Updated recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  return `Updated ${date.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
};

interface SharedCategoriesViewProps {
  role?: UserRole | null;
}

export default function SharedCategoriesView({ role = null }: SharedCategoriesViewProps) {
  const [categories, setCategories] = useState<VpaaCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const browserRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRevealed(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void vpaaCategoriesService.list(role)
      .then((response) => {
        if (!isMounted) return;
        setCategories(response);
        setSelectedSlug((current) => (current || response[0]?.slug || ''));
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load categories right now.');
        setCategories([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [role]);

  const filteredCategories = useMemo(
    () => categories.map((category) => {
      const theses = category.theses.filter((thesis) => !isSharedLibraryRecord(thesis));
      return {
        ...category,
        document_count: theses.length,
        theses,
      };
    }),
    [categories],
  );
  const selectedCategory = useMemo(
    () => filteredCategories.find((category) => category.slug === selectedSlug) ?? filteredCategories[0] ?? null,
    [filteredCategories, selectedSlug],
  );
  const visibleCategories = selectedCategory ? [selectedCategory] : filteredCategories.slice(0, 1);
  const combinedTheses = useMemo(
    () => visibleCategories.flatMap((category) => category.theses.map((thesis) => ({ ...thesis, categoryLabel: category.label }))),
    [visibleCategories],
  );

  const thesisBasePath = role === 'vpaa' ? '/vpaa/theses' : role === 'faculty' ? '/faculty/theses' : '/student/theses';

  const thesisHref = (thesis: VpaaCategory['theses'][number]) => `${thesisBasePath}/${encodeURIComponent(thesis.id)}`;

  useEffect(() => {
    if (!selectedSlug) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedSlug]);

  if (error) return <div className="vpaa-banner-error">{error}</div>;

  if (isLoading) return <div className="vpaa-card vpaa-loading-copy">Loading thesis categories from the archive...</div>;

  if (!categories.length) return <div className="vpaa-card">No thesis categories are available yet.</div>;

  return (
    <div className="vpaa-category-browser" ref={browserRef}>
      <div className="vpaa-category-list">
        {filteredCategories.map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];
          const isActive = selectedSlug === category.slug;

          return (
            <button
              type="button"
              key={category.id}
              className={`vpaa-category-item vpaa-category-delay-${(index % 4) + 1}${isActive ? ' active' : ''}${revealed ? ' revealed' : ''}`}
              onClick={() => setSelectedSlug(category.slug)}
            >
              <span className={`vpaa-category-icon vpaa-category-tone-${index % 6}`}>
                <Icon size={20} />
              </span>
              <span className="vpaa-category-copy">
                <strong>{category.label}</strong>
                {category.description ? <small>{category.description}</small> : null}
                <span>{formatDocumentCount(category.document_count)}</span>
              </span>
              <span className="vpaa-category-arrow" aria-hidden="true">
                <ChevronRight size={18} />
              </span>
            </button>
          );
        })}
      </div>

      <section className="vpaa-category-panel">
        <div className="vpaa-category-panel-content" key={selectedSlug || 'empty'}>
          <div className="vpaa-category-panel-header">
            <div>
              <h2>{visibleCategories[0]?.label}</h2>
              <p>{`Highlighted category - ${formatDocumentCount(visibleCategories[0]?.document_count ?? 0)}`}</p>
            </div>
            <span>{formatUpdatedAt(visibleCategories[0]?.updated_at)}</span>
          </div>

          {!combinedTheses.length ? (
            <div className="vpaa-card">No thesis has been assigned to this category yet.</div>
          ) : (
            <div className="vpaa-category-thesis-grid">
              {combinedTheses.map((thesis) => (
                <Link
                  className="vpaa-category-thesis-card"
                  key={`${thesis.categoryLabel}-${thesis.id}`}
                  to={thesisHref(thesis)}
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
                      : [thesis.categoryLabel, ...(thesis.keywords.length ? thesis.keywords : [thesis.program || thesis.school_year || thesis.department])]
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((tag, index) => ({ id: `${thesis.id}-${index}`, name: tag }))}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
