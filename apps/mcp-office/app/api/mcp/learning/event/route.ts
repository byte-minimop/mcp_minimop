import { NextRequest, NextResponse } from "next/server";
import { requireMCPSharedSecret } from "@/lib/mcp/auth";
import type { MCPLearningEventRequest, MCPLearningEventResponse } from "@/lib/mcp/contract";
import { insertLearningEvent } from "@/lib/learning/store";

// Must be Node.js — better-sqlite3 requires native bindings.
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
): Promise<NextResponse<MCPLearningEventResponse | { error: string }>> {
  const authError = requireMCPSharedSecret(req);
  if (authError) return authError;

  let body: MCPLearningEventRequest;
  try {
    body = (await req.json()) as MCPLearningEventRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.event_type || !body.context) {
    return NextResponse.json({ error: "Missing required fields: event_type, context." }, { status: 422 });
  }

  const VALID_TYPES = ["family_override", "service_correction", "recurring_blocker", "successful_case"] as const;
  if (!VALID_TYPES.includes(body.event_type as typeof VALID_TYPES[number])) {
    return NextResponse.json({ error: `Unknown event_type: ${body.event_type}` }, { status: 422 });
  }

  try {
    const result = insertLearningEvent({
      event_type: body.event_type,
      account_id: body.account_id ?? null,
      run_id: body.run_id ?? null,
      context: body.context,
    });

    return NextResponse.json({
      accepted: true,
      event_id: result.event_id,
      pattern_status: result.pattern_status,
    });
  } catch (err) {
    console.error("[MCP learning] event insert failed:", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
