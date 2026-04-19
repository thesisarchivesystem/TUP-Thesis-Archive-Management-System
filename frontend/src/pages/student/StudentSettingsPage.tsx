import { useMemo, useState } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../hooks/useAuth';

type SettingsForm = {
  thesisStatusUpdates: boolean;
  deadlineReminders: boolean;
  adviserMessages: boolean;
  notificationFrequency: 'Real-time' | 'Daily digest';
};

const defaultSettings: SettingsForm = {
  thesisStatusUpdates: true,
  deadlineReminders: true,
  adviserMessages: true,
  notificationFrequency: 'Real-time',
};

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingsForm>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('Prototype page: changes are stored only in this browser session.');

  const initials = useMemo(
    () => (user?.name || 'Student')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    [user?.name],
  );

  const toggleSetting = (field: keyof Pick<SettingsForm, 'thesisStatusUpdates' | 'deadlineReminders' | 'adviserMessages'>) => {
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
    <StudentLayout
      title="Student Settings"
      description="Manage the necessary notification and account preferences for your student account. Official profile and thesis details remain protected in your profile page."
    >
      <div className="vpaa-settings-page-shell">
        <div className="vpaa-settings-page-grid">
          <section className="vpaa-profile-page-panel vpaa-settings-summary-card">
            <div className="vpaa-settings-hero-avatar">{initials || 'ST'}</div>
            <div>
              <div className="vpaa-settings-display-name">Student Settings</div>
              <div className="vpaa-settings-display-role">Essential account preferences</div>
            </div>
            <div className="vpaa-settings-display-badge">Student Controls</div>
            <div className="vpaa-settings-display-notice">
              Only necessary student preferences can be changed here. Academic records and profile details stay faculty-managed.
            </div>
          </section>

          <section className="vpaa-profile-page-panel vpaa-settings-details-card">
            <div className="vpaa-profile-section-heading">Notifications</div>

            <div className="vpaa-settings-grid">
              <div className="vpaa-settings-field">
                <label>Thesis Status Updates</label>
                <div className="vpaa-settings-inline">
                  <span>Receive updates when submission status changes</span>
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
                <label>Deadline Reminders</label>
                <div className="vpaa-settings-inline">
                  <span>Get reminder alerts before important due dates</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.deadlineReminders ? ' is-on' : ''}`}
                    aria-label="Toggle deadline reminders"
                    aria-pressed={form.deadlineReminders}
                    onClick={() => toggleSetting('deadlineReminders')}
                  />
                </div>
              </div>

              <div className="vpaa-settings-field">
                <label>Adviser Messages</label>
                <div className="vpaa-settings-inline">
                  <span>Notify me when my adviser sends a message</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.adviserMessages ? ' is-on' : ''}`}
                    aria-label="Toggle adviser message notifications"
                    aria-pressed={form.adviserMessages}
                    onClick={() => toggleSetting('adviserMessages')}
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
    </StudentLayout>
  );
}
