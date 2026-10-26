import Icon from './Icon';

// Tap-to-call number with a call icon in front. Renders a dash when no number is on file.
export default function PhoneLink({ phone, size = 16 }) {
  if (!phone) return <span style={{ color: 'var(--slate)' }}>Not provided</span>;
  const href = `tel:${String(phone).replace(/[^\d+]/g, '')}`;
  return (
    <a
      href={href}
      className="ns-phone-link"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'inherit', fontWeight: 600, textDecoration: 'none' }}
      aria-label={`Call ${phone}`}
    >
      <Icon name="phone" size={size} /> {phone}
    </a>
  );
}
