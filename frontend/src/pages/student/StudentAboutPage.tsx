import AboutArchiveContent from '../../components/info/AboutArchiveContent';
import StudentLayout from '../../components/student/StudentLayout';

export default function StudentAboutPage() {
  return (
    <StudentLayout
      title="About the Thesis Archive"
      description="A shared overview of the archive, its purpose, and the academic value it protects."
    >
      <AboutArchiveContent />
    </StudentLayout>
  );
}
