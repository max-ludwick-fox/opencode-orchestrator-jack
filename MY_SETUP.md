# My OpenCode Setup — Personal Reference

> **This file lives only on the `my-customizations` branch.** It documents everything YOU added on top of Jack's orchestrator so you never have to reconstruct it. If you ever get confused, start here.

---

## TL;DR — The 30-Second Version

- Jack's orchestrator config is cloned into `~/.config/opencode/` (the OpenCode config dir itself is the git repo).
- You work on branch `my-customizations` by default. `master` is a pristine mirror of Jack's upstream.
- Your customizations: Bedrock/OpenAI prompt caching, `@latest` stripped from uvx MCPs, 4 lifecycle hooks in `plugin/jack-extras/`, personal slash commands in `commands/`.
- To run opencode: just type `opencode`. It already uses this config.
- Before pulling Jack's updates: switch to `master` first, pull there, then merge into `my-customizations`.

---

## Branch Layout

```
master              ← pristine mirror of https://github.com/jackmazac/opencode-orchestrator-jack
my-customizations   ← YOU ARE HERE. Everything YOU added lives here.
```

Check what branch you're on:
```bash
cd ~/.config/opencode && git branch --show-current
```

---

## What's on `my-customizations` (and NOT on master)

### 1. Prompt caching enabled (`opencode.json` → `provider`)

Added a `provider` block enabling `setCacheKey: true` for `amazon-bedrock`, `openai`, and `anthropic`. Per AWS docs, this gives **up to 85% latency reduction** on cached prefixes (system prompts, tool defs, stable context). Cache TTL is 5 minutes; resets on each hit.

### 2. Stripped `@latest` from 10 uvx MCPs (`opencode.json` → `mcp`)

AWS Labs documents that `@latest` on `uvx` commands forces a PyPI version check on every launch, adding 30–50 seconds to startup. Stripped from all 10 `awslabs.*` MCPs + `chrome-devtools-mcp`. Kept `@latest` on the 3 npm-based plugins (different cache model, not the same perf hit).

**Tradeoff:** uvx will NOT auto-update these MCPs. To manually update when you want newer versions:
```bash
uvx awslabs.cloudwatch-mcp-server@latest --help   # forces re-check for this one
# repeat for any MCP you want to bump
```

### 3. `plugin/jack-extras/` — 4 lifecycle hooks

Native OpenCode plugin written in TypeScript. Registered in `opencode.json` as `./plugin/jack-extras/index.ts`.

| Hook | Fires on | Purpose |
|---|---|---|
| `tool-output-truncator` | `tool.execute.after` | Caps bash/read/grep/glob outputs at 50KB (keeps first 8KB + last 4KB + "N chars truncated" marker). Protects context from runaway outputs. |
| `context-window-monitor` | `session.idle` | Warns in console at 75%/85%/95% context fill so you know to `/compact` or wrap up. |
| `session-recovery` | `session.error` | Detects transient errors (429/502/503, timeouts, "overloaded") and logs recovery attempts. Backs off after 3 attempts. |
| `todo-continuation-enforcer` | `chat.message` | If response contains `[ ]` markers, injects a reminder to keep going until all TODOs are done. |

**Tuning:** edit `plugin/jack-extras/index.ts` — constants at the top:
```ts
const TRUNCATE_THRESHOLD = 50_000   // chars before truncation kicks in
const TRUNCATE_HEAD = 8_000          // chars preserved from start
const TRUNCATE_TAIL = 4_000          // chars preserved from end
const CONTEXT_WARN_THRESHOLDS = [0.75, 0.85, 0.95]
const MAX_RECOVERY_ATTEMPTS = 3
```

### 4. `commands/` — personal slash commands

- `/improve-prompt` — prompt refinement helper
- `/write-audit-prompt` — generate audit prompts
- `/write-orchestrator-plan` — generate orchestrator plans

### 5. `plugin/shell-strategy/shell_strategy.md`

Workaround: Jack's upstream removed this file but `opencode.json` still references it in the `instructions` array. Kept locally.

### 6. `opencode-notifier-state.json` — gitignored

The `@mohak34/opencode-notifier` plugin writes this file on every turn (runtime noise). Added to `.gitignore` so git stops showing it as "modified" after every session.

### 7. `.env` changes (NOT in git — `.env*` is gitignored)

Location: `~/.config/opencode/.env`

```
AWS_BEARER_TOKEN_BEDROCK=<your-bedrock-api-key>
AWS_REGION=us-east-1
AWS_PROFILE=prod
```

`AWS_PROFILE=prod` is the **default** for all AWS MCPs. To switch accounts for a session:

```bash
AWS_PROFILE=bcl-dev opencode   # uses bcl-dev profile for this session
```

All AWS MCPs in `opencode.json` use `{env:AWS_PROFILE}` and `{env:AWS_REGION}` so they respect this.

---

## Daily Workflow

### Just use opencode normally
```bash
opencode
```
That's it. You're on `my-customizations`; your config is active.

### Check you're on the right branch
```bash
cd ~/.config/opencode && git branch --show-current
# should print: my-customizations
```

### Switch to vanilla Jack's for A/B testing
```bash
cd ~/.config/opencode && git checkout master
opencode   # now runs vanilla Jack's config
cd ~/.config/opencode && git checkout my-customizations
opencode   # back to your customized version
```

### Switch AWS accounts mid-work
Can't hot-swap (MCPs load at startup). Either:
```bash
AWS_PROFILE=bcl-dev opencode   # new session with different account
```
Or edit `~/.config/opencode/.env` and restart opencode.

---

## Pulling Jack's Updates (the important one)

**Never `git pull` while on `my-customizations`.** Your changes and Jack's will fight over `opencode.json` every single time.

The clean workflow:

```bash
cd ~/.config/opencode

# 1. Switch to pristine branch
git checkout master

# 2. Pull Jack's updates (conflict-free — master has no local changes)
git pull

# 3. Go back to your branch
git checkout my-customizations

# 4. Merge Jack's updates into your customizations
git merge master
#    If there are conflicts (likely in opencode.json): resolve them,
#    then:
#    git add opencode.json
#    git commit
```

When resolving opencode.json conflicts, remember:
- The `provider` block is YOURS — keep it.
- `@latest` stripped from `awslabs.*` MCPs is YOURS — keep the stripped version.
- `./plugin/jack-extras/index.ts` in the plugin array is YOURS — keep it.
- Agent model IDs, MCP definitions, etc. — usually take Jack's newer version.

---

## What Each Plugin in `opencode.json` Actually Does

```json
"plugin": [
  "@nick-vi/opencode-type-inject",          // auto-injects TS types into prompts
  "@tarquinen/opencode-dcp@latest",         // Dynamic Context Pruning (Jack's stack)
  "@franlol/opencode-md-table-formatter@latest",  // makes markdown tables render in TUI
  "@mohak34/opencode-notifier@latest",      // desktop notifications on session events
  "./plugin/jack-extras/index.ts"           // YOUR hooks (truncator, monitor, recovery, todo-enforcer)
]
```

---

## How OpenCode Loads This Config

1. OpenCode CLI starts (`~/.opencode/bin/opencode` — version 1.14.20).
2. Reads `~/.config/opencode/opencode.json`.
3. Loads `.env` from `~/.config/opencode/.env`.
4. Loads each plugin in the `plugin` array (npm packages pulled from node_modules, local paths loaded directly).
5. Starts all MCPs in parallel (most are `uvx awslabs.*-mcp-server`).
6. Injects the agent config, prompts from `prompts/`, skills, etc.
7. You interact with the primary agent (`orchestrator`), which delegates to subagents via the `task` tool.

---

## Known Issues & Workarounds

### OpenCode startup can still feel slow
Even with Tier A fixes applied, startup involves:
- Loading ~13 MCPs (8 AWS ones all spinning up Python envs)
- Multi-agent orchestration inherently fans out work

If it feels too slow, the next levers would be:
- **`experimental.mcp_lazy: true`** in `opencode.json` — UI appears instantly, MCPs load on demand. Experimental; changes how tools are surfaced.
- **Switch Anthropic agents from Bedrock to direct API** — saves 50–150ms/call but requires `ANTHROPIC_API_KEY`.
- **Prune the uv cache** when Cursor is closed (see below).

### `uv cache prune` hits a lock
The uv cache has bloat (942 abandoned `.tmp` dirs). `uv cache prune` can't run while other uv processes hold the lock (Cursor's MCPs). Run it when Cursor is closed:
```bash
# Quit Cursor first, then:
uv cache prune
```
Expected win: 5–20s off cold MCP starts.

### `github` MCP is present but non-functional
`opencode.json` references `{env:GITHUB_PERSONAL_ACCESS_TOKEN}` which isn't set. Either set that env var, or use the `gh` CLI directly via the bash tool (works fine because you're already authed via `gh auth login`).

### OMO (`oh-my-opencode`) was researched but NOT installed
You considered installing the popular `oh-my-opencode` plugin. Reasons you didn't:
- Community benchmark: 69% vs 73% pass rate vs vanilla (3.5× more requests, 10 min slower on real tasks)
- 15–25k token overhead at idle (vs ~0 for our cherry-picked hooks)
- Known billing risk (Gemini infinite-loop incident, $438 user bill)
- Would overwrite Jack's per-agent model pinning

The 4 `jack-extras` hooks capture what's actually useful from OMO (hooks, recovery, truncation) without any of the above downsides.

---

## Rollback / Emergency Recovery

### Full rollback to origin/master (throw away everything you added)
```bash
cd ~/.config/opencode
git checkout master
# Now opencode runs vanilla Jack's.
# Your my-customizations branch still exists — return with `git checkout my-customizations`.
```

### Undo a single customization
If one specific change is causing problems:
```bash
cd ~/.config/opencode
git log --oneline origin/master..my-customizations
# Find the commit SHA you want to undo, e.g. 2b01eaa
git revert 2b01eaa   # creates a new commit that reverses it
```

### Pre-Tier-A filesystem snapshot
Before we touched anything, snapshots were saved at:
```
/tmp/opencode-pre-tier-a-20260421-230008-opencode.json
/tmp/opencode-pre-tier-a-20260421-230008-env
```
These may get cleared on reboot — if you want them preserved long-term, copy them somewhere safe.

---

## Machine Migration Checklist

If you ever move to a new machine and need to reproduce this setup:

1. Install OpenCode: `curl -fsSL https://opencode.ai/install | bash`
2. Install bun: `curl -fsSL https://bun.sh/install | bash`
3. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
4. Install gh + `gh auth login`
5. Install AWS CLI v2 + `aws configure` (or SSO setup for `prod` profile)
6. Clone this repo (fork it first if you want remote backup):
   ```bash
   mv ~/.config/opencode ~/.config/opencode.bak 2>/dev/null || true
   git clone https://github.com/jackmazac/opencode-orchestrator-jack.git ~/.config/opencode
   cd ~/.config/opencode
   # Then restore YOUR branch — but since we haven't pushed to a remote yet,
   # you'd need to re-create my-customizations from this doc or from a
   # fresh patch you export beforehand.
   ```
7. Create `.env` (see "What's on `my-customizations`" → `.env` section above)
8. `bun install`
9. `opencode` — should just work

**Not pushing `my-customizations` to any remote is the one gap in this setup.** If machine migration ever comes up, consider forking Jack's repo to your own GitHub and pushing the branch there.

---

## Commits on This Branch

```
d9368de feat: add shell-strategy instruction file
bad972a feat: add personal slash commands
2b01eaa feat: Tier A perf tuning + jack-extras lifecycle hooks
9b27d79 chore: gitignore opencode-notifier runtime state file
```

All sit on top of Jack's `origin/master` (`7fb50d7` at the time this doc was written).

---

## Useful One-Liners

```bash
# See exactly what you customized on top of Jack's
cd ~/.config/opencode && git diff master..my-customizations --stat

# See which files differ
cd ~/.config/opencode && git diff master..my-customizations --name-only

# Full diff of a single file
cd ~/.config/opencode && git diff master..my-customizations -- opencode.json

# Update this doc after making changes
cd ~/.config/opencode && $EDITOR MY_SETUP.md && git add MY_SETUP.md && git commit -m "docs: update MY_SETUP"

# Check opencode version
opencode --version

# Force reload all MCPs (restart opencode session)
# Just quit and re-run `opencode`

# List all MCPs configured
cd ~/.config/opencode && jq -r '.mcp | keys[]' opencode.json

# List all agents and their models
cd ~/.config/opencode && jq -r '.agent | to_entries | map("\(.key): \(.value.model)") | .[]' opencode.json
```

---

## Key Files Reference Map

```
~/.config/opencode/
├── opencode.json              ← main config (agents, providers, mcps, plugins)
├── .env                       ← API keys (gitignored)
├── .gitignore                 ← includes opencode-notifier-state.json
├── README.md                  ← Jack's README (don't edit, will conflict on pull)
├── MY_SETUP.md                ← THIS FILE (your reference)
├── dcp-escape-hatches.md      ← Jack's DCP docs
├── prompts/                   ← agent prompt templates (Jack's)
├── skills/                    ← skill definitions (Jack's)
├── tools/                     ← custom tools (Jack's: journal, plan, audit, etc.)
├── commands/                  ← YOUR personal slash commands (my-customizations only)
├── plugin/
│   ├── shell-strategy/        ← YOUR workaround
│   └── jack-extras/           ← YOUR 4 hooks
├── package.json               ← bun deps (pinned to @opencode-ai/plugin 1.14.18)
└── node_modules/              ← installed plugin deps (gitignored)
```

---

_Last updated: when you added prompt caching, jack-extras hooks, and set up the my-customizations branch. Update this file whenever you add something new so future-you can find it._
