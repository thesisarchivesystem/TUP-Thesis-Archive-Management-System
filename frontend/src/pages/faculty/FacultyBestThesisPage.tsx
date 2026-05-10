import axios from 'axios';
import { Archive, CalendarDays, Eye, History, Info, RefreshCw, Shield, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import tamsBot from '../../assets/tams-bot.png';
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

const resolveSelectedThesisId = (response: FacultyBestThesisResponse): string => {
  const currentAwardThesisId = response.current_award?.thesis.id;
  const hasCurrentAwardInChoices = Boolean(
    currentAwardThesisId && response.candidates.some((candidate) => candidate.id === currentAwardThesisId),
  );

  return hasCurrentAwardInChoices ? currentAwardThesisId ?? '' : response.candidates[0]?.id ?? '';
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
    setSelectedThesisId(resolveSelectedThesisId(response));
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
        setSelectedThesisId(resolveSelectedThesisId(response));
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
      const award = await facultyBestThesisService.appointBestThesis({
        school_year: selectedSchoolYear,
        thesis_id: selectedThesisId,
      });
      setData((current) => current ? {
        ...current,
        current_award: award,
        history: [
          award,
          ...current.history.filter((historyAward) => historyAward.id !== award.id),
        ].sort((first, second) => {
          const yearCompare = second.school_year.localeCompare(first.school_year);
          if (yearCompare !== 0) return yearCompare;
          return new Date(second.awarded_at ?? 0).getTime() - new Date(first.awarded_at ?? 0).getTime();
        }),
      } : current);
      await loadBestThesis(selectedSchoolYear);
      setSuccess('Best Thesis appointed successfully.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Unable to appoint Best Thesis right now.'));
    } finally {
      setSaving(false);
    }
  };

  const candidateLabel = (candidate: FacultyBestThesisCandidate) =>
    candidate.title;

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

            <div className="faculty-best-thesis-overview-grid">
              <label className="faculty-best-thesis-field">
                <span><CalendarDays size={14} /> School Year</span>
                <select value={selectedSchoolYear} onChange={(event) => void handleSchoolYearChange(event.target.value)}>
                  {schoolYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>

              <div className="faculty-best-thesis-status-wrap">
                <span className="faculty-best-thesis-label"><Info size={14} /> Current Status</span>
                <div className="faculty-best-thesis-status-card">
                  <p>
                    {currentAward?.thesis
                      ? `"${currentAward.thesis.title}" is appointed as Best Thesis for ${selectedSchoolYear}.`
                      : 'No thesis is appointed as Best Thesis for the selected school year.'}
                  </p>
                  <span className={`faculty-best-thesis-status ${currentAward ? 'appointed' : 'pending'}`}>
                    {currentAward ? 'Appointed' : 'Not Appointed'}
                  </span>
                </div>
              </div>
            </div>

            <div className="faculty-best-thesis-appointment-section">
              <div className="faculty-best-thesis-appointment-grid">
                <div className="faculty-best-thesis-appointment-card">
                  <h3><Archive size={17} /> Appointment</h3>
                  <p>Select an eligible thesis to appoint as Best Thesis for School Year {selectedSchoolYear}.</p>

                  <label className="faculty-best-thesis-field">
                    <span>Eligible Thesis</span>
                    <select value={selectedThesisId} onChange={(event) => setSelectedThesisId(event.target.value)}>
                      {data?.candidates.length ? data.candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>{candidateLabel(candidate)}</option>
                      )) : <option value="">No eligible thesis found</option>}
                    </select>
                  </label>

                  <div className="faculty-best-thesis-actions">
                    <button
                      type="button"
                      className="faculty-best-thesis-appoint-btn"
                      onClick={() => void appoint()}
                      disabled={saving || !selectedCandidate || isCurrentSelection}
                    >
                      <RefreshCw size={17} />
                      <span>{saving ? 'Saving...' : currentAward ? 'Change Best Thesis' : 'Appoint Best Thesis'}</span>
                    </button>

                    {currentAward?.thesis ? (
                      <Link
                        className="faculty-best-thesis-view-btn"
                        to={`/faculty/theses/${encodeURIComponent(currentAward.thesis.id)}`}
                        state={{ thesis: currentAward.thesis }}
                      >
                        <Eye size={16} />
                        <span>View Current Appointment</span>
                      </Link>
                    ) : (
                      <span className="faculty-best-thesis-view-btn disabled">
                        <Eye size={16} />
                        <span>View Current Appointment</span>
                      </span>
                    )}
                  </div>

                  <div className="faculty-best-thesis-inline-note">
                    <Info size={15} />
                    <span>
                      {currentAward
                        ? `Selecting a new thesis will replace the current Best Thesis for School Year ${selectedSchoolYear}.`
                        : `The selected thesis will become the Best Thesis for School Year ${selectedSchoolYear}.`}
                    </span>
                  </div>
                </div>

                <div className="faculty-best-thesis-current-card">
                  <div className="faculty-best-thesis-current-head">
                    <span className="faculty-best-thesis-appoint-icon"><Star size={24} /></span>
                    <div>
                      <h3>Current Appointment</h3>
                      <p>
                        {currentAward
                          ? 'This thesis is currently appointed as the Best Thesis.'
                          : 'No thesis is currently appointed for this school year.'}
                      </p>
                    </div>
                  </div>

                  <div className="faculty-best-thesis-current-details">
                    <strong>{currentAward?.thesis.title ? `"${currentAward.thesis.title}"` : 'No Best Thesis Yet'}</strong>
                    <span>{currentAward?.thesis.author ?? 'Choose an eligible thesis to begin.'}</span>
                    <span>{currentAward?.thesis.program ?? currentAward?.thesis.department ?? 'Program not specified'}</span>
                    <small>School Year</small>
                    <b>{selectedSchoolYear}</b>
                  </div>

                  <div className="faculty-best-thesis-inline-note">
                    <Info size={15} />
                    <span>You can change the Best Thesis at any time for this school year.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="faculty-best-thesis-notes">
              <p><Shield size={25} /> <span><strong>One Best Thesis at a time</strong> Only one thesis can be appointed as the Best Thesis for each school year.</span></p>
              <p><RefreshCw size={25} /> <span><strong>Replace anytime</strong> You can update or replace the appointed thesis at any time.</span></p>
            </div>
          </section>

          <section className="faculty-best-thesis-history-card">
            <div className="faculty-best-thesis-history-head">
              <span className="faculty-best-thesis-history-icon"><History size={22} /></span>
              <div>
                <h2>Best Thesis History</h2>
                <p>Track the appointment history for your theses.</p>
              </div>
            </div>

            <div className="faculty-best-thesis-table-wrap">
              <table className="faculty-best-thesis-table">
                <thead>
                  <tr>
                    <th>School Year</th>
                    <th>Title</th>
                    <th>Authors</th>
                    <th>Adviser</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.history.length ? data.history.map((award) => (
                    <tr key={award.id}>
                      <td>{award.school_year}</td>
                      <td>{award.thesis.title}</td>
                      <td>{award.thesis.author || 'Unknown author'}</td>
                      <td>{award.thesis.adviser_name || 'No adviser listed'}</td>
                      <td><span className="faculty-best-thesis-status appointed">Appointed</span></td>
                      <td>{formatDate(award.awarded_at)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="faculty-best-thesis-empty">
                          <History size={34} />
                          <strong>No history records yet.</strong>
                          <span>This thesis has no appointment history.</span>
                          <img src={tamsBot} alt="" aria-hidden="true" />
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
