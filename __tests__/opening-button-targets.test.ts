import { beforeEach, expect, it, vi } from "vitest";
const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/client", () => ({ prisma: { automation: { findMany } } }));
import { validateOpeningButtonTargets } from "@/lib/campaigns/opening-button-targets";
const config = {
  buttons: [{ id: "b1", label: "Guide", targetCampaignId: "target" }],
  workspaceId: "workspace",
  instagramAccountId: "account",
  sourceId: "source",
  provider: "META",
};
beforeEach(() => {
  findMany.mockReset();
});
it("scopes active target lookup to the workspace and Instagram connection", async () => {
  findMany.mockResolvedValue([{ id: "target" }]);
  expect(await validateOpeningButtonTargets(config)).toBeNull();
  expect(findMany).toHaveBeenCalledWith({
    where: {
      id: { in: ["target"] },
      workspaceId: "workspace",
      instagramAccountId: "account",
      isActive: true,
    },
    select: { id: true },
  });
});
it("rejects unavailable targets and unsupported connections", async () => {
  findMany.mockResolvedValue([]);
  expect(await validateOpeningButtonTargets(config)).toMatch(/active campaign/);
  expect(
    await validateOpeningButtonTargets({ ...config, provider: "ZERNIO" }),
  ).toMatch(/Meta/);
});
it("rejects self-targeting but allows multiple buttons to share a target", async () => {
  expect(
    await validateOpeningButtonTargets({ ...config, sourceId: "target" }),
  ).toMatch(/itself/);
  findMany.mockResolvedValue([{ id: "target" }]);
  expect(
    await validateOpeningButtonTargets({
      ...config,
      buttons: [config.buttons[0], { ...config.buttons[0], id: "b2" }],
    }),
  ).toBeNull();
});
