import * as meta from "@/lib/meta/client";
import type { InstagramContext } from "./context";
export async function sendOpeningButtons({
  context,
  instagramAccountId,
  recipient,
  text,
  buttons,
}: {
  context: InstagramContext;
  instagramAccountId: string;
  recipient: { id: string } | { comment_id: string };
  text: string;
  buttons: { title: string; payload: string }[];
}) {
  if (context.provider !== "META")
    throw new Error(
      "Opening button workflows require a direct Meta connection",
    );
  return meta.sendOpeningButtonMessage(
    context.accessToken,
    instagramAccountId,
    recipient,
    text,
    buttons,
  );
}
