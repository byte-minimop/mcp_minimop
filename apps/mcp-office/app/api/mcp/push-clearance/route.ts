import { NextRequest, NextResponse } from "next/server";
import { requireMCPSharedSecret } from "@/lib/mcp/auth";
import { resolveAccountContext } from "@mktg/domain-google-ads";
import type {
  MCPPushClearanceRequest,
  MCPPushClearanceResponse,
} from "@/lib/mcp/contract";

export const runtime = "nodejs";

// Push authorization model: access-based, not allowlist-based.
//
// Beacon's push route now authorizes push based on whether the user's Google Ads
// OAuth connection includes the target account (checked in Beacon directly via
// getGoogleAdsAccessibleAccountForUser). This endpoint provides MCC catalog context
// for operational visibility and audit logging — it is not a blocking gate.
//
// cleared=true:  account recognized in the Concentrix MCC knowledge catalog.
// cleared=false: account not recognized in catalog — advisory only.

export async function POST(
  req: NextRequest,
): Promise<NextResponse<MCPPushClearanceResponse | { error: string }>> {
  const authError = requireMCPSharedSecret(req);
  if (authError) return authError;

  let body: MCPPushClearanceRequest;
  try {
    body = (await req.json()) as MCPPushClearanceRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.customer_id?.trim()) {
    return NextResponse.json(
      { error: "Missing required field: customer_id" },
      { status: 422 },
    );
  }

  const customerId = body.customer_id.trim();
  const accountRecord = resolveAccountContext(customerId);

  if (!accountRecord) {
    return NextResponse.json({
      cleared: false,
      account_id: customerId,
      account_name: null,
      reason: null,
      blockers: [
        {
          code: "account_not_in_mcc_catalog",
          message: `Customer ID ${customerId} is not recognized in the Concentrix MCC knowledge catalog. This is advisory — push authorization is determined by your Google Ads connection in Beacon.`,
        },
      ],
    });
  }

  return NextResponse.json({
    cleared: true,
    account_id: customerId,
    account_name: accountRecord.name,
    reason: `Concentrix MCC catalog: ${accountRecord.context} account, ${accountRecord.primary_region}${accountRecord.notes ? ` — ${accountRecord.notes}` : ""}`,
    blockers: [],
  });
}
