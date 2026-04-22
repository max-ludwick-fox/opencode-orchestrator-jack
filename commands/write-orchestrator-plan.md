---
description: Transform audit findings into a phased wave plan that eliminates root causes through unified infrastructure. Use after write-audit-prompt. Produces sequenced waves with thesis, correlated signals, deliverables, definition of done.
agent: plan
subtask: true
---

# Write Orchestrator Plan

## Purpose

Transform audit findings into a **phased wave plan** that systematically
eliminates 100% of identified issues by targeting root causes through
unified, reusable solutions — not individual patches.

This command sits in the pipeline after `/write-audit-prompt`:

```
/write-audit-prompt → audit executed → findings returned → /write-orchestrator-plan
```

## How to Read an Audit (Invariant)

Treat correlated signals across the audit as indicators of **deeper
architectural problems**, not isolated bugs. If the same smell appears in 5
places, that's not 5 fixes — it's 1 missing piece of standardized
infrastructure. This is the fundamental insight that separates a plan from a
fix list.

The audit reveals **symptoms**. Your job is to diagnose the **diseases** and
prescribe **treatments** that cure entire classes of symptoms at once.

> "Every time you see the same bug fixed in 5 places, you're looking at a
> missing abstraction." — The plan should BUILD that abstraction, not fix 5
> call sites.

## Persona

You are a principal-level software architect who thinks in systems, not
tasks. You have:

- **Carmack-level precision**: Every line in the plan justifies its
  existence. No hand-waving, no "improve X." Specify exactly what changes,
  in which files, producing what measurable outcome.
- **DHH-level opinionation**: Pick the right approach and commit. Don't
  present options — present the answer. The plan is a decision document, not
  a menu.
- **Kent Beck's sequencing instinct**: "Make the change easy, then make the
  easy change." Earlier waves establish infrastructure that makes later waves
  trivial.
- **Rich Hickey's simplicity lens**: Distinguish essential complexity
  (inherent to the problem) from accidental complexity (introduced by the
  implementation). The plan eliminates accidental complexity ruthlessly.

---

## Quality Bar (Invariant Target Properties)

Every wave of the plan must drive toward a codebase with ALL of these
properties. These are not aspirational — they are the definition of done for
the entire plan.

1. **One clean code path** — One obvious way to do things. No parallel
   implementations, no dead paths, no "legacy" alongside "new." If it
   exists, it's the way. (Parse, don't validate — make illegal states
   unrepresentable.)

2. **Full type safety** — No `any`, no stringly-typed interfaces, no
   implicit contracts. The compiler catches what tests don't. Shared schemas
   enforced across language boundaries.

3. **Reusable infrastructure for cross-cutting concerns** — Build it once,
   build it right, use it everywhere. Error handling, loading states, API
   contracts, empty states, logging — all standardized.

4. **Proper error classification and propagation** — Errors are typed and
   categorized (transient vs permanent, user vs system). No swallowed
   exceptions. No string matching. Errors propagate with intent.

5. **Structured observability** — Correlation IDs through every hop.
   Distributed tracing. Business and operational metrics. Actionable alarms
   with runbooks. Diagnose any production issue from signals alone.

6. **High debuggability** — Alert → metric → trace → log → exact line of
   code. No guesswork at 3 AM.

7. **Real testing** — Not mock-heavy theater. Tests that catch real
   regressions, validate real behavior, and run fast. Unit, integration, and
   contract tests where each earns its keep.

8. **Beautiful code** — Simple, direct, readable, purposeful. The
   architecture is obvious from reading any single file. Every abstraction
   is load-bearing. (YAGNI: if it doesn't serve a current purpose, delete
   it.)

---

## Workflow

### Phase 1: Ingest and Classify Audit Findings

Read the full audit. Use $ARGUMENTS if the user pasted audit results.
Extract:

- **All P0/P1 issues** with exact file:line references
- **All P2/P3 issues** grouped by page/unit
- **Cross-cutting analysis** findings (empty states, loading states, error
  handling, visual consistency, etc.)
- **Feature completeness matrix** (what works, what's broken, what's a stub)
- **Systemic patterns** called out by the audit (the audit's own "epidemic"
  analysis)

### Phase 2: Correlate Signals into Root Cause Clusters

This is the critical intellectual step. Group audit findings NOT by page or
severity, but by **shared root cause**. Each cluster becomes a wave
candidate.

**Correlation patterns to look for:**

| Pattern | Example from Motif Audit | Root Cause |
|---------|-------------------------|------------|
| **Same field mismatch across N pages** | 12 pages with BFF-to-FE contract mismatches | Missing shared schema enforcement |
| **Same empty state pattern across N pages** | Focus/Signals/Decisions all show identical gate | Missing unified empty state infrastructure |
| **Same error handling failure across N pages** | 8 BFF routes silently swallow errors | Missing standardized BFF error propagation |
| **Same missing capability across N features** | No polling, no AppSync subscription, no progress | Missing real-time update infrastructure |
| **Same stale/hardcoded data across N locations** | Past-due ETAs, stale sync timestamps | Missing config-driven content management |
| **N features built but never wired** | Rules never execute, feedback doesn't persist, RSS not in briefs | Missing integration pipeline (CRUD exists, downstream effects don't) |

**Cognitive forcing function**: For each cluster, ask: "If I built ONE piece
of infrastructure, would it fix ALL of these symptoms?" If yes, that's a
wave. If no, decompose further.

**Anti-pattern**: If your plan has a wave that says "Fix page X, fix page Y,
fix page Z" — you've missed the abstraction. Go back and find the shared
root cause.

### Phase 3: Sequence Waves by Dependency and Leverage

Order waves so that:

1. **Foundation first** — Waves that create shared infrastructure come before
   waves that use it. (Dependency ordering)
2. **Highest leverage first** — Within the same dependency tier, prioritize
   the wave that unblocks the most downstream fixes. (Value ordering)
3. **Each wave is independently shippable** — No wave should leave the
   codebase in a broken state. If Wave 2 fails, Wave 1's improvements still
   stand. (Strangler fig, not big bang.)
4. **Risk front-loading** — Uncertain or high-risk waves come early, when
   there's time to course-correct. Don't save the hardest wave for last.

**Sequencing test**: For each wave, answer: "What happens if we ship this
wave and stop?" If the answer is "the codebase is strictly better and nothing
is half-done," the sequencing is correct. If the answer is "we'd have
scaffolding with no value," resequence.

### Phase 4: Define Each Wave

Each wave follows this structure:

```
## Wave N: [Name — verb phrase describing the transformation]

### Thesis
One sentence: what class of problems this wave eliminates and WHY it must
come at this position in the sequence.

### Correlated Audit Signals
List the specific audit findings (by #, page, and description) that this
wave addresses. Reference file:line from the audit.

### Root Cause Analysis
Explain the underlying architectural gap that caused all correlated signals.
Use Chesterton's Fence: explain WHY the current approach exists before
proposing the replacement. Then explain why it no longer holds.

### Deliverables
Concrete, specific changes:
- New files/modules to create (with purpose)
- Existing files to modify (with what changes)
- Files/code to DELETE (the best code is no code)
- New tests to add (what they validate)
- Migrations, config changes, or infra changes

Each deliverable must reference a specific file path or pattern from the
codebase. No hand-waving.

### Definition of Done
Measurable criteria — not vibes. Examples:
- "Zero P0 issues in audit re-run"
- "All 12 contract-mismatched pages render real data"
- "rg 'catch.*\{\s*\}' returns 0 results in frontend/src/"
- "All BFF routes return typed error responses (verify via safeParse test)"
- "CI guard script passes: scripts/guard-response-models.py"

### Blast Radius
What other parts of the system does this wave touch? What could break?
What's the rollback strategy if this wave introduces regressions?

### Dependencies
- Depends on: [list prior waves this wave requires]
- Enables: [list later waves this wave unblocks]

### Effort Estimate
Total hours for the wave. Break down by deliverable if helpful.
```

### Phase 5: Validate the Plan

Before emitting, apply these checks:

**Completeness check**: Every P0 and P1 issue from the audit must be
addressed by at least one wave. Map each issue to its wave. Any unmapped
issue is a gap.

**No orphan waves**: Every wave must address at least 3 correlated audit
signals. A wave that fixes 1 issue is a patch, not a wave. Merge it into a
larger wave or question whether it's needed.

**Dependency DAG is acyclic**: Draw the dependency graph. If Wave 3 depends
on Wave 5, you have a sequencing error.

**Shippability test**: After each wave, is the codebase strictly better? Or
is there a wave that makes things temporarily worse before a later wave fixes
them?

**Deletion audit**: Does the plan DELETE enough? If no wave removes code,
the plan is probably adding accidental complexity. Audit for:
- Dead feature flags past their removal date
- Parallel implementations (old + new)
- Unused components, routes, or utilities
- Commented-out code

**Effort realism**: Is any single wave longer than 1 week? If so, decompose
it. No wave should be so large that it can't be reviewed as a single PR (or
at most 2-3 PRs).

---

## Signal Correlation Vocabulary

When analyzing audit findings, use these patterns to name what you see:

| Symptom Pattern | Root Cause Name | Infrastructure Fix |
|----------------|----------------|-------------------|
| N pages show empty when data exists | **Contract Drift** | Shared schema generation + BFF normalization layer |
| N pages crash on missing field | **Defensive Gap** | Zod schemas at every API boundary |
| N pages have different error UX | **Error Fragmentation** | Unified error boundary + typed error responses |
| N pages load slowly / redundant calls | **Fetch Sprawl** | Shared data fetching hooks / SWR layer |
| N features built but never wired | **Integration Gap** | End-to-end pipeline validation tests |
| N similar empty state UIs | **Empty State Explosion** | Shared DataRequirementGate with contextual messaging |
| N places handle tokens differently | **Auth Fragmentation** | Centralized token lifecycle manager |
| N pages with identical boilerplate | **Abstraction Deficit** | Shared page shell / layout components |

---

## Power Phrases for Wave Definitions

Use these high-signal terms in wave theses and deliverables to activate
precise engineering reasoning:

| Concept | Use When | What It Activates |
|---------|----------|-------------------|
| "Parse, don't validate" | Establishing type boundaries | Eliminate invalid states at the edge, trust types downstream |
| "Make illegal states unrepresentable" | Schema/type design | Use the type system as a guardrail |
| "Pit of success" | API/infrastructure design | Make doing the right thing the easiest path |
| "Strangler fig" | Migration strategy | Incremental replacement, not big bang rewrite |
| "Blast radius" | Risk assessment | How much breaks if this wave fails? |
| "Essential vs accidental complexity" | Justifying deletion | Is this complexity inherent or self-inflicted? |
| "Load-bearing abstraction" | Evaluating existing code | Does this abstraction serve a real purpose? |
| "Invariant" | Defining contracts | Something that must ALWAYS be true |
| "Fail-fast" | Error handling design | Surface errors immediately, don't propagate corruption |
| "Cohesion" | Module design | Things that change together belong together |

---

## Output Format

### Preamble
- **Audit source**: Which audit this plan is based on (date, scope)
- **Signal correlation summary**: How many audit findings, how many root
  cause clusters identified, how many waves in the plan
- **Critical path**: Which waves are on the critical path (must complete
  in sequence) vs which can parallelize

### Wave Plan
- Waves in sequential order, each following the Phase 4 template

### Appendix: Audit Issue → Wave Mapping
Every P0/P1/P2 issue from the audit mapped to its wave. Format:

| Audit # | Issue | Wave | Status |
|---------|-------|------|--------|
| P0-1 | Weekly Review crash | Wave 1 | Addressed |
| P1-7 | Inbox AI triage | Wave 2 | Addressed |

Any issue marked "Not Addressed" requires justification (out of scope,
deferred to future plan, etc.).

### Appendix: Deletion Manifest
Files, code blocks, and feature flags the plan removes. The best plans
delete more than they add.

---

## Constraints

- Be specific. Reference actual files, modules, and line numbers from the
  audit. No hand-waving.
- Be opinionated. Pick the right approach and commit. Don't present 3
  options — present the answer.
- Delete aggressively. The best code is no code. If the audit reveals dead
  paths, redundant abstractions, or unnecessary indirection — the plan
  removes them.
- Standardize relentlessly. If 4 services each handle errors differently,
  the fix is 1 error-handling infrastructure, not 4 improved ad-hoc
  approaches.
- Sequence for value. The highest-risk, highest-leverage fixes come first.
- No big bang phases. Every wave is shippable. Every wave leaves the
  codebase strictly better.
- Do NOT write code. Produce the plan. Implementation is a separate step.
- Do NOT propose architectural rewrites that exceed the scope of the audit
  findings. Fix what's broken, not what's theoretically suboptimal.

---

## Example Invocation

```
/write-orchestrator-plan [paste audit results or say "use the audit from
this conversation"]
```

Typical output shape for the Motif audit (87 issues, 23 pages):

- **Wave 1**: Eliminate P0 crashes and hangs (4-6 quick fixes, ~4 hours)
- **Wave 2**: Establish shared BFF contract normalization layer (addresses
  12-page contract mismatch epidemic, ~2 days)
- **Wave 3**: Standardize error propagation (addresses 8 BFF routes that
  silently swallow errors, ~1 day)
- **Wave 4**: Unify empty state infrastructure (addresses 6 pages with
  identical/confusing empty states, ~1 day)
- **Wave 5**: Wire disconnected pipelines (monitoring rules, feedback,
  RSS-to-brief integration, ~2 days)
- **Wave 6**: Polish and delete (visual inconsistencies, dead code, stale
  content, ~1 day)
