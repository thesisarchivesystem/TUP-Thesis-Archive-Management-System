import BrandMarkIcon from './BrandMarkIcon';

type SectionLoadingScreenProps = {
  label: string;
  compact?: boolean;
};

export default function SectionLoadingScreen({ label, compact = false }: SectionLoadingScreenProps) {
  return (
    <div className={`vpaa-loading-screen${compact ? ' compact' : ''}`} role="status" aria-live="polite">
      <div className="vpaa-loading-screen-orbit" aria-hidden="true">
        <div className="vpaa-loading-screen-badge">
          <BrandMarkIcon />
        </div>
      </div>
      <h2 className="vpaa-loading-screen-title">Thesis Archive</h2>
      <p className="vpaa-loading-screen-copy">{label}</p>
      <div className="vpaa-loading-screen-progress" aria-hidden="true">
        <span className="vpaa-loading-screen-progress-bar" />
      </div>
    </div>
  );
}
