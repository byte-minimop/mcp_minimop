/**
 * MCP learning promotion — deterministic pattern detection and promotion rules.
 *
 * Promotion is threshold-based, explicit, and never autonomous:
 *   - a pattern accumulates evidence until it crosses a threshold
 *   - crossing the threshold marks the pattern as "promoted"
 *   - promoted patterns are advisory records; they do not rewrite policy
 *
 * Thresholds are intentionally low (2–3) because in an operational system
 * even 2–3 consistent signals from a real workflow have high value.
 */

import { randomUUID } from "node:crypto";
import type {
  LearningEventType,
  LearningEventContext,
  LearningPatternRow,
  FamilyOverrideContext,
  ServiceCorrectionContext,
  RecurringBlockerContext,
  SuccessfulCaseContext,
  MCPLearningPatternStatus,
} from "./schema";

// ── Promotion thresholds ──────────────────────────────────────────────────────

const PROMOTION_THRESHOLDS: Record<string, number> = {
  family_override_preference: 3,
  service_normalization_candidate: 2,
  recurring_blocker_pattern: 3,
  successful_use_case_pattern: 2,
};

// ── Signal key construction ───────────────────────────────────────────────────

/**
 * Build a deterministic, human-readable dedup key from an event context.
 *
 * Keys are narrow enough to be meaningful (same family pair + same service
 * context = same key) but broad enough to accumulate across different runs
 * and accounts. Account-level scoping is intentionally excluded from keys
 * because cross-account patterns are more operationally useful at Phase 1.
 */
export function buildSignalKey(
  eventType: LearningEventType,
  context: LearningEventContext,
): string {
  switch (eventType) {
    case "family_override": {
      const c = context as FamilyOverrideContext;
      return `override:${c.recommended_family}→${c.selected_family}:svc:${c.service_category ?? "unknown"}`;
    }
    case "service_correction": {
      const c = context as ServiceCorrectionContext;
      const rawNorm = c.raw_input.toLowerCase().trim();
      const mcpNorm = c.mcp_canonical.toLowerCase().trim();
      return `svc_correction:${rawNorm}→${mcpNorm}`;
    }
    case "recurring_blocker": {
      const c = context as RecurringBlockerContext;
      return `blocker:${c.rule_id}:fam:${c.family}:svc:${c.service_category ?? "unknown"}`;
    }
    case "successful_case": {
      const c = context as SuccessfulCaseContext;
      return `success:fam:${c.family}:svc:${c.service_category ?? "unknown"}:ctx:${c.campaign_context ?? "unknown"}`;
    }
  }
}

// ── Pattern type mapping ──────────────────────────────────────────────────────

export function patternTypeForEvent(eventType: LearningEventType): string {
  switch (eventType) {
    case "family_override": return "family_override_preference";
    case "service_correction": return "service_normalization_candidate";
    case "recurring_blocker": return "recurring_blocker_pattern";
    case "successful_case": return "successful_use_case_pattern";
  }
}

// ── Advisory note generation ──────────────────────────────────────────────────

function buildAdvisoryNote(
  patternType: string,
  context: LearningEventContext,
  count: number,
): string {
  switch (patternType) {
    case "family_override_preference": {
      const c = context as FamilyOverrideContext;
      return (
        `Operators consistently select '${c.selected_family}' over MCP-recommended ` +
        `'${c.recommended_family}' for ${c.service_category ?? "unknown"} campaigns ` +
        `(${count} occurrence${count !== 1 ? "s" : ""}). ` +
        `Consider adjusting family guidance weights for this service context.`
      );
    }
    case "service_normalization_candidate": {
      const c = context as ServiceCorrectionContext;
      return (
        `AI consistently maps '${c.raw_input}' to '${c.ai_canonical ?? "null"}' — ` +
        `MCP canonical is '${c.mcp_canonical}' ` +
        `(${count} correction${count !== 1 ? "s" : ""}). ` +
        `Consider adding this alias to the service normalization catalog.`
      );
    }
    case "recurring_blocker_pattern": {
      const c = context as RecurringBlockerContext;
      return (
        `Blocker '${c.rule_id}' recurs ${count} time${count !== 1 ? "s" : ""} ` +
        `for '${c.family}' campaigns in '${c.service_category ?? "unknown"}' context. ` +
        `Consider surfacing a pre-emptive warning in family guidance for this combination.`
      );
    }
    case "successful_use_case_pattern": {
      const c = context as SuccessfulCaseContext;
      return (
        `Successful '${c.family}' use case for '${c.service_category ?? "unknown"}' ` +
        `${c.campaign_context ? `(${c.campaign_context}) ` : ""}` +
        `has repeated ${count} time${count !== 1 ? "s" : ""}. ` +
        `Use as a manager-visible reference pattern: ${c.manager_summary}`
      );
    }
    default:
      return `Pattern detected after ${count} occurrence${count !== 1 ? "s" : ""}.`;
  }
}

// ── Core promotion logic ──────────────────────────────────────────────────────

interface Db {
  prepare: (sql: string) => { get: (...args: unknown[]) => unknown; run: (...args: unknown[]) => unknown };
}

/**
 * Upsert the learning_patterns table for a given signal_key and evaluate
 * whether the pattern should be promoted.
 *
 * Called synchronously after every event insert. Returns the pattern status
 * reflecting what happened: new candidate, count bump, or promotion.
 */
export function evaluatePromotion(
  db: Db,
  signalKey: string,
  eventType: LearningEventType,
  context: LearningEventContext,
  now: string,
): MCPLearningPatternStatus {
  const patternType = patternTypeForEvent(eventType);
  const threshold = PROMOTION_THRESHOLDS[patternType] ?? 999;

  const existing = db
    .prepare(`SELECT * FROM learning_patterns WHERE signal_key = ?`)
    .get(signalKey) as LearningPatternRow | undefined;

  if (!existing) {
    const advisory = buildAdvisoryNote(patternType, context, 1);
    db.prepare(`
      INSERT INTO learning_patterns
        (id, pattern_type, signal_key, first_seen, last_seen, occurrence_count, status, context_json, advisory_note)
      VALUES (?, ?, ?, ?, ?, 1, 'candidate', ?, ?)
    `).run(randomUUID(), patternType, signalKey, now, now, JSON.stringify(context), advisory);
    return "new_candidate";
  }

  if (existing.status === "promoted") {
    db.prepare(`
      UPDATE learning_patterns
      SET occurrence_count = occurrence_count + 1, last_seen = ?
      WHERE signal_key = ?
    `).run(now, signalKey);
    return "existing_promoted";
  }

  const newCount = existing.occurrence_count + 1;
  const advisory = buildAdvisoryNote(patternType, context, newCount);

  if (newCount >= threshold) {
    db.prepare(`
      UPDATE learning_patterns
      SET occurrence_count = ?, last_seen = ?, status = 'promoted', promoted_at = ?, advisory_note = ?
      WHERE signal_key = ?
    `).run(newCount, now, now, advisory, signalKey);
    return "promoted";
  }

  db.prepare(`
    UPDATE learning_patterns
    SET occurrence_count = ?, last_seen = ?, advisory_note = ?
    WHERE signal_key = ?
  `).run(newCount, now, advisory, signalKey);
  return "updated_candidate";
}
