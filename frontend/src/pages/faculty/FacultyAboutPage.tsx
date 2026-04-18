import FacultyLayout from '../../components/faculty/FacultyLayout';
import AboutArchiveContent from '../../components/info/AboutArchiveContent';

export default function FacultyAboutPage() {
  return (
    <FacultyLayout
      title="About the Thesis Archive"
      description="A shared overview of the archive, its purpose, and the academic value it protects."
    >
      <AboutArchiveContent />
    </FacultyLayout>
  );
}
