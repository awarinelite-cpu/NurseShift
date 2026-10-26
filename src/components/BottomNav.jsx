import { NavLink } from 'react-router-dom';
import Icon from './ns/Icon';

export const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/shifts', label: 'Shifts', icon: 'calendar' },
  { to: '/earnings', label: 'Earnings', icon: 'wallet' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export default function BottomNav() {
  return (
    <nav className="ns-nav" aria-label="Main">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `ns-tab${isActive ? ' active' : ''}`}>
          <Icon name={t.icon} size={22} strokeWidth={1.9} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
