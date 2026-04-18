import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FacultyLayout from '../../components/faculty/FacultyLayout';

type SettingsForm = {
  thesisStatusUpdates: boolean;
  studentMessages: boolean;
  reviewReminders: boolean;
  notificationFrequency: 'Real-time' | 'Daily digest';
};

const defaultSettings: SettingsForm = {
  thesisStatusUpdates: true,
  studentMessages: true,
  reviewReminders: true,
  notificationFrequency: 'Real-time',
};

export default function FacultySettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingsForm>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('Prototype page: changes are stored only in this browser session.');

  const initials = useMemo(
    () => (user?.name || 'Faculty')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    [user?.name],
  );

  const toggleSetting = (field: keyof Pick<SettingsForm, 'thesisStatusUpdates' | 'studentMessages' | 'reviewReminders'>) => {
    setForm((current) => ({ ...current, [field]: !current[field] }));
    setSavedMessage('Prototype page: changes are stored only in this browser session.');
  };

  const handleReset = () => {
    setForm(defaultSettings);
    setSavedMessage('Prototype settings reset to defaults.');
  };

  const handleSave = () => {
    setSavedMessage('Settings saved locally for this prototype view.');
  };

  return (
    <FacultyLayout
      title="Faculty Settings"
      description="Manage notification and review preferences for the faculty account. Profile details remain available in the profile page."
    >
      <div className="vpaa-settings-page-shell">
        <div className="vpaa-settings-page-grid">
          <section className="vpaa-profile-page-panel vpaa-settings-summary-card">
            <div className="vpaa-settings-hero-avatar">{initials || 'FA'}</div>
            <div>
              <div className="vpaa-settings-display-name">Faculty Settings</div>
              <div className="vpaa-settings-display-role">Simple account preferences</div>
            </div>
            <div className="vpaa-settings-display-badge">Faculty Controls</div>
            <div className="vpaa-settings-display-notice">
              Only simple notification settings can be changed here. Faculty profile details remain on the profile page.
            </div>
          </section>

          <section className="vpaa-profile-page-panel vpaa-settings-details-card">
            <div className="vpaa-profile-section-heading">Notifications</div>

            <div className="vpaa-settings-grid">
              <div className="vpaa-settings-field">
                <label>Thesis Status Updates</label>
                <div className="vpaa-settings-inline">
                  <span>Receive alerts when student thesis status changes</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.thesisStatusUpdates ? ' is-on' : ''}`}
                    aria-label="Toggle thesis status updates"
                    aria-pressed={form.thesisStatusUpdates}
                    onClick={() => toggleSetting('thesisStatusUpdates')}
                  />
                </div>
              </div>

              <div className="vpaa-settings-field">
                <label>Review Reminders</label>
                <div className="vpaa-settings-inline">
                  <span>Get reminders before important thesis review deadlines</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.reviewReminders ? ' is-on' : ''}`}
                    aria-label="Toggle review reminders"
                    aria-pressed={form.reviewReminders}
                    onClick={() => toggleSetting('reviewReminders')}
                  />
                </div>
              </div>

              <div className="vpaa-settings-field">
                <label>Student Messages</label>
                <div className="vpaa-settings-inline">
                  <span>Notify me when students send archive-related messages</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.studentMessages ? ' is-on' : ''}`}
                    aria-label="Toggle student message notifications"
                    aria-pressed={form.studentMessages}
                    onClick={() => toggleSetting('studentMessages')}
                  />
                </div>
              </div>

              <div className="vpaa-settings-field">
                <label>Notification Frequency</label>
                <select
                  className="vpaa-settings-select"
                  value={form.notificationFrequency}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, notificationFrequency: event.target.value as SettingsForm['notificationFrequency'] }));
                    setSavedMessage('Prototype page: changes are stored only in this browser session.');
                  }}
                >
                  <option>Real-time</option>
                  <option>Daily digest</option>
                </select>
              </div>
            </div>

            <div className="vpaa-settings-actions">
              <button type="button" className="vpaa-profile-page-btn secondary" onClick={handleReset}>Reset</button>
              <button type="button" className="vpaa-profile-page-btn primary" onClick={handleSave}>Save Changes</button>
            </div>

            <div className="vpaa-settings-note" role="status" aria-live="polite">{savedMessage}</div>
          </section>
        </div>
      </div>
    </FacultyLayout>
  );
}
