# Multiple opening-DM buttons and campaign transitions

Status: planned; this branch prepares the feature, it does not implement it yet.

## Goal

Offer two or three choices directly in an opening DM. Each button either
continues the current campaign or explicitly starts another campaign. Labels
are presentation text, not implicit keyword triggers.

Meta documents a maximum of three buttons in a button template:
https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api/button-template

Quick Replies are a different message type, not a way to silently raise this
template's limit. Validate the actual private-reply/first-contact path with a
test Instagram account before considering the feature production-ready.

## Initial behavior

- Allow one to three buttons in the opening-DM editor, each with its own label
  and action: Continue this campaign / Start another campaign.
- Keep the current single-button behavior and existing campaigns compatible.
- Continue this campaign retains the existing reveal/follow-check behavior.
- Start another campaign enters the target campaign's opening DM if enabled;
  otherwise apply its follow gate and reveal behavior.
- Each additional transition requires a real user click; do not recursively
  execute campaigns without user input.
- Show the target campaign explicitly in the editor and preview.
- Restrict target selection to active campaigns in the same workspace and
  connected Instagram account. Revalidate this at click time.
- Reject targeting the source campaign via the start-campaign action; use
  Continue this campaign instead.
- If a target has been removed or disabled, record a clear failure without
  sending a different campaign or guessing an alternative recipient.
- Do not change webhook authentication, messaging-window rules or outbound
  retry/deduplication protections.

## Existing integration points to inspect before implementing

- Campaign persistence, API schemas, editor and preview currently expose
  openingDmEnabled, openingDmMessage and openingDmButtonLabel.
- lib/meta/client.ts constructs a single postback button for opening DMs.
- lib/instagram/send-messages.ts abstracts direct Meta and Zernio sends.
- lib/queue/dm-worker.ts emits reveal:<automationId> or
  followcheck:<automationId>. processPostback only recognizes those actions.
- lib/meta/webhook.ts parses postbacks separately from inbound keyword DMs.
- Existing delivery tracking and deduplication must also cover transitions.

Read current repository instructions and exact code before editing. Use an
additive migration if button definitions require a new field/table. Preserve
existing single-button data and legacy postbacks from already sent messages.
Never allow raw user-supplied postback payloads to select unvalidated campaigns.

## Implementation tasks

1. Define validated button actions and backward-compatible serialization.
   Enforce one to three buttons and Meta's documented title/payload limits.
2. Add persistence and migration, preserving the legacy single-button value
   when no new button configuration exists.
3. Extend create/edit/duplicate campaign APIs and the editor, including an
   accurate multi-button preview and eligible target choices.
4. Extend the provider abstraction and Meta private/direct message templates.
   Inspect Zernio capability before enabling this feature for that provider;
   unsupported actions must produce a clear validation error.
5. Route signed postback events to the configured action. Reuse existing
   target-campaign follow gates, delivery rules, tracking and deduplication.
   Resolve source and target in the current account/workspace scope.
6. Test validation, compatibility, multiple choices, target routing, cross-
   workspace/account rejection, disabled targets and duplicate event delivery.
7. Run typecheck, lint, tests and production build. Prepare an isolated test
   image only when implementation is ready; keep main/latest untouched.
8. Live-test two and three buttons from a real comment-triggered private reply,
   including a transition to another campaign and its next button.

## Acceptance criteria

- Existing campaigns and previously sent buttons still work.
- A new opening DM displays the configured two or three buttons.
- Each button performs exactly its selected action.
- Target campaigns can present a subsequent choice without an automatic loop.
- One repeated webhook event does not duplicate delivery.
- Target authorization is enforced server-side, not just in the UI.
- Failures and provider limitations are understandable in the editor/logs.

## Branch context

Created from TylonHH/openreply main at 3ca2398be85622a498773de2b8433a182ee254cc.
The inbox recovery PR is separate. At branch creation, the recovery fix had
not yet been merged into the fork's main. Integrate the updated main before
building a combined deployment so the validated inbox fix is retained.
