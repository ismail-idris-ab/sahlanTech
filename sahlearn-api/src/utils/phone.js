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

// Public display form: the last three digits only, e.g. '***678'.
//
// Deliberately not the network prefix as well. This is published on an
// unauthenticated page next to the person's full name, and showing
// '0801***5678' would leave only three unknown digits — about a thousand
// guesses away from a working number. Three digits is still enough to tell two
// people with the same name apart, which is all it is for.
function maskPhone(key) {
  if (typeof key !== 'string' || !/^234[789][01]\d{8}$/.test(key)) return '';
  return `***${key.slice(-3)}`;
}

module.exports = { phoneKey, isValidPhone, maskPhone, NIGERIAN_PHONE };
