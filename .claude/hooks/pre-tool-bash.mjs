// Hook: PreToolUse(Bash)
// Blocks dangerous git commands before they execute.
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

let input = {};
try {
  input = JSON.parse(Buffer.concat(chunks).toString());
} catch {
  process.exit(0);
}

// Extract only the first line of the command to avoid matching heredoc content
const fullCmd = (input.tool_input && input.tool_input.command) || '';
const firstLine = fullCmd.split('\n')[0].trim();

if (/^\s*git\s+push\b.*\s(--force|-f)\b/.test(firstLine)) {
  process.stderr.write('MAESTRO: git push --force detected. Confirm with Bradley before proceeding.\n');
  process.exit(2);
}

if (/^\s*git\s+push\b.*\smain\b/.test(firstLine)) {
  process.stderr.write('MAESTRO: direct push to main detected. Never push to main without Bradley approval.\n');
  process.exit(2);
}

if (/^\s*git\s+reset\s+--hard\b/.test(firstLine)) {
  process.stderr.write('MAESTRO: git reset --hard detected. This is destructive. Confirm with Bradley.\n');
  process.exit(2);
}

process.exit(0);
