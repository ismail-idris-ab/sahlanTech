// sahlearn-api/src/utils/phone.js
// The daily quiz identifies anyone — registered or not — by their phone number,
// so one person must always produce the same key no matter how they type it.
// 08012345678, +2348012345678 and 2348012345678 are all the same subscriber.

// Same shape the Student, Enrollment and ContactMessage models accept.
const NIGERIAN_PHONE = /^(\+234|234|0)([789][01]\d{8})$/;

// Returns the canonical '234XXXXXXXXXX' form, or null when the number is not a
// valid Nigerian mobile number. Everything that stores or compares a phone
// number goes through here, so a number can never be recorded in two forms.
function phoneKey(raw) {
  if (typeof raw !== 'string') return null;
  const stripped = raw.replace(/[\s()-]/g, '');
  const match = NIGERIAN_PHONE.exec(stripped);
  if (!match) return null;
  return `234${match[2]}`;
}

const isValidPhone = (raw) => phoneKey(raw) !== null;

// Public display form: first four and last four digits of the local number,
// e.g. '0801***5678'. Enough to tell two people with the same name apart
// without publishing a reachable number.
function maskPhone(key) {
  if (typeof key !== 'string' || !/^234[789][01]\d{8}$/.test(key)) return '';
  const local = `0${key.slice(3)}`; // 234801... -> 0801...
  return `${local.slice(0, 4)}***${local.slice(-4)}`;
}

module.exports = { phoneKey, isValidPhone, maskPhone, NIGERIAN_PHONE };
