const { toCsv, escapeCell } = require('../../src/utils/csv');

describe('escapeCell', () => {
  test('quotes every value', () => {
    expect(escapeCell('Musa')).toBe('"Musa"');
    expect(escapeCell(50000)).toBe('"50000"');
  });

  test('doubles an embedded quote', () => {
    expect(escapeCell('12" laptop')).toBe('"12"" laptop"');
  });

  test('keeps a comma inside one cell', () => {
    expect(escapeCell('Ibrahim, Musa')).toBe('"Ibrahim, Musa"');
  });

  test('keeps a newline inside one cell', () => {
    expect(escapeCell('line one\nline two')).toBe('"line one\nline two"');
  });

  test('renders null and undefined as empty', () => {
    expect(escapeCell(null)).toBe('""');
    expect(escapeCell(undefined)).toBe('""');
  });

  // A customer called '=cmd' must not become a formula when the file opens.
  test('defuses a value Excel would read as a formula', () => {
    expect(escapeCell('=1+1')).toBe('"\'=1+1"');
    expect(escapeCell('+A1')).toBe('"\'+A1"');
    expect(escapeCell('-500')).toBe('"\'-500"');
    expect(escapeCell('@name')).toBe('"\'@name"');
  });
});

describe('toCsv', () => {
  test('starts with a BOM so Excel reads UTF-8', () => {
    expect(toCsv(['A'], [])).toMatch(/^﻿/);
  });

  test('writes the header then a CRLF-separated row per entry', () => {
    const csv = toCsv(['Name', 'Total'], [['Musa', 50000], ['Aisha', 45000]]);
    expect(csv).toBe('﻿"Name","Total"\r\n"Musa","50000"\r\n"Aisha","45000"\r\n');
  });

  test('a header row alone is valid output', () => {
    expect(toCsv(['Name'], [])).toBe('﻿"Name"\r\n');
  });
});
