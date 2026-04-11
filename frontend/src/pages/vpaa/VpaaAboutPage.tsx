import { BookOpenText, Database, FolderKanban, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';
import VpaaLayout from '../../components/vpaa/VpaaLayout';

const pillars = [
  {
    title: 'Centralized Archive',
    copy: 'A single archive for thesis records, approvals, and research documents across the academic workflow.',
    icon: <BookOpenText size={20} />,
    tone: 'si-maroon',
  },
  {
    title: 'Role-Based Oversight',
    copy: 'VPAA, faculty advisers, and students each access the system through role-specific views and permissions.',
    icon: <ShieldCheck size={20} />,
    tone: 'si-sage',
  },
  {
    title: 'Structured Categories',
    copy: 'Theses are organized through predefined categories so records stay consistent as new work is submitted.',
    icon: <FolderKanban size={20} />,
    tone: 'si-sky',
  },
  {
    title: 'Persistent Data Flow',
    copy: 'Laravel API and database-backed records keep faculty accounts, activities, and thesis data synchronized.',
    icon: <Database size={20} />,
    tone: 'si-terracotta',
  },
  {
    title: 'Long-Term Continuity',
    copy: 'Records remain easier to monitor over time through institutional archiving, filtering, and searchable preservation.',
    icon: <Waypoints size={20} />,
    tone: 'si-gold',
  },
  {
    title: 'Academic Reuse',
    copy: 'Past studies stay visible for reference so departments can build stronger proposals and reduce duplicated work.',
    icon: <Sparkles size={20} />,
    tone: 'si-maroon',
  },
];

export default function VpaaAboutPage() {
  return (
    <VpaaLayout
      title="About the Thesis Archive"
      description="A curated overview of the archive, redesigned to stay elegant, clear, and aligned with the VPAA theme."
    >
      <section className="vpaa-page-hero vpaa-page-hero-about">
        <div className="vpaa-about-hero-copy">
          <span className="vpaa-pill si-maroon">Academic Archive Platform</span>
          <h2>About the Thesis Archive</h2>
          <p>
            The Thesis Archive Management System is a curated digital library for student research. It keeps every
            approved thesis organized, searchable, and ready for future study. Built for students, advisers, and
            administrators, it streamlines submission, review, and preservation from proposal to final archive.
          </p>
        </div>
        <div className="vpaa-page-hero-panel">
          <h3>What We Protect</h3>
          <ul className="vpaa-dot-list">
            <li><span />Verified authorship and academic integrity</li>
            <li><span />Complete submission history with revisions</li>
            <li><span />Long-term access to institutional research</li>
          </ul>
        </div>
      </section>

      <section className="vpaa-page-card-grid">
        {pillars.map((item) => (
          <article className="vpaa-page-feature-card" key={item.title}>
            <div className={`vpaa-stat-icon ${item.tone}`}>{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="vpaa-page-split">
        <div className="vpaa-card vpaa-page-story-card">
          <h3>How the archive helps</h3>
          <p>
            The archive provides a more dependable research environment for document storage, discovery, and academic
            oversight. It supports institutional continuity while giving users a clearer path for submission, review,
            search, and administrative monitoring.
          </p>
        </div>

        <div className="vpaa-card vpaa-page-story-card">
          <h3>Core workflow</h3>
          <ul className="vpaa-page-list">
            <li>Students submit work for academic review and archiving.</li>
            <li>Advisers and academic offices monitor approvals and records.</li>
            <li>Archived theses remain searchable through structured metadata and categories.</li>
          </ul>
        </div>
      </section>
    </VpaaLayout>
  );
}
