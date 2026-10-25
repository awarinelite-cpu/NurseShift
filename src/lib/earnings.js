// Display helpers and earnings maths for the nurse screens.
// A shift's `rate` is the total pay for the shift, so per-hour is rate / hours.

export function formatNaira(amount) {
  return `₦${Math.round(amount ?? 0).toLocaleString('en-NG')}`;
}

export function perHour(rate, hours) {
  return hours ? Math.round(rate / hours) : null;
}

export function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

export function fmtRange(shift) {
  return `${fmtTime(shift?.start)} - ${fmtTime(shift?.end)}`;
}

export function shiftType(start) {
  const h = parseInt(String(start ?? '').split(':')[0], 10);
  if (Number.isNaN(h)) return 'Day Shift';
  return h >= 6 && h < 17 ? 'Day Shift' : 'Night Shift';
}

export function toDate(dateStr) {
  return dateStr ? new Date(`${dateStr}T00:00:00`) : null;
}

export function fmtDay(dateStr, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = toDate(dateStr);
  return d ? d.toLocaleDateString('en-GB', opts) : '';
}

export function titleFor(shift) {
  if (!shift) return 'Shift';
  return `${shift.unit ?? 'General'} Nurse`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function inRange(date, range, now) {
  if (!date) return false;
  if (range === 'all') return true;
  if (range === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return date >= start && date <= now;
}

export function nextPayoutDate(now = new Date()) {
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);
  return now.getDate() < 5 ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, 5);
}

// range: 'month' | '3months' | 'all'
export function summarize(claims, range = 'month', now = new Date()) {
  const completed = claims.filter((c) => c.status === 'completed' && c.shift);
  const rows = completed
    .filter((c) => inRange(toDate(c.shift.date), range, now))
    .sort((a, b) => (b.shift.date ?? '').localeCompare(a.shift.date ?? ''));
  const total = rows.reduce((sum, c) => sum + (c.shift.rate ?? 0), 0);
  const pending = claims
    .filter((c) => c.status === 'approved' && c.shift)
    .reduce((sum, c) => sum + (c.shift.rate ?? 0), 0);
  return {
    rows,
    total,
    count: rows.length,
    average: rows.length ? Math.round(total / rows.length) : 0,
    pending,
    nextPayout: nextPayoutDate(now),
  };
}
