import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import FacultyLayout from '../../components/faculty/FacultyLayout';
import ThesisArchiveCover from '../../components/thesis/ThesisArchiveCover';
import { facultyLibraryService, type FacultyLibraryItem } from '../../services/facultyLibraryService';

const truncateTitle = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;

export default function FacultyAllSharedFilesPage() {
  const [libraryItems, setLibraryItems] = useState<FacultyLibraryItem[]>([]);
  const [libraryDepartment, setLibraryDepartment] = useState('');
  const [libraryCollege, setLibraryCollege] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    void facultyLibraryService.getLibrary()
      .then((response) => {
        if (!isMounted) return;
        setLibraryDepartment(response.department);
        setLibraryCollege(response.college ?? '');
        setLibraryItems(response.items);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load shared files right now.');
      })
      .finally(() => {
        if (isMounted) setLibraryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <FacultyLayout
      title="All Shared Files"
      description="Browse the full department shared files library."
      hidePageIntro
    >
      <div className="student-submission-details-shell">
        <div className="student-submission-details-topbar faculty-shared-files-topbar">
          <Link to="/faculty/students" className="student-submission-back-link faculty-shared-files-back-link">
            <ArrowLeft size={16} />
            <span>Back to Shared Files</span>
          </Link>
        </div>

        {error ? <div className="vpaa-banner-error">{error}</div> : null}

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(139,35,50,0.08)] text-[var(--maroon)]">
                <BookOpen size={20} />
              </span>
              <div>
                <h2 className="mb-0 text-xl text-text-primary" style={{ fontFamily: 'DM Serif Display, serif' }}>All Shared Files</h2>
                <p className="text-sm text-text-secondary">{libraryDepartment}{libraryCollege ? `, ${libraryCollege}` : ''}</p>
              </div>
            </div>
          </div>

          <div className="faculty-shared-files-grid faculty-shared-files-grid-full">
            {libraryLoading ? (
              <div className="faculty-shared-files-empty rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary">
                Loading shared files...
              </div>
            ) : null}

            {!libraryLoading && !libraryItems.length ? (
              <div className="faculty-shared-files-empty rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-10 text-center text-text-secondary">
                No shared files are available yet.
              </div>
            ) : null}

            {libraryItems.map((item) => (
              <Link
                key={item.id}
                to={`/faculty/students/${encodeURIComponent(item.id)}`}
                state={{ file: item }}
                className="faculty-shared-file-card"
              >
                <ThesisArchiveCover
                  className="faculty-shared-file-cover"
                  compact
                  title={truncateTitle(item.title, 18)}
                  college={item.college}
                  department={item.department || 'Faculty Library'}
                  author={item.author || item.authors?.filter(Boolean).join(', ') || 'Unknown author'}
                  authors={item.authors ?? undefined}
                  year={item.year || item.school_year || ''}
                  categories={item.categories?.length
                    ? item.categories
                    : (item.keywords?.length
                      ? item.keywords
                      : [item.category, item.type, item.program]
                    )
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((tag, index) => ({ id: `${item.id}-tag-${index}`, name: String(tag) }))}
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </FacultyLayout>
  );
}
