---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-10-06T06:20:06.125Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 261004-hip | unrun-verify | e2e/auth.spec.ts |  | Playwright e2e/auth.spec.ts not run: no .env.test/DB/server in worktree; config load TypeError | open |  | 2026-10-04T09:54:42.484Z |  |
| 2 | 261006-cl7 | unrun-verify | e2e/posts.spec.ts |  | Playwright CLI cannot load playwright.config.ts in this agent shell (context.conditions?.includes is not a function); teacher/manager/student posts spec rewritten as planned | open |  | 2026-10-06T06:20:06.125Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "261004-hip",
    "file": "e2e/auth.spec.ts",
    "line": null,
    "description": "Playwright e2e/auth.spec.ts not run: no .env.test/DB/server in worktree; config load TypeError",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-04T09:54:42.484Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "261006-cl7",
    "file": "e2e/posts.spec.ts",
    "line": null,
    "description": "Playwright CLI cannot load playwright.config.ts in this agent shell (context.conditions?.includes is not a function); teacher/manager/student posts spec rewritten as planned",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-06T06:20:06.125Z",
    "resolved_at": null
  }
]
````

