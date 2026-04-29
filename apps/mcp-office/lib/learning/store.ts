/**
 * MCP learning store — SQLite-backed operational memory.
 *
 * Two tables:
 *   learning_events   raw captured signals from Beacon; append-only
 *   learning_patterns promoted patterns derived from events; upserted on every insert
 *
 * The store is initialized lazily on first use and is module-level singleton
 * (Next.js Node.js runtime reuses the process across requests within the same
 * server instance, so a single open connection is correct and efficient).
 */

import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  LearningEventType,
  LearningEventContext,
  LearningEventRow,
  LearningPatternRow,
  LearningPatternType,
  MCPLearningPatternStatus,
} from "./schema";
import { buildSignalKey, patternTypeForEvent, evaluatePromotion } from "./promotion";

const DATA_DIR = process.env.MCP_DATA_DIR ?? path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "learning.sqlite");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS learning_events (
  id           TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  account_id   TEXT,
  run_id       TEXT,
  signal_key   TEXT NOT NULL,
  context_json TEXT NOT NULL,
  occurred_at  TEXT NOT NULL,
  processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_le_signal_key  ON learning_events (signal_key);
CREATE INDEX IF NOT EXISTS idx_le_event_type  ON learning_events (event_type);
CREATE INDEX IF NOT EXISTS idx_le_occurred_at ON learning_events (occurred_at);

CREATE TABLE IF NOT EXISTS learning_patterns (
  id               TEXT PRIMARY KEY,
  pattern_type     TEXT NOT NULL,
  signal_key       TEXT NOT NULL UNIQUE,
  first_seen       TEXT NOT NULL,
  last_seen        TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  status           TEXT NOT NULL DEFAULT 'candidate',
  promoted_at      TEXT,
  context_json     TEXT NOT NULL,
  advisory_note    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lp_pattern_type ON learning_patterns (pattern_type);
CREATE INDEX IF NOT EXISTS idx_lp_status       ON learning_patterns (status);
CREATE INDEX IF NOT EXISTS idx_lp_signal_key   ON learning_patterns (signal_key);
`;

let _db: ReturnType<typeof Database> | null = null;

function getDb(): ReturnType<typeof Database> {
  if (_db) return _db;
  const dir = path.dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("busy_timeout = 5000");
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.exec(SCHEMA);
  return _db;
}

/**
 * Insert a learning event and immediately evaluate whether it triggers a
 * pattern upsert or promotion. Returns the event id and promotion outcome.
 *
 * All operations are synchronous (better-sqlite3 is sync-only). This is fine
 * because the learning endpoint runs on Node.js runtime and the caller is
 * fire-and-forget from Beacon's critical path.
 */
export function insertLearningEvent(opts: {
  event_type: LearningEventType;
  account_id: string | null;
  run_id: string | null;
  context: LearningEventContext;
}): { event_id: string; pattern_status: MCPLearningPatternStatus } {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const signal_key = buildSignalKey(opts.event_type, opts.context);
  const context_json = JSON.stringify(opts.context);

  db.prepare(`
    INSERT INTO learning_events (id, event_type, account_id, run_id, signal_key, context_json, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, opts.event_type, opts.account_id, opts.run_id, signal_key, context_json, now);

  // better-sqlite3's Database type is stricter than the minimal Db interface used by evaluatePromotion
  const pattern_status = evaluatePromotion(db as unknown as Parameters<typeof evaluatePromotion>[0], signal_key, opts.event_type, opts.context, now);

  // Mark event as processed
  db.prepare(`UPDATE learning_events SET processed_at = ? WHERE id = ?`).run(now, id);

  return { event_id: id, pattern_status };
}

/**
 * Return all promoted patterns, optionally filtered by type.
 * Used for introspection and future reasoning integration.
 */
export function getPromotedPatterns(
  patternType?: LearningPatternType,
): LearningPatternRow[] {
  const db = getDb();
  if (patternType) {
    return db.prepare(
      `SELECT * FROM learning_patterns WHERE status = 'promoted' AND pattern_type = ? ORDER BY last_seen DESC`
    ).all(patternType) as LearningPatternRow[];
  }
  return db.prepare(
    `SELECT * FROM learning_patterns WHERE status = 'promoted' ORDER BY last_seen DESC`
  ).all() as LearningPatternRow[];
}

/**
 * Return candidate patterns that have not yet reached the promotion threshold.
 */
export function getCandidatePatterns(
  patternType?: LearningPatternType,
): LearningPatternRow[] {
  const db = getDb();
  if (patternType) {
    return db.prepare(
      `SELECT * FROM learning_patterns WHERE status = 'candidate' AND pattern_type = ? ORDER BY occurrence_count DESC`
    ).all(patternType) as LearningPatternRow[];
  }
  return db.prepare(
    `SELECT * FROM learning_patterns WHERE status = 'candidate' ORDER BY occurrence_count DESC`
  ).all() as LearningPatternRow[];
}

/**
 * Return raw event count per type — useful for operational dashboards.
 */
export function getLearningEventStats(): Array<{ event_type: string; count: number }> {
  const db = getDb();
  return db.prepare(
    `SELECT event_type, COUNT(*) as count FROM learning_events GROUP BY event_type ORDER BY count DESC`
  ).all() as Array<{ event_type: string; count: number }>;
}
