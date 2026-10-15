# Progress

## 2026-10-15 — Integrate latest source into main

- Combined opening-DM button workflows, the permanent `messaging_postbacks` subscription fix, and all commits in upstream main `dca8713` while preserving CapRover publishing/deployment files.
- Resolved nine merge conflicts and integrated the opening-menu marker with upstream follow rechecks. Expanded the migration check for stored link positions and legacy clicks; enabled PostgreSQL suites in CI.
- Validation passed: 364 tests with PostgreSQL 16, typecheck, lint, production build, migration preservation and diff formatting. Added regression coverage for the interactions introduced by this merge.
- Next: push `main`, wait for CI/GHCR publication, verify image source revision and digest, then record completion. No production deployment is authorized by the build request.

## 2026-10-13 — Opening DM button subscriptions

- Cloned the fork into the previously empty workspace and based the fix on the deployed button-workflow feature branch.
- Diagnosed missing `messaging_postbacks` through source inspection and authenticated read-only Meta API calls for both accounts.
- Repaired both live account subscriptions and verified the result through GET read-back. Preserved their existing subscriptions.
- Changed the connection helper, added a regression test and corrected setup documentation. Relevant tests: 88 passed. Full suite: 270 passed across 26 files. Typecheck, lint, production build and diff formatting passed.
- Confirmed health and public callback verification. No live message delivery test has run. Operator confirmation of app-level webhook settings and a real button click are pending.
- Operator subsequently identified n8n as the existing Meta callback destination. Routing events to OpenReply remains pending; no n8n configuration was changed. Published commit `9d55197` and draft PR #4 against the deployed feature branch.
