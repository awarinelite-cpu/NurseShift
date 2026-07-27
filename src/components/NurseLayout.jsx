import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

export default function NurseLayout() {
  return (
    <div className="app-shell">
      <TopBar />
      <Outlet />
    </div>
  );
}
