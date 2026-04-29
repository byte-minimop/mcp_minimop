import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import type { MCPCaseSnapshotRequest } from "./contract";
import type { RunListRow } from "./execution-trace-types";

const DATA_DIR = process.env.MCP_DATA_DIR ?? path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "case-snapshots.sqlite");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS case_snapshots (
  run_id        TEXT PRIMARY KEY,
  version_number INTEGER NOT NULL,
  review_status TEXT NOT NULL,
  customer_id   TEXT,
  actor_user_id TEXT,
  event_type    TEXT NOT NULL,
  occurred_at   TEXT NOT NULL,
  stored_at     TEXT NOT NULL,
  payload_json  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_snapshots_customer ON case_snapshots (customer_id);
CREATE INDEX IF NOT EXISTS idx_case_snapshots_stored   ON case_snapshots (stored_at);
CREATE INDEX IF NOT EXISTS idx_case_snapshots_status   ON case_snapshots (review_status);
`;

let _db: ReturnType<typeof Database> | null = null;

function getDb(): ReturnType<typeof Database> {
  if (_db) return _db;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("busy_timeout = 5000");
  _db.pragma("journal_mode = WAL");
  _db.exec(SCHEMA);
  return _db;
}

export function upsertCaseSnapshot(snapshot: MCPCaseSnapshotRequest): { run_id: string; stored_at: string } {
  const db = getDb();
  const storedAt = new Date().toISOString();
  const occurredAt = snapshot.occurred_at ?? storedAt;
  db.prepare(`
    INSERT INTO case_snapshots
      (run_id, version_number, review_status, customer_id, actor_user_id, event_type, occurred_at, stored_at, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(run_id) DO UPDATE SET
      version_number = excluded.version_number,
      review_status = excluded.review_status,
      customer_id = excluded.customer_id,
      actor_user_id = excluded.actor_user_id,
      event_type = excluded.event_type,
      occurred_at = excluded.occurred_at,
      stored_at = excluded.stored_at,
      payload_json = excluded.payload_json
  `).run(
    snapshot.run_id,
    snapshot.version_number,
    snapshot.review_status,
    snapshot.customer_id ?? null,
    snapshot.actor_user_id ?? null,
    snapshot.event_type,
    occurredAt,
    storedAt,
    JSON.stringify({ ...snapshot, occurred_at: occurredAt }),
  );
  return { run_id: snapshot.run_id, stored_at: storedAt };
}

function pushStatusFromSnapshot(status: string, eventType: string, pushStatus: RunListRow["push_status"]): RunListRow["push_status"] {
  if (pushStatus !== "not_pushed") return pushStatus;
  if (eventType === "push_succeeded" || status === "pushed") return "pushed";
  if (eventType === "push_failed" || status === "push_failed") return "failed";
  return "not_pushed";
}

export function listCaseSnapshotRows(limit = 100, customerId: string | null = null): RunListRow[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT payload_json, stored_at
    FROM case_snapshots
    WHERE (? IS NULL OR customer_id = ?)
    ORDER BY stored_at DESC
    LIMIT ?
  `).all(customerId, customerId, limit) as Array<{ payload_json: string; stored_at: string }>;

  return rows.map((row) => {
    const s = JSON.parse(row.payload_json) as MCPCaseSnapshotRequest;
    const push_status = pushStatusFromSnapshot(s.review_status, s.event_type, s.governance.push_status);
    return {
      run_id: s.run_id,
      campaign_title: s.campaign.title,
      campaign_underscore: s.campaign.title.replace(/\s+/g, "_"),
      family: s.campaign.family.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      markets: s.campaign.markets,
      locales: s.campaign.locales,
      multilingual: s.campaign.locales.length > 1,
      status: s.review_status,
      started_at: s.occurred_at ?? row.stored_at,
      duration_ms: 0,
      validation_status: s.governance.validation_status,
      push_status,
      reconciliation: push_status === "not_pushed" ? "no_push_attempts" : "consistent",
      has_warnings: s.governance.has_warnings,
      has_errors: s.governance.has_errors,
      fallback_used: false,
      request_ids: [],
      product_or_service: s.campaign.product_or_service,
      campaign_objective: s.campaign.objective,
      target_audience: s.campaign.target_audience,
      budget_label: s.campaign.budget_label,
      latest_push_actor: s.actor_user_id ?? null,
      latest_push_account_name: null,
      customer_id: s.customer_id ?? null,
      creator: s.actor_user_id ?? null,
      creator_is_dev: false,
    };
  });
}
