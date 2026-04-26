import {
  BadgeCheck,
  BarChart3,
  BookOpenText,
  ClipboardCheck,
  Database,
  Files,
  FolderKanban,
  Library,
  Lock,
  Search,
} from 'lucide-react';

const featureCards = [
  {
    title: 'Organized repository',
    copy: 'Theses are categorized by department, submission year, and keywords so records stay easy to find and manage.',
    icon: <BookOpenText size={18} />,
  },
  {
    title: 'Security & integrity',
    copy: 'Access controls, verified ownership, and revision tracking protect submissions and preserve metadata accuracy.',
    icon: <Lock size={18} />,
  },
  {
    title: 'Advanced search',
    copy: 'Users can quickly locate related studies through filters, searchable metadata, and indexed archive records.',
    icon: <Search size={18} />,
  },
  {
    title: 'Research impact',
    copy: 'Students build stronger proposals by referencing prior work and avoiding repeated topics across batches.',
    icon: <BarChart3 size={18} />,
  },
  {
    title: 'Submission tracking',
    copy: 'Each thesis moves through draft, review, revision, and archive stages with a clear activity trail.',
    icon: <Files size={18} />,
  },
  {
    title: 'Activity & audit logs',
    copy: 'Important actions such as uploads, revisions, and approvals remain visible for accountability and follow-up.',
    icon: <ClipboardCheck size={18} />,
  },
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
    copy: 'Submit drafts, track revision status, explore prior research, and access archived studies for reference.',
    tone: 'student',
  },
  {
    code: 'FA',
    title: 'Faculty & Advisers',
    copy: 'Review submissions, provide revision feedback, and monitor thesis progress from proposal through defense.',
    tone: 'faculty',
  },
  {
    code: 'LB',
    title: 'Librarians',
    copy: 'Manage the archival process, ensure metadata quality, and preserve the institution’s research collection.',
    tone: 'library',
  },
];

const faqItems = [
  {
    question: 'Who can access archived theses?',
    answer: 'Approved archive records are available to authenticated campus users, while drafts and review notes stay limited to the author and assigned reviewers.',
  },
  {
    question: 'Can I edit my thesis after submitting?',
    answer: 'Revisions are allowed while a thesis is still under review. Once archived, the final record is preserved as part of the university repository.',
  },
  {
    question: 'How long are theses kept in the archive?',
    answer: 'Approved theses are stored as long-term institutional records so future students and faculty can continue learning from them.',
  },
  {
    question: 'How do I report an issue with a submission?',
    answer: 'Use the Support section in the system or coordinate with your department office or library team for submission concerns.',
  },
];

export default function AboutArchiveContent() {
  return (
    <div className="vpaa-about-reference-layout">

      <section className="vpaa-about-reference-hero">
        <article className="vpaa-about-reference-story">
          <span className="vpaa-about-reference-label">University Research Repository</span>
          <h3>A digital home for every thesis your institution creates</h3>
          <p>
            The Thesis Archive is the university&apos;s central repository for student research. Every approved thesis is
            stored, organized, and made fully searchable so the first proposal to the final archived copy remains easy
            to trace, preserve, and learn from.
          </p>
          <div className="vpaa-about-reference-tags" aria-label="Supported user groups">
            <span>Students</span>
            <span>Faculty &amp; Advisers</span>
            <span>Librarians</span>
          </div>
        </article>

        <aside className="vpaa-about-reference-protect">
          <span className="vpaa-about-reference-label">What We Protect</span>
          <ul>
            <li><BadgeCheck size={14} /> Verified authorship and academic integrity</li>
            <li><Database size={14} /> Complete submission history with revisions</li>
            <li><Library size={14} /> Long-term access to institutional research</li>
            <li><FolderKanban size={14} /> Duplicated and plagiarized submissions</li>
          </ul>
          <div className="vpaa-about-reference-callout">
            <strong>Permanent retention</strong>
            <p>Archived records remain part of the university&apos;s academic memory.</p>
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

      <section className="vpaa-about-reference-section">
        <div className="vpaa-about-reference-section-head">
          <span className="vpaa-about-reference-label">Core Features</span>
        </div>
        <div className="vpaa-about-reference-feature-grid">
          {featureCards.map((item) => (
            <article className="vpaa-about-reference-feature-card" key={item.title}>
              <div className="vpaa-about-reference-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vpaa-about-reference-bottom-grid">
        <article className="vpaa-about-reference-panel">
          <div className="vpaa-about-reference-section-head">
            <span className="vpaa-about-reference-label">Users</span>
            <h3>Who uses this system</h3>
          </div>
          <div className="vpaa-about-reference-user-list">
            {userGroups.map((group) => (
              <div className="vpaa-about-reference-user-item" key={group.title}>
                <span className={`vpaa-about-reference-user-badge ${group.tone}`}>{group.code}</span>
                <div>
                  <strong>{group.title}</strong>
                  <p>{group.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="vpaa-about-reference-panel">
          <div className="vpaa-about-reference-section-head">
            <span className="vpaa-about-reference-label">FAQ</span>
            <h3>Frequently asked questions</h3>
          </div>
          <div className="vpaa-about-reference-faq-list">
            {faqItems.map((item) => (
              <div className="vpaa-about-reference-faq-item" key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
