/**
 * MCP operational learning — type definitions.
 *
 * Two-table model:
 *   learning_events   raw captured signals from Beacon activity
 *   learning_patterns promoted/curated operational knowledge derived from events
 *
 * Promotion is explicit and deterministic — patterns are never auto-applied.
 * Promoted patterns are advisory records for operators and future MCP reasoning;
 * they do not autonomously modify core truth or active policy.
 */

// ── Event types ───────────────────────────────────────────────────────────────

export type LearningEventType =
  | "family_override"      // human selected different family than MCP recommended
  | "service_correction"   // MCP had to correct AI's canonical offering at plan stage
  | "recurring_blocker"    // blueprint hard gap that recurs for the same context
  | "successful_case";     // pushed/validated case that is a good use-case signal

/** Context payload for a family_override event */
export interface FamilyOverrideContext {
  recommended_family: string;
  selected_family: string;
  service_category: string | null;
  service_group: string | null;
  campaign_context: "careers" | "corporate" | null;
  mcp_guardrail_forced: boolean;
}

/** Context payload for a service_correction event */
export interface ServiceCorrectionContext {
  raw_input: string;
  ai_canonical: string | null;
  mcp_canonical: string;
  service_category: string | null;
  service_group: string | null;
}

/** Context payload for a recurring_blocker event */
export interface RecurringBlockerContext {
  rule_id: string;
  family: string;
  service_category: string | null;
  message: string;
}

/** Context payload for a successful_case event */
export interface SuccessfulCaseContext {
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

export type LearningEventContext =
  | FamilyOverrideContext
  | ServiceCorrectionContext
  | RecurringBlockerContext
  | SuccessfulCaseContext;

// ── Pattern types ─────────────────────────────────────────────────────────────

export type LearningPatternType =
  | "family_override_preference"       // consistent override for a service context
  | "service_normalization_candidate"  // AI reliably gets this alias wrong
  | "recurring_blocker_pattern"        // same blocker keeps appearing for same context
  | "successful_use_case_pattern";     // repeatable high-quality use case MCP can reuse

export type LearningPatternStatus = "candidate" | "promoted" | "dismissed";

// ── DB row shapes (raw SQLite rows) ──────────────────────────────────────────

export interface LearningEventRow {
  id: string;
  event_type: LearningEventType;
  account_id: string | null;
  run_id: string | null;
  signal_key: string;
  context_json: string;
  occurred_at: string;
  processed_at: string | null;
}

export interface LearningPatternRow {
  id: string;
  pattern_type: LearningPatternType;
  signal_key: string;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  status: LearningPatternStatus;
  promoted_at: string | null;
  context_json: string;
  advisory_note: string;
}

// ── API types (used by contract.ts and the route) ────────────────────────────

export type MCPLearningPatternStatus =
  | "new_candidate"
  | "updated_candidate"
  | "promoted"
  | "existing_promoted"
  | "no_pattern";
