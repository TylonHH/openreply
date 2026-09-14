# Inbox recovery test for upstream issue #60

Related issue: https://github.com/diwenne/openreply/issues/60

## Confirmed reproduction

The reporter tested the Instagram Login API directly in Postman with a newly
issued token. The expanded conversations request works with limit=41 but fails
with limit=42 (and 50). At the outer cursor after the first 41 conversations,
limit=1 succeeds with fields=id and fields=id,updated_time, but fails with either:

- id,updated_time,participants
- id,messages.limit(1){message,from,created_time}

The failing response is OAuthException code 1. Both v26 and v25 failed in
OpenReply. This does not establish why Meta cannot expand that conversation,
nor whether each nested message field would fail independently.

## Change

Keep the normal expanded 50-conversation request. On Meta code 1, halve the
page size until the failing conversation is isolated. For that cursor only,
load id,updated_time and mark the entry as details unavailable. Continue from
the OUTER cursor and grow page sizes again when expanded reads succeed.

The existing 50-recent-conversation scope is preserved. Smaller pages are
followed until 50 unique entries are collected or Meta reports exhaustion;
this change does not implement an unlimited history browser.

Auth, permission, rate-limit, network and minimal-metadata failures are not
swallowed. Cursor loops are rejected; requests time out after 10 seconds.
Fallback diagnostics contain code/subcode/trace only, never tokens or content.
Polling will not start overlapping conversation-list requests for one account
in the same mounted inbox.

The unavailable entry remains visible with an explanation and a disabled
composer. Other entries remain readable and replyable. The route no longer
uses the account owner as a recipient when no other participant is available.

## Validation

Regression tests are in __tests__/conversation-recovery.test.ts. They simulate
a failing 42nd conversation, adjacent failures, healthy pages, short pages,
cursor errors, credential/rate-limit errors and network failures.

The branch CI runs typecheck, lint, tests and build. Only after those succeed
does the fork-specific CI job publish ghcr.io/tylonhh/openreply:issue-60-test.
This testing workflow change belongs to the fork and should be excluded from
a later upstream pull request.

Live Meta validation of the implementation is still required. No production
server configuration or stored token has been changed by this branch.

## CapRover test

1. Record the currently deployed web image/digest so you can restore it.
2. After the branch CI and image job succeed, deploy
   ghcr.io/tylonhh/openreply:issue-60-test to the OpenReply WEB app through
   Deployment > Deploy via ImageName. No database migration is required.
3. Leave the worker image unchanged for this inbox-only test.
4. Hard-refresh the inbox (or use a fresh browser session to avoid its
   short-lived client cache).
5. Confirm the affected account loads, the unavailable entry is labelled, and
   healthy entries after it are present (up to the existing 50-entry scope).
6. Open a healthy conversation and check messages. Check the unavailable entry
   displays an explanation and its composer is disabled.
7. Check a second healthy account. Verify repeated refreshes do not duplicate
   rows. No outbound test message is needed for this read-path change.
8. Report the results on issue #60 without tokens, cookies or private messages.
   To roll back, redeploy the previous web image/digest.

The proposed fix is on a test branch only; main and the latest image are not
updated by this test workflow.
