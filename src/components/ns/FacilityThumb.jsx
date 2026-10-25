import Icon from './Icon';

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

// No facility photos exist in the data yet, so each facility gets a stable tinted tile.
export default function FacilityThumb({ seed, size = 56, radius = 12 }) {
  const [a, b] = TINTS[hash(seed) % TINTS.length];
  return (
    <span
      className="ns-thumb"
      style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(145deg, ${a}, ${b})` }}
    >
      <Icon name="building" size={Math.round(size * 0.46)} strokeWidth={1.6} />
    </span>
  );
}
