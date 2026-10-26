import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav, { TABS as NURSE_TABS } from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import ErrorBoundary from './ErrorBoundary';
import Icon from './ns/Icon';

// Screens that sit inside the app but are not one of the four tabs get a slim back bar.
const SUBBAR_TITLES = { '/messages': 'Messages', '/nurses': 'Nurse Directory' };

export default function NurseLayout() {
  const { nurse, isDemo, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onDetail = /^\/shifts\/[^/]+$/.test(pathname);
  const onThread = /^\/messages\/[^/]+$/.test(pathname);
  const showNav = Boolean(nurse) && !onDetail && !onThread;
  const subTitle = nurse ? SUBBAR_TITLES[pathname] : null;
  const showDemo = isDemo && (nurse || pathname !== '/');

  return (
    <div className={`ns-stage${nurse ? ' ns-has-side' : ''}`}>
      {nurse && (
        <DesktopSidebar
          tabs={NURSE_TABS}
          extra={[{ to: '/messages', label: 'Messages', icon: 'message' }, { to: '/nurses', label: 'Nurse Directory', icon: 'user' }]}
          label="Duty Board"
          user={nurse?.name}
          onSignOut={signOut}
        />
      )}
      <div className="ns-app">
        {showDemo && (
          <div className="ns-demo">Demo mode: sign-up and login use local sample data. Add your Firebase config in src/lib/firebase.js to go live.</div>
        )}
        {subTitle && (
          <header className="ns-subbar">
            <button type="button" className="ns-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
              <Icon name="back" size={20} />
            </button>
            <h1>{subTitle}</h1>
          </header>
        )}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
