---
description: Generate a comprehensive audit orchestrator prompt for any product surface. Supports full-app sweeps, feature deep-dives, technical audits, user journeys, backend audits.
agent: plan
subtask: true
---

# Write Audit Prompt

## Purpose

Generate a **ready-to-execute audit orchestrator prompt** that decomposes a
product surface into parallel analysis units, applies priming questions to
force deep reasoning, and compiles findings into a prioritized action plan.

The generated prompt is designed to be pasted into a new conversation or
used as a Task tool prompt for an orchestrator agent that spawns subagents.

## Core Methodology (Invariant -- Always Applied)

Every generated audit prompt encodes these 8 structural techniques regardless
of scope or audit type:

1. **Stakeholder Gravity** -- Frame the audit around WHO will judge the
   findings and WHEN. An executive demo audit reports differently than a
   tech debt cleanup audit.

2. **Priming Questions Before Defects** -- Force each subagent to understand
   the PURPOSE of its unit before hunting bugs. This prevents low-value
   nitpick floods and ensures agents reason about intent.

3. **Per-Unit Specificity + Shared Schema** -- Each analysis unit gets custom
   file paths, known issues, and targeted questions. All units return the
   same structured format. Federated probes, unified compilation.

4. **Cross-Cutting Synthesis** -- Define dimensions that span multiple units
   to catch emergent/systemic issues invisible to any single probe.

5. **Fix Effort Estimation** -- Every issue gets an S/M/L/XL time estimate
   to make the output directly convertible to a sprint backlog.

6. **Action Plan Output** -- The deliverable is a prioritized action plan
   with clear tiers (must-fix, should-fix, defer), not just a flat bug list.

7. **Negative Space Analysis** -- Evaluate whether things should EXIST, not
   just whether they work. Dead features, redundant pages, and features
   behind impossible prerequisites are audit targets.

8. **Known-Issue Seeding** -- Pre-load each subagent with known issues from
   prior analysis so they go DEEPER from that baseline, not waste time
   rediscovering known problems.

9. **Lens Rotation** -- Each subagent evaluates its unit from multiple
   perspectives, not just "find bugs." Rotate through: first-time user,
   daily power user, skeptical executive, support engineer triaging a
   ticket. Different lenses surface different classes of defect.

10. **Adversarial Reasoning** -- Inject cognitive forcing functions that
    prevent shallow analysis: pre-mortems ("imagine this fails -- what
    killed it?"), Chesterton's Fence ("why was it built this way before
    you criticize?"), Five Whys ("what's the root cause, not the
    symptom?").

---

## Prompt Enhancement Layer

The generated prompt must include these elements to activate deep reasoning
in the executing agents. These are not decorative -- they steer the LLM
toward different reasoning clusters.

### Persona Anchoring

Assign evaluation personas in the generated prompt. Include this directive:

> "For each unit, evaluate from three lenses before listing issues:
> (1) A first-time user who has never seen this product -- what confuses
>     them in the first 5 seconds? (Don't Make Me Think -- Krug)
> (2) A skeptical VP evaluating whether to fund this -- what makes them
>     say 'this isn't ready'?
> (3) A QA engineer trying to break it -- what inputs, sequences, or
>     timing conditions cause failures?"

### Calibration Anchors

Set the quality bar explicitly. Include a directive like:

> "Rate each unit's polish against [best-in-class comparable product].
> A dashboard page should be compared to Linear or Notion. A chat
> interface should be compared to ChatGPT or Claude. A calendar should be
> compared to Fantastical or Google Calendar. If the unit wouldn't survive
> a side-by-side comparison, that IS the finding."

Adapt the reference products to the domain. The point is to anchor
evaluation against a high bar, not the project's own past.

### Anti-Sycophancy Directive

LLMs default to generous evaluation. Counteract this with:

> "Do NOT give credit for 'almost working.' A feature that is 90%
> implemented but crashes on the last step is BROKEN, not 'partially
> working.' A page that loads but shows no useful content is EMPTY, not
> 'displaying an onboarding state.' Be Carmack-level precise: describe
> exactly what you expected, exactly what you found, and exactly where
> the gap is. Broken windows matter -- small visible defects erode trust
> in the entire product."

### Cognitive Forcing Functions

Inject these reasoning patterns into the global priming section:

- **Pre-mortem**: "Imagine the stakeholder sees this page and loses
  confidence. What specifically caused that reaction?"
- **Chesterton's Fence**: "Before flagging something as wrong, state WHY
  you think it was built this way. Then explain why that reasoning no
  longer holds."
- **Five Whys**: "For every P0/P1 issue, trace the root cause. Don't stop
  at 'the API returns null.' Ask WHY it returns null."
- **Jobs-to-be-done**: "What is the user HIRING this page/feature to do?
  Is that job actually getting done?"

### High-Signal Vocabulary

When generating priming questions and analysis instructions, prefer these
terms -- they activate richer reasoning patterns than generic alternatives:

| Instead of | Use | Why |
|------------|-----|-----|
| "Is the UX good?" | "Does this respect the user's cognitive load?" | Activates usability heuristics |
| "Are there errors?" | "What are the failure modes and are they handled gracefully?" | Activates reliability engineering |
| "Is it consistent?" | "Does this follow the principle of least surprise?" | Activates convention-compliance reasoning |
| "Is it done?" | "Does this meet a definition of done?" | Activates completeness checking |
| "Is it fast?" | "What is the time-to-interactive and where are the bottlenecks?" | Activates performance profiling |
| "Does it look right?" | "Does this have the affordances users expect?" | Activates interaction design reasoning |
| "Is there too much?" | "Does this violate YAGNI? Is complexity load-bearing or accidental?" | Activates simplification reasoning |
| "What's missing?" | "What would make this achieve product-market fit for its audience?" | Activates product-thinking |

---

## Workflow

### Phase 0: Determine Audit Type and Scope

This is the critical first step. The user's request (or $ARGUMENTS) tells
you WHAT to audit. Classify into one of these types:

| Audit Type | Decomposition Unit | When to Use |
|------------|-------------------|-------------|
| **Full-App Sweep** | Pages / Views | Pre-demo, quarterly QA, onboarding |
| **Feature Deep-Dive** | Pipeline stages / components | One feature is broken or complex |
| **User Journey** | Journey steps (sequential) | Onboarding, purchase flow, setup wizard |
| **Technical Dimension** | Code locations by concern | Error handling, caching, auth, a11y |
| **Backend Audit** | Endpoints / workers / queues | API consistency, data integrity |
| **Design System** | Component categories | Visual consistency, reuse, a11y |
| **Infrastructure** | Stacks / services / configs | Pre-deploy, cost, security |

If the user doesn't specify, default to **Full-App Sweep** but ask:
"I'll generate a full-app audit. Want to narrow the scope to specific
pages, features, or concerns instead?"

The audit type determines:
- What units you decompose into (and thus how many subagents)
- Which priming question categories to include
- Which cross-cutting dimensions apply
- How the action plan is framed

### Phase 1: Gather Context

Collect these inputs. Use $ARGUMENTS if provided. Read the codebase to fill
gaps. Ask the user only if critical info is missing and can't be inferred.

**Always required:**
- **Product identity**: Name, one-line description, target users
- **Tech stack**: Frontend, backend, infra (read from package.json, pyproject.toml, etc.)
- **Stakeholder context**: Who reads this audit? What's the deadline? What does "good enough" mean?
- **Known issues**: Bugs, crashes, complaints, recent risky refactors

**Required based on audit type:**

| Audit Type | Additional Context Needed |
|------------|--------------------------|
| Full-App Sweep | Page/view inventory with URL patterns and component paths |
| Feature Deep-Dive | Feature's data flow: entry point → processing → storage → display |
| User Journey | Step-by-step flow with branching paths and failure modes |
| Technical Dimension | All code locations where the concern appears (grep/search) |
| Backend Audit | Route inventory, middleware chain, worker/queue topology |
| Design System | Component inventory, token/theme files, usage locations |
| Infrastructure | Stack inventory, deployment pipeline, environment configs |

**Always gathered (by reading codebase):**
- Directory structure and file organization conventions
- Where tests live (absence of tests is itself a finding)
- AGENTS.md, README, or similar project documentation

### Phase 2: Generate Priming Questions

Construct TWO levels of priming questions.

**Global priming questions** (every subagent answers these):

Select 10-20 questions from the categories below based on audit type.
NOT all categories apply to every audit type.

| Category | Applies To | Example Questions |
|----------|-----------|-------------------|
| **Purpose & Value** | All types | What is this unit's primary purpose? If removed, what breaks? Is value delivered or aspirational? |
| **User Journey** | Full-App, Journey, Design | How does a user arrive here? Is the primary action obvious in 3s? Where do they go next? |
| **Visual & Interaction** | Full-App, Journey, Design | Does this look finished? Are loading/error states present? Is there dead UI? |
| **Data Flow & Integrity** | Feature, Backend, Infra | Where does data originate? What transformations happen? What happens on partial failure? |
| **Code Quality** | All types | TODOs? Uncaught exceptions? Silent failures? Dead code? |
| **Performance** | All types | How many calls on mount/invocation? Redundant fetches? Time to usable? |
| **Reliability & Error Handling** | Feature, Backend, Infra, Dimension | What happens when X fails? Is the error surfaced or swallowed? Is retry logic correct? |
| **Security & Auth** | Backend, Infra, Dimension | Is input validated? Are permissions checked? Can user A access user B's data? |
| **Consistency & Conventions** | All types | Does this follow the project's established patterns? Where does it deviate and why? |

**Per-unit priming questions** (unique to each subagent):

For each analysis unit, generate 3-7 targeted questions based on:
- What the unit claims to do vs what the code actually does
- Known issues from prior analysis (seed these explicitly)
- Interaction/integration patterns unique to this unit
- External dependencies that could fail

### Phase 3: Build Subagent Assignments

For each analysis unit, generate a subagent block:

```
### SUBAGENT N: [Unit Name]
**Scope**: [One sentence: what this subagent analyzes]

**Files to read:**
- [5-15 specific file paths relevant to this unit]

**Unit-specific priming:**
- [3-7 targeted questions from Phase 2]

**Known issues:**
- [Pre-seed with any known bugs, complaints, or prior findings]
```

**Rules for file lists:**
- Prefer specific paths over globs
- Include both the "surface" file (component, route) and its dependencies
  (stores, hooks, services, backend handlers)
- Include test files if they exist
- Use "or similar" when exact path is uncertain

**Subagent count guidance:**
- Full-App Sweep: 1 per page/view (typically 10-30)
- Feature Deep-Dive: 1 per pipeline stage (typically 3-8)
- User Journey: 1 per journey step (typically 4-10)
- Technical Dimension: 1 per code area where the concern appears (typically 5-15)
- Backend Audit: 1 per route group or worker (typically 5-20)
- Never exceed 25 subagents. Group related units if needed.

### Phase 4: Define Cross-Cutting Analysis

Select 4-8 cross-cutting dimensions from the catalog below. Choose dimensions
that are RELEVANT to the audit type. Do not include all of them.

| Dimension | Applies To | What It Catches |
|-----------|-----------|-----------------|
| **Navigation & IA** | Full-App, Journey | Illogical sidebar order, orphaned pages, confusing entry points |
| **Empty State Taxonomy** | Full-App, Journey | Classify every empty state: onboarding gate vs no-data vs broken vs unimplemented |
| **Loading State Audit** | Full-App, Feature, Journey | Missing skeletons, stuck spinners, flash of empty content |
| **Error Handling Consistency** | All types | Silent swallowing, inconsistent error UI, missing boundaries |
| **Performance Hotspots** | All types | Redundant API calls, slow pages, N+1 queries, bundle bloat |
| **Feature Completeness Matrix** | Full-App, Feature | Per-unit status table: Working / Partial / Broken / Stub / Gate |
| **Visual Consistency** | Full-App, Design | Colors, spacing, typography, card styles, button patterns |
| **API Contract Consistency** | Backend, Feature | Response shapes, error formats, auth patterns, pagination |
| **Data Flow Integrity** | Feature, Backend | Orphaned writes, stale caches, race conditions, lost updates |
| **Test Coverage Gaps** | All types | Units with zero tests, critical paths without assertions |
| **Dead Code & Feature Flags** | All types | Unused imports, permanently-off flags, commented-out blocks |
| **Accessibility** | Full-App, Design, Journey | Missing labels, contrast, keyboard nav, focus management |
| **Security Surface** | Backend, Infra | Unvalidated inputs, missing auth checks, exposed internals |

Add 1-2 domain-specific dimensions based on the product:
- AI products: "AI Response Quality", "Hallucination Risk", "Prompt Robustness"
- Dashboard products: "Data Freshness", "Metric Accuracy"
- Collaboration products: "Multi-user Consistency", "Conflict Resolution"

### Phase 5: Define Output Schema

Every generated prompt MUST specify these elements:

**Per-subagent output format:**
```
## Unit: [Name]
### Files Analyzed: [list]

### Priming Answers
[Answers to global + unit-specific questions]

### Issues Found
| # | Sev | Category | Description | File:Line | Fix | Effort |
|---|-----|----------|-------------|-----------|-----|--------|

### Readiness Assessment
- Status: [Ready / Needs Work / Broken / Should Hide]
- Blockers: [P0/P1 issues]
- Quick wins: [P2/P3 fixable in <30 min]
```

**Severity taxonomy (always these 5 levels):**
- **P0**: Crash, hang, data loss, security vulnerability
- **P1**: Broken core feature, failed API, missing data that should exist
- **P2**: Visual regression, confusing UX, degraded performance
- **P3**: Polish (spacing, icons, copy), non-blocking warnings
- **P4**: Nice-to-have, tech debt, future improvement

**Category vocabulary (select relevant subset):**
`crash`, `hang`, `bug`, `empty-state`, `dead-code`, `missing-feature`,
`visual-regression`, `performance`, `accessibility`, `security`,
`inconsistency`, `overengineering`, `unclear-ux`, `data-integrity`,
`api-contract`, `test-gap`, `stale-content`

**Effort estimates:** S (<30 min), M (1-4 hrs), L (4-8 hrs), XL (>1 day)

### Phase 6: Define Compilation Instructions

Tell the orchestrator how to merge subagent results. Always include:

1. **Merge** all issues into a single table, deduplicating across units
2. **Sort** by severity (P0 first), then by number of units affected
3. **Group** cross-cutting issues that appear in 3+ units
4. **Create** the feature/unit completeness matrix
5. **Create** a prioritized action plan with tiers:

| Tier | Label | Criteria |
|------|-------|----------|
| 1 | Must fix | P0 + P1 that block the stated goal |
| 2 | Should fix | P2 that affect perceived quality |
| 3 | Defer | P3/P4 or issues outside the stated scope |

Adapt the tier labels to stakeholder context:
- Demo prep: "Must fix before demo", "Should fix", "Hide from demo"
- Release: "Release blocker", "Release improvement", "Post-release"
- Tech debt: "High-leverage cleanup", "Medium-leverage", "Low-priority"

6. **Create** a stakeholder risk section -- things the intended audience
   would notice and judge negatively, framed from THEIR perspective.

### Phase 7: Assemble and Emit

Assemble into a single prompt with this skeleton:

```
# [PRODUCT] [AUDIT TYPE] AUDIT

## Context
[Product, tech stack, stakeholder, deadline]

## Your Role
[Orchestrator: spawn N subagents, compile findings]

## Evaluation Standards
[Persona anchoring: 3 lenses]
[Calibration anchor: best-in-class comparison product]
[Anti-sycophancy directive]
[Cognitive forcing functions: pre-mortem, Chesterton's Fence, Five Whys]

## Global Priming Questions
[10-20 questions using high-signal vocabulary]

## Subagent Assignments
### SUBAGENT 1: [Unit]
...
### SUBAGENT N: [Unit]

## Cross-Cutting Analysis
[4-8 selected dimensions]

## Per-Subagent Output Format
[Schema with severity, category, effort]

## Compilation Instructions
[Merge, dedup, tier, risk section]

## Constraints
[Read-only, no skipping, brutal honesty, effort estimates]
```

---

## Quality Checklist

Before emitting, verify:

- [ ] Audit type is explicitly stated and scope matches the request
- [ ] Every unit in scope has a subagent with real file paths
- [ ] Global priming questions are relevant to the audit type
- [ ] Per-unit priming references known issues where applicable
- [ ] Cross-cutting dimensions are relevant (not all of them every time)
- [ ] Output schema defines severity, category, and effort
- [ ] Compilation produces a tiered action plan, not a flat list
- [ ] Stakeholder context is embedded throughout
- [ ] Constraints specify read-only operation
- [ ] Total subagent count is stated explicitly
- [ ] Persona anchoring directive is included (3 evaluation lenses)
- [ ] Calibration anchor names a specific best-in-class comparison product
- [ ] Anti-sycophancy directive is present ("do not give credit for almost")
- [ ] At least 2 cognitive forcing functions are injected (pre-mortem, etc.)
- [ ] High-signal vocabulary is used in priming questions (not generic)

---

## Output Format (Your Response)

Return:
1. **Audit scope**: "[Type]: [N] [units], [tech stack], [deadline/goal]"
2. **The complete audit prompt** in a single fenced code block
3. **Usage note**: Where to paste it (new conversation, Task tool, etc.)

---

## Constraints

- Generate the PROMPT. Do NOT execute the audit yourself.
- Do NOT hallucinate file paths. Read the codebase to discover real paths.
- Do NOT emit placeholder subagents ("TODO: add files").
- Do NOT exceed 25 subagents. Group related units if needed.
- DO read the project's AGENTS.md/README and directory structure first.
- DO seed known issues from conversation history or $ARGUMENTS.
- DO tailor priming questions to the product domain and audit type.
- DO ask the user about scope if $ARGUMENTS is ambiguous -- but provide
  a default ("I'll do a full-app sweep unless you want to narrow it").

---

## Example Invocations

**Full-App Sweep (pre-demo):**
```
/write-audit-prompt Full-app sweep for Motif. Executive demo next Tuesday.
Known bugs: meeting intelligence hangs, weekly review crashes, relationships
always blank. Recent widget refactor has perf regression.
```

**Feature Deep-Dive:**
```
/write-audit-prompt Audit the brief generation pipeline end-to-end.
It's been unreliable -- briefs sometimes show empty sections, narrative
generation times out, and the streaming proxy drops events.
```

**Technical Dimension:**
```
/write-audit-prompt Audit error handling across the entire frontend.
Check every API call site, every error boundary, every catch block.
We're seeing silent failures in production.
```

**User Journey:**
```
/write-audit-prompt Audit the new user onboarding journey. From first
login through connector setup, first brief generation, and first chat.
Users are dropping off after connecting Outlook.
```

**Backend Audit:**
```
/write-audit-prompt Audit all FastAPI routes in agents/routers/. Check
response models, error handling, auth, rate limiting, and caching
consistency. We recently added 6 new routers without review.
```
