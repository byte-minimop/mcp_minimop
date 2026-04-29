/**
 * Execution Trace type definitions.
 *
 * Declared in a separate file (no runtime side effects, no native
 * dependencies) so that client components can safely import these
 * types without dragging in the DB-bound module.
 */

export type TraceStatus =
  | "ok"
  | "warning"
  | "error"
  | "blocked"
  | "inferred"
  | "skipped"
  | "pending";

export type EventType =
  | "brief_received"
  | "planning_started"
  | "planning_completed"
  | "family_recommendation"
  | "localization_expansion"
  | "translation_call"
  | "payload_build"
  | "validation"
  | "approval"
  | "ready_to_push"
  | "push_attempt"
  | "push_completed"
  | "review_reopened";

export interface TraceEvent {
  run_id: string;
  step_id: string;
  event_type: EventType;
  label: string;
  status: TraceStatus;
  timestamp: string;
  duration_ms: number | null;
  summary: string | null;
  input_summary: string | null;
  output_summary: string | null;
  decision_reason: string | null;
  provider: string | null;
  model: string | null;
  external_request_id: string | null;
  fallback_used: boolean;
  error_code: string | null;
  error_message: string | null;
  /** Resolved actor label for human-triggered events (approval, reopen, ready_to_push). */
  actor_label: string | null;
  /** True when the actor is a dev-mode placeholder session (no real SSO identity). */
  actor_is_dev: boolean;
}

export type DecisionType =
  | "selected_family"
  | "family_fit"
  | "localization_mode"
  | "locale_expansion"
  | "naming_rule_applied"
  | "campaign_name_generated"
  | "fallback_used"
  | "validation_mode"
  | "conversion_event_selected"
  | "language_assumption"
  | "user_list_selection"
  | "conversion_action_selection"
  | "bidding_strategy";

export interface DecisionRecord {
  decision_id: string;
  decision_type: DecisionType;
  label: string;
  chosen_value: string;
  reason: string;
  timestamp: string;
  source: "brief" | "planner" | "readiness" | "localization" | "naming" | "push";
}

/**
 * AI call record.
 *
 * `prompt_source` and `response_source` are honest labels so the advanced
 * mode can distinguish persisted artifacts from reconstructions. We only
 * ever have:
 *   - a *persisted artifact* (the parsed JSON response, e.g. blueprint_json,
 *     localized_bundle_json), and
 *   - a *synthetic* prompt preview (we rebuild it from the known inputs).
 *
 * Beacon does not currently persist raw prompts or raw model responses;
 * advanced mode shows what is real (the artifact) and labels what is not.
 */
export interface AiCallRecord {
  call_id: string;
  purpose: string;
  provider: string;
  model: string;
  status: TraceStatus;
  timestamp: string;
  duration_ms: number | null;
  prompt_preview: string;
  response_preview: string;
  parsed_output_summary: string;
  fallback_used: boolean;
  prompt_source: "synthetic_reconstruction" | "persisted";
  response_source: "persisted_artifact_excerpt" | "synthesized";
  artifact_name: string | null;
  artifact_json: string | null;
}

export interface ExternalCallRecord {
  call_id: string;
  system: string;
  purpose: string;
  timestamp: string;
  status: TraceStatus;
  status_code: number | null;
  duration_ms: number | null;
  request_id: string | null;
  summary: string;
  error_excerpt: string | null;
}

export type ValidationSeverity = "ok" | "warning" | "error";

export interface ValidationIssue {
  domain: string;
  severity: ValidationSeverity;
  message: string;
  field_names: string[];
}

export interface LocaleValidation {
  locale_id: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationSummary {
  overall_status: TraceStatus;
  mode: "readiness_only" | "google_ads_validate_only" | "bundle";
  hard_gaps: string[];
  soft_gaps: string[];
  issues: ValidationIssue[];
  missing_assets: string[];
  character_limit_fixes: string[];
  google_ads_request_ids: string[];
  fallback_notes: string[];
  per_locale: LocaleValidation[];
}

export interface PushAuditEntry {
  id: number;
  timestamp: string;
  customer_id: string;
  account_name: string | null;
  outcome: "succeeded" | "validation_failed" | "failed" | "blocked";
  user_id: string | null;
  /** Resolved from users.email — null if user_id is unknown to the users table. */
  actor_email: string | null;
  /** Resolved from users.display_name — null if user_id is unknown. */
  actor_display_name: string | null;
  note: string | null;
  request_id: string | null;
  paused: boolean;
  validate_only: boolean;
  per_locale_ids: Array<{ locale_id: string; campaign_id: string }>;
  campaign_ids: string[];
  error_excerpt: string | null;
}

/**
 * Reconciliation status between runs.review_status and the push_audit ledger.
 *
 *  - `consistent`               : status matches the audit history.
 *  - `status_overstates_push`   : runs.review_status='pushed' but no
 *                                  push_audit row with outcome='succeeded'.
 *  - `status_understates_push`  : runs.review_status not 'pushed' but the
 *                                  most recent push_audit outcome is
 *                                  'succeeded' (status drifted backwards
 *                                  without rolling the audit forward).
 *  - `no_push_attempts`         : no push_audit rows for this run yet.
 */
export type ReconciliationStatus =
  | "consistent"
  | "status_overstates_push"
  | "status_understates_push"
  | "no_push_attempts";

export interface PushSummary {
  pushed: boolean;
  latest_outcome: PushAuditEntry["outcome"] | null;
  validate_only: boolean;
  paused: boolean;
  campaign_ids: string[];
  trigger_source: string;
  audit: PushAuditEntry[];
}

export interface PayloadArtifacts {
  brief_json: string | null;
  blueprint_json: string | null;
  execution_brief_json: string | null;
  localized_bundle_json: string | null;
}

export interface RunOverview {
  run_id: string;
  brief_intent: string;
  campaign_name: string;
  campaign_underscore: string;
  selected_family: string;
  recommended_family: string;
  why_selected: string;
  primary_language: string;
  locales_generated: string[];
  status: string;
  validation_status: TraceStatus;
  push_status: "not_pushed" | "validation_failed" | "failed" | "blocked" | "pushed";
  reconciliation: ReconciliationStatus;
  total_duration_ms: number;
  started_at: string;
  ended_at: string;
  markets: string[];
  objective: string;
  /** Resolved email or dev-mode label for who submitted this run. */
  created_by: string | null;
  /** True when the creator is a dev-mode placeholder (no real SSO identity). */
  created_by_is_dev: boolean;
  /** Google Ads customer_id at run creation time (null if account not selected at intake). */
  customer_id: string | null;
}

/**
 * Failure / risk summary surfaced at the top of the run-detail view.
 *
 * - `severity` drives the colour and whether it is shown as a success
 *   card or an alert card.
 * - `stage` is the coarse pipeline stage where the issue manifested.
 * - `findings` is a short list of concrete points, ordered roughly by
 *   operational priority.
 */
export type FailureSeverity = "success" | "info" | "warning" | "error";

export type FailureStage =
  | "brief"
  | "planning"
  | "family_recommendation"
  | "localization"
  | "payload_build"
  | "validation"
  | "push"
  | "none";

export interface FailureFinding {
  label: string;
  detail: string;
  request_id?: string | null;
}

export interface FailureSummary {
  severity: FailureSeverity;
  headline: string;
  stage: FailureStage;
  root_cause: string | null;
  request_id: string | null;
  recommended_action: string | null;
  findings: FailureFinding[];
}

export interface ExecutionTrace {
  overview: RunOverview;
  failure_summary: FailureSummary;
  timeline: TraceEvent[];
  decisions: DecisionRecord[];
  ai_calls: AiCallRecord[];
  external_calls: ExternalCallRecord[];
  validation: ValidationSummary;
  push: PushSummary;
  payloads: PayloadArtifacts;
}

export interface RunListRow {
  run_id: string;
  campaign_title: string;
  campaign_underscore: string;
  family: string;
  markets: string[];
  locales: string[];
  multilingual: boolean;
  status: string;
  started_at: string;
  duration_ms: number;
  validation_status: TraceStatus;
  push_status: RunOverview["push_status"];
  reconciliation: ReconciliationStatus;
  has_warnings: boolean;
  has_errors: boolean;
  fallback_used: boolean;
  request_ids: string[];
  product_or_service: string | null;
  campaign_objective: string | null;
  target_audience: string | null;
  budget_label: string | null;
  latest_push_actor: string | null;
  latest_push_account_name: string | null;
  /** Google Ads customer_id for this run (null if account not selected at intake). */
  customer_id: string | null;
  /** Resolved email or dev-mode label for who submitted this run. */
  creator: string | null;
  /** True when the creator is a dev-mode placeholder (no real SSO identity). */
  creator_is_dev: boolean;
}

/**
 * Shared formatter — used by both server and client components, so it lives
 * alongside the types rather than in the DB-bound module.
 */
export function formatDurationShort(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "\u2014";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}
