import { useEffect, useState } from 'react';

// Shows a "View on map" trigger that opens an in-app modal with an embedded
// Google Map, instead of navigating away to the Maps app/site. Uses the
// classic maps.google.com embed URL, which doesn't require an API key.
export default function MapModal({ lat, lng, label, city, className, style, children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const hasCoords = lat != null && lng != null;
  const q = hasCoords ? `${lat},${lng}` : encodeURIComponent(`${label} ${city}`);
  const embedSrc = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;

  return (
    <>
      <a
        href={externalUrl}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className={className}
        style={style}
      >
        {children}
      </a>

      {open && (
        <div className="map-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <p className="map-modal-title">{label}</p>
              <button className="map-modal-close" onClick={() => setOpen(false)} aria-label="Close map">
                ✕
              </button>
            </div>
            <iframe
              title={`Map — ${label}`}
              src={embedSrc}
              className="map-modal-frame"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="map-modal-external">
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      )}
    </>
  );
}
