import AboutArchiveContent from '../../components/info/AboutArchiveContent';

export default function AdminAboutPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-intro">
        <div>
          <h1>About the Thesis <em>Archive</em></h1>
          <p>A shared overview of the archive, its purpose, and the academic value it protects.</p>
        </div>
      </div>

      <AboutArchiveContent />
    </div>
  );
}
