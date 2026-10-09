import { describe, it, expect } from 'vitest';
import { redact, REDACTED } from '../src/core/redactor';

describe('redact', () => {
  it('redacts passwords, tokens, and api keys', () => {
    expect(redact('my password is hunter2 please note')).toBe(`my password is ${REDACTED} please note`);
    expect(redact('token: abcdef123456')).toBe(`token: ${REDACTED}`);
    expect(redact('api key = xyz-secret-token')).toBe(`api key = ${REDACTED}`);
    expect(redact('cvv: 123')).toBe(`cvv: ${REDACTED}`);
  });

  it('redacts AIza Google API keys', () => {
    const raw = 'AIzaSyA_3892782390823908320982309823';
    expect(redact(`Here is the key: ${raw}`)).toBe(`Here is the key: ${REDACTED}`);
  });

  it('redacts Bearer tokens', () => {
    expect(redact('Authorization: Bearer abcd1234efgh5678ijkl')).toBe(`Authorization: ${REDACTED}`);
  });

  it('redacts emails', () => {
    expect(redact('Contact me at alice.smith@example.co.uk today')).toBe(`Contact me at ${REDACTED} today`);
  });

  it('redacts +91 and international phone numbers', () => {
    expect(redact('Call me on +91 98765 43210')).toBe(`Call me on ${REDACTED}`);
    expect(redact('My office number is +1-555-123-4567')).toBe(`My office number is ${REDACTED}`);
  });

  it('redacts 10-digit Indian mobile numbers', () => {
    expect(redact('Ping me at 9876543210 soon')).toBe(`Ping me at ${REDACTED} soon`);
    expect(redact('Call 87654 32109')).toBe(`Call ${REDACTED}`);
  });

  it('redacts OTP only with code context', () => {
    expect(redact('Your login otp is 482910')).toBe(`Your login otp is ${REDACTED}`);
    expect(redact('Verification code 5821 for 2fa')).toBe(`Verification code ${REDACTED} for 2fa`);
  });

  it('does NOT redact dates, years, times, or amounts without OTP context', () => {
    expect(redact('Let us meet at 2026')).toBe('Let us meet at 2026');
    expect(redact('Deadline is 5 PM tomorrow')).toBe('Deadline is 5 PM tomorrow');
    expect(redact('Invoice is for 2500 dollars')).toBe('Invoice is for 2500 dollars');
  });

  it('redacts URL ?token= and query secrets', () => {
    expect(redact('https://example.com/api?token=secret123')).toBe(`https://example.com/api?token=${REDACTED}`);
    expect(redact('https://test.com/hook?sig=xyz123&user=bob')).toBe(`https://test.com/hook?sig=${REDACTED}&user=bob`);
  });

  it('keeps plain sentences unchanged', () => {
    const plain = 'Hey team, please review the PR when you get a chance.';
    expect(redact(plain)).toBe(plain);
  });
});
