import { CircleDot, FileText, Lock, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';

const termSections = [
  {
    title: 'Acceptable use',
    copy: 'Standards for conduct and content submitted to the archive.',
    icon: <ShieldCheck size={16} />,
    tone: 'rose',
    items: [
      'Submit only original work and accurately represent authorship.',
      'Do not upload confidential data without proper ethics clearance.',
      'Use the platform solely for academic and institutional purposes.',
    ],
  },
  {
    title: 'Submission ownership',
    copy: 'Rights retained by authors upon archival.',
    icon: <FileText size={16} />,
    tone: 'blue',
    items: [
      'Authors retain ownership while granting the university rights to store and display approved theses.',
      'Embargo requests must be approved by the assigned adviser before archival.',
      'Final copies become a permanent part of the institutional record.',
    ],
  },
  {
    title: 'Data privacy',
    copy: 'How personal and research data is handled and protected.',
    icon: <Lock size={16} />,
    tone: 'gold',
    items: [
      'Access levels are assigned by user role and require approval for elevation.',
      'Sensitive research content may be redacted or restricted by the library team.',
      'Audit logs are maintained for compliance and institutional accountability.',
    ],
  },
  {
    title: 'Service availability',
    copy: 'System maintenance, outages, and deadline provisions.',
    icon: <Wrench size={16} />,
    tone: 'green',
    items: [
      'Scheduled maintenance is announced in advance via the Support page.',
      'Submission deadlines may be extended at department discretion during outages.',
      'Technical incidents can be reported through the Support Center.',
    ],
  },
  {
    title: 'Policy updates',
    copy: 'How changes to these terms are communicated and applied.',
    icon: <RefreshCw size={16} />,
    tone: 'neutral',
    items: [
      'Terms may be revised to reflect changes in academic, privacy, or security requirements.',
      'Major updates are announced to all users before taking effect.',
      'Previous versions are archived and available on request.',
    ],
  },
];

export default function TermsAndConditionsContent() {
  return (
    <div className="vpaa-terms-reference-layout">
      <section className="vpaa-terms-reference-hero">
        <article className="vpaa-terms-reference-summary">
          <span className="vpaa-terms-reference-label">Legal &amp; Policy</span>
          <h2>Using the Thesis Archive means agreeing to these terms</h2>
          <p>
            These terms outline your responsibilities as a user of the Thesis Archive Management System covering
            submission conduct, data handling, ownership rights, and institutional policies. Continued use of the
            system constitutes acceptance.
          </p>
        </article>

        <aside className="vpaa-terms-reference-date">
          <span className="vpaa-terms-reference-label">Effective Date</span>
          <strong>February 7, 2026</strong>
          <p>Applies to all student, adviser, and librarian accounts.</p>
        </aside>
      </section>

      <section className="vpaa-terms-reference-grid">
        {termSections.map((section) => (
          <article className="vpaa-terms-reference-card" key={section.title}>
            <div className="vpaa-terms-reference-card-head">
              <span className={`vpaa-terms-reference-icon ${section.tone}`}>{section.icon}</span>
              <div>
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
              </div>
            </div>
            <div className="vpaa-terms-reference-list">
              {section.items.map((item) => (
                <div className="vpaa-terms-reference-item" key={item}>
                  <CircleDot size={10} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
