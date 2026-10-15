import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { subscribeInstagramAccountToWebhooks } from "../lib/meta/client";
import {
  createOAuthState,
  decryptToken,
  encryptToken,
  verifyOAuthState,
} from "../lib/meta/oauth";

beforeEach(() => {
  vi.stubEnv("NEXTAUTH_SECRET", "test-secret-with-enough-length");
  vi.stubEnv(
    "ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("subscribes connected accounts to opening-DM button clicks as well as comments and messages", async () => {
  vi.stubEnv("META_GRAPH_API_VERSION", "v25.0");
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(subscribeInstagramAccountToWebhooks("account", "token"))
    .resolves.toEqual({ success: true });
  expect(fetchMock).toHaveBeenCalledWith(
    "https://graph.instagram.com/v25.0/account/subscribed_apps",
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer token" }),
      body: JSON.stringify({
        subscribed_fields: ["comments", "messages", "messaging_postbacks"],
      }),
    }),
  );
});

describe("OAuth state and token encryption", () => {
  it("round-trips encrypted tokens", () => {
    const encrypted = encryptToken("long-lived-token");
    expect(encrypted).not.toBe("long-lived-token");
    expect(decryptToken(encrypted)).toBe("long-lived-token");
  });

  it("signs and verifies Instagram OAuth state", () => {
    const state = createOAuthState("workspace_123");
    expect(verifyOAuthState(state)?.workspaceId).toBe("workspace_123");
  });

  it("rejects tampered OAuth state", () => {
    const state = createOAuthState("workspace_123");
    expect(verifyOAuthState(`${state}tampered`)).toBeNull();
  });
});
