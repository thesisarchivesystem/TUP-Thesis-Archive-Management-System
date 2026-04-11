import VpaaLayout from '../../components/vpaa/VpaaLayout';

const supportTopics = [
  ['Submission Issues', 'Fix upload errors, file format problems, and missing requirements before the deadline.'],
  ['Approvals & Review', 'Track adviser and panel feedback, request clarifications, and submit revisions.'],
  ['Policy & Compliance', 'Get guidance on ethics clearance, consent forms, and data privacy rules.'],
  ['Access & Accounts', 'Reset credentials, update your profile, and manage permissions for collaborators.'],
  ['Archive Requests', 'Request embargo changes, citation corrections, or metadata updates.'],
  ['System Updates', 'Check service notices, maintenance windows, and new feature announcements.'],
];

const faqs = [
  ['How long does the review process take?', 'Most reviews finish within 7–14 days depending on adviser availability.'],
  ['What file formats are accepted?', 'Upload PDF as the final copy. Drafts can include DOCX and supporting attachments.'],
  ['Can submission deadlines be extended?', 'Yes. Extension requests should be coordinated through the adviser or department office.'],
  ['How do I update metadata after approval?', 'Open a support request and include the corrected title, author, or archive details.'],
];

export default function VpaaSupportPage() {
  return (
    <VpaaLayout title="Support Center" description="Get help with submissions, approvals, account access, and archive policies.">
      <section className="vpaa-page-hero vpaa-page-hero-support">
        <div className="vpaa-support-hero-copy">
          <h2>Support Center</h2>
          <p>
            Get help with submissions, approvals, account access, and archive policies. Browse guidance,
            check common questions, or open a request and our team will assist you.
          </p>
        </div>
        <div className="vpaa-page-hero-panel">
          <h3>Quick Contacts</h3>
          <div className="vpaa-contact-list">
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Help Desk</span><span>support@tup-archive.edu</span></div>
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Library</span><span>library@tup-archive.edu</span></div>
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Ethics</span><span>ethics@tup-archive.edu</span></div>
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Hours</span><span>Mon–Fri, 8:00 AM – 6:00 PM</span></div>
          </div>
        </div>
      </section>

      <section className="vpaa-page-card-grid">
        {supportTopics.map(([title, copy]) => (
          <article className="vpaa-page-feature-card" key={title}>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="vpaa-support-layout">
        <div className="vpaa-card vpaa-support-faq">
          <h3>Frequently Asked Questions</h3>
          <div className="vpaa-faq-list">
            {faqs.map(([question, answer]) => (
              <div className="vpaa-faq-item" key={question}>
                <strong>{question}</strong>
                <span>{answer}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vpaa-card vpaa-support-ticket">
          <h3>Open a Support Ticket</h3>
          <form className="vpaa-support-form">
            <input className="vpaa-support-input" type="text" placeholder="Full name" />
            <input className="vpaa-support-input" type="email" placeholder="Email address" />
            <select className="vpaa-support-input">
              <option>Issue category</option>
              <option>Submission & Upload</option>
              <option>Review & Approval</option>
              <option>Account Access</option>
              <option>Policy & Compliance</option>
              <option>Archive Update</option>
            </select>
            <textarea className="vpaa-support-textarea" placeholder="Describe your concern" />
            <button type="button" className="btn-primary">Submit Ticket</button>
          </form>
        </div>
      </section>
    </VpaaLayout>
  );
}
