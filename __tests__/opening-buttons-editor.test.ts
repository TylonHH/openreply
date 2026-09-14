import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import OpeningDmButtons from "@/components/opening-dm-buttons";
import type { OpeningButton } from "@/lib/campaigns/opening-buttons";
const workflows = [{ id: "guide", name: "Download guide" }];
function render(buttons: OpeningButton[]) {
  return renderToStaticMarkup(
    createElement(OpeningDmButtons, { buttons, workflows, onChange: vi.fn() }),
  );
}
it("initially renders one label field and offers the existing workflow", () => {
  const html = render([]);
  expect(html.match(/<input/g)).toHaveLength(1);
  expect(html).toContain("Download guide");
  expect(html).toContain("Continue this campaign");
});
it("adds only one optional field after a complete button", () => {
  expect(
    render([{ id: "b1", label: "Guide", targetCampaignId: "guide" }]).match(
      /<input/g,
    ),
  ).toHaveLength(2);
  expect(
    render([
      { id: "b1", label: "Guide", targetCampaignId: "guide" },
      { id: "b2", label: "", targetCampaignId: null },
    ]).match(/<input/g),
  ).toHaveLength(2);
});
it("does not add a field for an unavailable workflow and preserves it for correction", () => {
  const html = render([
    { id: "b1", label: "Guide", targetCampaignId: "deleted" },
  ]);
  expect(html.match(/<input/g)).toHaveLength(1);
  expect(html).toContain("Unavailable campaign");
});
