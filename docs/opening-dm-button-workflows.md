# Opening DM buttons and campaign workflows

Test feature for direct Meta connections. The branch includes the inbox recovery fix from main.

## Configure

- Enable an opening DM and write its message (up to 640 characters).
- Give button 1 a label (up to 20 characters). Choose **Continue this campaign** or an active campaign from the same Instagram account.
- The next optional editor field appears after the previous button is complete. Configure up to three buttons. Blank optional buttons are not saved.
- All configured choices appear together in the sent Instagram DM. This is progressive configuration, not a timed sequence of buttons.
- Click the buttons in the phone preview to inspect their action. It names a selected target rather than pretending to preview that target's contents.

A workflow button starts the selected campaign's opening DM when enabled. Otherwise it applies that campaign's follow gate and sends its reveal. Another transition requires another real click. It does not simulate a keyword or broadcast to other campaigns. New configured menus also work for DM keyword triggers.

Targets are validated on save and again on click: active, same workspace, same Instagram connection, and still assigned to that button. Changed/deleted buttons and unavailable targets do not send; the worker logs an unavailable-route warning. Choosing the current campaign uses the Continue action instead of a self-route. Replayed route events use durable delivery claims. Uncertain delivery failures are not automatically resent.

Legacy campaigns keep their old one-button data and reveal/followcheck postbacks. Zernio retains its existing single-button behavior; multi-button workflows are not enabled for it. Multiple choices and campaign routes disable the speculative read fallback so a read cannot select a workflow on the user's behalf.

## Deployment for testing

Image: `ghcr.io/tylonhh/openreply:button-workflows-test` (published only after CI passes).

Update both the web service and the DM worker to the same test image. Run `npm run db:migrate` with the new image before starting the updated web service and worker. If your deployment already runs migrations as a release/start step, keep that step enabled. The migration only adds `Automation.openingDmButtons` with an empty-array default and preserves old fields. Keep the existing database backup practice. Rolling back the application leaves this additive column in place; old code cannot execute newly sent workflow buttons.

## Live acceptance test

1. Create/enable a target campaign for the same account, preferably with its own opening DM and a Continue button.
2. Create a source campaign with an opening DM. Check that only button 1 initially appears; filling it reveals button 2; filling button 2 reveals button 3.
3. Set one button to Continue and another to the target from the list. Save, reopen, and confirm both labels and destinations persist. Test three buttons as well.
4. Trigger the source from a real Instagram comment. Confirm all configured buttons appear together. Continue should deliver the source reveal; the target button should display the target's opener, with no source reveal or premature follow-up.
5. Click the target's Continue button and check its follow requirement/reveal. Reading the source without clicking must not automatically start a branch.
6. Pause the target and click an already sent target button: no campaign should be sent, and the worker should log an unavailable target. Restore the target afterward.
7. Test a DM keyword trigger and an unchanged legacy campaign. Confirm the inbox recovery still works.

## Automated coverage

Unit/integration tests cover schema limits, stable route payloads, legacy buttons, sequential editor fields, provider request bodies, target validation, target menus/follow gates, stale/unavailable routes, read fallback, and duplicate webhook delivery. CI checks types, lint, tests and production build. A PostgreSQL 16 migration test upgrades a legacy campaign and verifies that its old data survives and multiple buttons persist.

Live Instagram delivery and final appearance must still be verified on the connected test account; mocked API tests cannot confirm Meta's live response.
