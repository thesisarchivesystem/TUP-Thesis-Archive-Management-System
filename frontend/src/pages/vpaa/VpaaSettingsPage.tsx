import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import VpaaLayout from '../../components/vpaa/VpaaLayout';

type SettingsForm = {
  approvalUpdates: boolean;
  complianceReminders: boolean;
  facultyMessages: boolean;
  notificationFrequency: 'Real-time' | 'Daily digest';
};

const defaultSettings: SettingsForm = {
  approvalUpdates: true,
  complianceReminders: true,
  facultyMessages: true,
  notificationFrequency: 'Real-time',
};

export default function VpaaSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SettingsForm>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('Prototype page: changes are stored only in this browser session.');

  const initials = useMemo(
    () => (user?.name || 'VPAA')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    [user?.name],
  );

  const toggleSetting = (field: keyof Pick<SettingsForm, 'approvalUpdates' | 'complianceReminders' | 'facultyMessages'>) => {
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
    <VpaaLayout
      title="VPAA Settings"
      description="Manage executive notification, approval, and oversight preferences for the VPAA account. Institutional profile details remain available in the profile page."
    >
      <div className="vpaa-settings-page-shell">
        <div className="vpaa-settings-page-grid">
          <section className="vpaa-profile-page-panel vpaa-settings-summary-card">
            <div className="vpaa-settings-hero-avatar">{initials || 'VP'}</div>
            <div>
              <div className="vpaa-settings-display-name">VPAA Settings</div>
              <div className="vpaa-settings-display-role">Simple account preferences</div>
            </div>
            <div className="vpaa-settings-display-badge">VPAA Controls</div>
            <div className="vpaa-settings-display-notice">
              Only simple notification settings can be changed here. Administrative profile details remain on the VPAA profile page.
            </div>
          </section>

          <section className="vpaa-profile-page-panel vpaa-settings-details-card">
            <div className="vpaa-profile-section-heading">Notifications</div>

            <div className="vpaa-settings-grid">
              <div className="vpaa-settings-field">
                <label>Approval Status Updates</label>
                <div className="vpaa-settings-inline">
                  <span>Receive alerts when approval status changes</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.approvalUpdates ? ' is-on' : ''}`}
                    aria-label="Toggle approval status updates"
                    aria-pressed={form.approvalUpdates}
                    onClick={() => toggleSetting('approvalUpdates')}
                  />
                </div>
              </div>

              <div className="vpaa-settings-field">
                <label>Compliance Reminders</label>
                <div className="vpaa-settings-inline">
                  <span>Get reminders before important approval deadlines</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.complianceReminders ? ' is-on' : ''}`}
                    aria-label="Toggle compliance reminders"
                    aria-pressed={form.complianceReminders}
                    onClick={() => toggleSetting('complianceReminders')}
                  />
                </div>
              </div>

              <div className="vpaa-settings-field">
                <label>Faculty Coordination Messages</label>
                <div className="vpaa-settings-inline">
                  <span>Notify me when faculty send archive messages</span>
                  <button
                    type="button"
                    className={`vpaa-settings-toggle${form.facultyMessages ? ' is-on' : ''}`}
                    aria-label="Toggle faculty coordination message notifications"
                    aria-pressed={form.facultyMessages}
                    onClick={() => toggleSetting('facultyMessages')}
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
    </VpaaLayout>
  );
}
