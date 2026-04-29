import { NextRequest, NextResponse } from "next/server";
import { requireMCPSharedSecret } from "@/lib/mcp/auth";
import { assembleContext } from "@/lib/mcp/context-assembly";
import type {
  MCPPostValidationRequest,
  MCPPostValidationResponse,
  MCPPostValidationViolation,
  MCPPostValidationCorrection,
} from "@/lib/mcp/contract";

export const runtime = "nodejs";

/**
 * POST /api/mcp/post-validation
 *
 * Validates AI-generated output against MCP deterministic truth after
 * generation completes but before the blueprint reaches human review.
 *
 * Scope is deliberately narrow:
 *   LEGACY_DOMAIN_UNGATED   — blocker: governance gap was not applied
 *   SERVICE_TAXONOMY_DRIFT  — advisory: AI used wrong canonical offering or confidence
 *   CAREERS_FAMILY_MISMATCH — advisory: careers landing page with non-Search family
 *
 * What this endpoint will NOT do:
 *   - Rewrite ad copy, messaging, or audience strategy
 *   - Re-run AI generation
 *   - Validate creative assets
 *   - Override human-approved decisions
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<MCPPostValidationResponse | { error: string }>> {
  const authError = requireMCPSharedSecret(req);
  if (authError) return authError;

  let body: MCPPostValidationRequest;
  try {
    body = (await req.json()) as MCPPostValidationRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.selected_family || !Array.isArray(body.blueprint_hard_gap_rule_ids)) {
    return NextResponse.json(
      { error: "Missing required fields: selected_family, blueprint_hard_gap_rule_ids" },
      { status: 422 },
    );
  }

  // Assemble authoritative context — same deterministic call used by /context and
  // /family-guidance. No account_id needed here; we're validating landing page and
  // service fields, not account policy.
  const context = assembleContext({
    product_or_service: body.product_or_service,
    landing_page_url: body.landing_page_url,
  });

  const violations: MCPPostValidationViolation[] = [];
  const corrections: MCPPostValidationCorrection[] = [];
  const reconciliationNotes: string[] = [];

  // ── Check 1: LEGACY_DOMAIN_UNGATED ───────────────────────────────────────────
  // Belt-and-suspenders: beacon-policy already injects BRIEF-021 via evaluateBriefPolicy,
  // but MCP verifies the gap is present from an independent code path. If it's missing,
  // this is a governance failure — the output should not reach review as "ready".
  if (
    context.landing_page.is_legacy_domain &&
    !body.blueprint_hard_gap_rule_ids.includes("BRIEF-021")
  ) {
    violations.push({
      code: "LEGACY_DOMAIN_UNGATED",
      severity: "blocker",
      field: "landing_page_url",
      message:
        `Landing page domain is a deprecated Concentrix brand (Convergys, Webhelp, or ServiceSource). ` +
        `Campaigns must not launch on this domain. The governance gap BRIEF-021 was not present in the ` +
        `blueprint output — this is a policy enforcement gap that must be resolved before review.`,
    });
    reconciliationNotes.push(
      `MCP detected legacy domain (${body.landing_page_url ?? "unknown"}) without the required ` +
      `BRIEF-021 governance gap. A blocker has been injected. This domain is no longer active under ` +
      `the Concentrix brand and must not be used for new campaigns.`,
    );
  }

  // ── Check 2: SERVICE_TAXONOMY_DRIFT ──────────────────────────────────────────
  // When MCP has an exact ("confirmed") service match, the plan's canonical_offering
  // and resolution_confidence should reflect it. If the AI drifted from the authoritative
  // taxonomy, these corrections normalize the service context.
  //
  // What MCP may correct: canonical_offering (string), resolution_confidence (string).
  // What MCP will not correct: any messaging, audience framing, or ad copy.
  if (body.product_or_service && context.service.match_confidence === "confirmed") {
    const confirmedCanonical = context.service.canonical_offering!;
    const canonicalDrifted = body.plan_canonical_offering !== confirmedCanonical;
    const confidenceUnderclaimed = body.plan_resolution_confidence !== "high";

    if (canonicalDrifted || confidenceUnderclaimed) {
      const driftParts: string[] = [];
      if (canonicalDrifted) {
        driftParts.push(
          `canonical_offering "${body.plan_canonical_offering ?? "null"}" → "${confirmedCanonical}"`,
        );
      }
      if (confidenceUnderclaimed) {
        driftParts.push(
          `resolution_confidence "${body.plan_resolution_confidence ?? "null"}" → "high"`,
        );
      }
      violations.push({
        code: "SERVICE_TAXONOMY_DRIFT",
        severity: "advisory",
        field: "service_context",
        message:
          `MCP has a confirmed exact match for "${body.product_or_service}": ` +
          `canonical_offering="${confirmedCanonical}", service_category="${context.service.service_category ?? "unknown"}". ` +
          `Plan recorded: ${driftParts.join("; ")}. Service context should be normalized to the confirmed Concentrix taxonomy.`,
      });
      if (canonicalDrifted) {
        corrections.push({
          field: "service_context.canonical_offering",
          corrected_value: confirmedCanonical,
          reason:
            `MCP confirmed exact alias match for "${body.product_or_service}" → "${confirmedCanonical}" ` +
            `(${context.service.service_category ?? "unknown"} / ${context.service.service_group ?? "unknown"})`,
        });
      }
      if (confidenceUnderclaimed) {
        corrections.push({
          field: "service_context.resolution_confidence",
          corrected_value: "high",
          reason: `MCP match_confidence is "confirmed" — plan resolution_confidence should be "high"`,
        });
      }
      reconciliationNotes.push(
        `Service taxonomy normalized to Concentrix canonical: "${confirmedCanonical}" ` +
        `(${context.service.service_category ?? "unknown"}, ${context.service.service_group ?? "unknown"}).`,
      );
    }
  }

  // ── Check 3: CAREERS_LANDING_PAGE_FAMILY_MISMATCH ────────────────────────────
  // The family-guidance guardrail fires at intake time (pre-AI), but the translate
  // call happens later with a user-selectable family override. If the landing page
  // is a canonical careers domain and the selected family is not Search, flag it.
  // Not auto-correctable: changing family at post-validation time would require
  // re-assembling the entire blueprint.
  if (
    context.landing_page.domain_status === "canonical_career" &&
    body.selected_family !== "search"
  ) {
    violations.push({
      code: "CAREERS_LANDING_PAGE_FAMILY_MISMATCH",
      severity: "advisory",
      field: "selected_family",
      message:
        `Landing page is a canonical Concentrix careers recruitment domain, but the selected ` +
        `campaign family is "${body.selected_family}". Careers campaigns require Search to capture ` +
        `high-intent job-seeker queries. Visual and discovery families are not suited to ` +
        `recruitment conversions and inflate cost-per-application.`,
    });
    reconciliationNotes.push(
      `Careers domain detected with non-Search family "${body.selected_family}". ` +
      `Review family selection — Search is the governance-recommended family for recruitment campaigns.`,
    );
  }

  const passed = violations.every((v) => v.severity !== "blocker");

  const response: MCPPostValidationResponse = {
    passed,
    violations,
    corrections,
    reconciliation_notes: reconciliationNotes,
    validated_at: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
