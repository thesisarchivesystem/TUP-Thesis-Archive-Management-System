import { useState } from 'react';
import type { UserRole } from '../../types/user.types';
import { supportTicketService } from '../../services/supportTicketService';

const supportTopics = [
  ['Submission Issues', 'Fix upload errors, file format problems, and missing requirements before the deadline.'],
  ['Approvals & Review', 'Track adviser and panel feedback, request clarifications, and submit revisions.'],
  ['Policy & Compliance', 'Get guidance on ethics clearance, consent forms, and data privacy rules.'],
  ['Access & Accounts', 'Reset credentials, update your profile, and manage permissions for collaborators.'],
  ['Archive Requests', 'Request embargo changes, citation corrections, or metadata updates.'],
  ['System Updates', 'Check service notices, maintenance windows, and new feature announcements.'],
];

const faqs = [
  ['How long does the review process take?', 'Most reviews finish within 7-14 days depending on adviser availability.'],
  ['What file formats are accepted?', 'Upload PDF as the final copy. Drafts can include DOCX and supporting attachments.'],
  ['Can submission deadlines be extended?', 'Yes. Extension requests should be coordinated through the adviser or department office.'],
  ['How do I update metadata after approval?', 'Open a support request and include the corrected title, author, or archive details.'],
];

const categoryOptions = [
  'Submission & Upload',
  'Review & Approval',
  'Account Access',
  'Policy & Compliance',
  'Archive Update',
  'General Inquiry',
];

const roleAudienceLabel: Record<UserRole, string> = {
  vpaa: 'administrative workflows',
  faculty: 'advising and review workflows',
  student: 'submission and archive access workflows',
};

type Props = {
  role: UserRole;
  initialName: string;
  initialEmail: string;
  initialCategory?: string;
  initialMessage?: string;
};

export default function SupportCenterContent({ role, initialName, initialEmail, initialCategory = '', initialMessage = '' }: Props) {
  const [form, setForm] = useState({
    full_name: initialName,
    email: initialEmail,
    category: initialCategory,
    message: initialMessage,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: 'full_name' | 'email' | 'category' | 'message', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.category) {
      setErrorMessage('Please choose an issue category.');
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await supportTicketService.createTicket({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        category: form.category,
        message: form.message.trim(),
      });

      setSuccessMessage('Your support ticket has been submitted. The VPAA support team has been notified.');
      setForm((current) => ({
        ...current,
        category: '',
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
    <>
      <section className="vpaa-page-hero vpaa-page-hero-support">
        <div className="vpaa-support-hero-copy">
          <h2>Support Center</h2>
          <p>
            Get help with {roleAudienceLabel[role]}. Browse guidance, check common questions, or open a
            request and our team will assist you.
          </p>
        </div>
        <div className="vpaa-page-hero-panel">
          <h3>Quick Contacts</h3>
          <div className="vpaa-contact-list">
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Help Desk</span><span>support@tup-archive.edu</span></div>
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Library</span><span>library@tup-archive.edu</span></div>
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Ethics</span><span>ethics@tup-archive.edu</span></div>
            <div className="vpaa-contact-item"><span className="vpaa-contact-badge">Hours</span><span>Mon-Fri, 8:00 AM - 6:00 PM</span></div>
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
          <form className="vpaa-support-form" onSubmit={handleSubmit}>
            <input className="vpaa-support-input" type="text" placeholder="Full name" value={form.full_name} onChange={(event) => handleChange('full_name', event.target.value)} required />
            <input className="vpaa-support-input" type="email" placeholder="Email address" value={form.email} onChange={(event) => handleChange('email', event.target.value)} required />
            <select className="vpaa-support-input" value={form.category} onChange={(event) => handleChange('category', event.target.value)} required>
              <option value="" disabled>Issue category</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <textarea className="vpaa-support-textarea" placeholder="Describe your concern" value={form.message} onChange={(event) => handleChange('message', event.target.value)} minLength={10} required />
            {successMessage ? <p style={{ color: 'var(--sage)' }}>{successMessage}</p> : null}
            {errorMessage ? <p style={{ color: 'var(--maroon)' }}>{errorMessage}</p> : null}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
