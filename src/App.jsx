import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { FacilityProvider } from './context/FacilityContext';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import RequireFacility from './components/RequireFacility';
import NurseLayout from './components/NurseLayout';
import FacilityLayout from './components/FacilityLayout';
import ShiftBoard from './pages/ShiftBoard';
import ShiftDetail from './pages/ShiftDetail';
import MyShifts from './pages/MyShifts';
import Profile from './pages/Profile';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin';
import AdminReview from './pages/admin/AdminReview';
import FacilityLogin from './pages/facility/FacilityLogin';
import FacilitySignUp from './pages/facility/FacilitySignUp';
import PostShift from './pages/facility/PostShift';
import FacilityDashboard from './pages/facility/FacilityDashboard';

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <FacilityProvider>
          <BrowserRouter>
            <Routes>
              {/* Admin surface — separate login, not linked from nurse nav */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<RequireAdmin><AdminReview /></RequireAdmin>} />

              {/* Facility surface — own layout, own auth */}
              <Route path="/facility/login" element={<FacilityLogin />} />
              <Route path="/facility/signup" element={<FacilitySignUp />} />
              <Route element={<FacilityLayout />}>
                <Route path="/facility" element={<RequireFacility><FacilityDashboard /></RequireFacility>} />
                <Route path="/facility/post" element={<RequireFacility><PostShift /></RequireFacility>} />
              </Route>

              {/* Nurse-facing surface, shares TopBar via layout route */}
              <Route element={<NurseLayout />}>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<RequireAuth><ShiftBoard /></RequireAuth>} />
                <Route path="/shifts/:shiftId" element={<RequireAuth><ShiftDetail /></RequireAuth>} />
                <Route path="/my-shifts" element={<RequireAuth><MyShifts /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </FacilityProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
