import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

export default function Profile() {
  const { nurse } = useAuth();

  if (!nurse) return <div className="page"><div className="empty-state">Not signed in.</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Profile</p>
        <h1 className="page-title">{nurse.name}</h1>
      </div>

      <div className="profile-card">
        <p className="profile-name">{nurse.name}</p>
        <p className="profile-role">{nurse.cadre} · {nurse.specialty || 'General practice'}</p>

        <Badge status={nurse.verification}>
          {nurse.verification === 'verified' ? 'License verified' : `License ${nurse.verification}`}
        </Badge>

        {nurse.verification === 'pending' && (
          <p style={{ fontSize: 13, color: 'var(--slate)', margin: '10px 0 0' }}>
            Your license is under review. You'll be able to claim shifts once an admin verifies it —
            usually within 48 hours.
          </p>
        )}

        <div className="profile-grid">
          <div>
            <p className="label">License number</p>
            <p className="value">{nurse.licenseNumber}</p>
          </div>
          <div>
            <p className="label">Experience</p>
            <p className="value">{nurse.yearsExperience} years</p>
          </div>
          <div>
            <p className="label">Rating</p>
            <p className="value">{nurse.rating ? `★ ${nurse.rating}` : 'No shifts yet'}</p>
          </div>
          <div>
            <p className="label">Phone</p>
            <p className="value">{nurse.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="label">Shifts completed</p>
            <p className="value">{nurse.shiftsCompleted}</p>
          </div>
          {(nurse.licenseFileName || nurse.licenseFileUrl) && (
            <div>
              <p className="label">License document</p>
              <p className="value">
                {nurse.licenseFileUrl ? (
                  <a href={nurse.licenseFileUrl} target="_blank" rel="noreferrer">{nurse.licenseFileName}</a>
                ) : (
                  nurse.licenseFileName
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
