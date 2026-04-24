import { useEffect } from 'react';

export type ThesisDetailItem = {
  id: string;
  title: string;
  author?: string;
  authors?: string[];
  abstract?: string | null;
  keywords?: string[];
  department?: string;
  program?: string | null;
  category?: string | null;
  school_year?: string | null;
  year?: string | number | null;
};

type ThesisDetailsModalProps = {
  thesis: ThesisDetailItem | null;
  onClose: () => void;
};

export default function ThesisDetailsModal({ thesis, onClose }: ThesisDetailsModalProps) {
  useEffect(() => {
    if (!thesis) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, thesis]);

  if (!thesis) return null;

  const authors = thesis.authors?.length
    ? thesis.authors
    : thesis.author
      ? thesis.author.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const metadata = [
    thesis.department,
    thesis.program,
    thesis.category,
    thesis.school_year,
    thesis.year ? `Year ${thesis.year}` : null,
  ].filter(Boolean);

  return (
    <div className="vpaa-thesis-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="vpaa-thesis-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thesis-details-title"
      >
        <div className="vpaa-thesis-modal-header">
          <div>
            <div className="vpaa-thesis-modal-kicker">Thesis Information</div>
            <h2 id="thesis-details-title">{thesis.title}</h2>
          </div>
          <button type="button" className="vpaa-thesis-modal-close" onClick={onClose} aria-label="Close thesis details">
            ×
          </button>
        </div>

        {metadata.length ? (
          <div className="vpaa-thesis-modal-meta">
            {metadata.map((item) => (
              <span className="vpaa-pill vpaa-category-tag" key={item}>{item}</span>
            ))}
          </div>
        ) : null}

        <div className="vpaa-thesis-modal-grid">
          <section className="vpaa-thesis-modal-section">
            <h3>Abstract</h3>
            <p>{thesis.abstract?.trim() || 'No abstract available for this thesis yet.'}</p>
          </section>

          <section className="vpaa-thesis-modal-section">
            <h3>Authors</h3>
            {authors.length ? (
              <div className="vpaa-thesis-modal-list">
                {authors.map((author) => (
                  <span className="vpaa-thesis-modal-chip" key={author}>{author}</span>
                ))}
              </div>
            ) : (
              <p>No author details available.</p>
            )}
          </section>

          <section className="vpaa-thesis-modal-section">
            <h3>Keywords</h3>
            {thesis.keywords?.length ? (
              <div className="vpaa-thesis-modal-list">
                {thesis.keywords.map((keyword) => (
                  <span className="vpaa-thesis-modal-chip keyword" key={keyword}>{keyword}</span>
                ))}
              </div>
            ) : (
              <p>No keywords available.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
