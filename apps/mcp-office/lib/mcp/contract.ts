/**
 * Phase 1 MCP Runtime API contract.
 *
 * This file is the single source of truth for the Beacon ↔ MCP HTTP interface.
 * A mirror lives in Beacon-newux/types/mcp-contract.ts — keep both in sync when
 * adding or changing fields. No code generation; manual sync is intentional at
 * this scale.
 *
 * Versioning: the health endpoint returns version "1". Increment when any
 * request or response shape changes in a breaking way.
 */

// ── Health ───────────────────────────────────────────────────────────────────

export interface MCPHealthResponse {
  status: "ok" | "degraded";
  version: "1";
  timestamp: string;
  checks?: {
    storage?: {
      ok: boolean;
      data_dir_configured: boolean;
      error?: "storage_unavailable" | "storage_probe_mismatch" | "storage_data_dir_unconfigured";
    };
  };
}

// ── Corporate messaging guidance ──────────────────────────────────────────────
//
// Runtime summary derived from the New Realities knowledge pack.
// Included in MCPContextBundle when campaign_context === "corporate".
// Designed to be usable by any MCP coworker or agent — not Beacon-specific.

export interface MCPCorporateMessagingGuidance {
  /** Which knowledge pack this guidance was derived from */
  source_pack: "new_realities";
  /** Campaign/brand identity hierarchy — must be preserved in any output */
  identity: {
    campaign_platform: string;
    campaign_line: string;
    brand_position: string;
  };
  /** Primary buying audience — own outcomes and budget */
  primary_audience: string[];
  /** Influencer audience — credibility matters but not the center of gravity */
  influencer_audience: string[];
  /** Story recommended for the current context (typically Story 3 for performance) */
  recommended_story: {
    id: string;
    name: string;
    stage: string;
    thesis: string;
  } | null;
  /** All four campaign stories with funnel stage mappings */
  all_stories: Array<{
    id: string;
    name: string;
    stage: string;
    thesis: string;
  }>;
  /** Active message pillars */
  message_pillars: string[];
  /** Hard positioning rules — must be checked in any generated content */
  positioning_constraints: {
    never: string[];
    always: string[];
  };
  /** Phrase hierarchy rules — scope and mixing constraints for each phrase */
  language_rules: Array<{
    phrase: string;
    scope: string;
    rule: string;
  }>;
  /** Active narrative direction */
  narrative_direction: {
    challenges: string[];
    emphasizes: string[];
    avoids: string[];
  };
}

// ── Context assembly ─────────────────────────────────────────────────────────

export interface MCPContextRequest {
  /** Google Ads customer ID (dash-formatted or digits-only) */
  account_id?: string | null;
  product_or_service?: string | null;
  landing_page_url?: string | null;
  /** Used to infer campaign_context when account_id is unknown */
  campaign_objective?: string | null;
}

export interface MCPContextBundle {
  assembled_at: string;

  service: {
    canonical_offering: string | null;
    service_category: string | null;
    service_group: string | null;
    offering_id: string | null;
    matched_alias: string | null;
    /** "confirmed" = exact alias match, "fuzzy" = substring match, "none" = unresolved */
    match_confidence: "confirmed" | "fuzzy" | "none";
  };

  account: {
    account_id: string | null;
    name: string | null;
    /** null when account_id is not in the MCC knowledge catalog */
    context: "careers" | "corporate" | "mixed" | "legacy" | null;
    primary_region: string | null;
    /** Whether this account is approved for Beacon push operations */
    push_eligible: boolean;
    push_eligible_reason: string | null;
  };

  landing_page: {
    is_legacy_domain: boolean;
    is_canonical_career_domain: boolean;
    domain_status: "canonical_career" | "legacy_career" | "ats_pattern" | "unknown";
  };

  /** Inferred campaign context: careers when objective is attract_candidates or account is careers */
  campaign_context: "careers" | "corporate";

  /**
   * Corporate messaging guidance from the New Realities knowledge pack.
   * Non-null when campaign_context === "corporate".
   * Null for careers context — positioning knowledge is not applicable.
   * Reusable by any coworker that receives an MCPContextBundle.
   */
  corporate_messaging: MCPCorporateMessagingGuidance | null;

  /**
   * Pre-emptive warnings derived from promoted recurring_blocker_pattern learning signals.
   * Each entry represents a blocker that MCP has observed recur multiple times in this
   * service context. Advisory only — never blocks campaign creation automatically.
   * Empty array when no promoted patterns match the current service context.
   */
  recurring_blocker_warnings: MCPRecurringBlockerWarning[];
}

/**
 * A pre-emptive warning derived from a promoted recurring_blocker_pattern.
 * Tells downstream consumers (Beacon, AI reasoning) that a specific blocker
 * has historically recurred in this service context before the AI even runs.
 */
export interface MCPRecurringBlockerWarning {
  /** Gap rule ID that recurred, e.g. "MISSING_CONVERSION_TRACKING" */
  rule_id: string;
  /** Campaign family this blocker was observed in */
  family: string;
  service_category: string | null;
  occurrence_count: number;
  /** Full advisory note from the promoted learning pattern */
  advisory_note: string;
  /** Short human-readable summary for display or prompt injection */
  summary: string;
}

// ── Family guidance ──────────────────────────────────────────────────────────

export interface MCPFamilyGuidanceRequest {
  intent: string;
  campaign_objective: string;
  campaign_context: "careers" | "corporate";
  landing_page_url: string;
  product_or_service?: string | null;
  target_geography?: string | null;
  target_audience?: string | null;
  budget_amount?: number | null;
  budget_currency?: string | null;
  image_asset_status?: "available" | null;
  video_asset_status?: "available" | null;
  audience_buying_stage?: "awareness" | "consideration" | "intent" | "decision" | null;
}

export interface MCPRankedFamily {
  family: string;
  strategic_score: number;
  execution_maturity: number;
  detected_signals: string[];
}

export interface MCPFamilyGuidanceResponse {
  /** True when MCP applied a hard guardrail overriding any scoring */
  was_guardrail_forced: boolean;
  guardrail_reason: string | null;
  /** The MCP-determined recommendation (guardrail or top of ranked list) */
  recommended_family: string;
  ranked: MCPRankedFamily[];
  context_used: {
    campaign_context: "careers" | "corporate";
    service_category: string | null;
    account_context: string | null;
  };
  /**
   * Non-null when a promoted learning pattern influenced the family ranking.
   * Always null when was_guardrail_forced is true — hard guardrails outrank learned preference.
   * The biased family's detected_signals also carries a human-readable label.
   */
  learning_bias: {
    applied: boolean;
    biased_family: string;
    pattern_type: "family_override_preference";
    occurrence_count: number;
    note: string;
  } | null;
}

// ── Post-validation ──────────────────────────────────────────────────────────

/**
 * Snapshot of AI-generated output fields that MCP validates deterministically.
 * Sent by Beacon after AI generation completes, before persistence.
 */
export interface MCPPostValidationRequest {
  landing_page_url: string | null;
  product_or_service: string | null;
  /** The resolved campaign family stamped by Beacon server-side */
  selected_family: string;
  /** From CampaignPlan.service_context — AI-generated at plan time */
  plan_canonical_offering: string | null;
  plan_resolution_confidence: "high" | "low" | null;
  /** rule_id values from blueprint.hard_gaps — used to verify governance coverage */
  blueprint_hard_gap_rule_ids: string[];
  blueprint_status: "ready" | "ready_with_gaps" | "blocked";
}

export type MCPValidationSeverity = "blocker" | "advisory";

export interface MCPPostValidationViolation {
  /** Machine-readable violation code, e.g. "LEGACY_DOMAIN_UNGATED" */
  code: string;
  severity: MCPValidationSeverity;
  /** Dot-path of the affected field, e.g. "landing_page_url" */
  field: string;
  message: string;
}

export interface MCPPostValidationCorrection {
  /** Dot-path of the correctable field */
  field: string;
  /** Normalized value (always a string; callers must cast for non-string fields) */
  corrected_value: string;
  reason: string;
}

export interface MCPPostValidationResponse {
  /** True when no blocker violations were found */
  passed: boolean;
  violations: MCPPostValidationViolation[];
  /**
   * Corrections MCP may apply automatically — restricted to deterministic taxonomy
   * fields (canonical_offering, resolution_confidence). Never includes ad copy,
   * messaging, or audience strategy.
   */
  corrections: MCPPostValidationCorrection[];
  /** Human-readable governance notes for the review surface audit trail */
  reconciliation_notes: string[];
  validated_at: string;
}

// ── Operational learning events ──────────────────────────────────────────────

/**
 * A high-signal operational event emitted by Beacon after meaningful activity.
 * MCP captures these and uses them to build curated learning patterns over time.
 *
 * Four event types are supported at Phase 1:
 *   family_override    human selected different family than MCP recommended
 *   service_correction MCP had to fix AI's canonical offering at plan stage
 *   recurring_blocker  blueprint emitted a hard gap that recurs in this context
 *   successful_case    pushed case that can become a repeatable best-use-case pattern
 *
 * Events are captured broadly; only events that cross a pattern threshold are
 * promoted to reusable operational knowledge.
 */
export type MCPLearningEventType =
  | "family_override"
  | "service_correction"
  | "recurring_blocker"
  | "successful_case";

export interface MCPFamilyOverrideContext {
  recommended_family: string;
  selected_family: string;
  service_category: string | null;
  service_group: string | null;
  campaign_context: "careers" | "corporate" | null;
  mcp_guardrail_forced: boolean;
}

export interface MCPServiceCorrectionContext {
  raw_input: string;
  ai_canonical: string | null;
  mcp_canonical: string;
  service_category: string | null;
  service_group: string | null;
}

export interface MCPRecurringBlockerContext {
  rule_id: string;
  family: string;
  service_category: string | null;
  message: string;
}

export interface MCPSuccessfulCaseContext {
  family: string;
  service_category: string | null;
  service_group: string | null;
  campaign_context: "careers" | "corporate" | null;
  product_or_service: string | null;
  campaign_objective: string | null;
  markets: string[];
  locales: string[];
  push_outcome: "succeeded";
  manager_summary: string;
}

export interface MCPLearningEventRequest {
  event_type: MCPLearningEventType;
  account_id?: string | null;
  run_id?: string | null;
  context: MCPFamilyOverrideContext | MCPServiceCorrectionContext | MCPRecurringBlockerContext | MCPSuccessfulCaseContext;
}

/**
 * Status of the pattern that was upserted as a result of this event:
 *   new_candidate      first occurrence of this signal — pattern created
 *   updated_candidate  pattern count incremented, below promotion threshold
 *   promoted           count crossed threshold — pattern is now operational knowledge
 *   existing_promoted  pattern was already promoted — count still incremented
 *   no_pattern         event recorded but no pattern logic applies (should not occur)
 */
export type MCPLearningPatternStatus =
  | "new_candidate"
  | "updated_candidate"
  | "promoted"
  | "existing_promoted"
  | "no_pattern";

export interface MCPLearningEventResponse {
  accepted: true;
  event_id: string;
  pattern_status: MCPLearningPatternStatus;
}

// ── Case snapshots ──────────────────────────────────────────────────────────

export interface MCPCaseSnapshotRequest {
  run_id: string;
  version_number: number;
  review_status: string;
  customer_id?: string | null;
  actor_user_id?: string | null;
  event_type: "version_saved" | "status_changed" | "push_attempt" | "push_succeeded" | "push_failed";
  occurred_at?: string;
  campaign: {
    title: string;
    family: string;
    product_or_service: string | null;
    objective: string | null;
    target_audience: string | null;
    budget_label: string | null;
    campaign_context: "careers" | "corporate" | null;
    service_category: string | null;
    service_group: string | null;
    markets: string[];
    locales: string[];
  };
  governance: {
    validation_status: "ok" | "warning" | "error" | "blocked" | "pending" | "skipped";
    push_status: "not_pushed" | "pushed" | "validation_failed" | "failed" | "blocked";
    has_errors: boolean;
    has_warnings: boolean;
    hard_gap_rule_ids: string[];
    soft_gap_count: number;
    mcp_audit_state: string | null;
  };
  activity: {
    summary: string;
    last_action: string;
  };
}

export interface MCPCaseSnapshotResponse {
  accepted: true;
  run_id: string;
  stored_at: string;
}

// ── Push clearance ───────────────────────────────────────────────────────────

export interface MCPPushClearanceRequest {
  /** Google Ads customer ID (dash-formatted or digits-only) */
  customer_id: string;
}

export interface MCPPushClearanceResponse {
  cleared: boolean;
  account_id: string;
  account_name: string | null;
  /** Human-readable reason why push is approved (for audit logging) */
  reason: string | null;
  /** Non-empty when cleared is false */
  blockers: Array<{ code: string; message: string }>;
}
