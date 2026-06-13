// Hook: Stop
// Reminds to validate TypeScript and lint before committing.
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

let input = {};
try {
  input = JSON.parse(Buffer.concat(chunks).toString());
} catch {}

const stopReason = (input && input.stop_reason) || '';

if (stopReason === 'tool_use' || stopReason === '') {
  process.exit(0);
}

process.stdout.write(
  '\nMAESTRO: Before committing, run:\n' +
  '  npx tsc --noEmit && npm run lint\n'
);
process.exit(0);
