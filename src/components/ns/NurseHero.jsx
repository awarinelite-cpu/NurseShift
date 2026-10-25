import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

// Display-only banner for the nurse screens. `onBack` is the same handler the
// old top bar used; pass back={false} on the tab screens that had no back button.
export default function NurseHero({ title, subtitle, back = true, onBack, right = null, tiles = [], children = null }) {
  const navigate = useNavigate();
  return (
    <header className="nsd-hero nsd-hero-compact">
      <div className="nsd-top">
        <div className="nsd-top-left">
          {back && (
            <button type="button" className="nsd-back" onClick={onBack ?? (() => navigate(-1))} aria-label="Back">
              <Icon name="back" size={22} />
            </button>
          )}
          <div className="nsd-brand">
            <Icon name="logo" size={30} strokeWidth={1.8} className="nsd-logo" />
            <strong>Nurse<span>Shift</span></strong>
          </div>
        </div>
        {right}
      </div>
      {title && (
        <div className="nsd-page-title">
          <h1>{title}</h1>
          {subtitle && <small>{subtitle}</small>}
        </div>
      )}
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
      {children}
    </header>
  );
}
