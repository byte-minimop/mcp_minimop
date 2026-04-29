import { NextRequest, NextResponse } from "next/server";
import { requireMCPSharedSecret } from "@/lib/mcp/auth";
import { assembleContext } from "@/lib/mcp/context-assembly";
import type {
  MCPFamilyGuidanceRequest,
  MCPFamilyGuidanceResponse,
  MCPRankedFamily,
} from "@/lib/mcp/contract";
import {
  rankFamiliesForBrief,
  type BriefForRanking,
} from "@mktg/domain-google-ads";
import type { CampaignObjective } from "@mktg/domain-google-ads";
import { getPromotedPatterns } from "@/lib/learning/store";
import type { FamilyOverrideContext } from "@/lib/learning/schema";

// Points added to the strategic_score of a family matched by a promoted
// override pattern. Sized to tip close contests without overriding clear winners:
// +8 cannot beat a family that leads by 9+ points on base scoring alone.
const LEARNING_BIAS_POINTS = 8;

export const runtime = "nodejs";

/**
 * Hard guardrails that MCP enforces deterministically — checked before ranking.
 * Careers campaigns are always Search: visual/discovery families inflate
 * cost-per-application and are not suited to recruitment conversions.
 */
function applyGuardrails(
  context: "careers" | "corporate",
): { family: string; reason: string } | null {
  if (context === "careers") {
    return {
      family: "search",
      reason:
        "Careers campaigns require Search to capture high-intent job-seeker queries. " +
        "Visual and discovery families (Demand Gen, Performance Max) are not suited " +
        "to recruitment conversions and inflate cost-per-application.",
    };
  }
  return null;
}

const VALID_OBJECTIVES = new Set<string>([
  "generate_leads",
  "attract_candidates",
  "increase_website_traffic",
  "build_brand_awareness",
]);

export async function POST(
  req: NextRequest,
): Promise<NextResponse<MCPFamilyGuidanceResponse | { error: string }>> {
  const authError = requireMCPSharedSecret(req);
  if (authError) return authError;

  let body: MCPFamilyGuidanceRequest;
  try {
    body = (await req.json()) as MCPFamilyGuidanceRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.intent?.trim() || !body.campaign_objective || !body.campaign_context) {
    return NextResponse.json(
      { error: "Missing required fields: intent, campaign_objective, campaign_context" },
      { status: 422 },
    );
  }

  // Assemble deterministic context from brief fields for service_category
  const context = assembleContext({
    product_or_service: body.product_or_service,
    landing_page_url: body.landing_page_url,
    campaign_objective: body.campaign_objective,
  });

  const guardrail = applyGuardrails(body.campaign_context);

  // Run scoring even when a guardrail fires — callers can inspect ranked[] for UX
  // purposes (e.g. showing why Search was chosen over alternatives).
  let ranked: MCPRankedFamily[] = [];
  if (VALID_OBJECTIVES.has(body.campaign_objective)) {
    const brief: BriefForRanking = {
      campaign_objective: body.campaign_objective as CampaignObjective,
      landing_page_url: body.landing_page_url,
      product_or_service: body.product_or_service ?? null,
      image_asset_status: body.image_asset_status ?? null,
      video_asset_status: body.video_asset_status ?? null,
      audience_buying_stage: body.audience_buying_stage ?? null,
    };
    ranked = rankFamiliesForBrief(brief, body.intent);
  }

  // ── Learning bias ─────────────────────────────────────────────────────────
  // Applies a small upward score bias when a promoted family_override_preference
  // pattern exists for this service context. Rules:
  //   1. Guardrails always win — bias is skipped entirely when guardrail fired.
  //   2. Only patterns where mcp_guardrail_forced=false are used — guardrail-forced
  //      overrides reflect unusual policy situations, not genuine preference.
  //   3. Only families already in ranked[] are eligible — bias cannot resurrect
  //      a family that scored 0 (truly ineligible for this brief).
  //   4. Take the most-observed matching pattern (highest occurrence_count).
  let learningBias: MCPFamilyGuidanceResponse["learning_bias"] = null;

  if (!guardrail && ranked.length > 0) {
    const serviceCategory = context.service.service_category;
    const rankedFamilySet = new Set(ranked.map((r) => r.family));

    const match = getPromotedPatterns("family_override_preference")
      .filter((p) => {
        const ctx = JSON.parse(p.context_json) as FamilyOverrideContext;
        return (
          ctx.service_category === serviceCategory &&
          !ctx.mcp_guardrail_forced &&
          rankedFamilySet.has(ctx.selected_family)
        );
      })
      .sort((a, b) => b.occurrence_count - a.occurrence_count)[0];

    if (match) {
      const ctx = JSON.parse(match.context_json) as FamilyOverrideContext;
      const biasLabel = `Learning bias: operators consistently select this family for ${serviceCategory ?? "this"} service context (${match.occurrence_count} observed overrides)`;

      ranked = ranked
        .map((r) =>
          r.family === ctx.selected_family
            ? {
                ...r,
                strategic_score: Math.min(100, r.strategic_score + LEARNING_BIAS_POINTS),
                detected_signals: [...r.detected_signals, biasLabel],
              }
            : r,
        )
        .sort((a, b) =>
          b.strategic_score !== a.strategic_score
            ? b.strategic_score - a.strategic_score
            : b.execution_maturity - a.execution_maturity,
        );

      learningBias = {
        applied: true,
        biased_family: ctx.selected_family,
        pattern_type: "family_override_preference",
        occurrence_count: match.occurrence_count,
        note: match.advisory_note,
      };
    }
  }

  const recommendedFamily = guardrail?.family ?? ranked[0]?.family ?? "search";

  const response: MCPFamilyGuidanceResponse = {
    was_guardrail_forced: guardrail !== null,
    guardrail_reason: guardrail?.reason ?? null,
    recommended_family: recommendedFamily,
    ranked,
    context_used: {
      campaign_context: body.campaign_context,
      service_category: context.service.service_category,
      account_context: null,
    },
    learning_bias: learningBias,
  };

  return NextResponse.json(response);
}
