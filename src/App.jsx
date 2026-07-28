import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import CallModal from './components/CallModal';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { FacilityProvider } from './context/FacilityContext';
import { CallProvider } from './context/CallContext';
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
import Messages from './pages/Messages';
import ChatThread from './pages/ChatThread';
import NurseDirectory from './pages/NurseDirectory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReview from './pages/admin/AdminReview';
import AdminFacilities from './pages/admin/AdminFacilities';
import AdminFacilityDetail from './pages/admin/AdminFacilityDetail';
import AdminFacilityImport from './pages/admin/AdminFacilityImport';
import FacilityLogin from './pages/facility/FacilityLogin';
import FacilitySignUp from './pages/facility/FacilitySignUp';
import PostShift from './pages/facility/PostShift';
import FacilityDashboard from './pages/facility/FacilityDashboard';

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <FacilityProvider>
          <CallProvider>
            <BrowserRouter>
              <CallModal />
              <Routes>
                {/* Admin surface — separate login, not linked from nurse nav */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ErrorBoundary><RequireAdmin><AdminDashboard /></RequireAdmin></ErrorBoundary>} />
                <Route path="/admin/review" element={<ErrorBoundary><RequireAdmin><AdminReview /></RequireAdmin></ErrorBoundary>} />
                <Route path="/admin/facilities" element={<ErrorBoundary><RequireAdmin><AdminFacilities /></RequireAdmin></ErrorBoundary>} />
                <Route path="/admin/facilities/import" element={<ErrorBoundary><RequireAdmin><AdminFacilityImport /></RequireAdmin></ErrorBoundary>} />
                <Route path="/admin/facilities/:facilityId" element={<ErrorBoundary><RequireAdmin><AdminFacilityDetail /></RequireAdmin></ErrorBoundary>} />

                {/* Facility surface — own layout, own auth */}
                <Route path="/facility/login" element={<FacilityLogin />} />
                <Route path="/facility/signup" element={<FacilitySignUp />} />
                <Route element={<FacilityLayout />}>
                  <Route path="/facility" element={<RequireFacility><FacilityDashboard /></RequireFacility>} />
                  <Route path="/facility/post" element={<RequireFacility><PostShift /></RequireFacility>} />
                  <Route path="/facility/messages" element={<RequireFacility><Messages /></RequireFacility>} />
                  <Route path="/facility/messages/:conversationId" element={<RequireFacility><ChatThread /></RequireFacility>} />
                </Route>

                {/* Nurse-facing surface, shares TopBar via layout route */}
                <Route element={<NurseLayout />}>
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<RequireAuth><ShiftBoard /></RequireAuth>} />
                  <Route path="/shifts/:shiftId" element={<RequireAuth><ShiftDetail /></RequireAuth>} />
                  <Route path="/my-shifts" element={<RequireAuth><MyShifts /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
                  <Route path="/messages/:conversationId" element={<RequireAuth><ChatThread /></RequireAuth>} />
                  <Route path="/nurses" element={<RequireAuth><NurseDirectory /></RequireAuth>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CallProvider>
        </FacilityProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
