import { NextRequest, NextResponse } from "next/server";
import { requireMCPSharedSecret } from "@/lib/mcp/auth";
import type { MCPCaseSnapshotRequest, MCPCaseSnapshotResponse } from "@/lib/mcp/contract";
import { upsertCaseSnapshot } from "@/lib/mcp/case-snapshot-store";

export const runtime = "nodejs";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<MCPCaseSnapshotResponse | { error: string }>> {
  const authError = requireMCPSharedSecret(req);
  if (authError) return authError;

  let body: MCPCaseSnapshotRequest;
  try {
    body = (await req.json()) as MCPCaseSnapshotRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.run_id || !Number.isFinite(body.version_number) || !body.review_status) {
    return NextResponse.json({ error: "Missing required case fields." }, { status: 422 });
  }
  if (!body.campaign?.title || !body.campaign?.family) {
    return NextResponse.json({ error: "Missing required campaign summary fields." }, { status: 422 });
  }
  if (!isStringArray(body.campaign.markets) || !isStringArray(body.campaign.locales)) {
    return NextResponse.json({ error: "campaign.markets and campaign.locales must be string arrays." }, { status: 422 });
  }
  if (!body.governance || !body.activity?.summary) {
    return NextResponse.json({ error: "Missing governance/activity fields." }, { status: 422 });
  }

  try {
    const stored = upsertCaseSnapshot(body);
    return NextResponse.json({ accepted: true, run_id: stored.run_id, stored_at: stored.stored_at });
  } catch (err) {
    console.error("[MCP case-snapshot] upsert failed:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
