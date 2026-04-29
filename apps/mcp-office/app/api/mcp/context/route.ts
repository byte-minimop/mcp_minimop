import { NextRequest, NextResponse } from "next/server";
import { requireMCPSharedSecret } from "@/lib/mcp/auth";
import { assembleContext } from "@/lib/mcp/context-assembly";
import type {
  MCPContextRequest,
  MCPContextBundle,
  MCPRecurringBlockerWarning,
} from "@/lib/mcp/contract";
import { getPromotedPatterns } from "@/lib/learning/store";
import type { RecurringBlockerContext } from "@/lib/learning/schema";

export const runtime = "nodejs";

/**
 * Query promoted recurring_blocker_pattern records that match the current
 * service context. Returns [] when serviceCategory is null (no safe match key)
 * or when no promoted patterns exist for this context.
 *
 * Only promoted patterns (status="promoted") are returned — candidates do not
 * yet have enough evidence to surface as pre-emptive warnings.
 */
function lookupRecurringBlockerWarnings(
  serviceCategory: string | null,
): MCPRecurringBlockerWarning[] {
  if (!serviceCategory) return [];

  return getPromotedPatterns("recurring_blocker_pattern")
    .filter((p) => {
      const ctx = JSON.parse(p.context_json) as RecurringBlockerContext;
      return ctx.service_category === serviceCategory;
    })
    .map((p) => {
      const ctx = JSON.parse(p.context_json) as RecurringBlockerContext;
      return {
        rule_id: ctx.rule_id,
        family: ctx.family,
        service_category: ctx.service_category,
        occurrence_count: p.occurrence_count,
        advisory_note: p.advisory_note,
        summary: `Rule '${ctx.rule_id}' has blocked '${ctx.family}' campaigns ${p.occurrence_count} times in '${serviceCategory}' service context.`,
      };
    });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<MCPContextBundle | { error: string }>> {
  const authError = requireMCPSharedSecret(req);
  if (authError) return authError;

  let body: MCPContextRequest;
  try {
    body = (await req.json()) as MCPContextRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bundle = assembleContext(body);
  bundle.recurring_blocker_warnings = lookupRecurringBlockerWarnings(
    bundle.service.service_category,
  );
  return NextResponse.json(bundle);
}
