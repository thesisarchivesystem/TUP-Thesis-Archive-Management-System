import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/user.types';
import { authService } from '../services/authService';

// Pages
import Homepage from '../pages/public/Homepage';
// Auth pages
import VpaaSignIn from '../pages/auth/VpaaSignIn';
import FacultySignIn from '../pages/auth/FacultySignIn';
import StudentSignIn from '../pages/auth/StudentSignIn';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
// Dashboard pages
import VpaaDashboard from '../pages/vpaa/VpaaDashboard';
import VpaaCategoriesPage from '../pages/vpaa/VpaaCategoriesPage';
import VpaaActivityLogPage from '../pages/vpaa/VpaaActivityLogPage';
import VpaaMessagesPage from '../pages/vpaa/VpaaMessagesPage';
import VpaaAdviseesPage from '../pages/vpaa/VpaaAdviseesPage';
import VpaaAboutPage from '../pages/vpaa/VpaaAboutPage';
import VpaaSupportPage from '../pages/vpaa/VpaaSupportPage';
import VpaaTermsPage from '../pages/vpaa/VpaaTermsPage';
import VpaaProfilePage from '../pages/vpaa/VpaaProfilePage';
import VpaaThesisDetailsPage from '../pages/vpaa/VpaaThesisDetailsPage';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import FacultyCategoriesPage from '../pages/faculty/FacultyCategoriesPage';
import FacultyMessagesPage from '../pages/faculty/FacultyMessagesPage';
import FacultySupportPage from '../pages/faculty/FacultySupportPage';
import FacultyAboutPage from '../pages/faculty/FacultyAboutPage';
import FacultyFileSharingPage from '../pages/faculty/FacultyFileSharingPage';
import FacultyAllSharedFilesPage from '../pages/faculty/FacultyAllSharedFilesPage';
import FacultyAddThesisPage from '../pages/faculty/FacultyAddThesisPage';
import FacultyMyThesesPage from '../pages/faculty/FacultyMyThesesPage';
import FacultyApprovedThesesPage from '../pages/faculty/FacultyApprovedThesesPage';
import FacultyArchivedThesesPage from '../pages/faculty/FacultyArchivedThesesPage';
import FacultyReviewSubmissionsPage from '../pages/faculty/FacultyReviewSubmissionsPage';
import FacultySubmissionDetailsPage from '../pages/faculty/FacultySubmissionDetailsPage';
import FacultyExtensionRequestDetailsPage from '../pages/faculty/FacultyExtensionRequestDetailsPage';
import FacultySearchResultsPage from '../pages/faculty/FacultySearchResultsPage';
import FacultyActivityLogPage from '../pages/faculty/FacultyActivityLogPage';
import FacultyAdviseesPage from '../pages/faculty/FacultyAdviseesPage';
import FacultyTermsPage from '../pages/faculty/FacultyTermsPage';
import FacultyProfilePage from '../pages/faculty/FacultyProfilePage';
import FacultyThesisDetailsPage from '../pages/faculty/FacultyThesisDetailsPage';
import FacultySharedFileDetailsPage from '../pages/faculty/FacultySharedFileDetailsPage';
import StudentCategoriesPage from '../pages/student/StudentCategoriesPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentMessagesPage from '../pages/student/StudentMessagesPage';
import StudentMySubmissionsPage from '../pages/student/StudentMySubmissionsPage';
import StudentSubmissionDetailsPage from '../pages/student/StudentSubmissionDetailsPage';
import StudentSearchResultsPage from '../pages/student/StudentSearchResultsPage';
import StudentAboutPage from '../pages/student/StudentAboutPage';
import StudentSupportPage from '../pages/student/StudentSupportPage';
import StudentTermsPage from '../pages/student/StudentTermsPage';
import StudentUploadThesisPage from '../pages/student/StudentUploadThesisPage';
import StudentExtensionRequestPage from '../pages/student/StudentExtensionRequestPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentThesisDetailsPage from '../pages/student/StudentThesisDetailsPage';
import VpaaSearchResultsPage from '../pages/vpaa/VpaaSearchResultsPage';
import StudentRecentlyAddedPage from '../pages/student/StudentRecentlyAddedPage';
import StudentTopSearchesPage from '../pages/student/StudentTopSearchesPage';
import StudentAllThesesPage from '../pages/student/StudentAllThesesPage';
import FacultyRecentlyAddedPage from '../pages/faculty/FacultyRecentlyAddedPage';
import FacultyTopSearchesPage from '../pages/faculty/FacultyTopSearchesPage';
import FacultyAllThesesPage from '../pages/faculty/FacultyAllThesesPage';
import VpaaRecentlyAddedPage from '../pages/vpaa/VpaaRecentlyAddedPage';
import VpaaTopSearchesPage from '../pages/vpaa/VpaaTopSearchesPage';
import VpaaAllThesesPage from '../pages/vpaa/VpaaAllThesesPage';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: UserRole[] }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

function AuthSync() {
  const token = useAuthStore((state) => state.token);
  const rememberMe = useAuthStore((state) => state.rememberMe);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!token) return;

    let active = true;

    void authService.getCurrentUser()
      .then((response) => {
        if (!active || !response?.user) return;
        setAuth(response.user, token, rememberMe);
      })
      .catch(() => {
        // Let the API interceptor/logout flow handle invalid sessions.
      });

    return () => {
      active = false;
    };
  }, [rememberMe, setAuth, token]);

  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthSync />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/sign-in/vpaa" element={<VpaaSignIn />} />
        <Route path="/sign-in/faculty" element={<FacultySignIn />} />
        <Route path="/sign-in/student" element={<StudentSignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes - VPAA */}
        <Route path="/vpaa" element={<ProtectedRoute allowedRoles={['vpaa']} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VpaaDashboard />} />
          <Route path="dashboard/recently-added" element={<VpaaRecentlyAddedPage />} />
          <Route path="dashboard/top-searches" element={<VpaaTopSearchesPage />} />
          <Route path="dashboard/all" element={<VpaaAllThesesPage />} />
          <Route path="categories" element={<VpaaCategoriesPage />} />
          <Route path="search" element={<VpaaSearchResultsPage />} />
          <Route path="thesis/:id" element={<VpaaThesisDetailsPage />} />
          <Route path="theses/:id" element={<VpaaThesisDetailsPage />} />
          <Route path="activity-log" element={<VpaaActivityLogPage />} />
          <Route path="messages" element={<VpaaMessagesPage />} />
          <Route path="my-advisees" element={<VpaaAdviseesPage />} />
          <Route path="about" element={<VpaaAboutPage />} />
          <Route path="support" element={<VpaaSupportPage />} />
          <Route path="terms" element={<VpaaTermsPage />} />
          <Route path="profile" element={<VpaaProfilePage />} />
          <Route path="faculty" element={<Navigate to="/vpaa/my-advisees" replace />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Routes - Faculty */}
        <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
          <Route path="dashboard/recently-added" element={<FacultyRecentlyAddedPage />} />
          <Route path="dashboard/top-searches" element={<FacultyTopSearchesPage />} />
          <Route path="dashboard/all" element={<FacultyAllThesesPage />} />
          <Route path="categories" element={<FacultyCategoriesPage />} />
          <Route path="search" element={<FacultySearchResultsPage />} />
          <Route path="thesis/:id" element={<FacultyThesisDetailsPage />} />
          <Route path="theses/:id" element={<FacultyThesisDetailsPage />} />
          <Route path="activity-log" element={<FacultyActivityLogPage />} />
          <Route path="messages" element={<FacultyMessagesPage />} />
          <Route path="profile" element={<FacultyProfilePage />} />
          <Route path="about" element={<FacultyAboutPage />} />
          <Route path="support" element={<FacultySupportPage />} />
          <Route path="terms" element={<FacultyTermsPage />} />
          <Route path="my-advisees" element={<FacultyAdviseesPage />} />
          <Route path="students" element={<FacultyFileSharingPage />} />
          <Route path="students/all" element={<FacultyAllSharedFilesPage />} />
          <Route path="students/:id" element={<FacultySharedFileDetailsPage />} />
          <Route path="manage-thesis/add" element={<FacultyAddThesisPage />} />
          <Route path="my-submissions" element={<FacultyMyThesesPage />} />
          <Route path="manage-thesis/my-thesis" element={<Navigate to="/faculty/my-submissions" replace />} />
          <Route path="manage-thesis/approved" element={<FacultyApprovedThesesPage />} />
          <Route path="manage-thesis/in-archive" element={<FacultyArchivedThesesPage />} />
          <Route path="manage-thesis/review" element={<FacultyReviewSubmissionsPage />} />
          <Route path="manage-thesis/review/:id" element={<FacultySubmissionDetailsPage />} />
          <Route path="manage-thesis/extension-requests/:id" element={<FacultyExtensionRequestDetailsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Routes - Student */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="dashboard/recently-added" element={<StudentRecentlyAddedPage />} />
          <Route path="dashboard/top-searches" element={<StudentTopSearchesPage />} />
          <Route path="dashboard/all" element={<StudentAllThesesPage />} />
          <Route path="categories" element={<StudentCategoriesPage />} />
          <Route path="search" element={<StudentSearchResultsPage />} />
          <Route path="thesis/:id" element={<StudentThesisDetailsPage />} />
          <Route path="theses/:id" element={<StudentThesisDetailsPage />} />
          <Route path="my-submissions" element={<StudentMySubmissionsPage />} />
          <Route path="my-submissions/:id" element={<StudentSubmissionDetailsPage />} />
          <Route path="upload-thesis" element={<StudentUploadThesisPage />} />
          <Route path="extension-request" element={<StudentExtensionRequestPage />} />
          <Route path="messages" element={<StudentMessagesPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="about" element={<StudentAboutPage />} />
          <Route path="support" element={<StudentSupportPage />} />
          <Route path="terms" element={<StudentTermsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
