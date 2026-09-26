// Excel opens a CSV natively, so no spreadsheet library is needed. Two things
// make the difference between a file Excel reads and one it mangles: every
// field quoted per RFC 4180, and a UTF-8 BOM so '₦' and accented names survive.
const BOM = '﻿';

const escapeCell = (value) => {
  if (value === null || value === undefined) return '""';
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Prefixing a
  // single quote keeps a value like '-500' text instead of an expression.
  const raw = String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

// Free-form rows, for a document that is not one flat table — a single sale
// puts its details, its items and its receipts in one file.
const toCsvRows = (rows) =>
  BOM + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n';

const toCsv = (headers, rows) => toCsvRows([headers, ...rows]);

// Content-Disposition with a plain ASCII filename: a quote or newline smuggled
// into it would break the header.
const sendCsv = (res, filename, body) => {
  const safeName = filename.replace(/[^A-Za-z0-9._-]/g, '-');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.send(body);
};

module.exports = { toCsv, toCsvRows, sendCsv, escapeCell };
