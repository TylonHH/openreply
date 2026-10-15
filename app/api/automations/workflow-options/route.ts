import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId)
    return NextResponse.json({ success: false }, { status: 401 });
  const accountId = request.nextUrl.searchParams.get("instagramAccountId");
  if (!accountId) return NextResponse.json({ success: false }, { status: 400 });
  const account = await prisma.instagramAccount.findFirst({
    where: { id: accountId, workspaceId },
    select: { id: true, provider: true },
  });
  if (!account) return NextResponse.json({ success: false }, { status: 404 });
  const campaigns = await prisma.automation.findMany({
    where: { workspaceId, instagramAccountId: account.id, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    success: true,
    data: { supported: account.provider === "META", campaigns },
  });
}
