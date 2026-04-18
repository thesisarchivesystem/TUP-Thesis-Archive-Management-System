import { BookOpenText, Database, FolderKanban, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';

const pillars = [
  {
    title: 'Purpose',
    copy: 'Provide a trusted repository where theses are preserved, discoverable, and categorized by department, year, and keywords.',
    icon: <BookOpenText size={20} />,
    tone: 'si-maroon',
  },
  {
    title: 'How It Works',
    copy: 'Students submit their work, advisers and panels validate it, and the library team archives the final copy for campus access.',
    icon: <ShieldCheck size={20} />,
    tone: 'si-sage',
  },
  {
    title: 'Who It Serves',
    copy: 'Students looking for references, advisers reviewing progress, and librarians maintaining the university research legacy.',
    icon: <FolderKanban size={20} />,
    tone: 'si-sky',
  },
  {
    title: 'Data Stewardship',
    copy: 'Version history, permissions, and secure storage ensure that every document stays intact and traceable over time.',
    icon: <Database size={20} />,
    tone: 'si-terracotta',
  },
  {
    title: 'Discovery',
    copy: 'Advanced search, tags, and category views help students find relevant studies across disciplines quickly.',
    icon: <Waypoints size={20} />,
    tone: 'si-gold',
  },
  {
    title: 'Impact',
    copy: 'By reusing prior research, students build stronger proposals and prevent duplicated work across batches.',
    icon: <Sparkles size={20} />,
    tone: 'si-maroon',
  },
];

export default function AboutArchiveContent() {
  return (
    <>
      <section className="vpaa-page-hero vpaa-page-hero-about">
        <div className="vpaa-about-hero-copy">
          <h2>About the Thesis Archive</h2>
          <p>
            The Thesis Archive Management System is a curated digital library for student research. It keeps every
            approved thesis organized, searchable, and ready for future study. Built for students, advisers, and
            librarians, it streamlines submission, review, and preservation from proposal to final archive.
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
    </>
  );
}
