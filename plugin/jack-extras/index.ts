import type { Plugin } from "@opencode-ai/plugin"

const TRUNCATE_THRESHOLD = 50_000
const TRUNCATE_HEAD = 8_000
const TRUNCATE_TAIL = 4_000

const CONTEXT_WARN_THRESHOLDS = [0.75, 0.85, 0.95] as const
const warnedSessions = new Map<string, number>()

const recoveryAttempts = new Map<string, number>()
const MAX_RECOVERY_ATTEMPTS = 3

const TRUNCATE_TOOLS = new Set([
  "bash",
  "read",
  "grep",
  "glob",
])

function truncateOutput(text: string, tool: string): string {
  if (text.length <= TRUNCATE_THRESHOLD) return text

  const head = text.slice(0, TRUNCATE_HEAD)
  const tail = text.slice(-TRUNCATE_TAIL)
  const omitted = text.length - TRUNCATE_HEAD - TRUNCATE_TAIL

  return [
    head,
    "",
    `… [jack-extras: ${tool} output truncated — ${omitted.toLocaleString()} chars omitted to preserve context. Original was ${text.length.toLocaleString()} chars] …`,
    "",
    tail,
  ].join("\n")
}

function getThresholdCrossed(used: number, total: number): number | null {
  if (!total || total <= 0) return null
  const ratio = used / total
  for (let i = CONTEXT_WARN_THRESHOLDS.length - 1; i >= 0; i--) {
    if (ratio >= CONTEXT_WARN_THRESHOLDS[i]) return CONTEXT_WARN_THRESHOLDS[i]
  }
  return null
}

export const JackExtras: Plugin = async ({ client }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (!TRUNCATE_TOOLS.has(input.tool)) return
      if (typeof output.output !== "string") return
      if (output.output.length <= TRUNCATE_THRESHOLD) return

      output.output = truncateOutput(output.output, input.tool)
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const sessionID = (event.properties as any)?.sessionID
        if (!sessionID) return

        try {
          const session = await client.session.get({ path: { id: sessionID } })
          const tokens = (session as any)?.data?.tokens
          if (!tokens) return

          const used = (tokens.input ?? 0) + (tokens.output ?? 0) + (tokens.reasoning ?? 0)
          const total = tokens.context ?? tokens.limit
          const crossed = getThresholdCrossed(used, total)
          if (!crossed) return

          const last = warnedSessions.get(sessionID) ?? 0
          if (crossed <= last) return
          warnedSessions.set(sessionID, crossed)

          const pct = Math.round(crossed * 100)
          console.warn(
            `[jack-extras] context-window-monitor: session ${sessionID.slice(0, 8)} at ${pct}% (${used.toLocaleString()}/${total.toLocaleString()} tokens). Consider /compact or wrapping up the task.`,
          )
        } catch {}
        return
      }

      if (event.type === "session.deleted") {
        const sessionID = (event.properties as any)?.sessionID
        if (sessionID) {
          warnedSessions.delete(sessionID)
          recoveryAttempts.delete(sessionID)
        }
        return
      }

      if (event.type === "session.error") {
        const sessionID = (event.properties as any)?.sessionID
        const error = (event.properties as any)?.error
        if (!sessionID) return

        const attempts = recoveryAttempts.get(sessionID) ?? 0
        if (attempts >= MAX_RECOVERY_ATTEMPTS) {
          console.warn(
            `[jack-extras] session-recovery: session ${sessionID.slice(0, 8)} hit ${MAX_RECOVERY_ATTEMPTS} recovery attempts — backing off.`,
          )
          return
        }

        const errMsg = String(error?.message ?? error ?? "")
        const isTransient =
          /timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|503|502|429|overloaded|rate.?limit/i.test(
            errMsg,
          )
        if (!isTransient) return

        recoveryAttempts.set(sessionID, attempts + 1)
        console.warn(
          `[jack-extras] session-recovery: detected transient error in session ${sessionID.slice(0, 8)} (attempt ${attempts + 1}/${MAX_RECOVERY_ATTEMPTS}): ${errMsg.slice(0, 200)}`,
        )
        return
      }
    },

    "chat.message": async (input, output) => {
      try {
        const todoText = output.parts
          .filter((p) => p.type === "text")
          .map((p) => (p as any).text ?? "")
          .join("\n")

        if (!/\b(todo|task list|TODOs?)\b/i.test(todoText)) return

        const incompleteCount = (todoText.match(/\[ \]/g) ?? []).length
        if (incompleteCount === 0) return

        const reminder = `\n\n_[jack-extras: ${incompleteCount} incomplete TODO item(s) detected. Continue executing the task list — do not stop until all items are complete or you have a blocking question.]_`

        output.parts.push({
          type: "text",
          text: reminder,
        } as any)
      } catch {}
    },
  }
}
