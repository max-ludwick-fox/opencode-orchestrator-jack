#!/usr/bin/env node
/**
 * Cursor postToolUse hook — tool output truncator.
 *
 * Mirrors the jack-extras/index.ts `tool.execute.after` hook from the OpenCode side:
 * when a bash/read/grep/glob tool returns a very large payload, keep the head and
 * tail but replace the middle with a single explanatory marker. This stops one
 * noisy command from eating most of the context window.
 *
 * Cursor hook protocol (per https://cursor.com/docs/agent/hooks):
 *   - stdin: JSON envelope containing at least `hook_event_name`, `tool_name`,
 *     and `tool_response` (with `output` as a string)
 *   - stdout: either empty (no change) or JSON with a `modifiedOutput` / allowed
 *     control field
 *   - exit 0 = continue, non-zero = block (we never block — truncation is advisory)
 *
 * We only mutate output for a focused set of tools; everything else is passed through.
 */

const TRUNCATE_THRESHOLD = 50_000;
const TRUNCATE_HEAD = 8_000;
const TRUNCATE_TAIL = 4_000;

const TRUNCATE_TOOLS = new Set([
  "bash",
  "read",
  "grep",
  "glob",
  "run_terminal_cmd",
  "read_file",
]);

function truncate(text, toolName) {
  if (typeof text !== "string" || text.length <= TRUNCATE_THRESHOLD) return null;
  const head = text.slice(0, TRUNCATE_HEAD);
  const tail = text.slice(-TRUNCATE_TAIL);
  const omitted = text.length - TRUNCATE_HEAD - TRUNCATE_TAIL;
  return [
    head,
    "",
    `… [truncate-output: ${toolName} output truncated — ${omitted.toLocaleString()} chars omitted to preserve context. Original was ${text.length.toLocaleString()} chars] …`,
    "",
    tail,
  ].join("\n");
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw) {
      process.exit(0);
      return;
    }
    const payload = JSON.parse(raw);
    const toolName = payload.tool_name ?? payload.toolName ?? "unknown";
    if (!TRUNCATE_TOOLS.has(toolName)) {
      process.exit(0);
      return;
    }
    const response = payload.tool_response ?? payload.toolResponse ?? {};
    const output = response.output ?? response.text ?? "";
    const truncated = truncate(output, toolName);
    if (truncated === null) {
      process.exit(0);
      return;
    }
    process.stdout.write(
      JSON.stringify({
        modifiedOutput: truncated,
      }) + "\n",
    );
    process.exit(0);
  } catch {
    process.exit(0);
  }
})();
