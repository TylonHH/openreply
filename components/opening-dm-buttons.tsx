"use client";
import {
  visibleOpeningButtonCount,
  type OpeningButton,
} from "@/lib/campaigns/opening-buttons";
export type WorkflowOption = { id: string; name: string };
export default function OpeningDmButtons({
  buttons,
  onChange,
  workflows,
}: {
  buttons: OpeningButton[];
  onChange: (buttons: OpeningButton[]) => void;
  workflows: WorkflowOption[];
}) {
  const complete = (b: OpeningButton) =>
    Boolean(
      b.label.trim() &&
        (!b.targetCampaignId ||
          workflows.some((w) => w.id === b.targetCampaignId)),
    );
  const count = visibleOpeningButtonCount(buttons, complete);
  function update(index: number, patch: Partial<OpeningButton>) {
    const next = [...buttons];
    next[index] = {
      ...(next[index] ?? {
        id: crypto.randomUUID(),
        label: "",
        targetCampaignId: null,
      }),
      ...patch,
    };
    onChange(next);
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Up to 3 buttons. Complete a button to add the next one. All completed
        buttons appear together in the DM.
      </p>
      {Array.from({ length: count }, (_, index) => {
        const button = buttons[index];
        return (
          <fieldset
            key={index}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <legend className="px-1 text-xs text-muted">
              Button {index + 1}
              {index > 0 ? " (optional)" : ""}
            </legend>
            <input
              aria-label={`Button ${index + 1} label`}
              value={button?.label ?? ""}
              maxLength={20}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder="Button label"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <select
              aria-label={`Button ${index + 1} workflow`}
              value={button?.targetCampaignId ?? ""}
              onChange={(e) =>
                update(index, { targetCampaignId: e.target.value || null })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Continue this campaign</option>
              {button?.targetCampaignId &&
                !workflows.some((w) => w.id === button.targetCampaignId) && (
                  <option value={button.targetCampaignId} disabled>
                    Unavailable campaign — choose another
                  </option>
                )}
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  Start: {w.name}
                </option>
              ))}
            </select>
            {index > 0 && button && (
              <button
                type="button"
                onClick={() => onChange(buttons.filter((_, i) => i !== index))}
                className="text-xs text-muted hover:text-foreground"
              >
                Remove button
              </button>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
