import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clockIn, clockOut } from '../lib/shifts';
import { rateFacilityForClaim } from '../lib/ratings';
import { fileDispute } from '../lib/disputes';
import { useAuth } from '../context/AuthContext';
import { useClaims } from '../lib/useClaims';
import { getOrCreateConversation } from '../lib/chat';
import { getFacility } from '../lib/facility';
import { formatNaira, fmtRange, titleFor, toDate } from '../lib/earnings';
import ReportIssueForm from '../components/ReportIssueForm';
import Icon from '../components/ns/Icon';
import NurseHero from '../components/ns/NurseHero';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', match: (c) => c.status === 'pending' || c.status === 'approved' },
  { key: 'completed', label: 'Completed', match: (c) => c.status === 'completed' },
  { key: 'cancelled', label: 'Cancelled', match: (c) => c.status === 'rejected' },
];

function statusPill(c) {
  if (c.status === 'completed') return { text: 'Completed', tone: 'grey' };
  if (c.status === 'rejected') return { text: 'Declined', tone: 'red' };
  if (c.status === 'pending') return { text: 'Pending', tone: 'blue' };
  if (c.clockIn && !c.clockOut) return { text: 'In progress', tone: 'amber' };
  return { text: 'Confirmed', tone: 'green' };
}

export default function MyShifts() {
  const { nurse } = useAuth();
  const navigate = useNavigate();
  const { claims, loading, refresh } = useClaims(nurse.id);
  const [tab, setTab] = useState('upcoming');
  const [messaging, setMessaging] = useState(null);
  const [error, setError] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);
  const [reportingFor, setReportingFor] = useState(null);
  const [reportSent, setReportSent] = useState(null);
  const [phones, setPhones] = useState({});
  const [noPhoneFor, setNoPhoneFor] = useState(null);

  // Facility phone numbers, looked up once per facility, for the tap-to-call button.
  useEffect(() => {
    const ids = [...new Set(claims.map((c) => c.shift?.facilityId).filter(Boolean))].filter((id) => !(id in phones));
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => getFacility(id).then((f) => [id, f?.phone || null]).catch(() => [id, null]))).then((pairs) =>
      setPhones((prev) => ({ ...prev, ...Object.fromEntries(pairs) }))
    );
  }, [claims]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = Object.fromEntries(TABS.map((t) => [t.key, claims.filter(t.match).length]));
  const list = claims
    .filter(TABS.find((t) => t.key === tab).match)
    .sort((a, b) => (a.shift?.date ?? '').localeCompare(b.shift?.date ?? '') * (tab === 'upcoming' ? 1 : -1));

  async function handleClockIn(id) {
    await clockIn(id);
    refresh();
  }
  async function handleClockOut(id) {
    await clockOut(id);
    refresh();
  }
  async function handleRate(claim, rating) {
    await rateFacilityForClaim(claim.id, claim.shift?.facilityId, rating);
    setRatingFor(null);
    refresh();
  }
  async function handleReport(claim, { reason, description }) {
    await fileDispute({
      claimId: claim.id,
      shiftId: claim.shiftId,
      facilityId: claim.shift?.facilityId,
      nurseId: nurse.id,
      reporterId: nurse.id,
      reporterRole: 'nurse',
      reporterName: nurse.name,
      otherPartyName: claim.shift?.facility ?? 'Unknown facility',
      shiftLabel: `${claim.shift?.unit ?? ''} · ${claim.shift?.date ?? ''}`.trim(),
      reason,
      description,
    });
    setReportingFor(null);
    setReportSent(claim.id);
    refresh();
  }
  async function handleMessage(c) {
    setMessaging(c.id);
    setError(null);
    try {
      const conv = await getOrCreateConversation(
        { id: nurse.id, type: 'nurse', name: nurse.name },
        { id: c.shift?.facilityId, type: 'facility', name: c.shift?.facility },
        { type: 'shift', shiftId: c.shiftId }
      );
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setMessaging(null);
    }
  }

  return (
    <div className="ns-screen nsd-nurse nsd-board">
      <NurseHero
        title="My Shifts"
        subtitle="Your upcoming, completed and cancelled shifts."
        onBack={() => navigate('/')}
        tiles={[
          { label: 'Upcoming', value: counts.upcoming, tone: 'blue', icon: 'calendar' },
          { label: 'Completed', value: counts.completed, tone: 'green', icon: 'checkCircle' },
          { label: 'Cancelled', value: counts.cancelled, tone: 'red', icon: 'alert' },
        ]}
      />

      <div className="ns-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'on' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {error && <p className="ns-error">{error}</p>}

      {loading ? (
        <div className="ns-empty">Loading...</div>
      ) : list.length === 0 ? (
        <div className="ns-empty">
          {tab === 'upcoming' ? (
            <>No upcoming shifts yet. <Link to="/shifts">Find a shift</Link></>
          ) : (
            `Nothing in ${TABS.find((t) => t.key === tab).label.toLowerCase()} yet.`
          )}
        </div>
      ) : (
        <ul className="ns-list">
          {list.map((c) => {
            const d = toDate(c.shift?.date);
            const pill = statusPill(c);
            const canRate = c.status === 'completed' && !c.facilityRated;
            const reported = c.disputeFiled || reportSent === c.id;
            return (
              <li key={c.id} className="ns-card ns-claim">
                <div className="ns-claim-row">
                  <div className="ns-date">
                    <strong>{d ? d.getDate() : '-'}</strong>
                    <small>{d ? d.toLocaleDateString('en-GB', { month: 'short' }) : ''}</small>
                  </div>
                  <div className="ns-claim-main">
                    <h3>{titleFor(c.shift)}</h3>
                    <p><Icon name="pin" size={13} /> {c.shift?.facility ?? 'Unknown facility'}</p>
                    <p><Icon name="clock" size={13} /> {fmtRange(c.shift)}</p>
                    <span className={`ns-tag ${pill.tone}`}>{pill.text}</span>
                  </div>
                  <strong className="ns-claim-pay">{formatNaira(c.shift?.rate)}</strong>
                </div>

                <div className="ns-claim-actions">
                  <button type="button" disabled={messaging === c.id} onClick={() => handleMessage(c)}>
                    {messaging === c.id ? 'Opening...' : 'Message'}
                  </button>
                  <button
                    type="button"
                    aria-label={phones[c.shift?.facilityId] ? `Call ${phones[c.shift.facilityId]}` : 'Call facility'}
                    onClick={() => {
                      const num = phones[c.shift?.facilityId];
                      if (!num) { setNoPhoneFor(c.id); return; }
                      window.location.href = `tel:${num.replace(/[^\d+]/g, '')}`;
                    }}
                  >
                    <Icon name="phone" size={13} /> {phones[c.shift?.facilityId] || 'Call'}
                  </button>
                  {c.status === 'approved' && !c.clockIn && <button type="button" className="primary" onClick={() => handleClockIn(c.id)}>Clock in</button>}
                  {c.clockIn && !c.clockOut && <button type="button" className="primary" onClick={() => handleClockOut(c.id)}>Clock out</button>}
                  {canRate && ratingFor !== c.id && <button type="button" onClick={() => setRatingFor(c.id)}>Rate facility</button>}
                  {!reported && reportingFor !== c.id && c.status !== 'rejected' && (
                    <button type="button" className="danger" onClick={() => setReportingFor(c.id)}>Report issue</button>
                  )}
                  {reported && <span className="ns-muted">Reported, under review</span>}
                </div>

                {noPhoneFor === c.id && !phones[c.shift?.facilityId] && (
                  <p className="ns-error" role="status">Phone number not available for this facility.</p>
                )}

                {canRate && ratingFor === c.id && (
                  <div className="ns-rate">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => handleRate(c, n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                        {n}<Icon name="star" size={14} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                )}

                {reportingFor === c.id && (
                  <ReportIssueForm onSubmit={(payload) => handleReport(c, payload)} onCancel={() => setReportingFor(null)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
