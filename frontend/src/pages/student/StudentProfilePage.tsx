import { useEffect, useMemo, useState } from 'react';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../hooks/useAuth';
import { studentProfileService, type StudentProfileView } from '../../services/studentProfileService';

const emptyProfile: StudentProfileView = {
  id: '',
  student_id: '',
  full_name: '',
  email: '',
  mobile: null,
  department: '',
  program: '',
  year_level: null,
  thesis_title: null,
  adviser_name: null,
  adviser_email: null,
  defense_schedule: null,
  status: 'No submission yet',
  editable_by: 'Faculty',
  updated_at: null,
};

const withFallback = (value?: string | null, fallback = 'Not specified') =>
  value && value.trim() ? value : fallback;

const formatUpdatedLabel = (value?: string | null) => {
  if (!value) return 'Last updated: Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last updated: Not available';
  return `Last updated: ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
};

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileView>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    void studentProfileService.getProfile()
      .then((response) => {
        if (!mounted) return;
        setProfile(response);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load student profile.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const initials = useMemo(
    () => (profile.full_name || user?.name || 'Student')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    [profile.full_name, user?.name],
  );

  return (
    <StudentLayout
      title="Student Profile"
      description="View your personal and thesis information. Profile updates are managed through your assigned faculty adviser."
    >
      <div className="vpaa-profile-page-shell">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {isLoading ? <div className="vpaa-card">Loading student profile...</div> : null}

        {!isLoading ? (
          <div className="vpaa-profile-page-grid">
            <section className="vpaa-profile-page-panel vpaa-profile-summary-card">
              <div className="vpaa-profile-hero-avatar avatar-tone-student">{initials || 'ST'}</div>
              <div>
                <div className="vpaa-profile-display-name">{profile.full_name || user?.name || 'Student User'}</div>
                <div className="vpaa-profile-display-role">
                  Student - {withFallback(profile.program)}
                </div>
              </div>
              <div className="vpaa-settings-display-badge">Student Account</div>
              <div className="vpaa-profile-display-notice">
                This profile is read-only. Changes can only be made by faculty.
              </div>
            </section>

            <section className="vpaa-profile-page-panel vpaa-profile-details-card">
              <div className="vpaa-profile-section-block">
                <div className="vpaa-profile-section-heading">Personal Information</div>
                <div className="vpaa-profile-form-grid">
                  <label className="vpaa-profile-form-field">
                    <span>Student ID</span>
                    <input value={profile.student_id} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Email</span>
                    <input value={profile.email} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Mobile</span>
                    <input value={withFallback(profile.mobile)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Program</span>
                    <input value={withFallback(profile.program)} readOnly />
                  </label>
                </div>
              </div>

              <div className="vpaa-profile-section-block">
                <div className="vpaa-profile-section-heading">Thesis Information</div>
                <div className="vpaa-profile-form-grid">
                  <label className="vpaa-profile-form-field vpaa-profile-form-field-full">
                    <span>Thesis Title</span>
                    <input value={withFallback(profile.thesis_title)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Adviser</span>
                    <input value={withFallback(profile.adviser_name)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Status</span>
                    <input value={withFallback(profile.status)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Defense Schedule</span>
                    <input value={withFallback(profile.defense_schedule)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Department</span>
                    <input value={withFallback(profile.department)} readOnly />
                  </label>
                </div>
              </div>

              <div className="vpaa-profile-section-block">
                <div className="vpaa-profile-section-heading">Access and Permissions</div>
                <div className="vpaa-profile-meta-row">
                  <span>Profile status: Read-only</span>
                  <span>Editable by: {profile.editable_by}</span>
                  <span>{formatUpdatedLabel(profile.updated_at)}</span>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </StudentLayout>
  );
}
