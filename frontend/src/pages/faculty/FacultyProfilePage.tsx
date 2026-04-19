import { useEffect, useMemo, useState } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useAuth } from '../../hooks/useAuth';
import { facultyProfileService, type FacultyProfileView } from '../../services/facultyProfileService';

const emptyProfile: FacultyProfileView = {
  id: '',
  faculty_id: '',
  full_name: '',
  email: '',
  department: '',
  faculty_role: '',
  role_title: '',
  rank: '',
  mobile: null,
  office: null,
  advisee_count: 0,
  committee_role: '',
  consultation_hours: null,
  specialization: null,
  status: 'active',
  editable_by: 'VPAA',
  updated_at: null,
};

const formatUpdatedLabel = (value?: string | null) => {
  if (!value) return 'Last updated: Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last updated: Not available';
  return `Last updated: ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
};

const withFallback = (value?: string | null, fallback = 'Not specified') =>
  value && value.trim() ? value : fallback;

const statusLabel = (status: FacultyProfileView['status']) => {
  if (status === 'inactive') return 'Inactive';
  if (status === 'on_leave') return 'On Leave';
  return 'Read-only';
};

export default function FacultyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FacultyProfileView>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    void facultyProfileService.getProfile()
      .then((response) => {
        if (!mounted) return;
        setProfile(response);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load faculty profile.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const initials = useMemo(
    () => (profile.full_name || user?.name || 'Faculty')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(''),
    [profile.full_name, user?.name],
  );

  return (
    <FacultyLayout
      title="Faculty Profile"
      description="Review your faculty information and academic assignment details. Profile updates are managed through VPAA."
    >
      <div className="vpaa-profile-page-shell">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {isLoading ? <div className="vpaa-card">Loading faculty profile...</div> : null}

        {!isLoading ? (
          <div className="vpaa-profile-page-grid">
            <section className="vpaa-profile-page-panel vpaa-profile-summary-card">
              <div className="vpaa-profile-hero-avatar avatar-tone-faculty">{initials || 'FA'}</div>
              <div>
                <div className="vpaa-profile-display-name">{profile.full_name || user?.name || 'Faculty User'}</div>
                <div className="vpaa-profile-display-role">{withFallback(profile.role_title)}, {withFallback(profile.department)}</div>
              </div>
              <div className="vpaa-profile-display-badge">Faculty Account</div>
              <div className="vpaa-profile-display-notice">
                This profile is read-only. Changes can only be made by VPAA.
              </div>
            </section>

            <section className="vpaa-profile-page-panel vpaa-profile-details-card">
              <div className="vpaa-profile-section-block">
                <div className="vpaa-profile-section-heading">Professional Information</div>
                <div className="vpaa-profile-form-grid">
                  <label className="vpaa-profile-form-field">
                    <span>Faculty ID</span>
                    <input value={profile.faculty_id} readOnly />
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
                    <span>Office</span>
                    <input value={withFallback(profile.office)} readOnly />
                  </label>
                </div>
              </div>

              <div className="vpaa-profile-section-block">
                <div className="vpaa-profile-section-heading">Academic Load</div>
                <div className="vpaa-profile-form-grid">
                  <label className="vpaa-profile-form-field">
                    <span>Advisees</span>
                    <input value={`${profile.advisee_count} Thesis Advisees`} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Committee Role</span>
                    <input value={withFallback(profile.committee_role)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Consultation Hours</span>
                    <input value={withFallback(profile.consultation_hours)} readOnly />
                  </label>
                  <label className="vpaa-profile-form-field">
                    <span>Specialization</span>
                    <input value={withFallback(profile.specialization || profile.rank)} readOnly />
                  </label>
                </div>
              </div>

              <div className="vpaa-profile-section-block">
                <div className="vpaa-profile-section-heading">Access and Permissions</div>
                <div className="vpaa-profile-meta-row">
                  <span>Profile status: {statusLabel(profile.status)}</span>
                  <span>Editable by: {profile.editable_by}</span>
                  <span>{formatUpdatedLabel(profile.updated_at)}</span>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </FacultyLayout>
  );
}
