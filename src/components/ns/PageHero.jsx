import Icon from './Icon';
import { useAdmin } from '../../context/AdminContext';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

// Display-only header used by the admin list screens. It holds no state and
// triggers nothing. `full` gives the same banner and big gradient tiles as the
// dashboard; the default is the compact version.
export default function PageHero({ title, subtitle, tiles = [], full = false }) {
  const { admin } = useAdmin();
  const displayName = admin?.name || admin?.email?.split('@')[0] || 'Admin';

  if (full) {
    return (
      <>
        <header className="nsd-hero">
          <div className="nsd-top">
            <div className="nsd-brand">
              <Icon name="logo" size={40} strokeWidth={1.8} className="nsd-logo" />
              <div>
                <strong>Nurse<span>Shift</span></strong>
                <small>Flexible Shifts. Healthier Communities.</small>
              </div>
            </div>
            <div className="nsd-top-right">
              <span className="nsd-bell" aria-hidden="true"><Icon name="bell" size={24} /></span>
              <span className="nsd-avatar" aria-hidden="true">{initials(admin?.name || displayName)}</span>
            </div>
          </div>
          <div className="nsd-page-title nsd-page-title-lg">
            <h1>{title}</h1>
            {subtitle && <small>{subtitle}</small>}
          </div>
        </header>
        {tiles.length > 0 && (
          <div className="nsd-stats">
            {tiles.map((t) => (
              <div className={`nsd-stat ${t.tone}`} key={t.label}>
                <span className="nsd-stat-icon"><Icon name={t.icon} size={22} strokeWidth={2.2} /></span>
                <small>{t.label}</small>
                <strong>{t.value}</strong>
                <span className="nsd-stat-foot">
                  {t.ring && <i className="nsd-ring" aria-hidden="true" />}
                  <em>{t.foot}</em>
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <header className="nsd-hero nsd-hero-compact">
      <div className="nsd-top">
        <div className="nsd-brand">
          <Icon name="logo" size={30} strokeWidth={1.8} className="nsd-logo" />
          <strong>Nurse<span>Shift</span></strong>
        </div>
      </div>
      <div className="nsd-page-title">
        <h1>{title}</h1>
        {subtitle && <small>{subtitle}</small>}
      </div>
      {tiles.length > 0 && (
        <div className="nsd-mini-row">
          {tiles.map((t) => (
            <div className={`nsd-mini ${t.tone}`} key={t.label}>
              <span className="nsd-mini-icon"><Icon name={t.icon} size={16} strokeWidth={2.2} /></span>
              <strong>{t.value}</strong>
              <small>{t.label}</small>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
