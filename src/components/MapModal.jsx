import { useEffect, useState } from 'react';

// Shows a "View on map" trigger that opens an in-app modal with an embedded
// Google Map, instead of navigating away to the Maps app/site. Uses the
// classic maps.google.com embed URL, which doesn't require an API key.
export default function MapModal({ lat, lng, label, city, className, style, children }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');

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
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const startUrl = `${directionsUrl}&dir_action=navigate`;

  async function handleShare(e) {
    e.preventDefault();
    const shareData = {
      title: label,
      text: city ? `${label} — ${city}` : label,
      url: externalUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(externalUrl);
      setToast('Link copied');
      setTimeout(() => setToast(''), 1800);
    } catch {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    }
  }

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

            <div className="map-modal-actions">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-action-btn primary"
                title="Directions"
                aria-label="Directions"
              >
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>Directions</span>
              </a>
              <a
                href={startUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-action-btn"
                title="Start navigation"
                aria-label="Start navigation"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
                  <path d="M3 11 22 2 13 21 11 13 3 11z" />
                </svg>
                <span>Start</span>
              </a>
              <button onClick={handleShare} className="map-action-btn" title="Share" aria-label="Share location">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="2.6" />
                  <circle cx="6" cy="12" r="2.6" />
                  <circle cx="18" cy="19" r="2.6" />
                  <line x1="8.3" y1="10.6" x2="15.7" y2="6.6" />
                  <line x1="8.3" y1="13.4" x2="15.7" y2="17.4" />
                </svg>
                <span>Share</span>
              </button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-action-btn ghost"
                title="Open in Google Maps"
                aria-label="Open in Google Maps"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            {toast && <div className="map-modal-toast">{toast}</div>}
          </div>
        </div>
      )}
    </>
  );
}
