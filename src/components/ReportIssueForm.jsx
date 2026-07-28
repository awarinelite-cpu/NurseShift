import { useState } from 'react';

const REASONS = ['No-show', 'Unsafe conditions', 'Payment issue', 'Harassment or misconduct', 'Other'];

export default function ReportIssueForm({ onSubmit, onCancel }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    await onSubmit({ reason, description: description.trim() });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <div className="form-row">
        <label htmlFor="report-reason">Reason</label>
        <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="report-description">What happened?</label>
        <textarea
          id="report-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details that will help our team look into this."
          rows={3}
          required
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" className="claim-btn" style={{ background: 'var(--red)', flex: '1 1 140px' }} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
        <button type="button" className="clock-btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
