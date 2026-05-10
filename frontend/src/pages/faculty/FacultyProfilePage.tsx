import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { BookOpen, BriefcaseBusiness, LockKeyhole, UserRound } from 'lucide-react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import { useAuth } from '../../hooks/useAuth';
import { academicStructureService } from '../../services/academicStructureService';
import type { AdminStructureCollege } from '../../services/adminService';
import {
  facultyProfileService,
  type FacultyProfileUpdatePayload,
  type FacultyProfileView,
} from '../../services/facultyProfileService';

const emptyProfile: FacultyProfileView = {
  id: '',
  faculty_id: '',
  full_name: '',
  first_name: '',
  last_name: '',
  suffix: null,
  email: '',
  department: '',
  college: null,
  faculty_role: '',
  role_title: '',
  rank: '',
  mobile: null,
  advisee_count: 0,
  committee_role: '',
  consultation_hours: null,
  specialization: null,
  status: 'active',
  editable_by: 'VPAA',
  updated_at: null,
};

const withFallback = (value?: string | null, fallback = 'Not specified') =>
  value && value.trim() ? value : fallback;

const getEditableProfile = (profile: FacultyProfileView): FacultyProfileUpdatePayload => ({
  first_name: profile.first_name ?? '',
  last_name: profile.last_name ?? '',
  suffix: profile.suffix ?? '',
  email: profile.email ?? '',
  rank: profile.rank ?? '',
  faculty_role: profile.faculty_role ?? '',
  college: profile.college ?? '',
  department: profile.department ?? '',
});

type FacultyProfileFieldProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  editable?: boolean;
  options?: string[];
  disabled?: boolean;
  onChange?: (value: string) => void;
};

function FacultyProfileField({
  label,
  value,
  icon,
  editable = false,
  options,
  disabled = false,
  onChange,
}: FacultyProfileFieldProps) {
  return (
    <div className={`student-profile-readonly-field${icon ? ' with-icon' : ''}`}>
      <span>{label}</span>
      {editable && options ? (
        <select
          className="faculty-profile-edit-input faculty-profile-edit-select"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option value={option} key={option}>{option}</option>
          ))}
        </select>
      ) : editable ? (
        <input
          className="faculty-profile-edit-input"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <strong>
          {icon ? <span className="student-profile-field-inline-icon">{icon}</span> : null}
          {value}
        </strong>
      )}
    </div>
  );
}

type FacultyProfileSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function FacultyProfileSection({ title, icon, children }: FacultyProfileSectionProps) {
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

export default function FacultyProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<FacultyProfileView>(emptyProfile);
  const [form, setForm] = useState<FacultyProfileUpdatePayload>(() => getEditableProfile(emptyProfile));
  const [colleges, setColleges] = useState<AdminStructureCollege[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStructureLoading, setIsStructureLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      facultyProfileService.getProfile(),
      academicStructureService.list(),
    ])
      .then(([response, structure]) => {
        if (!mounted) return;
        setProfile(response);
        setForm(getEditableProfile(response));
        setColleges(structure);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load faculty profile.');
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
          setIsStructureLoading(false);
        }
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

  const displayName = profile.full_name || user?.name || 'Faculty User';
  const roleSummary = `Faculty - ${withFallback(profile.faculty_role)}, ${withFallback(profile.department)}`;
  const collegeOptions = useMemo(() => (
    Array.from(new Set([
      ...colleges.map((college) => college.name).filter(Boolean),
      profile.college,
    ].filter(Boolean) as string[]))
  ), [colleges, profile.college]);
  const selectedCollege = useMemo(
    () => colleges.find((college) => college.name === form.college),
    [colleges, form.college],
  );
  const departmentOptions = useMemo(() => (
    Array.from(new Set([
      ...(selectedCollege?.departments.map((department) => department.name).filter(Boolean) ?? []),
      profile.department,
    ].filter(Boolean) as string[]))
  ), [profile.department, selectedCollege]);

  const updateField = (field: keyof FacultyProfileUpdatePayload) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCollegeChange = (value: string) => {
    const nextCollege = colleges.find((college) => college.name === value);
    const nextDepartmentNames = nextCollege?.departments.map((department) => department.name) ?? [];

    setForm((current) => ({
      ...current,
      college: value,
      department: nextDepartmentNames.includes(current.department ?? '') ? current.department : '',
    }));
  };

  const handleEdit = () => {
    setForm(getEditableProfile(profile));
    setError('');
    setSuccessMessage('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(getEditableProfile(profile));
    setError('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const updatedProfile = await facultyProfileService.updateProfile(form);
      setProfile(updatedProfile);
      setForm(getEditableProfile(updatedProfile));
      updateUser({
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        suffix: updatedProfile.suffix,
        name: updatedProfile.full_name,
        email: updatedProfile.email,
      });
      setIsEditing(false);
      setSuccessMessage('Faculty profile updated successfully.');
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;
      setError(
        typeof firstValidationError === 'string'
          ? firstValidationError
          : err?.response?.data?.message || 'Unable to update faculty profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FacultyLayout
      title="Faculty Profile"
      description="Review your faculty information and academic assignment details. Profile updates are managed through VPAA."
    >
      <div className="student-profile-reference-shell">
        {error ? <div className="vpaa-banner-error">{error}</div> : null}
        {successMessage ? <div className="vpaa-banner-success">{successMessage}</div> : null}
        {isLoading ? <div className="vpaa-card vpaa-profile-loading">Loading faculty profile...</div> : null}

        {!isLoading ? (
          <div className="student-profile-reference-grid">
            <aside className="student-profile-identity-card">
              <div className="student-profile-avatar faculty-profile-theme-avatar">{initials || 'FA'}</div>
              <div className="student-profile-identity-copy">
                <h2>{displayName}</h2>
                <p>{roleSummary}</p>
              </div>
              <span className="student-profile-account-badge">Faculty Account</span>
            </aside>

            <section className="student-profile-info-card">
              <div className="faculty-profile-edit-actions">
                {isEditing ? (
                  <>
                    <button type="button" className="faculty-profile-edit-button secondary" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </button>
                    <button type="button" className="faculty-profile-edit-button primary" onClick={() => void handleSave()} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="faculty-profile-edit-button primary" onClick={handleEdit}>
                    Edit Profile
                  </button>
                )}
              </div>

              <FacultyProfileSection title="Basic Information" icon={<UserRound size={16} />}>
                <FacultyProfileField label="First Name" value={isEditing ? form.first_name || '' : withFallback(profile.first_name || user?.first_name)} editable={isEditing} onChange={updateField('first_name')} />
                <FacultyProfileField label="Last Name" value={isEditing ? form.last_name || '' : withFallback(profile.last_name || user?.last_name)} editable={isEditing} onChange={updateField('last_name')} />
                <FacultyProfileField label="Suffix" value={isEditing ? form.suffix || '' : withFallback(profile.suffix || user?.suffix)} editable={isEditing} onChange={updateField('suffix')} />
                <FacultyProfileField label="Email" value={isEditing ? form.email || '' : withFallback(profile.email || user?.email)} editable={isEditing} onChange={updateField('email')} />
              </FacultyProfileSection>

              <FacultyProfileSection title="Account Information" icon={<LockKeyhole size={16} />}>
                <FacultyProfileField label="Faculty ID" value={withFallback(profile.faculty_id)} />
                <FacultyProfileField
                  label="Password"
                  value="Password is hidden for security."
                  icon={<LockKeyhole size={15} />}
                />
              </FacultyProfileSection>

              <FacultyProfileSection title="Faculty Information" icon={<BriefcaseBusiness size={16} />}>
                <FacultyProfileField label="Rank" value={isEditing ? form.rank || '' : withFallback(profile.rank)} editable={isEditing} onChange={updateField('rank')} />
                <FacultyProfileField label="Faculty Role" value={isEditing ? form.faculty_role || '' : withFallback(profile.faculty_role)} editable={isEditing} onChange={updateField('faculty_role')} />
              </FacultyProfileSection>

              <FacultyProfileSection title="Academic Information" icon={<BookOpen size={16} />}>
                <FacultyProfileField
                  label="College"
                  value={isEditing ? form.college || '' : withFallback(profile.college)}
                  editable={isEditing}
                  options={collegeOptions}
                  disabled={isStructureLoading}
                  onChange={handleCollegeChange}
                />
                <FacultyProfileField
                  label="Department"
                  value={isEditing ? form.department || '' : withFallback(profile.department)}
                  editable={isEditing}
                  options={departmentOptions}
                  disabled={isStructureLoading || !form.college}
                  onChange={updateField('department')}
                />
              </FacultyProfileSection>
            </section>
          </div>
        ) : null}
      </div>
    </FacultyLayout>
  );
}
