import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildOpeningButtons,
  openingButtonsSchema,
  parseCampaignRoute,
  requiresButtonChoice,
  visibleOpeningButtonCount,
} from "@/lib/campaigns/opening-buttons";
import { sendOpeningButtonMessage } from "@/lib/meta/client";
const button = { id: "b1", label: "Get guide", targetCampaignId: null };
afterEach(() => vi.unstubAllGlobals());
describe("opening buttons", () => {
  it("accepts at most three complete buttons with unique IDs and 20-character labels", () => {
    expect(openingButtonsSchema.safeParse([button]).success).toBe(true);
    for (const value of [
      [button, button],
      [{ ...button, label: " " }],
      [{ ...button, label: "x".repeat(21) }],
      Array.from({ length: 4 }, (_, i) => ({ ...button, id: `b${i}` })),
    ]) {
      expect(openingButtonsSchema.safeParse(value).success).toBe(false);
    }
  });
  it("keeps legacy reveal and follow-gate postbacks", () => {
    const campaign = {
      id: "source",
      openingDmButtonLabel: "Continue",
      requireFollow: false,
    };
    expect(buildOpeningButtons(campaign)[0].payload).toBe("reveal:source");
    expect(
      buildOpeningButtons({ ...campaign, requireFollow: true })[0].payload,
    ).toBe("followcheck:source");
  });
  it("binds a route to its source, button and target", () => {
    const payload = buildOpeningButtons({
      id: "source",
      openingDmButtonLabel: null,
      requireFollow: false,
      openingDmButtons: [{ ...button, targetCampaignId: "target" }],
    })[0].payload;
    expect(parseCampaignRoute(payload)).toEqual({
      sourceId: "source",
      buttonId: "b1",
      targetId: "target",
    });
    expect(parseCampaignRoute("route:source:b1:target:extra")).toBeNull();
  });
  it("requires an explicit click for choices and routes, retaining legacy read fallback", () => {
    expect(requiresButtonChoice(undefined)).toBe(false);
    expect(requiresButtonChoice([button])).toBe(false);
    expect(requiresButtonChoice([button, { ...button, id: "b2" }])).toBe(true);
    expect(
      requiresButtonChoice([{ ...button, targetCampaignId: "target" }]),
    ).toBe(true);
  });
  it("reveals the next editor field only after the current button is complete", () => {
    const complete = (b: { label: string }) => Boolean(b.label.trim());
    expect(visibleOpeningButtonCount([], complete)).toBe(1);
    expect(
      visibleOpeningButtonCount([{ ...button, label: "" }], complete),
    ).toBe(1);
    expect(visibleOpeningButtonCount([button], complete)).toBe(2);
    expect(
      visibleOpeningButtonCount(
        [button, { ...button, id: "b2", label: "" }],
        complete,
      ),
    ).toBe(2);
    expect(
      visibleOpeningButtonCount([button, { ...button, id: "b2" }], complete),
    ).toBe(3);
  });
  it("sends three postback buttons in one Meta template to the right recipient", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message_id: "m1" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetch);
    const buttons = ["one", "two", "three"].map((title) => ({
      title,
      payload: `route:s:${title}:target`,
    }));
    await sendOpeningButtonMessage(
      "test-token",
      "ig-account",
      { comment_id: "comment" },
      "Choose",
      buttons,
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      recipient: { comment_id: "comment" },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Choose",
            buttons: buttons.map((b) => ({ type: "postback", ...b })),
          },
        },
      },
    });
  });
  it("rejects invalid button templates before sending", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      sendOpeningButtonMessage("test", "ig", { id: "user" }, "Choose", []),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
