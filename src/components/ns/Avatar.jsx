import { initials } from '../../lib/earnings';

// Round avatar: shows the photo when there is one, otherwise initials.
export default function Avatar({ name, photoUrl, className = 'ns-avatar' }) {
  return (
    <span className={className}>
      {photoUrl ? <img src={photoUrl} alt="" className="ns-avatar-img" /> : initials(name)}
    </span>
  );
}
