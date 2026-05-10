import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { BookOpen, GraduationCap, LockKeyhole, UserRound } from 'lucide-react';
import StudentLayout from '../../components/student/StudentLayout';
import { useAuth } from '../../hooks/useAuth';
import { studentProfileService, type StudentProfileView } from '../../services/studentProfileService';

const emptyProfile: StudentProfileView = {
  id: '',
  student_id: '',
  first_name: null,
  last_name: null,
  suffix: null,
  full_name: '',
  email: '',
  mobile: null,
  college: null,
  department: '',
  program: '',
  section: null,
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

const formatYearLevel = (value?: number | null) => {
  if (!value) return 'Not assigned';

  const suffix = value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th';
  return `${value}${suffix} Year`;
};

type ProfileFieldProps = {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
};

function ProfileField({ label, value, accent = false, muted = false }: ProfileFieldProps) {
  return (
    <div className={`student-profile-readonly-field${accent ? ' accent' : ''}${muted ? ' muted' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type ProfileSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function ProfileSection({ title, icon, children }: ProfileSectionProps) {
  return (
    <section className="student-profile-info-section">
      <div className="student-profile-section-title">
        <span className="student-profile-section-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      <div className="student-profile-field-grid">{children}</div>
    </section>
  );
}

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

  const displayName = profile.full_name || user?.name || 'Student User';

  return (
    <StudentLayout
      title="Student Profile"
      description="View your personal and academic information. Profile updates are managed by your assigned faculty adviser."
    >
      <div className="student-profile-reference-shell">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {isLoading ? <div className="vpaa-card vpaa-profile-loading">Loading student profile...</div> : null}

        {!isLoading ? (
          <div className="student-profile-reference-grid">
            <aside className="student-profile-identity-card">
              <div className="student-profile-avatar">{initials || 'ST'}</div>
              <div className="student-profile-identity-copy">
                <h2>{displayName}</h2>
                <p>Student - {withFallback(profile.program)}</p>
              </div>
              <span className="student-profile-account-badge">Student Account</span>
              <div className="student-profile-readonly-notice">
                <LockKeyhole size={22} />
                <div>
                  <strong>This profile is read-only.</strong>
                  <span>Changes are managed by faculty.</span>
                </div>
              </div>
            </aside>

            <section className="student-profile-info-card">
              <ProfileSection title="Basic Information" icon={<UserRound size={16} />}>
                <ProfileField label="First Name" value={withFallback(profile.first_name || user?.first_name)} />
                <ProfileField label="Last Name" value={withFallback(profile.last_name || user?.last_name)} />
                <ProfileField label="Suffix" value={withFallback(profile.suffix || user?.suffix)} />
                <ProfileField label="Email" value={withFallback(profile.email || user?.email)} accent />
              </ProfileSection>

              <ProfileSection title="Student Information" icon={<GraduationCap size={16} />}>
                <ProfileField label="Student ID" value={withFallback(profile.student_id)} accent />
                <ProfileField label="Year Level" value={formatYearLevel(profile.year_level)} />
              </ProfileSection>

              <ProfileSection title="Academic Information" icon={<BookOpen size={16} />}>
                <ProfileField label="College" value={withFallback(profile.college)} />
                <ProfileField label="Department" value={withFallback(profile.department)} />
                <ProfileField label="Course" value={withFallback(profile.program)} />
                <ProfileField label="Section" value={withFallback(profile.section, 'Not assigned')} accent />
              </ProfileSection>
            </section>
          </div>
        ) : null}
      </div>
    </StudentLayout>
  );
}
