import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import ErrorBoundary from './ErrorBoundary';

export default function NurseLayout() {
  return (
    <div className="app-shell">
      <TopBar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
