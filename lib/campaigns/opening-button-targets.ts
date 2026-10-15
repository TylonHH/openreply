import { prisma } from "@/lib/db/client";
import type { OpeningButton } from "./opening-buttons";

export async function validateOpeningButtonTargets({
  buttons,
  workspaceId,
  instagramAccountId,
  sourceId,
  provider,
}: {
  buttons: OpeningButton[];
  workspaceId: string;
  instagramAccountId: string;
  sourceId?: string;
  provider: string;
}): Promise<string | null> {
  if (!buttons.length) return null;
  if (provider !== "META")
    return "Opening button workflows require a direct Meta connection";
  const ids = [
    ...new Set(
      buttons.flatMap((b) => (b.targetCampaignId ? [b.targetCampaignId] : [])),
    ),
  ];
  if (sourceId && ids.includes(sourceId))
    return "Choose Continue this campaign instead of linking a campaign to itself";
  if (!ids.length) return null;
  const targets = await prisma.automation.findMany({
    where: { id: { in: ids }, workspaceId, instagramAccountId, isActive: true },
    select: { id: true },
  });
  return targets.length === ids.length
    ? null
    : "Choose an active campaign from the same Instagram account";
}
