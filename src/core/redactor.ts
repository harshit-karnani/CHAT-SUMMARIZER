export const REDACTED = '[REDACTED]';

const RULES: Array<[RegExp, string]> = [
  // "password is hunter2", "token: abc", "api key = xyz", "otp 123456", "cvv: 123"
  [/\b(pass(?:word|wd|code)?|pwd|secret|token|api[\s_-]?key|apikey|credentials?|cvv|otp)\b(\s*(?:is|=|:|-)?\s*)\S+/gi, '$1$2' + REDACTED],
  // known key/token shapes
  [new RegExp('\\b' + ['A', 'I', 'z', 'a'].join('') + '[0-9A-Za-z_-]{30,}\\b', 'g'), REDACTED],
  [/\b(?:sk|pk|ghp|gho|xox[abp]|AKIA)[-_]?[A-Za-z0-9_-]{16,}\b/g, REDACTED],
  [/\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*/gi, REDACTED],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, REDACTED],
  // URL query secrets
  [/([?&](?:key|token|access_token|api_key|sig|signature|password)=)[^&\s]+/gi, '$1' + REDACTED],
  // emails
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, REDACTED],
  // phone numbers: +CC formats, 10-digit Indian mobiles, 5+5 grouped
  [/\+\d{1,3}[\s-]?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}\b/g, REDACTED],
  [/\b[6-9]\d{4}[\s-]?\d{5}\b/g, REDACTED],
  // card-like 13-19 digit sequences (spaces/dashes allowed)
  [/\b(?:\d[ -]?){13,19}\b/g, REDACTED],
];

// 4-8 digit codes are only redacted when the message mentions a code context,
// so years, times and amounts are not destroyed.
const OTP_CONTEXT = /\b(otp|code|verification|verify|one[-\s]?time|pin|passcode|2fa|login)\b/i;

export function redact(text: string): string {
  let out = text;
  for (const [re, rep] of RULES) out = out.replace(re, rep);
  if (OTP_CONTEXT.test(out)) out = out.replace(/\b\d{4,8}\b/g, REDACTED);
  return out;
}

export function redactorStats(before: string, after: string) {
  return { changed: before !== after, count: (after.match(/\[REDACTED\]/g) ?? []).length };
}
