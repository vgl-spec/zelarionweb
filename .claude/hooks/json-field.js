#!/usr/bin/env node
// Reads a hook JSON payload on stdin and prints one dotted-path field, or nothing.
//
// Why this exists: the dotclaude safety hooks parse their payload with `jq`, and three of them
// fail closed when it is missing — which denies every Bash/Edit/Write call on a machine without
// jq (e.g. a stock Windows box with only Git Bash). Node is already required by this project,
// so the hooks fall back to this script instead of bricking the session.

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    process.exit(0); // Malformed payload prints nothing; the caller treats that as "field absent".
  }
  for (const key of (process.argv[2] || '').split('.')) {
    if (value === null || typeof value !== 'object') {
      value = undefined;
      break;
    }
    value = value[key];
  }
  if (value !== undefined && value !== null) {
    process.stdout.write(String(value));
  }
});
