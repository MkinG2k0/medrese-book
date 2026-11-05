# Phase 17 — Plan Check

**Checked:** 2026-11-05  
**Plans:** 17-01 … 17-04  
**Status:** FAILED (2 blockers, 4 warnings)

## Verdict

## PLAN CHECK FAILED

Plans are largely tracer-first, decision-aligned, and Nyquist-wired, but two blockers must be fixed before `/gsd-execute-phase 17`.

## Coverage Summary

| Requirement | Plans | Status |
|-------------|-------|--------|
| TUITION-01 | 01, 04 | Covered |
| TUITION-02 | 02, 04 | Covered |
| TUITION-03 | 03, 04 | Covered |
| TUITION-04 | 01 (D-10), 03, 04 | Covered |
| TEST-01 | 01–04 | Covered |
| TEST-04 | 01, 03, 04 | Partial — confirm E2E thin (warning) |

## Plan Summary

| Plan | Tasks | Files (listed) | Wave | depends_on | Estimate | Status |
|------|-------|----------------|------|------------|----------|--------|
| 01 | 3 (checkpoint + W0 + tracer) | 15 | 1 | [] | 52k (52%, low conf) | Valid struct; scope edge |
| 02 | 2 | 7 | 2 | 17-01 | 36k | Valid |
| 03 | 3 | 10 | 2 | 17-01 | 42k | Valid; D-09 gap |
| 04 | 2 (e2e + UAT) | 3 | 3 | 17-02, 17-03 | 38k | Valid; confirm step thin |

## Dimension Results

| Dim | Result |
|-----|--------|
| 1 Requirement coverage | PASS (IDs in frontmatter + tasks) |
| 2 Task completeness | PASS (auto/tracer have files/action/verify/done; checkpoints OK) |
| 3 Dependency correctness | PASS (acyclic; wave 2 parallel 02∥03 OK; no file clash) |
| 4 Key links planned | PASS with confirm-verify soft spot (see warnings) |
| 5 Scope sanity | WARNING — 17-01 at 15 files (intentional tracer) |
| 6 must_haves derivation | PASS (user-observable truths) |
| 7 Context compliance | **FAIL** — D-09 confirm UI incomplete |
| 7b Scope reduction | **FAIL** — D-09 “при confirm” reduced to list-only |
| 7c Architectural tiers | PASS vs RESEARCH map |
| 8 Nyquist | PASS (VALIDATION.md present; automated verifies; no MISSING/watch) |
| 9 Cross-plan contracts | PASS (month field flows 01→02/03→04) |
| 10 .cursor/rules | PASS (migration/tests/antd constraints referenced) |
| 11 Research resolution | **FAIL** — Open Questions not marked RESOLVED |
| 12 Pattern compliance | PASS (analogs in read_first/actions) |
| Review incorporation | SKIPPED (no REVIEWS.md) |

### Dimension 8: Nyquist Compliance

| Task | Plan | Wave | Automated Command | Status |
|------|------|------|-------------------|--------|
| Wave 0 units | 01 | 1 | targeted Vitest (expect RED) | ✅ |
| Tracer month | 01 | 1 | prisma validate + Vitest + tsc | ✅ |
| unpaid-months | 02 | 2 | unpaid-months.test.ts | ✅ |
| ParentPayForm | 02 | 2 | unpaid + tsc | ✅ |
| ROLE_ROUTES | 03 | 2 | match-role-route.test.ts | ✅ |
| debts page | 03 | 2 | debts unit + routes + tsc | ✅ |
| requests month | 03 | 2 | tsc only | ⚠️ weak |
| E2E | 04 | 3 | test:unit + tuition-month + cashier-role | ✅ (latency warning) |
| UAT | 04 | 3 | human checkpoint | — |

Sampling: Wave 1–3 implementation windows have ≥2/3 automated → ✅  
Wave 0 gaps mapped into plans 01/02/03/04 → ✅  
Overall Nyquist structure: ✅ PASS (with warnings below)

## Blockers (must fix)

**1. [research_resolution] RESEARCH.md Open Questions not closed**
- File: `17-RESEARCH.md`
- Section `## Open Questions` lacks `(RESOLVED)`; Q1/Q2 lack inline `RESOLVED` markers
- Plans already adopt A1 (OR multi-child) and Node≥22.22 / author-anyway — mark research closed
- Fix: Rename to `## Open Questions (RESOLVED)` and add `RESOLVED:` lines for both questions

**2. [context_compliance / scope_reduction] D-09 confirm UI incomplete**
- Plan: `17-03`
- Task: Show request.month on payment-requests list
- Locked D-09: show `month` in list **and at confirm**
- Plan/action only adds list column/Tag; PATTERNS.md also requires confirm modal content
- Fix: Extend 17-03 task 3 action + acceptance + must_haves to show `request.month` in confirm modal/dialog (display only; still copy month from DB on confirm)

## Warnings (should fix)

**1. [key_links_planned / TEST-04] Confirm regression not in 17-04 action steps**
- Plan: `17-04`
- must_haves claim create/confirm E2E; action covers create + optional request month visibility, not confirm→payment.month
- Fix: Add explicit E2E step: confirm pending request → assert created payment attributed to request.month (or toast/success without Zod error + month visible)

**2. [verification_derivation] Tracer verify does not assert confirm copies DB month**
- Plan: `17-01` tracer
- Acceptance requires confirm `month: request.month`; automated verify is schema/attribution/tsc only
- Fix: Add focused unit/integration assert (mock/tx fixture) or rely on expanded 17-04 confirm E2E and reference it in 17-01 acceptance cross-link

**3. [scope_sanity] Plan 01 lists 15 files**
- Intentional tracer-first slice; estimate 52% budget OK; confidence low
- Fix: optional — none required if tracer stays; monitor executor quality

**4. [nyquist 8b] Full Playwright gate ~100s**
- Acceptable as phase/wave gate; units already sample per task
- Fix: none required

## Structured Issues

```yaml
issues:
  - plan: null
    dimension: research_resolution
    severity: blocker
    description: "17-RESEARCH.md ## Open Questions lacks (RESOLVED) and inline RESOLVED markers for multi-child OR and E2E Node version"
    fix_hint: "Mark section ## Open Questions (RESOLVED); Q1 RESOLVED any-child OR (A1, locked in 17-02); Q2 RESOLVED prefer Node≥22.22, still author specs"

  - plan: "17-03"
    dimension: context_compliance
    severity: blocker
    task: 3
    description: "D-09 requires month on payment-requests list AND at confirm; plan only covers list column"
    user_decision: "D-09: В списке заявок и при confirm показывать month заявки"
    plan_action: "display month column/Tag near each request … before confirm"
    fix_hint: "Add confirm modal/dialog month display to 17-03 task 3 action, acceptance_criteria, and must_haves"

  - plan: "17-04"
    dimension: key_links_planned
    severity: warning
    task: 1
    description: "must_haves/TEST-04/D-11 claim create/confirm with month but action omits confirm journey"
    fix_hint: "Add E2E confirm step asserting month attribution after confirm"

  - plan: "17-01"
    dimension: verification_derivation
    severity: warning
    task: 3
    description: "Confirm copies request.month is acceptance truth but not covered by automated verify"
    fix_hint: "Add unit assert for confirm month copy or cross-link 17-04 confirm E2E"

  - plan: "17-01"
    dimension: scope_sanity
    severity: warning
    description: "15 files_modified at blocker threshold; acceptable for intentional tracer if left intact"
    metrics:
      tasks: 3
      files: 15
      estimate_ratio: 0.52
    fix_hint: "Keep tracer; optionally note in PLAN that file count is intentional"

  - plan: "17-04"
    dimension: nyquist_compliance
    severity: warning
    description: "Full E2E verify latency ~100s as phase gate"
    fix_hint: "Keep; units already provide fast per-task sampling"
```

## What already looks solid

- Tracer-first 17-01 with one-way `checkpoint:decision` + `[BLOCKING]` migrate SQL
- D-01…D-08, D-10, D-11 largely tasked with D-XX references
- Threat models T-17-01…07 + T-17-SC on plans
- No Phase 18 Saldo / v3.1 salary / Excel month creep
- VALIDATION.md + Wave 0 map aligned to real task IDs
- Parallel wave 2 (02 parent UI ∥ 03 debts) without shared-file races

## Recommendation

Revise 17-03 (D-09 confirm UI) + mark RESEARCH Open Questions resolved; optionally tighten 17-04 confirm E2E and 17-01 verify. Then re-run plan-checker.
