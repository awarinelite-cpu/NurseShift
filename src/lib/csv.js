// Minimal CSV parser — handles quoted fields (with embedded commas/newlines)
// and escaped quotes ("") without pulling in an external dependency.
// Good enough for admin-uploaded facility lists; not a general CSV engine.
function parseRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// Expected header columns (case-insensitive, order doesn't matter):
//   name, city, lat, lng, unit, cadre, date, start, end, hours, rate, urgency
// Only name and city are required. unit + date are required together to
// also create a shift for that facility — otherwise just the facility
// is created with no shift.
export function parseFacilityCsv(text) {
  const rows = parseRows(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((key, idx) => {
      record[key] = (cells[idx] ?? '').trim();
    });
    return record;
  });
}
