import { useEffect, useState } from 'react';
import { listMyClaims, clockIn, clockOut } from '../lib/shifts';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

export default function MyShifts() {
  const { nurse } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await listMyClaims(nurse.id);
    setClaims(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClockIn(claimId) {
    await clockIn(claimId);
    refresh();
  }

  async function handleClockOut(claimId) {
    await clockOut(claimId);
    refresh();
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">{claims.length} claimed</p>
        <h1 className="page-title">My Shifts</h1>
        <p className="page-sub">Track approvals, clock in when your shift starts, and clock out when it ends.</p>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          You haven't claimed any shifts yet. Head to the Duty Board to find one.
        </div>
      ) : (
        claims.map((c) => (
          <div className="claim-card" key={c.id}>
            <div>
              <div className="facility">{c.shift?.facility ?? 'Unknown facility'}</div>
              <div className="meta">
                {c.shift?.unit} · {c.shift?.date} · {c.shift?.start}–{c.shift?.end} · {formatNaira(c.shift?.rate ?? 0)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge status={c.status}>{c.status}</Badge>
              {c.status === 'approved' && !c.clockIn && (
                <button className="clock-btn" onClick={() => handleClockIn(c.id)}>Clock in</button>
              )}
              {c.clockIn && !c.clockOut && (
                <button className="clock-btn active" onClick={() => handleClockOut(c.id)}>Clock out</button>
              )}
              {c.clockOut && <Badge status="completed">Completed</Badge>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
