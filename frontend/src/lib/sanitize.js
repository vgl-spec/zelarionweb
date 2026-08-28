// Input hygiene for text collected from forms -- NOT an XSS defence.
//
// React escapes every interpolated string by default, so text rendered
// through JSX (`{value}`) can never inject markup on its own. The real XSS
// boundary is that nothing sanitized here is ever passed to
// `dangerouslySetInnerHTML`, and that the server re-validates independently
// before persisting or echoing it back (see
// .claude/rules/idempotency-concurrency.md, rule 9: validate at the
// boundary). This module only trims whitespace noise and strips
// non-printing control characters so form fields don't carry invisible
// junk -- it deliberately does NOT strip HTML tags or blocklist patterns
// like `<script>`. Doing that would be security theatre (trivially
// bypassed, and irrelevant given React's escaping) while mangling
// legitimate input: a project description that says "supports <500 users"
// or "R&D budget" contains `<` and `&` and must survive untouched.

const CONTROL_CHARS_STRIP_NEWLINES = /[\x00-\x1F\x7F]/g;
const CONTROL_CHARS_KEEP_NEWLINES = /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Strips C0 control characters and DEL from `value`. When `allowNewlines`
 * is false, `\n`/`\r` are treated as control characters too -- but replaced
 * with a space rather than deleted outright, so "John\nSmith" collapses to
 * "John Smith" instead of fusing into "JohnSmith".
 */
export function stripControlChars(value, { allowNewlines = false } = {}) {
  if (typeof value !== 'string') return '';
  if (allowNewlines) {
    // Normalize CRLF/CR to LF first so a lone \r isn't left as a stray
    // control char after the strip below.
    return value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS_KEEP_NEWLINES, '');
  }
  return value.replace(/[\r\n]/g, ' ').replace(CONTROL_CHARS_STRIP_NEWLINES, '');
}

/**
 * Trims, strips control characters, and collapses whitespace runs into a
 * single space (newlines preserved as line breaks when `allowNewlines` is
 * true, each line collapsed independently so paragraph breaks survive),
 * then hard-truncates to `maxLength`. Used on every text field before it is
 * sent to the server -- a UX guard against pasted junk, not a security
 * control.
 */
export function sanitizeText(value, { maxLength = Infinity, allowNewlines = false } = {}) {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  const stripped = stripControlChars(trimmed, { allowNewlines });

  const collapsed = allowNewlines
    ? stripped
        .split('\n')
        .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
        .join('\n')
        .trim()
    : stripped.replace(/\s+/g, ' ').trim();

  return collapsed.slice(0, maxLength);
}
