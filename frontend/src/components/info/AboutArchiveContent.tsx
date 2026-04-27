import { BadgeCheck, Library, SearchCheck } from 'lucide-react';

const protectionItems = [
  'Verified authorship and academic integrity',
  'Searchable records organized by department and year',
  'Role-based access control for students, faculty, and VPAA',
];

const workflowSteps = [
  'Student submits draft',
  'Adviser reviews & comments',
  'Panel validates thesis',
  'Library archives final copy',
  'Published to archive',
];

const userGroups = [
  {
    code: 'ST',
    title: 'Students',
    copy: 'Submit drafts, track revision status, and explore prior research for reference during proposal writing.',
    tone: 'student',
  },
  {
    code: 'FA',
    title: 'Faculty & Advisers',
    copy: 'Review advisee submissions, provide revision feedback, and monitor progress from proposal to defense.',
    tone: 'faculty',
  },
  {
    code: 'VP',
    title: 'VPAA',
    copy: 'Oversee academic workflows, monitor institutional compliance, and support long-term stewardship of approved research records.',
    tone: 'library',
  },
];

const protectionIcons = [BadgeCheck, SearchCheck, Library];

export default function AboutArchiveContent() {
  return (
    <div className="vpaa-about-reference-layout">
      <section className="vpaa-about-reference-hero">
        <article className="vpaa-about-reference-story">
          <div className="vpaa-about-reference-summary">
            <span className="vpaa-about-reference-label">About the Archive</span>
            <h3>A digital home for every thesis your institution creates</h3>
            <p>
              The Thesis Archive is the university&apos;s central repository for student research. Every approved thesis
              is stored, organized, and made fully searchable from first proposal to final submission. It ensures
              research is preserved, accessible, and never lost.
            </p>
            <div className="vpaa-about-reference-tags" aria-label="Supported user groups">
              <span className="student">Students</span>
              <span className="faculty">Faculty &amp; Advisers</span>
              <span className="library">VPAA</span>
            </div>
          </div>
        </article>

        <aside className="vpaa-about-reference-protect">
          <span className="vpaa-about-reference-label">What We Protect</span>
          <ul>
            {protectionItems.map((item, index) => {
              const Icon = protectionIcons[index];
              return (
                <li key={item}>
                  <span className="vpaa-about-reference-protect-icon">
                    <Icon size={14} />
                  </span>
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
          <div className="vpaa-about-reference-callout">
            <strong>Need the full policy?</strong>
            <p>See Terms &amp; Conditions for data handling, ownership rights, and compliance rules.</p>
          </div>
        </aside>
      </section>

      <section className="vpaa-about-reference-workflow">
        <div className="vpaa-about-reference-workflow-head">
          <span className="vpaa-about-reference-label">Workflow</span>
          <h3>How a thesis moves through the system</h3>
        </div>
        <div className="vpaa-about-reference-steps">
          {workflowSteps.map((step, index) => (
            <article className="vpaa-about-reference-step" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vpaa-about-reference-panel">
        <div className="vpaa-about-reference-section-head">
          <span className="vpaa-about-reference-label">Users</span>
          <h3>Who uses this system</h3>
        </div>
        <div className="vpaa-about-reference-user-list vpaa-about-reference-user-list-grid">
          {userGroups.map((group) => (
            <article className="vpaa-about-reference-user-item" key={group.title}>
              <span className={`vpaa-about-reference-user-badge ${group.tone}`}>{group.code}</span>
              <div>
                <strong>{group.title}</strong>
                <p>{group.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
