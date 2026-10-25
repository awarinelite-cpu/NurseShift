import { useEffect, useState } from 'react';
import Icon from './Icon';
import { getFacilityCover } from '../../lib/facility';

const TINTS = [
  ['#0F514A', '#2BB59A'],
  ['#1F4E79', '#5B9BD5'],
  ['#5B3A8C', '#A98BD9'],
  ['#8A4B14', '#E0A458'],
  ['#14605F', '#5FD0C2'],
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Shows the facility's cover photo when the admin has added one (pass `photo`
// directly, or `facilityId` to look it up). Otherwise each facility gets a
// stable tinted tile.
export default function FacilityThumb({ seed, photo, facilityId, size = 56, radius = 12 }) {
  const [looked, setLooked] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (photo || !facilityId) return undefined;
    let live = true;
    getFacilityCover(facilityId).then((url) => live && setLooked(url));
    return () => { live = false; };
  }, [photo, facilityId]);

  const src = photo ?? looked;
  const [a, b] = TINTS[hash(seed) % TINTS.length];

  return (
    <span
      className="ns-thumb"
      style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(145deg, ${a}, ${b})`, overflow: 'hidden' }}
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <Icon name="building" size={Math.round(size * 0.46)} strokeWidth={1.6} />
      )}
    </span>
  );
}
