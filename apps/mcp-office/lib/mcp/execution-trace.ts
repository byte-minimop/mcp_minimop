/**
 * Execution Trace: owner-only structured view over a Beacon campaign run.
 *
 * Reads Beacon's operational SQLite database (read-only) and reconstructs
 * a typed trace model from the persisted run, version, event, and push
 * records. Nothing is a giant unstructured blob — heavy artifacts
 * (prompts, blueprints, localized bundles) are kept separate from the
 * light-weight records that drive the timeline, decisions, AI calls,
 * external calls, validation, and push audit sections.
 *
 * Server-side only — never import from client components. The full JSON
 * artifacts can be large (60–100 KB each), so run-detail data is fetched
 * per-run rather than bulk-loaded.
 *
 * Uses node:sqlite (built-in, Node 22.5+) — no native compilation required.
 */

import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";

import {
  type TraceStatus,
  type TraceEvent,
  type DecisionRecord,
  type AiCallRecord,
  type ExternalCallRecord,
  type ValidationIssue,
  type LocaleValidation,
  type ValidationSummary,
  type PushAuditEntry,
  type PushSummary,
  type PayloadArtifacts,
  type RunOverview,
  type ExecutionTrace,
  type RunListRow,
  type FailureSummary,
  type FailureStage,
  type FailureFinding,
  type FailureSeverity,
  type ReconciliationStatus,
  formatDurationShort,
} from "./execution-trace-types";

export {
  formatDurationShort,
  type TraceStatus,
  type TraceEvent,
  type DecisionRecord,
  type AiCallRecord,
  type ExternalCallRecord,
  type ValidationIssue,
  type LocaleValidation,
  type ValidationSummary,
  type PushAuditEntry,
  type PushSummary,
  type PayloadArtifacts,
  type RunOverview,
  type ExecutionTrace,
  type RunListRow,
  type FailureSummary,
  type FailureStage,
  type FailureFinding,
  type FailureSeverity,
  type ReconciliationStatus,
};

// ---------------------------------------------------------------------------
// Database access
// ---------------------------------------------------------------------------

// Default points at the running Beacon-newux instance (the one MCP is paired
// with). The previous default targeted the old /home/azureuser/Beacon DB and
// silently surfaced stale data. Override via BEACON_SQLITE_PATH if needed.
const BEACON_DB_PATH =
  process.env.BEACON_SQLITE_PATH ??
  "/home/azureuser/Beacon-newux/data/beacon.sqlite";

function openDb(): DatabaseSync | null {
  if (!existsSync(BEACON_DB_PATH)) return null;
  try {
    return new DatabaseSync(BEACON_DB_PATH, { readOnly: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[execution-trace] openDb failed for", BEACON_DB_PATH, ":", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// DB row shapes
// ---------------------------------------------------------------------------

interface RunRow {
  run_id: string;
  created_at: string;
  updated_at: string;
  latest_version_number: number;
  review_status: string;
  approved_version_number: number | null;
  last_transition_at: string;
  customer_id: string | null;
  created_by_user_id: string | null;
}

interface VersionRow {
  run_id: string;
  version_number: number;
  created_at: string;
  source: string;
  clarification_answers_json: string | null;
  brief_json: string;
  blueprint_json: string;
  execution_brief_json: string | null;
  localized_bundle_json: string | null;
}

interface EventRow {
  id: number;
  run_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  version_number: number | null;
  created_at: string;
  actor_user_id: string | null;
}

interface PushRow {
  id: number;
  created_at: string;
  run_id: string;
  user_id: string | null;
  customer_id: string;
  account_name: string | null;
  outcome: string;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function durationMs(startIso: string, endIso: string): number {
  const a = Date.parse(startIso);
  const b = Date.parse(endIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, b - a);
}

function extractRequestId(note: string | null): string | null {
  if (!note) return null;
  const m1 = note.match(/Request ID:\s*([A-Za-z0-9_\-]+)/);
  if (m1) return m1[1];
  const m2 = note.match(/"requestId":\s*"([A-Za-z0-9_\-]+)"/);
  if (m2) return m2[1];
  return null;
}

function extractCampaignIds(note: string | null): Array<{ locale_id: string; campaign_id: string }> {
  if (!note) return [];
  const out: Array<{ locale_id: string; campaign_id: string }> = [];
  const re = /([A-Z]{2,3}_[a-z]{2,3})\s*\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(note)) !== null) {
    out.push({ locale_id: m[1], campaign_id: m[2] });
  }
  return out;
}

function extractErrorExcerpt(note: string | null): string | null {
  if (!note) return null;
  const m = note.match(/"message":\s*"([^"]+)"/);
  if (m) return m[1];
  if (note.length > 200) return note.slice(0, 200) + "\u2026";
  return note;
}

function summarizeFamily(family: string): string {
  return family.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// User identity lookup — resolves push_audit.user_id → email/display_name.
// We snapshot the whole users table once per request (it's tiny, <100 rows in
// practice) and pass the map down to enrichers. Avoids N+1 queries.
// ---------------------------------------------------------------------------

interface UserIdentity {
  email: string;
  display_name: string;
}

function loadUserIdentities(db: DatabaseSync): Map<string, UserIdentity> {
  const out = new Map<string, UserIdentity>();
  try {
    const rows = db
      .prepare(`SELECT user_id, email, display_name FROM users`)
      .all() as unknown as Array<UserIdentity & { user_id: string }>;
    for (const r of rows) {
      out.set(r.user_id, { email: r.email, display_name: r.display_name });
    }
  } catch {
    // users table may be absent in legacy snapshots — degrade silently.
  }
  return out;
}

// ---------------------------------------------------------------------------
// Actor resolution — maps a user_id to a display label, handling dev-mode
// placeholder sessions created by ensurePlaceholderUser() in Beacon.
// ---------------------------------------------------------------------------

function resolveActor(
  userId: string | null,
  userIdentities: Map<string, UserIdentity>,
): { label: string | null; isDev: boolean } {
  if (!userId) return { label: null, isDev: false };
  const identity = userIdentities.get(userId);
  if (identity) {
    // Placeholder users have email "placeholder+<sessionId>@beacon.local" and
    // display_name "Beacon Test User". Show a meaningful dev label instead of
    // a raw session ID or the generic placeholder string.
    const isPlaceholder =
      identity.email.endsWith("@beacon.local") ||
      identity.display_name === "Beacon Test User";
    if (isPlaceholder) return { label: "dev mode (no SSO)", isDev: true };
    return { label: identity.email, isDev: false };
  }
  // user_id present but not in the users table — legacy run or orphaned session.
  const isDev = userId.startsWith("placeholder-");
  return {
    label: isDev ? "dev mode (no SSO)" : userId.slice(0, 16) + "…",
    isDev,
  };
}

// ---------------------------------------------------------------------------
// State reconciliation — compares runs.review_status with the push_audit
// ledger. Surfaces drift so an owner can spot runs whose status no longer
// matches what actually happened against Google Ads.
// ---------------------------------------------------------------------------

/**
 * Mirrors Beacon Queue's SQL CASE rewrite (lib/infra/run-store.ts:776):
 *   review_status='pushed' AND no successful push_audit ⇒ display as ready_to_push
 * Both surfaces must apply the same rule so a single run prints the same
 * status word in Beacon Queue and MCP Runs. The reconciliation field is the
 * *explanation* of why the displayed status differs from the raw DB value;
 * it is not a substitute for showing the same word.
 */
function effectiveReviewStatus(
  rawStatus: string,
  pushes: { outcome: string }[],
): string {
  if (rawStatus !== "pushed") return rawStatus;
  const anySucceeded = pushes.some((p) => p.outcome === "succeeded");
  return anySucceeded ? "pushed" : "ready_to_push";
}

function classifyReconciliation(
  reviewStatus: string,
  pushes: PushAuditEntry[],
): ReconciliationStatus {
  const anySucceeded = pushes.some((p) => p.outcome === "succeeded");
  // status='pushed' with no successful audit row is the strongest drift case.
  // Check this BEFORE the "no_push_attempts" early-return — a run that claims
  // pushed but has no push_audit history at all is the most misleading state
  // an owner can encounter, and must be flagged.
  if (reviewStatus === "pushed" && !anySucceeded) {
    return "status_overstates_push";
  }
  if (pushes.length === 0) return "no_push_attempts";
  const latest = pushes[pushes.length - 1];
  if (reviewStatus !== "pushed" && latest.outcome === "succeeded") {
    return "status_understates_push";
  }
  return "consistent";
}

function classifyPushStatus(
  outcome: PushAuditEntry["outcome"] | null,
): RunOverview["push_status"] {
  if (!outcome) return "not_pushed";
  if (outcome === "succeeded") return "pushed";
  return outcome;
}

function classifyValidation(blueprint: Record<string, unknown>, bundle: Record<string, unknown> | null): TraceStatus {
  const hard = asArr(blueprint["hard_gaps"]);
  const soft = asArr(blueprint["soft_gaps"]);
  if (hard.length > 0) return "error";
  if (bundle) {
    const bv = asObj(bundle["bundle_validation"]);
    const invalid = Number(bv["invalid_units"] ?? 0);
    const warnUnits = Number(bv["warning_units"] ?? 0);
    if (invalid > 0) return "error";
    if (warnUnits > 0 || soft.length > 0) return "warning";
  } else if (soft.length > 0) {
    return "warning";
  }
  return "ok";
}

// ---------------------------------------------------------------------------
// Overview builder
// ---------------------------------------------------------------------------

function buildOverview(
  run: RunRow,
  version: VersionRow,
  blueprint: Record<string, unknown>,
  brief: Record<string, unknown>,
  bundle: Record<string, unknown> | null,
  latestPush: PushAuditEntry | null,
  pushes: PushAuditEntry[] = [],
  userIdentities: Map<string, UserIdentity> = new Map(),
): RunOverview {
  const campaignSummary = asObj(blueprint["campaign_summary"]);
  const geography = asObj(blueprint["geography_summary"]);
  const assumptions = asArr(blueprint["assumptions"]).filter((v): v is string => typeof v === "string");

  const selectedFamily = asStr(campaignSummary["selected_family"]) || asStr(brief["selected_family"]) || "unknown";
  const recommendedFamily = asStr(campaignSummary["recommended_family"]) || selectedFamily;
  const campaignName = asStr(campaignSummary["campaign_name"], "Untitled campaign");
  const campaignUnderscore = campaignName.replace(/\s+/g, "_");

  const locales: string[] = [];
  if (bundle) {
    for (const u of asArr(bundle["units"])) {
      const loc = asObj(asObj(u)["locale"]);
      const id = asStr(loc["locale_id"]);
      if (id) locales.push(id);
    }
  }

  const markets = asStr(geography["geography"]).split(/,\s*/).filter(Boolean);
  const primaryLanguage = asStr(geography["language"], "English");

  const whySelected = assumptions.find((a) => /chosen|selected|deprioritized|top\s*\d/i.test(a))
    ?? asStr(campaignSummary["objective_label"])
    ?? "Family chosen by planner.";

  const started = run.created_at;
  const ended = latestPush ? latestPush.timestamp : run.updated_at;
  const totalDuration = durationMs(started, ended);

  const validationStatus = classifyValidation(blueprint, bundle);
  const pushStatus = classifyPushStatus(latestPush?.outcome ?? null);
  const reconciliation = classifyReconciliation(run.review_status, pushes);

  const creator = resolveActor(run.created_by_user_id ?? null, userIdentities);

  return {
    run_id: run.run_id,
    brief_intent: asStr(brief["key_message"]) || asStr(campaignSummary["brief_summary"]) || "(no brief intent recorded)",
    campaign_name: campaignName,
    campaign_underscore: campaignUnderscore,
    selected_family: summarizeFamily(selectedFamily),
    recommended_family: summarizeFamily(recommendedFamily),
    why_selected: whySelected,
    primary_language: primaryLanguage,
    locales_generated: locales,
    // Apply the same status downgrade Beacon Queue applies, so the same run
    // shows the same status word in both surfaces. Reconciliation field still
    // explains the why when status_overstates_push.
    status: effectiveReviewStatus(run.review_status, pushes),
    validation_status: validationStatus,
    push_status: pushStatus,
    reconciliation,
    total_duration_ms: totalDuration,
    started_at: started,
    ended_at: ended,
    markets,
    objective: asStr(brief["campaign_objective"]) || asStr(campaignSummary["objective_label"]) || "",
    created_by: creator.label,
    created_by_is_dev: creator.isDev,
    customer_id: run.customer_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Timeline builder
// ---------------------------------------------------------------------------

function buildTimeline(
  run: RunRow,
  version: VersionRow,
  blueprint: Record<string, unknown>,
  bundle: Record<string, unknown> | null,
  events: EventRow[],
  pushes: PushAuditEntry[],
  userIdentities: Map<string, UserIdentity> = new Map(),
): TraceEvent[] {
  const out: TraceEvent[] = [];
  const runId = run.run_id;

  const versionSavedEvt = events.find((e) => e.event_type === "version_saved" && e.version_number === version.version_number);
  const planningEnd = versionSavedEvt?.created_at ?? version.created_at;
  const planningStart = run.created_at;

  out.push({
    run_id: runId,
    step_id: "brief_received",
    event_type: "brief_received",
    label: "Brief received",
    status: "ok",
    timestamp: run.created_at,
    duration_ms: 0,
    summary: "Brief submitted from Beacon UI",
    input_summary: `${(version.brief_json?.length ?? 0).toLocaleString()} bytes`,
    output_summary: null,
    decision_reason: null,
    provider: null,
    model: null,
    external_request_id: null,
    fallback_used: false,
    error_code: null,
    error_message: null,
    actor_label: null,
    actor_is_dev: false,
  });

  out.push({
    run_id: runId,
    step_id: "planning_started",
    event_type: "planning_started",
    label: "Planning started",
    status: "ok",
    timestamp: planningStart,
    duration_ms: 0,
    summary: "Planner began deriving campaign blueprint",
    input_summary: null,
    output_summary: null,
    decision_reason: null,
    provider: null,
    model: null,
    external_request_id: null,
    fallback_used: false,
    error_code: null,
    error_message: null,
    actor_label: null,
    actor_is_dev: false,
  });

  const campaignSummary = asObj(blueprint["campaign_summary"]);
  out.push({
    run_id: runId,
    step_id: "family_recommendation",
    event_type: "family_recommendation",
    label: "Family recommendation completed",
    status: campaignSummary["family_override_active"] ? "warning" : "ok",
    timestamp: planningEnd,
    duration_ms: null,
    summary: `Recommended ${asStr(campaignSummary["recommended_family"], "?")} · selected ${asStr(campaignSummary["selected_family"], "?")}`,
    input_summary: null,
    output_summary: asStr(campaignSummary["campaign_name"]) || null,
    decision_reason: asStr(campaignSummary["objective_label"]) || null,
    provider: null,
    model: null,
    external_request_id: null,
    fallback_used: Boolean(campaignSummary["family_override_active"]),
    error_code: null,
    error_message: null,
    actor_label: null,
    actor_is_dev: false,
  });

  out.push({
    run_id: runId,
    step_id: "planning_completed",
    event_type: "planning_completed",
    label: "Planning completed",
    status: "ok",
    timestamp: planningEnd,
    duration_ms: durationMs(planningStart, planningEnd),
    summary: "Blueprint written to run version",
    input_summary: null,
    output_summary: `${(version.blueprint_json?.length ?? 0).toLocaleString()} bytes blueprint`,
    decision_reason: null,
    provider: null,
    model: null,
    external_request_id: null,
    fallback_used: false,
    error_code: null,
    error_message: null,
    actor_label: null,
    actor_is_dev: false,
  });

  if (bundle) {
    const localeCount = asArr(bundle["units"]).length;
    out.push({
      run_id: runId,
      step_id: "localization_expansion",
      event_type: "localization_expansion",
      label: "Localization expansion completed",
      status: "ok",
      timestamp: planningEnd,
      duration_ms: null,
      summary: `${localeCount} locale unit(s) expanded · mode: ${asStr(bundle["localization_mode"], "?")}`,
      input_summary: null,
      output_summary: asArr(bundle["units"]).map((u) => asStr(asObj(asObj(u)["locale"])["locale_id"])).join(", "),
      decision_reason: null,
      provider: null,
      model: null,
      external_request_id: null,
      fallback_used: false,
      error_code: null,
      error_message: null,
      actor_label: null,
      actor_is_dev: false,
    });

    if (asStr(bundle["localization_mode"]) === "adapt" || asStr(bundle["localization_mode"]) === "translate") {
      out.push({
        run_id: runId,
        step_id: "translation_call",
        event_type: "translation_call",
        label: "Translation call completed",
        status: "ok",
        timestamp: planningEnd,
        duration_ms: null,
        summary: `Translation pass for ${localeCount} locale(s)`,
        input_summary: `Source: ${asStr(bundle["source_brief_summary"]).slice(0, 80)}\u2026`,
        output_summary: `${localeCount} creative sets`,
        decision_reason: null,
        provider: "Azure OpenAI",
        model: asStr(process.env.AZURE_OPENAI_DEPLOYMENT, "gpt-4o"),
        external_request_id: null,
        fallback_used: false,
        error_code: null,
        error_message: null,
        actor_label: null,
        actor_is_dev: false,
      });
    }
  }

  out.push({
    run_id: runId,
    step_id: "payload_build",
    event_type: "payload_build",
    label: "Payload build completed",
    status: "ok",
    timestamp: planningEnd,
    duration_ms: null,
    summary: "Google Ads payload assembled from blueprint",
    input_summary: null,
    output_summary: `campaign_name: ${asStr(campaignSummary["campaign_name"])}`,
    decision_reason: null,
    provider: null,
    model: null,
    external_request_id: null,
    fallback_used: false,
    error_code: null,
    error_message: null,
    actor_label: null,
    actor_is_dev: false,
  });

  const validationStatus = classifyValidation(blueprint, bundle);
  out.push({
    run_id: runId,
    step_id: "validation",
    event_type: "validation",
    label: "Validation completed",
    status: validationStatus,
    timestamp: planningEnd,
    duration_ms: null,
    summary:
      validationStatus === "ok"
        ? "No blocking issues"
        : validationStatus === "warning"
          ? "Warnings present"
          : "Blocking issues present",
    input_summary: null,
    output_summary: null,
    decision_reason: null,
    provider: null,
    model: null,
    external_request_id: null,
    fallback_used: false,
    error_code: null,
    error_message: null,
    actor_label: null,
    actor_is_dev: false,
  });

  for (const ev of events) {
    if (ev.event_type !== "status_changed") continue;
    const evActor = resolveActor(ev.actor_user_id ?? null, userIdentities);
    if (ev.to_status === "approved") {
      out.push({
        run_id: runId,
        step_id: `approval_${ev.id}`,
        event_type: "approval",
        label: "Approved",
        status: "ok",
        timestamp: ev.created_at,
        duration_ms: null,
        summary: ev.note ?? "Blueprint approved",
        input_summary: null,
        output_summary: null,
        decision_reason: null,
        provider: null,
        model: null,
        external_request_id: null,
        fallback_used: false,
        error_code: null,
        error_message: null,
        actor_label: evActor.label,
        actor_is_dev: evActor.isDev,
      });
    } else if (ev.to_status === "ready_to_push") {
      out.push({
        run_id: runId,
        step_id: `ready_${ev.id}`,
        event_type: "ready_to_push",
        label: "Marked ready to push",
        status: "ok",
        timestamp: ev.created_at,
        duration_ms: null,
        summary: ev.note ?? "Ready to push",
        input_summary: null,
        output_summary: null,
        decision_reason: null,
        provider: null,
        model: null,
        external_request_id: null,
        fallback_used: false,
        error_code: null,
        error_message: null,
        actor_label: evActor.label,
        actor_is_dev: evActor.isDev,
      });
    } else if (ev.to_status === "draft" && ev.from_status && ev.from_status !== "draft") {
      out.push({
        run_id: runId,
        step_id: `reopen_${ev.id}`,
        event_type: "review_reopened",
        label: "Review reopened",
        status: "warning",
        timestamp: ev.created_at,
        duration_ms: null,
        summary: ev.note ?? "Review reopened",
        input_summary: null,
        output_summary: null,
        decision_reason: null,
        provider: null,
        model: null,
        external_request_id: null,
        fallback_used: false,
        error_code: null,
        error_message: null,
        actor_label: evActor.label,
        actor_is_dev: evActor.isDev,
      });
    } else if (ev.to_status === "pushed" || ev.to_status === "push_failed") {
      out.push({
        run_id: runId,
        step_id: `push_evt_${ev.id}`,
        event_type: "push_completed",
        label: ev.to_status === "pushed" ? "Push completed" : "Push failed",
        status: ev.to_status === "pushed" ? "ok" : "error",
        timestamp: ev.created_at,
        duration_ms: null,
        summary: ev.note ? ev.note.slice(0, 200) : null,
        input_summary: null,
        output_summary: null,
        decision_reason: null,
        provider: null,
        model: null,
        external_request_id: extractRequestId(ev.note),
        fallback_used: false,
        error_code: null,
        error_message: ev.to_status === "push_failed" ? extractErrorExcerpt(ev.note) : null,
        actor_label: evActor.label,
        actor_is_dev: evActor.isDev,
      });
    }
  }

  for (const p of pushes) {
    const isSuccess = p.outcome === "succeeded";
    out.push({
      run_id: runId,
      step_id: `push_${p.id}`,
      event_type: "push_attempt",
      label: isSuccess ? "Push succeeded" : `Push ${p.outcome}`,
      status: isSuccess ? "ok" : p.outcome === "blocked" ? "blocked" : "error",
      timestamp: p.timestamp,
      duration_ms: null,
      summary: p.note ? p.note.slice(0, 200) : null,
      input_summary: `customer_id: ${p.customer_id}`,
      output_summary: p.campaign_ids.length ? p.campaign_ids.join(", ") : null,
      decision_reason: null,
      provider: "Google Ads API",
      model: null,
      external_request_id: p.request_id,
      fallback_used: false,
      error_code: null,
      error_message: p.error_excerpt,
      actor_label: p.actor_email ?? null,
      actor_is_dev: p.actor_email?.endsWith("@beacon.local") ?? false,
    });
  }

  out.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return out;
}

// ---------------------------------------------------------------------------
// Decision log builder
// ---------------------------------------------------------------------------

function buildDecisions(
  run: RunRow,
  blueprint: Record<string, unknown>,
  bundle: Record<string, unknown> | null,
): DecisionRecord[] {
  const out: DecisionRecord[] = [];
  const cs = asObj(blueprint["campaign_summary"]);
  const cr = asObj(blueprint["campaign_requirements"]);
  const geo = asObj(blueprint["geography_summary"]);
  const lr = asObj(blueprint["launch_readiness"]);
  const et = asObj(lr["execution_truth"]);
  const convSignal = asObj(blueprint["conversion_signal"]);
  const assumptions = asArr(blueprint["assumptions"]).filter((v): v is string => typeof v === "string");
  const ts = run.created_at;

  out.push({
    decision_id: "selected_family",
    decision_type: "selected_family",
    label: "Selected campaign family",
    chosen_value: summarizeFamily(asStr(cs["selected_family"]) || "unknown"),
    reason: `Recommended ${summarizeFamily(asStr(cs["recommended_family"]) || "?")}; objective fit: ${asStr(cr["family_objective_fit"], "unknown")}. ${cs["family_override_active"] ? "User override active." : "No override."}`,
    timestamp: ts,
    source: "planner",
  });

  const ra = assumptions.find((a) => /top\s*\d.*candidate/i.test(a));
  if (ra) {
    out.push({
      decision_id: "family_fit_rationale",
      decision_type: "family_fit",
      label: "Family fit rationale",
      chosen_value: summarizeFamily(asStr(cs["selected_family"]) || "?"),
      reason: ra,
      timestamp: ts,
      source: "planner",
    });
  }

  out.push({
    decision_id: "campaign_name",
    decision_type: "campaign_name_generated",
    label: "Campaign name generated",
    chosen_value: asStr(cs["campaign_name"], "(unnamed)"),
    reason: "Generated from naming template: [Market] | [Offering] | [Objective] | [Family] | [Theme] | [YYYY-MM]",
    timestamp: ts,
    source: "naming",
  });

  if (geo["language_was_assumed"]) {
    out.push({
      decision_id: "language_assumption",
      decision_type: "language_assumption",
      label: "Language assumption",
      chosen_value: asStr(geo["language"], "English"),
      reason: "No explicit language in brief — bounded default applied",
      timestamp: ts,
      source: "planner",
    });
  }

  if (bundle) {
    out.push({
      decision_id: "localization_mode",
      decision_type: "localization_mode",
      label: "Localization mode",
      chosen_value: asStr(bundle["localization_mode"], "?"),
      reason: `Locale expansion over ${asArr(bundle["units"]).length} unit(s) from bundled source brief`,
      timestamp: ts,
      source: "localization",
    });

    const localeIds = asArr(bundle["units"])
      .map((u) => asStr(asObj(asObj(u)["locale"])["locale_id"]))
      .filter(Boolean);
    if (localeIds.length > 0) {
      out.push({
        decision_id: "locale_expansion",
        decision_type: "locale_expansion",
        label: "Locale expansion",
        chosen_value: localeIds.join(", "),
        reason: `Derived from market list: ${asStr(geo["geography"], "?")}`,
        timestamp: ts,
        source: "localization",
      });
    }
  }

  const userList = asObj(et["google_ads_user_list"]);
  if (asStr(userList["source"]) === "fallback") {
    out.push({
      decision_id: "user_list_fallback",
      decision_type: "fallback_used",
      label: "Fallback used — Google Ads user list",
      chosen_value: "none",
      reason: asStr(userList["reason"], "No live Google Ads audience was selected."),
      timestamp: ts,
      source: "readiness",
    });
  }

  const convAction = asObj(et["google_ads_conversion_action"]);
  if (asStr(convAction["source"]) === "fallback") {
    out.push({
      decision_id: "conversion_action_fallback",
      decision_type: "fallback_used",
      label: "Fallback used — Google Ads conversion action",
      chosen_value: "none",
      reason: asStr(convAction["reason"], "No live Google Ads conversion selected."),
      timestamp: ts,
      source: "readiness",
    });
  } else if (asStr(convAction["conversion_name"])) {
    out.push({
      decision_id: "conversion_action_selected",
      decision_type: "conversion_action_selection",
      label: "Conversion action selected",
      chosen_value: asStr(convAction["conversion_name"]),
      reason: asStr(convAction["reason"], "Selected live conversion action for measurement"),
      timestamp: ts,
      source: "readiness",
    });
  }

  const bt = asObj(et["bidding_truth"]);
  if (asStr(bt["strategy"])) {
    out.push({
      decision_id: "bidding_strategy",
      decision_type: "bidding_strategy",
      label: "Bidding strategy",
      chosen_value: asStr(bt["strategy"]),
      reason: asStr(bt["reason"], "Set by readiness or inferred default"),
      timestamp: ts,
      source: "readiness",
    });
  }

  if (asStr(convSignal["focus_conversion_event"])) {
    out.push({
      decision_id: "conversion_event",
      decision_type: "conversion_event_selected",
      label: "Conversion focus event",
      chosen_value: asStr(convSignal["conversion_label"], asStr(convSignal["focus_conversion_event"])),
      reason: `Source: ${asStr(convSignal["source"], "?")} · ${asStr(convSignal["google_ads_mapping_hint"], "")}`.trim(),
      timestamp: ts,
      source: "planner",
    });
  }

  out.push({
    decision_id: "validation_mode",
    decision_type: "validation_mode",
    label: "Validation mode",
    chosen_value: bundle ? "bundle + readiness" : "readiness_only",
    reason: bundle
      ? "Multilingual bundle present — per-locale validation run in addition to readiness gates"
      : "Single-locale run — readiness gates only",
    timestamp: ts,
    source: "planner",
  });

  return out;
}

// ---------------------------------------------------------------------------
// AI calls builder
// ---------------------------------------------------------------------------

function buildAiCalls(
  run: RunRow,
  version: VersionRow,
  brief: Record<string, unknown>,
  blueprint: Record<string, unknown>,
  bundle: Record<string, unknown> | null,
): AiCallRecord[] {
  const out: AiCallRecord[] = [];
  const ts = version.created_at;
  const cs = asObj(blueprint["campaign_summary"]);
  const provider = "Azure OpenAI";
  const model = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

  const briefPreview = JSON.stringify(
    {
      landing_page_url: asStr(brief["landing_page_url"]),
      product_or_service: asStr(brief["product_or_service"]),
      campaign_objective: asStr(brief["campaign_objective"]),
      target_geography: asStr(brief["target_geography"]),
      key_message: asStr(brief["key_message"]).slice(0, 160),
    },
    null,
    2,
  );

  out.push({
    call_id: "plan_blueprint",
    purpose: "Blueprint generation",
    provider,
    model,
    status: "ok",
    timestamp: ts,
    duration_ms: null,
    prompt_preview:
      "Generate a campaign blueprint from the submitted brief. Select the best campaign family for the objective, produce campaign name, audience summary, conversion mapping, readiness gates, and assumptions.\n\nBrief:\n" +
      briefPreview,
    response_preview: `Selected family: ${asStr(cs["selected_family"], "?")}\nCampaign name: ${asStr(cs["campaign_name"], "?")}\nBrief summary: ${asStr(cs["brief_summary"]).slice(0, 240)}\u2026`,
    parsed_output_summary: `campaign_family=${asStr(cs["selected_family"])} · type_was_inferred=${Boolean(cs["type_was_inferred"])} · objective_was_inferred=${Boolean(cs["objective_was_inferred"])}`,
    fallback_used: Boolean(cs["family_override_active"]),
    prompt_source: "synthetic_reconstruction",
    response_source: "persisted_artifact_excerpt",
    artifact_name: "blueprint_json",
    artifact_json: version.blueprint_json ?? null,
  });

  if (bundle) {
    const localeCount = asArr(bundle["units"]).length;
    out.push({
      call_id: "localize_bundle",
      purpose: `Localization — ${asStr(bundle["localization_mode"], "?")}`,
      provider,
      model,
      status: "ok",
      timestamp: ts,
      duration_ms: null,
      prompt_preview:
        `Adapt the source campaign into ${localeCount} locale unit(s). Preserve headline intent within RSA character limits. Locales: ` +
        asArr(bundle["units"])
          .map((u) => asStr(asObj(asObj(u)["locale"])["locale_id"]))
          .join(", "),
      response_preview: asArr(bundle["units"])
        .slice(0, 2)
        .map((u) => {
          const o = asObj(u);
          return `${asStr(asObj(o["locale"])["locale_id"])}: ${asStr(o["campaign_name"])}`;
        })
        .join("\n"),
      parsed_output_summary: `${localeCount} units generated · ${asObj(bundle["bundle_validation"])["valid_units"] ?? 0} valid · mode=${asStr(bundle["localization_mode"])}`,
      fallback_used: false,
      prompt_source: "synthetic_reconstruction",
      response_source: "persisted_artifact_excerpt",
      artifact_name: "localized_bundle_json",
      artifact_json: version.localized_bundle_json ?? null,
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// External calls builder
// ---------------------------------------------------------------------------

function buildExternalCalls(
  blueprint: Record<string, unknown>,
  pushes: PushAuditEntry[],
): ExternalCallRecord[] {
  const out: ExternalCallRecord[] = [];
  const lr = asObj(blueprint["launch_readiness"]);
  const et = asObj(lr["execution_truth"]);
  const lp = asObj(blueprint["landing_page_analysis"]);

  if (asStr(lp["fetch_status"])) {
    out.push({
      call_id: "lp_fetch",
      system: "Landing page fetch",
      purpose: "Fetch target landing page for structural analysis",
      timestamp: "",
      status: asStr(lp["fetch_status"]) === "fetched" ? "ok" : "warning",
      status_code: null,
      duration_ms: null,
      request_id: null,
      summary: `${asStr(lp["url"])} · title: ${asStr(lp["title"]).slice(0, 80)}`,
      error_excerpt: null,
    });
  }

  const userList = asObj(et["google_ads_user_list"]);
  if (asStr(userList["source"]) === "fallback") {
    out.push({
      call_id: "google_ads_user_list_lookup",
      system: "Google Ads API",
      purpose: "User list (audience) lookup",
      timestamp: "",
      status: "skipped",
      status_code: null,
      duration_ms: null,
      request_id: null,
      summary: asStr(userList["reason"], "No live audience selected"),
      error_excerpt: null,
    });
  }

  const convAction = asObj(et["google_ads_conversion_action"]);
  if (asStr(convAction["source"]) === "fallback") {
    out.push({
      call_id: "google_ads_conversion_action_lookup",
      system: "Google Ads API",
      purpose: "Conversion action lookup",
      timestamp: "",
      status: "skipped",
      status_code: null,
      duration_ms: null,
      request_id: null,
      summary: asStr(convAction["reason"], "No live conversion selected"),
      error_excerpt: null,
    });
  }

  for (const p of pushes) {
    const validateOnly = Boolean(p.validate_only);
    const isSuccess = p.outcome === "succeeded";
    const isValidationFail = p.outcome === "validation_failed";
    out.push({
      call_id: `google_ads_${validateOnly || isValidationFail ? "validate" : "push"}_${p.id}`,
      system: "Google Ads API",
      purpose: isValidationFail || validateOnly ? "Campaign validation (validateOnly)" : "Campaign creation (push)",
      timestamp: p.timestamp,
      status: isSuccess ? "ok" : p.outcome === "blocked" ? "blocked" : "error",
      status_code: isSuccess ? 200 : 400,
      duration_ms: null,
      request_id: p.request_id,
      summary: p.note ? p.note.slice(0, 200) : p.outcome,
      error_excerpt: p.error_excerpt,
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Validation builder
// ---------------------------------------------------------------------------

function buildValidation(
  blueprint: Record<string, unknown>,
  bundle: Record<string, unknown> | null,
  pushes: PushAuditEntry[],
): ValidationSummary {
  const cr = asObj(blueprint["campaign_requirements"]);
  const issues: ValidationIssue[] = [];
  const dependencyChecks = asArr(cr["dependency_checks"]);
  for (const d of dependencyChecks) {
    const o = asObj(d);
    const sev = asStr(o["severity"]);
    issues.push({
      domain: asStr(o["domain"], "general"),
      severity: sev === "error" || sev === "blocker" ? "error" : sev === "warning" ? "warning" : "ok",
      message: asStr(o["message"]),
      field_names: asArr(o["field_names"]).filter((v): v is string => typeof v === "string"),
    });
  }

  const perLocale: LocaleValidation[] = [];
  if (bundle) {
    for (const u of asArr(bundle["units"])) {
      const o = asObj(u);
      const v = asObj(o["validation"]);
      perLocale.push({
        locale_id: asStr(asObj(o["locale"])["locale_id"]),
        is_valid: Boolean(v["is_valid"]),
        errors: asArr(v["errors"]).filter((x): x is string => typeof x === "string"),
        warnings: asArr(v["warnings"]).filter((x): x is string => typeof x === "string"),
      });
    }
  }

  const missingAssets: string[] = [];
  const reqAssets = asArr(blueprint["required_assets"]).filter((v): v is string => typeof v === "string");
  const lr = asObj(blueprint["launch_readiness"]);
  const et = asObj(lr["execution_truth"]);
  for (const key of ["google_ads_user_list", "google_ads_conversion_action", "active_customer_id"]) {
    const o = asObj(et[key]);
    if (asStr(o["status"]) === "missing") {
      missingAssets.push(key.replace(/_/g, " "));
    }
  }

  const googleAdsRequestIds: string[] = [];
  for (const p of pushes) {
    if (p.request_id) googleAdsRequestIds.push(p.request_id);
  }

  const fallbackNotes = asArr(blueprint["assumptions"])
    .filter((v): v is string => typeof v === "string")
    .filter((a) => /inferred|assumed|fallback|default/i.test(a));

  const overall = classifyValidation(blueprint, bundle);
  const mode: ValidationSummary["mode"] = bundle
    ? "bundle"
    : googleAdsRequestIds.length > 0
      ? "google_ads_validate_only"
      : "readiness_only";

  const hardGaps = asArr(blueprint["hard_gaps"]).filter((v): v is string => typeof v === "string");
  const softGaps = asArr(blueprint["soft_gaps"]).filter((v): v is string => typeof v === "string");

  return {
    overall_status: overall,
    mode,
    hard_gaps: hardGaps,
    soft_gaps: softGaps,
    issues,
    missing_assets: missingAssets.length ? missingAssets : reqAssets,
    character_limit_fixes: [],
    google_ads_request_ids: googleAdsRequestIds,
    fallback_notes: fallbackNotes,
    per_locale: perLocale,
  };
}

// ---------------------------------------------------------------------------
// Push summary builder
// ---------------------------------------------------------------------------

function buildPushSummary(
  run: RunRow,
  events: EventRow[],
  pushes: PushAuditEntry[],
): PushSummary {
  const latest = pushes.length ? pushes[pushes.length - 1] : null;
  const succeeded = pushes.find((p) => p.outcome === "succeeded");
  const allCampaignIds: string[] = [];
  for (const p of pushes) for (const id of p.campaign_ids) allCampaignIds.push(id);

  const triggerSource =
    run.review_status === "pushed" || succeeded
      ? "owner approved → push in Beacon UI"
      : events.some((e) => e.to_status === "ready_to_push")
        ? "queued via ready-to-push transition"
        : "not triggered";

  return {
    pushed: Boolean(succeeded),
    latest_outcome: latest?.outcome ?? null,
    validate_only: latest ? latest.validate_only : false,
    paused: latest ? latest.paused : true,
    campaign_ids: allCampaignIds,
    trigger_source: triggerSource,
    audit: pushes,
  };
}

// ---------------------------------------------------------------------------
// Failure summary builder
// ---------------------------------------------------------------------------

function buildFailureSummary(
  overview: RunOverview,
  validation: ValidationSummary,
  push: PushSummary,
  decisions: DecisionRecord[],
): FailureSummary {
  const findings: FailureFinding[] = [];

  const latestPush = push.audit.length ? push.audit[push.audit.length - 1] : null;
  const pushFailed =
    latestPush &&
    latestPush.outcome !== "succeeded" &&
    !push.audit.some(
      (p) => p.outcome === "succeeded" && Date.parse(p.timestamp) > Date.parse(latestPush.timestamp),
    );

  const fallbackDecisions = decisions.filter((d) => d.decision_type === "fallback_used");

  if (pushFailed && latestPush) {
    const errorLine = latestPush.error_excerpt ?? latestPush.note ?? "Google Ads rejected the payload";
    const stage: FailureStage = latestPush.validate_only ? "validation" : "push";
    const rootCause =
      extractTopGoogleAdsErrorCode(latestPush.note) ??
      latestPush.error_excerpt ??
      "See raw note for details";
    const action =
      /DUPLICATE_CAMPAIGN_NAME/i.test(latestPush.note ?? "")
        ? "Rename the campaign or reuse the existing one — Google Ads rejects duplicate names in the same account."
        : /INVALID_ARGUMENT/i.test(latestPush.note ?? "")
          ? "Open Payloads tab, fix the field called out in the error, and re-run validation before pushing."
          : /RESOURCE_NOT_FOUND/i.test(latestPush.note ?? "")
            ? "A dependent resource (ad group, criterion, campaign) is missing — rebuild the payload from the current blueprint."
            : "Review the External Calls tab for the full Google Ads response and adjust the payload.";

    findings.push({
      label:
        latestPush.outcome === "validation_failed"
          ? "Google Ads validateOnly failed"
          : latestPush.outcome === "blocked"
            ? "Push blocked"
            : "Push failed",
      detail: errorLine,
      request_id: latestPush.request_id,
    });

    for (const f of fallbackDecisions) {
      findings.push({ label: f.label, detail: f.reason });
    }

    return {
      severity: "error",
      headline: `Google Ads ${latestPush.validate_only ? "validation" : "push"} failed${stage === "validation" ? "" : " mid-mutation"}. Root cause: ${rootCause}.`,
      stage,
      root_cause: rootCause,
      request_id: latestPush.request_id,
      recommended_action: action,
      findings,
    };
  }

  if (validation.overall_status === "error") {
    const firstErr = validation.issues.find((i) => i.severity === "error");
    const root = firstErr ? `${firstErr.domain}: ${firstErr.message}` : validation.hard_gaps[0] ?? "Blocking validation issue";
    for (const g of validation.hard_gaps) findings.push({ label: "Hard gap", detail: g });
    for (const i of validation.issues.filter((x) => x.severity === "error")) {
      findings.push({ label: `Error · ${i.domain}`, detail: i.message });
    }
    return {
      severity: "error",
      headline: `Validation failed at ${overview.selected_family}. Root cause: ${root}.`,
      stage: "validation",
      root_cause: root,
      request_id: validation.google_ads_request_ids[0] ?? null,
      recommended_action:
        "Resolve the hard gaps before re-running push. Open the Validation tab for the full issue list.",
      findings,
    };
  }

  const warningIssues = validation.issues.filter((i) => i.severity === "warning");
  if (fallbackDecisions.length > 0 || warningIssues.length > 0 || validation.overall_status === "warning") {
    for (const f of fallbackDecisions) {
      findings.push({ label: f.label, detail: f.reason });
    }
    for (const w of warningIssues.slice(0, 4)) {
      findings.push({ label: `Warning · ${w.domain}`, detail: w.message });
    }
    const headline =
      fallbackDecisions.length > 0
        ? `Run completed with fallback${fallbackDecisions.length > 1 ? "s" : ""}. ${fallbackDecisions[0].label}: ${truncate(fallbackDecisions[0].reason, 140)}`
        : `Run completed with ${warningIssues.length} warning${warningIssues.length === 1 ? "" : "s"}.`;

    return {
      severity: "warning",
      headline,
      stage: fallbackDecisions.length > 0 ? "family_recommendation" : "validation",
      root_cause: fallbackDecisions[0]?.reason ?? warningIssues[0]?.message ?? null,
      request_id: null,
      recommended_action:
        fallbackDecisions.length > 0
          ? "Confirm the fallback is acceptable before push — consider providing the missing input and re-running."
          : "Review warnings in the Validation tab; push is allowed but results will reflect the current state.",
      findings,
    };
  }

  const successDetail =
    push.pushed && latestPush
      ? `Pushed to ${latestPush.account_name ?? latestPush.customer_id}${latestPush.paused ? " (paused)" : ""}${push.campaign_ids.length ? ` · ${push.campaign_ids.length} campaign${push.campaign_ids.length === 1 ? "" : "s"}` : ""}`
      : overview.status === "ready_to_push"
        ? "Ready to push — no validation issues"
        : overview.status === "approved"
          ? "Approved — awaiting push"
          : "Blueprint generated cleanly";

  return {
    severity: "success",
    headline: successDetail,
    stage: "none",
    root_cause: null,
    request_id: latestPush?.request_id ?? null,
    recommended_action: null,
    findings: [],
  };
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

function extractTopGoogleAdsErrorCode(note: string | null): string | null {
  if (!note) return null;
  const m = note.match(/"errorCode":\s*\{\s*"([a-zA-Z]+)":\s*"([A-Z_0-9]+)"/);
  if (m) return `${m[1]}: ${m[2]}`;
  const msg = note.match(/"message":\s*"([^"]+)"/);
  return msg ? msg[1] : null;
}

// ---------------------------------------------------------------------------
// Push audit row enrichment
// ---------------------------------------------------------------------------

function enrichPush(
  row: PushRow,
  userIdentities: Map<string, UserIdentity>,
): PushAuditEntry {
  const note = row.note;
  const requestId = extractRequestId(note);
  const campaignIdPairs = extractCampaignIds(note);
  const paused = !!(note && /[Pp]aused/.test(note));
  const validateOnly = !!(note && /validateOnly/.test(note));
  const campaignIds = campaignIdPairs.length > 0
    ? campaignIdPairs.map((p) => p.campaign_id)
    : requestId
      ? [requestId]
      : [];

  const identity = row.user_id ? userIdentities.get(row.user_id) ?? null : null;

  return {
    id: row.id,
    timestamp: row.created_at,
    customer_id: row.customer_id,
    account_name: row.account_name,
    outcome: (row.outcome as PushAuditEntry["outcome"]) ?? "failed",
    user_id: row.user_id,
    actor_email: identity?.email ?? null,
    actor_display_name: identity?.display_name ?? null,
    note,
    request_id: requestId,
    paused,
    validate_only: validateOnly,
    per_locale_ids: campaignIdPairs,
    campaign_ids: campaignIds,
    error_excerpt: row.outcome === "succeeded" ? null : extractErrorExcerpt(note),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isExecutionTraceAvailable(): boolean {
  const db = openDb();
  if (!db) return false;
  db.close();
  return true;
}

export function listRuns(limit = 100, customerId: string | null = null): RunListRow[] {
  const db = openDb();
  if (!db) return [];
  try {
    const userIdentities = loadUserIdentities(db);

    const rows = db
      .prepare(
        // Order by updated_at so any save, status transition, or push attempt
        // bubbles the run to the top. created_at would freeze a run's position
        // at intake time, hiding live activity (status changes, push results)
        // behind newer-but-untouched runs.
        //
        // Customer scoping: when a customerId is supplied (active account from
        // the placeholder/SSO cookie) we restrict to that account so MCP Runs
        // shows the same set of runs the user sees in Beacon Queue. Passing
        // null returns all runs (admin-wide view).
        `SELECT r.run_id, r.created_at, r.updated_at, r.review_status, r.latest_version_number,
                r.customer_id, r.created_by_user_id,
                v.brief_json, v.blueprint_json, v.localized_bundle_json
         FROM runs r
         LEFT JOIN run_versions v
                ON v.run_id = r.run_id
               AND v.version_number = r.latest_version_number
         WHERE (? IS NULL OR r.customer_id = ?)
         ORDER BY r.updated_at DESC
         LIMIT ?`,
      )
      .all(customerId, customerId, limit) as unknown as Array<{
      run_id: string;
      created_at: string;
      updated_at: string;
      review_status: string;
      latest_version_number: number;
      customer_id: string | null;
      created_by_user_id: string | null;
      brief_json: string | null;
      blueprint_json: string | null;
      localized_bundle_json: string | null;
    }>;

    const pushLatestByRun = db
      .prepare(
        `SELECT run_id, outcome, created_at, user_id, account_name
         FROM push_audit
         WHERE id IN (
           SELECT MAX(id) FROM push_audit GROUP BY run_id
         )`,
      )
      .all() as unknown as Array<{ run_id: string; outcome: string; created_at: string; user_id: string | null; account_name: string | null }>;
    const pushByRun = new Map(pushLatestByRun.map((p) => [p.run_id, p]));

    const pushAllByRun = db
      .prepare(
        `SELECT run_id, note, outcome FROM push_audit ORDER BY id ASC`,
      )
      .all() as unknown as Array<{ run_id: string; note: string | null; outcome: string }>;
    const requestIdsByRun = new Map<string, string[]>();
    // Per-run ordered outcome list — needed for reconciliation drift detection.
    // Cheap to keep in memory: push_audit is ~1 row per push attempt.
    const outcomesByRun = new Map<string, Array<PushAuditEntry["outcome"]>>();
    for (const p of pushAllByRun) {
      const id = extractRequestId(p.note);
      if (id) {
        const arr = requestIdsByRun.get(p.run_id) ?? [];
        arr.push(id);
        requestIdsByRun.set(p.run_id, arr);
      }
      const outcomeList = outcomesByRun.get(p.run_id) ?? [];
      outcomeList.push((p.outcome as PushAuditEntry["outcome"]) ?? "failed");
      outcomesByRun.set(p.run_id, outcomeList);
    }

    const result: RunListRow[] = [];
    for (const r of rows) {
      const brief = asObj(safeJsonParse(r.brief_json));
      const blueprint = asObj(safeJsonParse(r.blueprint_json));
      const bundle = r.localized_bundle_json ? asObj(safeJsonParse(r.localized_bundle_json)) : null;
      const cs = asObj(blueprint["campaign_summary"]);
      const geo = asObj(blueprint["geography_summary"]);
      const locales = bundle
        ? asArr(bundle["units"])
            .map((u) => asStr(asObj(asObj(u)["locale"])["locale_id"]))
            .filter(Boolean)
        : [];
      const markets = asStr(geo["geography"]).split(/,\s*/).filter(Boolean);
      const family = asStr(cs["selected_family"]) || asStr(brief["selected_family"]) || "unknown";
      const campaignTitle =
        asStr(cs["campaign_name"]) ||
        asStr(brief["product_or_service"]) ||
        r.run_id.slice(0, 8);
      const productOrService = asStr(brief["product_or_service"]) || asStr(cs["product_or_service"]) || null;
      const campaignObjective = asStr(brief["campaign_objective"]) || asStr(cs["objective"]) || null;
      const targetAudience = asStr(brief["target_audience"]) || asStr(cs["target_audience"]) || null;
      const budgetAmount = brief["budget_amount"] ?? asObj(brief["budget"])["amount"];
      const budgetCurrency = asStr(brief["budget_currency"]) || asStr(asObj(brief["budget"])["currency"]);
      const budgetLabel = budgetAmount !== undefined && budgetAmount !== null && String(budgetAmount).trim()
        ? `${budgetCurrency || ""}${budgetCurrency ? " " : ""}${String(budgetAmount)}`
        : null;
      const campaignUnderscore = campaignTitle.replace(/\s+/g, "_");
      const started = r.created_at;
      const latestPush = pushByRun.get(r.run_id) ?? null;
      const pushActor = latestPush?.user_id ? resolveActor(latestPush.user_id, userIdentities) : null;
      const ended = latestPush?.created_at ?? r.updated_at;
      const validationStatus = classifyValidation(blueprint, bundle);
      const pushStatus = classifyPushStatus(
        (latestPush?.outcome as PushAuditEntry["outcome"] | undefined) ?? null,
      );

      const hardGaps = asArr(blueprint["hard_gaps"]).filter((v): v is string => typeof v === "string");
      const softGaps = asArr(blueprint["soft_gaps"]).filter((v): v is string => typeof v === "string");
      const cr = asObj(blueprint["campaign_requirements"]);
      const warningDeps = asArr(cr["warning_dependencies"]).filter((v): v is string => typeof v === "string");
      const bundleValidation = bundle ? asObj(bundle["bundle_validation"]) : {};
      const bundleInvalid = Number(bundleValidation["invalid_units"] ?? 0);
      const bundleWarn = Number(bundleValidation["warning_units"] ?? 0);
      const hasErrors =
        hardGaps.length > 0 ||
        bundleInvalid > 0 ||
        validationStatus === "error" ||
        pushStatus === "failed" ||
        pushStatus === "validation_failed" ||
        pushStatus === "blocked";
      const hasWarnings = softGaps.length > 0 || warningDeps.length > 0 || bundleWarn > 0;
      const lr = asObj(blueprint["launch_readiness"]);
      const et = asObj(lr["execution_truth"]);
      const fallbackUsed = ["google_ads_user_list", "google_ads_conversion_action"].some((k) => {
        const o = asObj(et[k]);
        return asStr(o["source"]) === "fallback";
      }) || Boolean(cs["family_override_active"]);

      // Reconciliation: derive lightweight PushAuditEntry stubs from the
      // outcome list we already gathered. classifyReconciliation only reads
      // .outcome and the array length, so we don't need the full enriched
      // shape here — keeping listRuns hot path cheap.
      const outcomeStubs: PushAuditEntry[] = (outcomesByRun.get(r.run_id) ?? []).map(
        (oc) => ({ outcome: oc } as unknown as PushAuditEntry),
      );
      const reconciliation = classifyReconciliation(r.review_status, outcomeStubs);

      const rowCreator = resolveActor(r.created_by_user_id ?? null, userIdentities);
      result.push({
        run_id: r.run_id,
        campaign_title: campaignTitle,
        campaign_underscore: campaignUnderscore,
        family: summarizeFamily(family),
        markets,
        locales,
        multilingual: locales.length > 1,
        // Same downgrade rule as Beacon Queue, using the per-run outcome list
        // we already collected. Both surfaces now print the same status word.
        status: effectiveReviewStatus(r.review_status, outcomeStubs),
        started_at: started,
        duration_ms: durationMs(started, ended),
        validation_status: validationStatus,
        push_status: pushStatus,
        reconciliation,
        has_warnings: hasWarnings,
        has_errors: hasErrors,
        fallback_used: fallbackUsed,
        request_ids: requestIdsByRun.get(r.run_id) ?? [],
        product_or_service: productOrService,
        campaign_objective: campaignObjective,
        target_audience: targetAudience,
        budget_label: budgetLabel,
        latest_push_actor: pushActor?.label ?? null,
        latest_push_account_name: latestPush?.account_name ?? null,
        customer_id: r.customer_id ?? null,
        creator: rowCreator.label,
        creator_is_dev: rowCreator.isDev,
      });
    }
    return result;
  } finally {
    db.close();
  }
}

export function getExecutionTrace(runId: string): ExecutionTrace | null {
  const db = openDb();
  if (!db) return null;
  try {
    const run = db.prepare(`SELECT * FROM runs WHERE run_id = ?`).get(runId) as unknown as
      | RunRow
      | undefined;
    if (!run) return null;

    const version = db
      .prepare(
        `SELECT * FROM run_versions WHERE run_id = ? AND version_number = ? LIMIT 1`,
      )
      .get(runId, run.latest_version_number) as unknown as VersionRow | undefined;
    if (!version) return null;

    const events = db
      .prepare(
        `SELECT * FROM run_events WHERE run_id = ? ORDER BY id ASC`,
      )
      .all(runId) as unknown as EventRow[];

    const pushRows = db
      .prepare(
        `SELECT * FROM push_audit WHERE run_id = ? ORDER BY id ASC`,
      )
      .all(runId) as unknown as PushRow[];
    const userIdentities = loadUserIdentities(db);
    const pushes = pushRows.map((row) => enrichPush(row, userIdentities));
    const latestPush = pushes.length ? pushes[pushes.length - 1] : null;

    const brief = asObj(safeJsonParse(version.brief_json));
    const blueprint = asObj(safeJsonParse(version.blueprint_json));
    const bundle = version.localized_bundle_json
      ? asObj(safeJsonParse(version.localized_bundle_json))
      : null;

    const overview = buildOverview(run, version, blueprint, brief, bundle, latestPush, pushes, userIdentities);
    const timeline = buildTimeline(run, version, blueprint, bundle, events, pushes, userIdentities);
    const decisions = buildDecisions(run, blueprint, bundle);
    const aiCalls = buildAiCalls(run, version, brief, blueprint, bundle);
    const externalCalls = buildExternalCalls(blueprint, pushes);
    const validation = buildValidation(blueprint, bundle, pushes);
    const push = buildPushSummary(run, events, pushes);
    const failureSummary = buildFailureSummary(overview, validation, push, decisions);

    return {
      overview,
      failure_summary: failureSummary,
      timeline,
      decisions,
      ai_calls: aiCalls,
      external_calls: externalCalls,
      validation,
      push,
      payloads: {
        brief_json: version.brief_json ?? null,
        blueprint_json: version.blueprint_json ?? null,
        execution_brief_json: version.execution_brief_json ?? null,
        localized_bundle_json: version.localized_bundle_json ?? null,
      },
    };
  } finally {
    db.close();
  }
}
