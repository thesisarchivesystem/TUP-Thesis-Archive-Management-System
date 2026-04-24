import { useEffect, useMemo, useRef, useState } from 'react';
import { Blocks, Brain, ChevronRight, Cpu, Database, Globe, Shield, Smartphone, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vpaaCategoriesService, type VpaaCategory } from '../../services/vpaaCategoriesService';
import type { UserRole } from '../../types/user.types';

const categoryIcons = [Globe, Brain, Shield, Cpu, Database, Users2, Smartphone, Blocks];

const formatDocumentCount = (count: number) => `${count}+ document${count === 1 ? '' : 's'}`;

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
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
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
        setSelectedSlugs((current) => (current.length ? current : (response[0]?.slug ? [response[0].slug] : [])));
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

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedSlugs.includes(category.slug)),
    [categories, selectedSlugs],
  );
  const visibleCategories = selectedCategories.length ? selectedCategories : categories.slice(0, 1);
  const combinedTheses = useMemo(
    () => visibleCategories.flatMap((category) => category.theses.map((thesis) => ({ ...thesis, categoryLabel: category.label }))),
    [visibleCategories],
  );

  const thesisBasePath = role === 'vpaa' ? '/vpaa/theses' : role === 'faculty' ? '/faculty/theses' : '/student/theses';

  const thesisHref = (thesis: VpaaCategory['theses'][number]) => `${thesisBasePath}/${encodeURIComponent(thesis.id)}`;

  if (error) return <div className="vpaa-banner-error">{error}</div>;

  if (isLoading) return <div className="vpaa-card vpaa-loading-copy">Loading thesis categories from the archive...</div>;

  if (!categories.length) return <div className="vpaa-card">No thesis categories are available yet.</div>;

  return (
    <div className="vpaa-category-browser" ref={browserRef}>
      <div className="vpaa-category-list">
        {categories.map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];
          const isActive = selectedSlugs.includes(category.slug);

          return (
            <button
              type="button"
              key={category.id}
              className={`vpaa-category-item vpaa-category-delay-${(index % 4) + 1}${isActive ? ' active' : ''}${revealed ? ' revealed' : ''}`}
              onClick={() => setSelectedSlugs((current) => (
                current.includes(category.slug)
                  ? current.filter((slug) => slug !== category.slug)
                  : [...current, category.slug]
              ))}
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
        <div className="vpaa-category-panel-content" key={selectedSlugs.join('|') || 'empty'}>
          <div className="vpaa-category-panel-header">
            <div>
              <h2>{selectedCategories.length > 1 ? 'Selected Categories' : visibleCategories[0]?.label}</h2>
              <p>{selectedCategories.length > 1 ? `${selectedCategories.length} categories selected` : `Highlighted category - ${formatDocumentCount(visibleCategories[0]?.document_count ?? 0)}`}</p>
            </div>
            <span>{selectedCategories.length > 1 ? `${combinedTheses.length} thesis records` : formatUpdatedAt(visibleCategories[0]?.updated_at)}</span>
          </div>

          {selectedCategories.length > 1 ? (
            <div className="vpaa-category-selection-summary">
              {selectedCategories.map((category) => (
                <span className="vpaa-pill vpaa-category-tag" key={category.id}>{category.label}</span>
              ))}
            </div>
          ) : null}

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
                  <div className="vpaa-cover vpaa-category-thesis-cover">
                    <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                    <div className="vpaa-cover-meta">{thesis.department}</div>
                    <div className="vpaa-cover-title">{thesis.title}</div>
                  </div>

                  <div className="vpaa-category-thesis-body">
                    <h3>{thesis.title}</h3>
                    <p>{thesis.author}{thesis.year ? ` - ${thesis.year}` : ''}</p>
                    <div className="vpaa-category-tags">
                      {[thesis.categoryLabel, ...(thesis.keywords.length ? thesis.keywords : [thesis.program || thesis.school_year || thesis.department])]
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
          )}
        </div>
      </section>
    </div>
  );
}
