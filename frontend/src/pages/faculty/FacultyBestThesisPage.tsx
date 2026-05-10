import axios from 'axios';
import { Archive, CalendarDays, History, Info, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import SectionLoadingScreen from '../../components/SectionLoadingScreen';
import {
  facultyBestThesisService,
  type FacultyBestThesisCandidate,
  type FacultyBestThesisResponse,
} from '../../services/facultyBestThesisService';

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; error?: string; errors?: Record<string, string[] | string> } | undefined;
    if (responseData?.message) return responseData.message;
    if (responseData?.error) return responseData.error;
    const firstFieldError = responseData?.errors ? Object.values(responseData.errors).flat().find(Boolean) : null;
    if (typeof firstFieldError === 'string') return firstFieldError;
  }

  return error instanceof Error && error.message ? error.message : fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FacultyBestThesisPage() {
  const [data, setData] = useState<FacultyBestThesisResponse | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [selectedThesisId, setSelectedThesisId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBestThesis = async (schoolYear?: string) => {
    const response = await facultyBestThesisService.getBestTheses({ school_year: schoolYear });
    setData(response);
    setSelectedSchoolYear(response.selected_school_year);
    setSelectedThesisId(response.current_award?.thesis.id ?? response.candidates[0]?.id ?? '');
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void facultyBestThesisService.getBestTheses()
      .then((response) => {
        if (!active) return;
        setData(response);
        setSelectedSchoolYear(response.selected_school_year);
        setSelectedThesisId(response.current_award?.thesis.id ?? response.candidates[0]?.id ?? '');
      })
      .catch((err) => {
        if (!active) return;
        setError(extractApiErrorMessage(err, 'Unable to load Best Thesis records.'));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  const schoolYears = useMemo(() => {
    const currentYear = String(new Date().getFullYear());
    return Array.from(new Set([...(data?.school_years ?? []), selectedSchoolYear || currentYear].filter(Boolean)));
  }, [data?.school_years, selectedSchoolYear]);

  const selectedCandidate = useMemo(
    () => data?.candidates.find((candidate) => candidate.id === selectedThesisId) ?? null,
    [data?.candidates, selectedThesisId],
  );

  const currentAward = data?.current_award ?? null;
  const isCurrentSelection = Boolean(currentAward?.thesis.id && currentAward.thesis.id === selectedThesisId);

  const handleSchoolYearChange = async (schoolYear: string) => {
    setSelectedSchoolYear(schoolYear);
    setSelectedThesisId('');
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await loadBestThesis(schoolYear);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Unable to load records for this school year.'));
    } finally {
      setLoading(false);
    }
  };

  const appoint = async () => {
    if (!selectedSchoolYear || !selectedThesisId) {
      setError('Choose a school year and thesis first.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await facultyBestThesisService.appointBestThesis({
        school_year: selectedSchoolYear,
        thesis_id: selectedThesisId,
      });
      await loadBestThesis(selectedSchoolYear);
      setSuccess('Best Thesis appointed successfully.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Unable to appoint Best Thesis right now.'));
    } finally {
      setSaving(false);
    }
  };

  const candidateLabel = (candidate: FacultyBestThesisCandidate) =>
    `${candidate.title} - ${candidate.author}`;

  return (
    <FacultyLayout
      title="Best Thesis"
      description="Manage Best Thesis appointments for your archived approved theses."
    >
      {loading && !data ? (
        <SectionLoadingScreen label="Loading Best Thesis feature..." />
      ) : (
        <div className="faculty-best-thesis-page">
          {error ? <div className="vpaa-banner-error">{error}</div> : null}
          {success ? <div className="vpaa-banner-success">{success}</div> : null}

          <section className="faculty-best-thesis-feature-card">
            <div className="faculty-best-thesis-feature-head">
              <span className="faculty-best-thesis-icon"><Star size={26} /></span>
              <div>
                <h2>Best Thesis Feature</h2>
                <p>Manage the best thesis appointment for this school year.</p>
              </div>
            </div>

            <label className="faculty-best-thesis-field">
              <span><CalendarDays size={14} /> School Year</span>
              <select value={selectedSchoolYear} onChange={(event) => void handleSchoolYearChange(event.target.value)}>
                {schoolYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>

            <div className="faculty-best-thesis-status-card">
              <div className="faculty-best-thesis-card-head">
                <h3>Current Status</h3>
                <span className={`faculty-best-thesis-status ${currentAward ? 'appointed' : 'pending'}`}>
                  {currentAward ? 'Appointed' : 'Not Appointed'}
                </span>
              </div>
              <p>
                {currentAward?.thesis
                  ? `"${currentAward.thesis.title}" is appointed as Best Thesis for ${selectedSchoolYear}.`
                  : 'No thesis is appointed as Best Thesis for the selected school year.'}
              </p>
            </div>

            <div className="faculty-best-thesis-appointment-card">
              <h3>Appointment</h3>
              <label className="faculty-best-thesis-field">
                <span><Archive size={14} /> Eligible Thesis</span>
                <select value={selectedThesisId} onChange={(event) => setSelectedThesisId(event.target.value)}>
                  {data?.candidates.length ? data.candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>{candidateLabel(candidate)}</option>
                  )) : <option value="">No eligible thesis found</option>}
                </select>
              </label>
              <button
                type="button"
                className="faculty-best-thesis-appoint-btn"
                onClick={() => void appoint()}
                disabled={saving || !selectedCandidate || isCurrentSelection}
              >
                <Star size={17} />
                <span>{saving ? 'Appointing...' : isCurrentSelection ? 'Already Appointed' : 'Appoint as Best Thesis'}</span>
              </button>
            </div>

            <div className="faculty-best-thesis-notes">
              <p><Info size={15} /> Only one thesis can be appointed as the Best Thesis for each school year.</p>
              <p><Info size={15} /> Once appointed, it will be highlighted in the Best Thesis records and dashboard carousel.</p>
            </div>
          </section>

          <section className="faculty-best-thesis-history-card">
            <div className="faculty-best-thesis-history-head">
              <h2>Best Thesis History</h2>
              <p>Track the appointment history for your theses.</p>
            </div>

            <div className="faculty-best-thesis-table-wrap">
              <table className="faculty-best-thesis-table">
                <thead>
                  <tr>
                    <th>School Year</th>
                    <th>Status</th>
                    <th>Awarded By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.history.length ? data.history.map((award) => (
                    <tr key={award.id}>
                      <td>
                        <strong>{award.school_year}</strong>
                        <span>{award.thesis.title}</span>
                      </td>
                      <td><span className="faculty-best-thesis-status appointed">Appointed</span></td>
                      <td>{award.awarded_by_name || 'Faculty'}</td>
                      <td>{formatDate(award.awarded_at)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4}>
                        <div className="faculty-best-thesis-empty">
                          <History size={34} />
                          <strong>No history records yet.</strong>
                          <span>This thesis has no appointment history.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </FacultyLayout>
  );
}
