import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseFacilityCsv } from '../../lib/csv';
import { bulkImportFacilities } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';

export default function AdminFacilityImport() {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    setResult(null);
    setParseError('');
    setRows([]);
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseFacilityCsv(String(reader.result));
        if (parsed.length === 0) {
          setParseError('No rows found in that file.');
          return;
        }
        if (!('name' in parsed[0]) || !('city' in parsed[0])) {
          setParseError('CSV must have "name" and "city" columns at minimum.');
          return;
        }
        setRows(parsed);
      } catch {
        setParseError('Could not read that file as CSV.');
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const outcome = await bulkImportFacilities(rows);
      setResult(outcome);
      setRows([]);
    } catch (err) {
      setParseError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="page-title">Import Facilities</h1>
          <p className="page-sub">Upload a CSV to bulk-create facilities and their shifts.</p>
        </div>
        <button className="clock-btn" onClick={handleSignOut}>Sign out</button>
      </div>

      <p style={{ marginBottom: 16 }}>
        <Link to="/admin">← Back to license review</Link>
      </p>

      <div className="detail-card" style={{ marginBottom: 16 }}>
        <p className="label" style={{ marginBottom: 8 }}>CSV format</p>
        <p className="detail-city" style={{ marginBottom: 10 }}>
          Required columns: <code>name</code>, <code>city</code>. Optional: <code>lat</code>, <code>lng</code>,{' '}
          <code>unit</code>, <code>cadre</code>, <code>date</code>, <code>start</code>, <code>end</code>,{' '}
          <code>hours</code>, <code>rate</code>, <code>urgency</code>. Include <code>unit</code> and{' '}
          <code>date</code> to also create one open shift per facility.
        </p>
        <a href="/facilities-template.csv" download>Download a ready-made template (70 Lagos + Ogun facilities)</a>
      </div>

      <div className="form-row">
        <label htmlFor="csv-file">CSV file</label>
        <input id="csv-file" type="file" accept=".csv,text/csv" onChange={handleFile} />
        {fileName && <p className="file-picked">Selected: {fileName}</p>}
        {parseError && <p className="form-error">{parseError}</p>}
      </div>

      {rows.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 20 }}>{rows.length} rows ready to import</p>
          <div className="detail-card" style={{ marginBottom: 16, maxHeight: 280, overflowY: 'auto' }}>
            {rows.slice(0, 8).map((r, i) => (
              <div key={i} className="claim-card" style={{ padding: '8px 0' }}>
                <div>
                  <div className="facility">{r.name || '(missing name)'}</div>
                  <div className="meta">
                    {r.city || '(missing city)'}
                    {r.unit && r.date ? ` · ${r.unit} · ${r.date}` : ' · no shift (no unit/date)'}
                  </div>
                </div>
              </div>
            ))}
            {rows.length > 8 && <p className="detail-city">…and {rows.length - 8} more</p>}
          </div>

          <button className="claim-btn" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing…' : `Import ${rows.length} facilities`}
          </button>
        </>
      )}

      {result && (
        <div className="detail-card" style={{ marginTop: 16 }}>
          <p className="detail-facility" style={{ color: 'var(--green)' }}>
            Created {result.created.length} facilit{result.created.length === 1 ? 'y' : 'ies'}
          </p>
          {result.skipped.length > 0 && (
            <>
              <p className="form-error" style={{ marginTop: 8 }}>
                Skipped {result.skipped.length} row{result.skipped.length === 1 ? '' : 's'}:
              </p>
              {result.skipped.slice(0, 5).map((s, i) => (
                <p key={i} className="detail-city">{s.row.name || '(no name)'} — {s.reason}</p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
