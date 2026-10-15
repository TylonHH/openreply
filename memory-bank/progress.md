# Progress

## 2026-10-13 — Opening DM button subscriptions

- Cloned the fork into the previously empty workspace and based the fix on the deployed button-workflow feature branch.
- Diagnosed missing `messaging_postbacks` through source inspection and authenticated read-only Meta API calls for both accounts.
- Repaired both live account subscriptions and verified the result through GET read-back. Preserved their existing subscriptions.
- Changed the connection helper, added a regression test and corrected setup documentation. Relevant tests: 88 passed. Full suite: 270 passed across 26 files. Typecheck, lint, production build and diff formatting passed.
- Confirmed health and public callback verification. No live message delivery test has run. Operator confirmation of app-level webhook settings and a real button click are pending.
- Operator subsequently identified n8n as the existing Meta callback destination. Routing events to OpenReply remains pending; no n8n configuration was changed. Published commit `9d55197` and draft PR #4 against the deployed feature branch.
