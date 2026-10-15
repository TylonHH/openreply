# Active Context

## Main integration and image publication — 2026-10-15

- The operator authorized merging all discussed updates into `main` and building/publishing the GHCR image. Scope: opening-DM workflows through `bb07d45`, the permanent subscription fix through `38a633b`, and upstream main `dca8713` (2026-10-05). Open upstream PRs are outside this integration.
- Integrated in a separate worktree to preserve the original checkout's uncommitted n8n documentation and memory changes. Resolved nine conflicts, retaining workflow target scoping, explicit-choice read guards, transactional link saves, durable delivery claims, follow rechecks and localization.
- New configured Continue buttons carry upstream's `:open` marker, so first-time non-followers receive the follow prompt immediately. Existing unmarked payloads remain supported.
- Full suite: 364 tests passed with disposable PostgreSQL 16, including combined workflow/link saves, duplicate route events, distinct taps and ambiguous opening-menu delivery. Typecheck, lint, production build and legacy-to-latest migration checks passed. CI now enables the database suites rather than skipping them.
- Publication uses the existing GHCR workflow on `main`; record its final run, revision and digest after completion. Deployment, production database migrations and Meta/n8n configuration changes are outside this request.

## Opening DM continuation failure — 2026-10-13

- The deployed web app and worker use `ghcr.io/tylonhh/openreply:button-workflows-test`, corresponding to the `feat/opening-dm-button-workflows` branch. Local fix branch: `codex/fix-opening-dm-button`.
- Both connected Meta accounts had only `comments` and `messages` in their live account subscriptions. `subscribeInstagramAccountToWebhooks` omitted `messaging_postbacks`, so button clicks could not reach the worker.
- Added `messaging_postbacks` to both live account subscriptions through Meta's API. Both returned HTTP 200 / success and GET read-back confirmed all three fields. Existing fields were preserved. No DM was sent, service restarted, image deployed, or database data changed by this repair.
- The web app, worker, PostgreSQL and Redis are healthy. Callback verification at `https://openreply.caprover.drrene.de/api/webhook` returns HTTP 200 and the expected challenge without redirect.
- The database contained zero `WebhookEvent` rows and zero reveal logs at diagnosis. Comment polling explains the opening DMs. App-level webhook configuration remains unverified; an app-subscription GET using the configured Instagram app credentials was rejected. Asked the operator to confirm the callback, Live mode and `messaging_postbacks` in Meta's dashboard.
- Permanent source fix includes a subscription regression test and setup instructions for both subscription levels and existing connections. Live button-to-reveal acceptance still requires a real Instagram tap after app-level configuration is confirmed.
- The operator confirmed that the Meta callback currently points to n8n. OpenReply needs event forwarding from that callback or a separate Meta app. Forwarding must preserve the exact request body and `x-hub-signature-256` header for signature verification. The n8n instance/workflow has not been identified or changed.
- Permanent fix published in draft PR https://github.com/TylonHH/openreply/pull/4, targeting the existing feature branch; commit `9d55197`. Production build passed.

## Maintenance context

- This is the `TylonHH/openreply` fork, nested inside the Netcup operations workspace. Read `AGENTS.md` and the parent operations memory bank before significant work.
- Keep the existing button-workflow feature and inbox recovery changes. Do not deploy or restart production without authorization under the parent change-control rules.
- Keep secrets out of repository files and diagnostic output.
