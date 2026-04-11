import { useEffect, useMemo, useState } from 'react';
import { Blocks, Brain, ChevronRight, Cpu, Database, Globe, Shield, Smartphone, Users2 } from 'lucide-react';
import { vpaaCategoriesService, type VpaaCategory } from '../../services/vpaaCategoriesService';

const categoryIcons = [Globe, Brain, Shield, Cpu, Database, Users2, Smartphone, Blocks];

const formatDocumentCount = (count: number) => `${count}+ document${count === 1 ? '' : 's'}`;

const formatUpdatedAt = (value?: string | null) => {
  if (!value) return 'Updated recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  return `Updated ${date.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
};

export default function SharedCategoriesView() {
  const [categories, setCategories] = useState<VpaaCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRevealed(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void vpaaCategoriesService.list()
      .then((response) => {
        if (!isMounted) return;
        setCategories(response);
        setSelectedSlug((current) => current || response[0]?.slug || '');
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
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === selectedSlug) ?? categories[0] ?? null,
    [categories, selectedSlug],
  );

  if (error) return <div className="vpaa-banner-error">{error}</div>;

  if (isLoading) return <div className="vpaa-card">Loading thesis categories from the archive...</div>;

  if (!categories.length) return <div className="vpaa-card">No thesis categories are available yet.</div>;

  return (
    <div className="vpaa-category-browser">
      <div className="vpaa-category-list">
        {categories.map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];
          const isActive = selectedCategory?.slug === category.slug;

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
        <div className="vpaa-category-panel-header">
          <div>
            <h2>{selectedCategory?.label}</h2>
            <p>Highlighted category - {formatDocumentCount(selectedCategory?.document_count ?? 0)}</p>
          </div>
          <span>{formatUpdatedAt(selectedCategory?.updated_at)}</span>
        </div>

        {!selectedCategory?.theses.length ? (
          <div className="vpaa-card">No thesis has been assigned to this category yet.</div>
        ) : (
          <div className="vpaa-category-thesis-grid">
            {selectedCategory.theses.map((thesis) => (
              <article className="vpaa-category-thesis-card" key={thesis.id}>
                <div className="vpaa-cover vpaa-category-thesis-cover">
                  <div className="vpaa-cover-meta">Technological University of the Philippines</div>
                  <div className="vpaa-cover-meta">{thesis.department}</div>
                  <div className="vpaa-cover-title">{thesis.title}</div>
                </div>

                <div className="vpaa-category-thesis-body">
                  <h3>{thesis.title}</h3>
                  <p>{thesis.author}{thesis.year ? ` - ${thesis.year}` : ''}</p>
                  <div className="vpaa-category-tags">
                    {(thesis.keywords.length ? thesis.keywords : [thesis.program || thesis.school_year || thesis.department])
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((tag) => (
                        <span className="vpaa-pill vpaa-category-tag" key={tag}>{tag}</span>
                      ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
