const termSections = [
  {
    title: 'Acceptable Use',
    copy: 'Users must submit original work, respect intellectual property, and follow campus guidelines for academic integrity.',
    items: [
      'No plagiarism or misrepresentation of authorship.',
      'Do not upload confidential data without clearance.',
      'Use the platform only for academic and institutional purposes.',
    ],
  },
  {
    title: 'Submission Ownership',
    copy: 'Authors retain ownership of their work while granting the university the right to store and display approved theses.',
    items: [
      'Metadata may be edited by archive administrators.',
      'Embargo requests must be approved by the adviser.',
      'Final copies become part of the institutional record.',
    ],
  },
  {
    title: 'Data Privacy',
    copy: 'Personal data and sensitive research content are handled according to university privacy policies.',
    items: [
      'Access levels are assigned by role and approval.',
      'Sensitive data may be redacted or restricted.',
      'Audit logs are maintained for compliance.',
    ],
  },
  {
    title: 'Service Availability',
    copy: 'The system may undergo scheduled maintenance with advance notice to users.',
    items: [
      'Outages are communicated through the Support page.',
      'Deadlines may be extended at department discretion.',
      'Reports can be filed for technical incidents.',
    ],
  },
  {
    title: 'Policy Updates',
    copy: 'Terms may be revised to reflect changes in academic, privacy, or security requirements.',
    items: [
      'Major updates are announced to all users.',
      'Continued use indicates acceptance of changes.',
      'Archived versions are kept for reference.',
    ],
  },
  {
    title: 'Contact & Appeals',
    copy: 'Questions or disputes should be addressed through official channels.',
    items: [
      'Submit concerns via the Support Center.',
      'Appeals are reviewed by the academic office.',
      'Policy clarification is available on request.',
    ],
  },
];

export default function TermsAndConditionsContent() {
  return (
    <>
      <section className="vpaa-page-hero vpaa-page-hero-terms">
        <div className="vpaa-terms-hero-copy">
          <h2>Terms & Conditions</h2>
          <p>
            These terms outline responsibilities for using the Thesis Archive Management System,
            including submission rules, data handling, and institutional policies.
          </p>
        </div>
        <div className="vpaa-page-hero-panel">
          <h3>Effective Date</h3>
          <p>February 7, 2026</p>
          <p>Applies to all student, adviser, and librarian accounts.</p>
        </div>
      </section>

      <section className="vpaa-terms-grid">
        {termSections.map((section) => (
          <article className="vpaa-card vpaa-terms-section" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.copy}</p>
            <div className="vpaa-terms-list">
              {section.items.map((item) => (
                <div className="vpaa-terms-item" key={item}>{item}</div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
