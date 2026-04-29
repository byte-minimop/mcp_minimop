/**
 * Read-only query layer for Beacon's operational SQLite database.
 *
 * UI-facing read layer — NOT a source of truth for Beacon runtime state.
 * Values here are rendered in the inspector. For authoritative Beacon runtime
 * truth, consult Beacon's lib/infra/run-store.ts directly.
 *
 * Opens the database in read-only mode, runs lightweight aggregate
 * and recent-event queries, and returns typed results for the
 * MCP Office Beacon detail page.
 *
 * Graceful degradation: if the database is missing or unreadable,
 * getBeaconActivity() returns null and the UI falls back to mock content.
 *
 * Server-side only — never import this in client components.
 */

// node:sqlite (built-in, Node 22.5+) — no native compilation. Avoids the
// broken better-sqlite3 prebuilt binary that ships in this workspace's
// node_modules (wrong ELF header for this architecture, fails to load).
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";

// ---------------------------------------------------------------------------
// Database path
// ---------------------------------------------------------------------------

// Default points at the running Beacon-newux instance (the one MCP is paired
// with). The previous default targeted the old /home/azureuser/Beacon DB and
// silently surfaced stale data. Override via BEACON_SQLITE_PATH if needed.
const BEACON_DB_PATH =
  process.env.BEACON_SQLITE_PATH ??
  "/home/azureuser/Beacon-newux/data/beacon.sqlite";

// ---------------------------------------------------------------------------
// Typed result shapes
// ---------------------------------------------------------------------------

export interface RecentEvent {
  id: number;
  run_id: string;
  event_type: "version_saved" | "status_changed";
  from_status: string | null;
  to_status: string | null;
  version_number: number | null;
  created_at: string;
}

export interface RecentPush {
  id: number;
  created_at: string;
  run_id: string;
  customer_id: string;
  account_name: string | null;
  outcome: "succeeded" | "validation_failed" | "failed" | "blocked";
  note: string | null;
}

export interface PushSummary {
  total: number;
  succeeded: number;
  validation_failed: number;
  failed: number;
  blocked: number;
}

export interface RunStatusCounts {
  draft: number;
  approved: number;
  ready_to_push: number;
  pushed: number;
  push_failed: number;
  other: number;
  total: number;
}

export interface BeaconActivity {
  recentEvents: RecentEvent[];
  recentPushes: RecentPush[];
  pushSummary: PushSummary;
  runStatus: RunStatusCounts;
  /** Runs whose blueprint was stamped mcp_governance_audit.state="skipped" —
   *  MCP post-validation did not run when these blueprints were generated. */
  governanceGapCount: number;
}

/**
 * Most-recent active run (anything that isn't already pushed) — used by the
 * MCP Office "Current run" card so it reflects what Beacon is actually
 * working on right now, not a hardcoded placeholder.
 */
export interface CurrentRunInfo {
  run_id: string;
  /** Effective status — same downgrade rule as Beacon Queue: a `pushed` row
   *  with no successful push_audit entry is reported as `ready_to_push`. */
  effective_status: string;
  campaign_title: string;
  family: string;
  geography: string;
  updated_at: string;
}

/**
 * Snapshot used by every MCP surface that displays Beacon-as-coworker truth
 * (Office, Overview, Coworkers, Shell). One server call → one consistent view.
 */
export interface BeaconOperationalSnapshot {
  totals: {
    runs: number;
    events: number;
    pushes: number;
  };
  runStatus: RunStatusCounts;
  pushSummary: PushSummary;
  /** Count of runs whose effective status is draft or regenerated — i.e. work
   *  the human review gate is currently sitting on. */
  queueAwaiting: number;
  recentEvents: RecentEvent[];
  recentPushes: RecentPush[];
  currentRun: CurrentRunInfo | null;
  lastPush: RecentPush | null;
}

export function getBeaconOperationalSnapshot(): BeaconOperationalSnapshot | null {
  const db = openDb();
  if (!db) return null;
  try {
    const totals = {
      runs: ((db.prepare(`SELECT COUNT(*) AS c FROM runs`).get() as { c: number } | undefined)?.c) ?? 0,
      events: ((db.prepare(`SELECT COUNT(*) AS c FROM run_events`).get() as { c: number } | undefined)?.c) ?? 0,
      pushes: ((db.prepare(`SELECT COUNT(*) AS c FROM push_audit`).get() as { c: number } | undefined)?.c) ?? 0,
    };

    // node:sqlite returns rows whose prototype isn't Object.prototype, which
    // RSC refuses to serialize across to client components. Spread each row
    // into a plain object before handing them up.
    const recentEvents = (db
      .prepare(
        `SELECT id, run_id, event_type, from_status, to_status, version_number, created_at
         FROM run_events ORDER BY created_at DESC LIMIT 8`
      )
      .all() as unknown as RecentEvent[]).map((r) => ({ ...r }));

    const recentPushes = (db
      .prepare(
        `SELECT id, created_at, run_id, customer_id, account_name, outcome, note
         FROM push_audit ORDER BY created_at DESC LIMIT 5`
      )
      .all() as unknown as RecentPush[]).map((r) => ({ ...r }));
    for (const p of recentPushes) {
      if (p.note && p.note.length > 120) p.note = p.note.slice(0, 120) + "\u2026";
    }

    const pushRows = db
      .prepare(`SELECT outcome, COUNT(*) as count FROM push_audit GROUP BY outcome`)
      .all() as Array<{ outcome: string; count: number }>;
    const pushSummary: PushSummary = { total: 0, succeeded: 0, validation_failed: 0, failed: 0, blocked: 0 };
    for (const row of pushRows) {
      pushSummary.total += row.count;
      if (row.outcome === "succeeded") pushSummary.succeeded = row.count;
      else if (row.outcome === "validation_failed") pushSummary.validation_failed = row.count;
      else if (row.outcome === "failed") pushSummary.failed = row.count;
      else if (row.outcome === "blocked") pushSummary.blocked = row.count;
    }

    const statusRows = db
      .prepare(`SELECT review_status, COUNT(*) as count FROM runs GROUP BY review_status`)
      .all() as Array<{ review_status: string; count: number }>;
    const runStatus: RunStatusCounts = {
      draft: 0, approved: 0, ready_to_push: 0, pushed: 0, push_failed: 0, other: 0, total: 0,
    };
    const knownStatuses = new Set(["draft", "approved", "ready_to_push", "pushed", "push_failed"]);
    for (const row of statusRows) {
      runStatus.total += row.count;
      if (knownStatuses.has(row.review_status)) {
        (runStatus as unknown as Record<string, number>)[row.review_status] = row.count;
      } else {
        runStatus.other += row.count;
      }
    }

    // Queue at ops = anything Beacon is waiting on a human to look at.
    const queueAwaiting =
      ((db
        .prepare(`SELECT COUNT(*) AS c FROM runs WHERE review_status IN ('draft','regenerated')`)
        .get() as { c: number } | undefined)?.c) ?? 0;

    // "Current run" = the most recently-touched run that isn't fully pushed.
    // Mirrors Beacon Queue's downgrade rule: a 'pushed' status without a
    // successful push_audit row is treated as 'ready_to_push'.
    const currentRow = db
      .prepare(
        `SELECT
           r.run_id,
           CASE
             WHEN r.review_status = 'pushed' AND NOT EXISTS (
               SELECT 1 FROM push_audit pa WHERE pa.run_id = r.run_id AND pa.outcome = 'succeeded'
             ) THEN 'ready_to_push'
             ELSE r.review_status
           END AS effective_status,
           r.updated_at,
           v.brief_json,
           v.blueprint_json
         FROM runs r
         JOIN run_versions v ON v.run_id = r.run_id AND v.version_number = r.latest_version_number
         WHERE NOT (
           r.review_status = 'pushed' AND EXISTS (
             SELECT 1 FROM push_audit pa WHERE pa.run_id = r.run_id AND pa.outcome = 'succeeded'
           )
         )
         ORDER BY r.updated_at DESC
         LIMIT 1`
      )
      .get() as
        | { run_id: string; effective_status: string; updated_at: string; brief_json: string; blueprint_json: string }
        | undefined;
    let currentRun: CurrentRunInfo | null = null;
    if (currentRow) {
      let brief: Record<string, unknown> = {};
      let blueprint: Record<string, unknown> = {};
      try { brief = JSON.parse(currentRow.brief_json) as Record<string, unknown>; } catch { /* ignore */ }
      try { blueprint = JSON.parse(currentRow.blueprint_json) as Record<string, unknown>; } catch { /* ignore */ }
      const cs = (blueprint["campaign_summary"] as Record<string, unknown> | undefined) ?? {};
      const fam = (cs["selected_family"] ?? brief["selected_family"] ?? brief["campaign_type"] ?? "unknown") as string;
      currentRun = {
        run_id: currentRow.run_id,
        effective_status: currentRow.effective_status,
        campaign_title:
          (cs["campaign_name"] as string | undefined) ||
          (brief["product_or_service"] as string | undefined) ||
          currentRow.run_id.slice(0, 8),
        family: String(fam),
        geography: String(brief["target_geography"] ?? ""),
        updated_at: currentRow.updated_at,
      };
    }

    const lastPush = recentPushes[0] ?? null;

    return {
      totals,
      runStatus,
      pushSummary,
      queueAwaiting,
      recentEvents,
      recentPushes,
      currentRun,
      lastPush,
    };
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

function openDb(): DatabaseSync | null {
  if (!existsSync(BEACON_DB_PATH)) return null;
  try {
    return new DatabaseSync(BEACON_DB_PATH, { readOnly: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[beacon-activity] openDb failed for", BEACON_DB_PATH, ":", err);
    return null;
  }
}

export function getBeaconActivity(): BeaconActivity | null {
  const db = openDb();
  if (!db) return null;

  try {
    // Plain-object the rows for RSC serialization (see snapshot helper above).
    // Recent run events (last 5)
    const recentEvents = (db
      .prepare(
        `SELECT id, run_id, event_type, from_status, to_status, version_number, created_at
         FROM run_events
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .all() as unknown as RecentEvent[]).map((r) => ({ ...r }));

    // Recent push audit entries (last 5)
    const recentPushes = (db
      .prepare(
        `SELECT id, created_at, run_id, customer_id, account_name, outcome, note
         FROM push_audit
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .all() as unknown as RecentPush[]).map((r) => ({ ...r }));

    // Truncate verbose notes (JSON error blobs can be thousands of chars)
    for (const p of recentPushes) {
      if (p.note && p.note.length > 120) {
        p.note = p.note.slice(0, 120) + "\u2026";
      }
    }

    // Push outcome totals
    const pushRows = db
      .prepare(`SELECT outcome, COUNT(*) as count FROM push_audit GROUP BY outcome`)
      .all() as Array<{ outcome: string; count: number }>;

    const pushSummary: PushSummary = {
      total: 0,
      succeeded: 0,
      validation_failed: 0,
      failed: 0,
      blocked: 0,
    };
    for (const row of pushRows) {
      pushSummary.total += row.count;
      if (row.outcome === "succeeded") pushSummary.succeeded = row.count;
      else if (row.outcome === "validation_failed") pushSummary.validation_failed = row.count;
      else if (row.outcome === "failed") pushSummary.failed = row.count;
      else if (row.outcome === "blocked") pushSummary.blocked = row.count;
    }

    // Run status distribution
    const statusRows = db
      .prepare(`SELECT review_status, COUNT(*) as count FROM runs GROUP BY review_status`)
      .all() as Array<{ review_status: string; count: number }>;

    const runStatus: RunStatusCounts = {
      draft: 0,
      approved: 0,
      ready_to_push: 0,
      pushed: 0,
      push_failed: 0,
      other: 0,
      total: 0,
    };
    const knownStatuses = new Set(["draft", "approved", "ready_to_push", "pushed", "push_failed"]);
    for (const row of statusRows) {
      runStatus.total += row.count;
      if (knownStatuses.has(row.review_status)) {
        (runStatus as unknown as Record<string, number>)[row.review_status] = row.count;
      } else {
        runStatus.other += row.count;
      }
    }

    const governanceGapCount =
      ((db
        .prepare(
          `SELECT COUNT(*) AS c
           FROM runs r
           JOIN run_versions v ON v.run_id = r.run_id AND v.version_number = r.latest_version_number
           WHERE json_extract(v.blueprint_json, '$.mcp_governance_audit.state') = 'skipped'`
        )
        .get() as { c: number } | undefined)?.c) ?? 0;

    return { recentEvents, recentPushes, pushSummary, runStatus, governanceGapCount };
  } finally {
    db.close();
  }
}
