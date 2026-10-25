import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import CallModal from './components/CallModal';
import AdminLayout from './components/AdminLayout';
import AdminShell from './components/AdminShell';
import InstallPrompt from './components/InstallPrompt';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { FacilityProvider } from './context/FacilityContext';
import { CallProvider } from './context/CallContext';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import RequireOwner from './components/RequireOwner';
import RequireFacility from './components/RequireFacility';
import NurseLayout from './components/NurseLayout';
import FacilityLayout from './components/FacilityLayout';
import Home from './pages/Home';
import Earnings from './pages/Earnings';
import ShiftBoard from './pages/ShiftBoard';
import ShiftDetail from './pages/ShiftDetail';
import MyShifts from './pages/MyShifts';
import Profile from './pages/Profile';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Messages from './pages/Messages';
import ChatThread from './pages/ChatThread';
import NurseDirectory from './pages/NurseDirectory';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNurses from './pages/admin/AdminNurses';
import AdminShifts from './pages/admin/AdminShifts';
import AdminReview from './pages/admin/AdminReview';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminFacilities from './pages/admin/AdminFacilities';
import AdminFacilityDetail from './pages/admin/AdminFacilityDetail';
import AdminFacilityImport from './pages/admin/AdminFacilityImport';
import PostShift from './pages/facility/PostShift';
import FacilityDashboard from './pages/facility/FacilityDashboard';
import FacilityHome from './pages/facility/FacilityHome';

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <FacilityProvider>
          <CallProvider>
            <BrowserRouter>
              <CallModal />
              <InstallPrompt />
              <Routes>
                {/* Admin surface — signs in through the shared /login page */}
                <Route element={<AdminShell />}>
                  <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                  <Route path="/admin/settings" element={<ErrorBoundary><RequireAdmin><RequireOwner><AdminSettings /></RequireOwner></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin" element={<ErrorBoundary><RequireAdmin><AdminDashboard /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/nurses" element={<ErrorBoundary><RequireAdmin><AdminNurses /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/shifts" element={<ErrorBoundary><RequireAdmin><AdminShifts /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/review" element={<ErrorBoundary><RequireAdmin><AdminReview /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/disputes" element={<ErrorBoundary><RequireAdmin><AdminDisputes /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/facilities" element={<ErrorBoundary><RequireAdmin><AdminFacilities /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/facilities/import" element={<ErrorBoundary><RequireAdmin><AdminFacilityImport /></RequireAdmin></ErrorBoundary>} />
                  <Route path="/admin/facilities/:facilityId" element={<ErrorBoundary><RequireAdmin><AdminFacilityDetail /></RequireAdmin></ErrorBoundary>} />
                </Route>

                {/* Facility surface — own layout, signs in through the shared /login page */}
                <Route element={<AdminLayout label="for facilities" />}>
                  <Route path="/facility/login" element={<Navigate to="/login" replace />} />
                  <Route path="/facility/signup" element={<Navigate to="/signup?role=facility" replace />} />
                </Route>
                <Route element={<FacilityLayout />}>
                  <Route path="/facility" element={<RequireFacility><FacilityHome /></RequireFacility>} />
                  <Route path="/facility/claims" element={<RequireFacility><FacilityDashboard /></RequireFacility>} />
                  <Route path="/facility/post" element={<RequireFacility><PostShift /></RequireFacility>} />
                  <Route path="/facility/messages" element={<RequireFacility><Messages /></RequireFacility>} />
                  <Route path="/facility/messages/:conversationId" element={<RequireFacility><ChatThread /></RequireFacility>} />
                </Route>

                {/* Nurse-facing surface, shares TopBar via layout route */}
                <Route element={<NurseLayout />}>
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/shifts" element={<RequireAuth><ShiftBoard /></RequireAuth>} />
                  <Route path="/earnings" element={<RequireAuth><Earnings /></RequireAuth>} />
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
