# Active Context

## Opening DM continuation failure — 2026-10-13

- The deployed web app and worker use `ghcr.io/tylonhh/openreply:button-workflows-test`, corresponding to the `feat/opening-dm-button-workflows` branch. Local fix branch: `codex/fix-opening-dm-button`.
- Both connected Meta accounts had only `comments` and `messages` in their live account subscriptions. `subscribeInstagramAccountToWebhooks` omitted `messaging_postbacks`, so button clicks could not reach the worker.
- Added `messaging_postbacks` to both live account subscriptions through Meta's API. Both returned HTTP 200 / success and GET read-back confirmed all three fields. Existing fields were preserved. No DM was sent, service restarted, image deployed, or database data changed by this repair.
- The web app, worker, PostgreSQL and Redis are healthy. Callback verification at `https://openreply.caprover.drrene.de/api/webhook` returns HTTP 200 and the expected challenge without redirect.
- The database contained zero `WebhookEvent` rows and zero reveal logs at diagnosis. Comment polling explains the opening DMs. App-level webhook configuration remains unverified; an app-subscription GET using the configured Instagram app credentials was rejected. Asked the operator to confirm the callback, Live mode and `messaging_postbacks` in Meta's dashboard.
- Permanent source fix includes a subscription regression test and setup instructions for both subscription levels and existing connections. Live button-to-reveal acceptance still requires a real Instagram tap after app-level configuration is confirmed.

## Maintenance context

- This is the `TylonHH/openreply` fork, nested inside the Netcup operations workspace. Read `AGENTS.md` and the parent operations memory bank before significant work.
- Keep the existing button-workflow feature and inbox recovery changes. Do not deploy or restart production without authorization under the parent change-control rules.
- Keep secrets out of repository files and diagnostic output.
