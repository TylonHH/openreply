import { z } from "zod";

const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
export const openingButtonsSchema = z
  .array(
    z
      .object({
        id: identifier,
        label: z.string().trim().min(1).max(20),
        targetCampaignId: identifier.nullable(),
      })
      .strict(),
  )
  .max(3)
  .refine(
    (buttons) => new Set(buttons.map((b) => b.id)).size === buttons.length,
    "Button IDs must be unique",
  );
export type OpeningButton = z.infer<typeof openingButtonsSchema>[number];
export function readOpeningButtons(value: unknown): OpeningButton[] {
  return openingButtonsSchema.parse(value ?? []);
}
export function requiresButtonChoice(value: unknown): boolean {
  const buttons = readOpeningButtons(value);
  return buttons.length > 1 || buttons.some((b) => b.targetCampaignId !== null);
}
export function buildOpeningButtons(automation: {
  id: string;
  openingDmButtons?: unknown;
  openingDmButtonLabel: string | null;
  requireFollow: boolean;
}) {
  const buttons = readOpeningButtons(automation.openingDmButtons);
  const continuation = `${automation.requireFollow ? "followcheck" : "reveal"}:${automation.id}`;
  return buttons.length
    ? buttons.map((b) => ({
        title: b.label,
        payload: b.targetCampaignId
          ? `route:${automation.id}:${b.id}:${b.targetCampaignId}`
          : continuation,
      }))
    : [
        {
          title: (automation.openingDmButtonLabel || "Continue").slice(0, 20),
          payload: continuation,
        },
      ];
}
export function parseCampaignRoute(payload: string) {
  const match =
    /^route:([a-zA-Z0-9_-]{1,64}):([a-zA-Z0-9_-]{1,64}):([a-zA-Z0-9_-]{1,64})$/.exec(
      payload,
    );
  return match
    ? { sourceId: match[1], buttonId: match[2], targetId: match[3] }
    : null;
}
export function visibleOpeningButtonCount(
  buttons: OpeningButton[],
  isComplete: (button: OpeningButton) => boolean,
) {
  return Math.min(
    3,
    Math.max(
      1,
      buttons.length +
        (buttons.length > 0 && buttons.every(isComplete) ? 1 : 0),
    ),
  );
}
