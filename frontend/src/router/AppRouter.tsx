import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/user.types';

// Pages
import Homepage from '../pages/public/Homepage';
// Auth pages
import VpaaSignIn from '../pages/auth/VpaaSignIn';
import FacultySignIn from '../pages/auth/FacultySignIn';
import StudentSignIn from '../pages/auth/StudentSignIn';
import ForgotPassword from '../pages/auth/ForgotPassword';
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
import VpaaSettingsPage from '../pages/vpaa/VpaaSettingsPage';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import FacultyCategoriesPage from '../pages/faculty/FacultyCategoriesPage';
import FacultyMessagesPage from '../pages/faculty/FacultyMessagesPage';
import FacultySupportPage from '../pages/faculty/FacultySupportPage';
import FacultyAboutPage from '../pages/faculty/FacultyAboutPage';
import FacultyFileSharingPage from '../pages/faculty/FacultyFileSharingPage';
import FacultyAddThesisPage from '../pages/faculty/FacultyAddThesisPage';
import FacultyApprovedThesesPage from '../pages/faculty/FacultyApprovedThesesPage';
import FacultyReviewSubmissionsPage from '../pages/faculty/FacultyReviewSubmissionsPage';
import FacultyActivityLogPage from '../pages/faculty/FacultyActivityLogPage';
import FacultyAdviseesPage from '../pages/faculty/FacultyAdviseesPage';
import FacultyTermsPage from '../pages/faculty/FacultyTermsPage';
import FacultyProfilePage from '../pages/faculty/FacultyProfilePage';
import FacultySettingsPage from '../pages/faculty/FacultySettingsPage';
import StudentCategoriesPage from '../pages/student/StudentCategoriesPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentMessagesPage from '../pages/student/StudentMessagesPage';
import StudentSupportPage from '../pages/student/StudentSupportPage';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: UserRole[] }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/sign-in/vpaa" element={<VpaaSignIn />} />
        <Route path="/sign-in/faculty" element={<FacultySignIn />} />
        <Route path="/sign-in/student" element={<StudentSignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes - VPAA */}
        <Route element={<ProtectedRoute allowedRoles={['vpaa']} />}>
          <Route path="/vpaa/dashboard" element={<VpaaDashboard />} />
          <Route path="/vpaa/categories" element={<VpaaCategoriesPage />} />
          <Route path="/vpaa/activity-log" element={<VpaaActivityLogPage />} />
          <Route path="/vpaa/messages" element={<VpaaMessagesPage />} />
          <Route path="/vpaa/my-advisees" element={<VpaaAdviseesPage />} />
          <Route path="/vpaa/about" element={<VpaaAboutPage />} />
          <Route path="/vpaa/support" element={<VpaaSupportPage />} />
          <Route path="/vpaa/terms" element={<VpaaTermsPage />} />
          <Route path="/vpaa/profile" element={<VpaaProfilePage />} />
          <Route path="/vpaa/settings" element={<VpaaSettingsPage />} />
          <Route path="/vpaa/faculty" element={<Navigate to="/vpaa/my-advisees" replace />} />
          <Route path="/vpaa/*" element={<Navigate to="/vpaa/dashboard" replace />} />
        </Route>

        {/* Protected Routes - Faculty */}
        <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty/categories" element={<FacultyCategoriesPage />} />
          <Route path="/faculty/activity-log" element={<FacultyActivityLogPage />} />
          <Route path="/faculty/messages" element={<FacultyMessagesPage />} />
          <Route path="/faculty/profile" element={<FacultyProfilePage />} />
          <Route path="/faculty/settings" element={<FacultySettingsPage />} />
          <Route path="/faculty/about" element={<FacultyAboutPage />} />
          <Route path="/faculty/support" element={<FacultySupportPage />} />
          <Route path="/faculty/terms" element={<FacultyTermsPage />} />
          <Route path="/faculty/my-advisees" element={<FacultyAdviseesPage />} />
          <Route path="/faculty/students" element={<FacultyFileSharingPage />} />
          <Route path="/faculty/manage-thesis/add" element={<FacultyAddThesisPage />} />
          <Route path="/faculty/manage-thesis/approved" element={<FacultyApprovedThesesPage />} />
          <Route path="/faculty/manage-thesis/review" element={<FacultyReviewSubmissionsPage />} />
          <Route path="/faculty/*" element={<Navigate to="/faculty/dashboard" replace />} />
        </Route>

        {/* Protected Routes - Student */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/categories" element={<StudentCategoriesPage />} />
          <Route path="/student/messages" element={<StudentMessagesPage />} />
          <Route path="/student/support" element={<StudentSupportPage />} />
          <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
