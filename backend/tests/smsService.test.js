// tests/smsService.test.js
const { normalizeGhanaPhone, buildMessage } = require('../services/smsService');

describe('normalizeGhanaPhone', () => {
  it('converts 0XX to +233XX format', () => {
    expect(normalizeGhanaPhone('0244123456')).toBe('+233244123456');
  });
  it('leaves +233 numbers untouched', () => {
    expect(normalizeGhanaPhone('+233244123456')).toBe('+233244123456');
  });
  it('strips spaces', () => {
    expect(normalizeGhanaPhone('024 412 3456')).toBe('+233244123456');
  });
  it('handles 233 prefix without +', () => {
    expect(normalizeGhanaPhone('233244123456')).toBe('+233244123456');
  });
});

describe('buildMessage', () => {
  it('builds an open message in English', () => {
    const msgs = buildMessage('open', 'Lamashegu', { time: '6:15 AM', duration: 4 });
    expect(msgs.en).toContain('Lamashegu');
    expect(msgs.en).toContain('flowing');
    expect(msgs.en).toContain('GWCL Tamale');
    expect(msgs.en.length).toBeLessThan(320); // fits in 2 SMS
  });

  it('builds an advance message with time', () => {
    const msgs = buildMessage('advance', 'Choggu', { time: '9:30 AM' });
    expect(msgs.en).toContain('Choggu');
    expect(msgs.en).toContain('9:30 AM');
    expect(msgs.en).toContain('30 minutes');
  });

  it('builds an emergency message', () => {
    const msgs = buildMessage('emergency', 'All Zones', { message: 'Pipe burst on Savelugu Rd.' });
    expect(msgs.en).toContain('GWCL');
  });

  it('includes Dagbani (tw) translation for open alerts', () => {
    const msgs = buildMessage('open', 'Lamashegu', { time: '6:15 AM', duration: 3 });
    expect(msgs.tw).toBeTruthy();
    expect(msgs.tw).toContain('Lamashegu');
  });
});
