const { phoneKey, isValidPhone, maskPhone } = require('../../src/utils/phone');

describe('phoneKey', () => {
  test('the same subscriber typed three ways gives one key', () => {
    expect(phoneKey('08012345678')).toBe('2348012345678');
    expect(phoneKey('+2348012345678')).toBe('2348012345678');
    expect(phoneKey('2348012345678')).toBe('2348012345678');
  });

  test('spaces, dashes and brackets are ignored', () => {
    expect(phoneKey(' 0801 234 5678 ')).toBe('2348012345678');
    expect(phoneKey('0801-234-5678')).toBe('2348012345678');
    expect(phoneKey('(0801)2345678')).toBe('2348012345678');
  });

  test('every Nigerian mobile prefix is accepted', () => {
    for (const local of ['07012345678', '08112345678', '09012345678', '08112345678']) {
      expect(phoneKey(local)).not.toBeNull();
    }
  });

  test('rejects anything that is not a Nigerian mobile number', () => {
    for (const bad of [
      '0601234567', // wrong prefix
      '080123456', // too short
      '080123456789', // too long
      '+15551234567', // not Nigerian
      'not a phone',
      '',
      null,
      undefined,
      12345,
      {},
      [],
    ]) {
      expect(phoneKey(bad)).toBeNull();
      expect(isValidPhone(bad)).toBe(false);
    }
  });
});

describe('maskPhone', () => {
  test('shows the first four and last four digits only', () => {
    expect(maskPhone('2348012345678')).toBe('0801***5678');
  });

  test('never leaks the middle digits', () => {
    expect(maskPhone('2348012345678')).not.toContain('234');
    expect(maskPhone('2348019995678')).not.toContain('999');
  });

  test('returns an empty string for anything that is not a key', () => {
    for (const bad of ['08012345678', 'nonsense', '', null, undefined, 42]) {
      expect(maskPhone(bad)).toBe('');
    }
  });
});
