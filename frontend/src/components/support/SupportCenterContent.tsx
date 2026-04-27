import { useState } from 'react';
import { CircleHelp, Clock3, FileUp, KeyRound, LibraryBig, MailCheck, ShieldAlert } from 'lucide-react';
import type { UserRole } from '../../types/user.types';
import { supportTicketService } from '../../services/supportTicketService';

const supportTopics = [
  ['Submission issues', 'Fix upload errors, file format problems, and missing requirements before the deadline.', <FileUp size={16} />],
  ['Approvals & review', 'Track adviser and panel feedback, request clarifications, and submit revisions.', <MailCheck size={16} />],
  ['Policy & compliance', 'Get guidance on ethics clearance, consent forms, and data privacy rules.', <ShieldAlert size={16} />],
  ['Access & accounts', 'Reset credentials, update your profile, and manage permissions for collaborators.', <KeyRound size={16} />],
  ['Archive requests', 'Request embargo changes, citation corrections, or metadata updates after archival.', <LibraryBig size={16} />],
  ['System updates', 'Check service notices, maintenance windows, and new feature announcements.', <Clock3 size={16} />],
] as const;

const faqs = [
  ['How long does the review process take?', 'Most reviews finish within 7-14 days depending on adviser availability and revision cycles.'],
  ['What file formats are accepted?', 'Submit the final copy as PDF. Drafts during review may include DOCX and supporting attachments.'],
  ['Can submission deadlines be extended?', 'Yes. Extension requests must be coordinated through your adviser or the department office before the deadline.'],
  ['Who can access my thesis while it\'s under review?', 'Only you and your assigned adviser can view a draft. It becomes visible to authorized users once archived.'],
  ['How do I update metadata after approval?', 'Open a support request using the ticket form and include the corrected title, author, or archive details.'],
  ['Can I edit my thesis after it\'s been archived?', 'The archived document is locked, but all revision history is preserved. Contact the library team for corrections.'],
] as const;

const categoryOptions = [
  'Submission & Upload',
  'Review & Approval',
  'Account Access',
  'Policy & Compliance',
  'Archive Update',
  'General Inquiry',
  'Others',
];

const OTHER_CATEGORY = 'Others';

type Props = {
  role: UserRole;
  initialName: string;
  initialEmail: string;
  initialCategory?: string;
  initialMessage?: string;
};

export default function SupportCenterContent({ initialName, initialEmail, initialCategory = '', initialMessage = '' }: Props) {
  const [form, setForm] = useState({
    full_name: initialName,
    email: initialEmail,
    category: initialCategory,
    other_category: initialCategory && !categoryOptions.includes(initialCategory) ? initialCategory : '',
    message: initialMessage,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: 'full_name' | 'email' | 'category' | 'other_category' | 'message', value: string) => {
    setForm((current) => {
      if (field === 'category') {
        return {
          ...current,
          category: value,
          other_category: value === OTHER_CATEGORY ? current.other_category : '',
        };
      }

      return { ...current, [field]: value };
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.category) {
      setErrorMessage('Please choose an issue category.');
      return;
    }

    if (form.category === OTHER_CATEGORY && !form.other_category.trim()) {
      setErrorMessage('Please specify your issue category.');
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const normalizedCategory = form.category === OTHER_CATEGORY
        ? form.other_category.trim()
        : form.category;

      await supportTicketService.createTicket({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        category: normalizedCategory,
        message: form.message.trim(),
      });

      setSuccessMessage('Your support ticket has been submitted. The VPAA support team has been notified.');
      setForm((current) => ({
        ...current,
        category: '',
        other_category: '',
        message: '',
      }));
    } catch (error: unknown) {
      const responseData =
        typeof error === 'object' &&
        error !== null &&
        'response' in error
          ? (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
          : undefined;

      const firstValidationError = responseData?.errors
        ? Object.values(responseData.errors)[0]?.[0]
        : undefined;

      setErrorMessage(responseData?.message || firstValidationError || 'We could not submit your support ticket right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vpaa-support-reference-layout">
      <section className="vpaa-support-reference-top">
        <article className="vpaa-support-reference-hero">
          <div className="vpaa-support-reference-summary">
            <span className="vpaa-support-reference-label">Support Center</span>
            <h2>Browse guidance, or open a request and our team will assist you.</h2>
            <p>
              Choose a support topic below, check the frequently asked questions, or submit a ticket directly. For urgent
              concerns, use the contact details on the right.
            </p>
          </div>
        </article>

        <aside className="vpaa-support-reference-contacts">
          <h3>Quick contacts</h3>
          <div className="vpaa-support-reference-contact-list">
            <div className="vpaa-support-reference-contact-item"><span>Help Desk</span><strong>support@tup-archive.edu</strong></div>
            <div className="vpaa-support-reference-contact-item"><span>Library</span><strong>library@tup-archive.edu</strong></div>
            <div className="vpaa-support-reference-contact-item"><span>Ethics</span><strong>ethics@tup-archive.edu</strong></div>
            <div className="vpaa-support-reference-contact-item"><span>Hours</span><strong>Mon-Fri, 8:00 AM - 6:00 PM</strong></div>
          </div>
        </aside>
      </section>

      <section className="vpaa-support-reference-topic-grid">
        {supportTopics.map(([title, copy, icon]) => (
          <article className="vpaa-support-reference-topic-card" key={title}>
            <div className="vpaa-support-reference-topic-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="vpaa-support-reference-bottom">
        <article className="vpaa-support-reference-faq">
          <div className="vpaa-support-reference-section-head">
            <span className="vpaa-support-reference-label">FAQ</span>
            <h3>Frequently asked questions</h3>
          </div>
          <div className="vpaa-support-reference-faq-list">
            {faqs.map(([question, answer]) => (
              <div className="vpaa-support-reference-faq-item" key={question}>
                <div className="vpaa-support-reference-faq-question">
                  <CircleHelp size={14} />
                  <strong>{question}</strong>
                </div>
                <p>{answer}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="vpaa-support-reference-ticket">
          <div className="vpaa-support-reference-section-head">
            <span className="vpaa-support-reference-label">Ticket</span>
            <h3>Open a support ticket</h3>
          </div>
          <form className="vpaa-support-reference-form" onSubmit={handleSubmit}>
            <label>
              <span>Full Name</span>
              <input className="vpaa-support-input" type="text" value={form.full_name} onChange={(event) => handleChange('full_name', event.target.value)} required />
            </label>
            <label>
              <span>Email</span>
              <input className="vpaa-support-input" type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} required />
            </label>
            <label>
              <span>Issue Category</span>
              <select className="vpaa-support-input" value={form.category} onChange={(event) => handleChange('category', event.target.value)} required>
                <option value="" disabled>Select a category...</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            {form.category === OTHER_CATEGORY ? (
              <label>
                <span>Specify Issue Category</span>
                <input
                  className="vpaa-support-input"
                  type="text"
                  value={form.other_category}
                  onChange={(event) => handleChange('other_category', event.target.value)}
                  placeholder="Enter your issue category..."
                  required
                />
              </label>
            ) : null}
            <label>
              <span>Describe Your Concern</span>
              <textarea className="vpaa-support-textarea" value={form.message} onChange={(event) => handleChange('message', event.target.value)} placeholder="Briefly describe the issue you're experiencing..." minLength={10} required />
            </label>
            {successMessage ? <p className="vpaa-support-reference-success">{successMessage}</p> : null}
            {errorMessage ? <p className="vpaa-support-reference-error">{errorMessage}</p> : null}
            <button type="submit" className="btn-primary vpaa-support-reference-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <small>We typically respond within 1-2 business days.</small>
          </form>
        </article>
      </section>
    </div>
  );
}
