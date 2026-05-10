import { ChevronRight, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export type DashboardBestThesis = {
  school_year: string;
  thesis: {
    id: string;
    title: string;
    author: string;
    authors?: string[];
    year?: string | null;
    category?: string | null;
    categories?: Array<{ id?: string; name: string; slug?: string }>;
  };
};

type BestThesisBannerProps = {
  award?: DashboardBestThesis | null;
  awards?: DashboardBestThesis[];
  detailsPath: string;
  getDetailsPath?: (award: DashboardBestThesis) => string;
};

const compactAuthors = (award: DashboardBestThesis) => {
  const authors = award.thesis.authors?.filter(Boolean) ?? [];
  if (authors.length > 1) return `${authors[0]}, et al.`;
  return authors[0] || award.thesis.author || 'Unknown author';
};

export default function BestThesisBanner({ award, awards, detailsPath, getDetailsPath }: BestThesisBannerProps) {
  const slides = useMemo(() => (awards?.length ? awards : award ? [award] : []), [award, awards]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const activeAward = slides[activeIndex] ?? null;
  const hasMultipleSlides = slides.length > 1;
  const categories = activeAward?.thesis.categories?.filter((category) => Boolean(category?.name)).slice(0, 2) ?? [];
  const fallbackCategory = activeAward?.thesis.category ? [{ id: 'category', name: activeAward.thesis.category }] : [];
  const visibleCategories = categories.length ? categories : fallbackCategory;
  const activeDetailsPath = activeAward && getDetailsPath ? getDetailsPath(activeAward) : detailsPath;

  const goToSlide = (nextIndex: number) => {
    if (!slides.length) return;
    setActiveIndex((nextIndex + slides.length) % slides.length);
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === null || !hasMultipleSlides) return;
    const distance = clientX - touchStartX;

    if (Math.abs(distance) > 42) {
      goToSlide(activeIndex + (distance < 0 ? 1 : -1));
    }

    setTouchStartX(null);
  };

  const content = activeAward ? (
    <>
      <div className="vpaa-best-thesis-title">
        <Trophy size={18} />
        <span>Best Thesis of School Year {activeAward.school_year}</span>
      </div>
      <h2>{activeAward.thesis.title}</h2>
      <div className="vpaa-best-thesis-divider" />
      <div className="vpaa-best-thesis-meta-grid">
        <div>
          <span>Categories</span>
          <div className="vpaa-best-thesis-tags">
            {visibleCategories.length ? visibleCategories.map((category) => (
              <strong key={category.id ?? category.name}>{category.name}</strong>
            )) : <strong>Uncategorized</strong>}
          </div>
        </div>
        <div>
          <span>Authors</span>
          <p>{compactAuthors(activeAward)}{activeAward.thesis.year ? ` - ${activeAward.thesis.year}` : ''}</p>
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="vpaa-best-thesis-title">
        <Trophy size={18} />
        <span>Best Thesis</span>
      </div>
      <h2>No Best Thesis appointed yet</h2>
      <div className="vpaa-best-thesis-divider" />
      <div className="vpaa-best-thesis-meta-grid">
        <div>
          <span>Categories</span>
          <div className="vpaa-best-thesis-tags"><strong>Awaiting selection</strong></div>
        </div>
        <div>
          <span>Authors</span>
          <p>The selected thesis will appear here after admin appointment.</p>
        </div>
      </div>
    </>
  );

  if (!award) {
    return <div className="vpaa-best-thesis-banner">{content}</div>;
  }

  return (
    <div
      className="vpaa-best-thesis-carousel"
      onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >
      <Link className="vpaa-best-thesis-banner" to={activeDetailsPath} state={{ thesis: activeAward?.thesis }}>
        {content}
      </Link>
      {hasMultipleSlides ? (
        <button type="button" className="vpaa-best-thesis-nav next" onClick={() => goToSlide(activeIndex + 1)} aria-label="Next Best Thesis">
          <ChevronRight size={18} />
        </button>
      ) : null}
      {hasMultipleSlides ? (
        <div className="vpaa-best-thesis-dots" aria-label="Best Thesis school year slides">
          {slides.map((slide, index) => (
            <button
              key={`${slide.school_year}-${slide.thesis.id}`}
              type="button"
              className={index === activeIndex ? 'active' : ''}
              onClick={() => goToSlide(index)}
              aria-label={`Show Best Thesis for ${slide.school_year}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
