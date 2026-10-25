import Icon from './Icon';

// Display-only header used by the admin list screens: brand row, page title and
// a row of summary tiles. It holds no state and triggers nothing.
export default function PageHero({ title, subtitle, tiles = [] }) {
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
