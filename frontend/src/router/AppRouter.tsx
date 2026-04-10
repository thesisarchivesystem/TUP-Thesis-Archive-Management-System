import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/user.types';

// Pages
import Homepage from '../pages/public/Homepage';
// Auth pages
import VpaaSignIn from '../pages/auth/VpaaSignIn';
import FacultySignIn from '../pages/auth/FacultySignIn';
import StudentSignIn from '../pages/auth/StudentSignIn';
// Dashboard pages
import VpaaDashboard from '../pages/vpaa/VpaaDashboard';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import StudentDashboard from '../pages/student/StudentDashboard';

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

        {/* Protected Routes - VPAA */}
        <Route element={<ProtectedRoute allowedRoles={['vpaa']} />}>
          <Route path="/vpaa/dashboard" element={<VpaaDashboard />} />
          <Route path="/vpaa/*" element={<Navigate to="/vpaa/dashboard" replace />} />
        </Route>

        {/* Protected Routes - Faculty */}
        <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty/*" element={<Navigate to="/faculty/dashboard" replace />} />
        </Route>

        {/* Protected Routes - Student */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
