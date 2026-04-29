/**
 * Node and edge definitions for the MCP Architecture view.
 *
 * UI copy — NOT a source of truth for MCP architecture, ownership, or integration claims.
 * Node labels and edges are a visual narrative for the inspector; do not cite them as
 * authoritative architecture. Canonical architecture lives in README.md, AGENTS.md,
 * docs/architecture/composable-marketing-architecture.md, and the package code itself.
 *
 * Layout: top-to-bottom, wide and spacious.
 *   Row 0  — Orchestration (Coordinator center-right, Secretary far-left)
 *   Row 1  — Specialist workers (5 nodes, evenly spaced)
 *   Row 2  — MCP shared foundation (4 nodes, wider spacing)
 *   Row 3  — External systems + future connectors
 */

import type { Node, Edge } from "@xyflow/react";

// ---------------------------------------------------------------------------
// Color tokens
// ---------------------------------------------------------------------------

const C = {
  live:         { bg: "#e8f5e9", border: "#66bb6a", text: "#2e7d32" },
  inDev:        { bg: "#fff8e1", border: "#ffca28", text: "#f57f17" },
  planned:      { bg: "#f3f3f3", border: "#bdbdbd", text: "#616161" },
  future:       { bg: "#f9f9f9", border: "#d0d0d0", text: "#9e9e9e" },
  foundation:   { bg: "#e3f2fd", border: "#64b5f6", text: "#1565c0" },
  external:     { bg: "#fafafa", border: "#ccc",    text: "#757575" },
  futureExt:    { bg: "#fafafa", border: "#e0e0e0", text: "#aaa"    },
  orchestrator: { bg: "#ede7f6", border: "#9575cd", text: "#4527a0" },
  secretary:    { bg: "#fce4ec", border: "#ef9a9a", text: "#c62828" },
} as const;

// ---------------------------------------------------------------------------
// Shared node style builder
// ---------------------------------------------------------------------------

type Palette = { bg: string; border: string; text: string };

function nodeStyle(c: Palette, dashed = false): React.CSSProperties {
  return {
    background: c.bg,
    border: `1.5px ${dashed ? "dashed" : "solid"} ${c.border}`,
    borderRadius: 10,
    padding: "10px 18px",
    color: c.text,
    fontSize: 12,
    fontWeight: 600,
    textAlign: "center" as const,
    minWidth: 130,
  };
}

// ---------------------------------------------------------------------------
// Layout grid — wide and spacious
// ---------------------------------------------------------------------------

// Workers: 5 nodes centered across ~1200px
const workerGap = 240;
const workerStart = 100;

// Foundation: 4 nodes centered, wider gap
const foundGap = 310;
const foundStart = 50;

// External: 6 active + 1 future, grouped under Integrations area
const extGap = 190;
const extStart = 80;

const Y = {
  orch: 0,
  workers: 200,
  foundation: 450,
  external: 680,
};

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export const architectureNodes: Node[] = [
  // ── Orchestration ──────────────────────────────────────────────────────
  { id: "secretary",   position: { x: 0,   y: Y.orch }, data: { label: "Secretary\nSystem navigation" },        style: nodeStyle(C.secretary, true) },
  { id: "coordinator", position: { x: 600, y: Y.orch }, data: { label: "Coordinator\nStrategic orchestration" }, style: nodeStyle(C.orchestrator, true) },

  // ── Workers ────────────────────────────────────────────────────────────
  { id: "beacon",   position: { x: workerStart + workerGap * 0, y: Y.workers }, data: { label: "Beacon\nGoogle Ads" },          style: nodeStyle(C.live) },
  { id: "tagpilot", position: { x: workerStart + workerGap * 1, y: Y.workers }, data: { label: "TagPilot\nGTM + GA4" },         style: nodeStyle(C.inDev, true) },
  { id: "lumen",    position: { x: workerStart + workerGap * 2, y: Y.workers }, data: { label: "Lumen\nSEO" },                  style: nodeStyle(C.planned, true) },
  { id: "linkedin", position: { x: workerStart + workerGap * 3, y: Y.workers }, data: { label: "LinkedIn Ads\nspecialist" },     style: nodeStyle(C.future, true) },
  { id: "meta",     position: { x: workerStart + workerGap * 4, y: Y.workers }, data: { label: "Meta Ads\nspecialist" },         style: nodeStyle(C.future, true) },

  // ── MCP Foundation ─────────────────────────────────────────────────────
  { id: "knowledge",    position: { x: foundStart + foundGap * 0, y: Y.foundation }, data: { label: "Knowledge" },     style: nodeStyle(C.foundation) },
  { id: "memory",       position: { x: foundStart + foundGap * 1, y: Y.foundation }, data: { label: "Memory" },        style: nodeStyle(C.foundation) },
  { id: "integrations", position: { x: foundStart + foundGap * 2, y: Y.foundation }, data: { label: "Integrations" },   style: nodeStyle(C.foundation) },
  { id: "ops",          position: { x: foundStart + foundGap * 3, y: Y.foundation }, data: { label: "Ops" },            style: nodeStyle(C.foundation) },

  // ── External systems (active) ──────────────────────────────────────────
  { id: "google-ads",   position: { x: extStart + extGap * 0, y: Y.external }, data: { label: "Google Ads API" },        style: nodeStyle(C.external) },
  { id: "azure-blob",   position: { x: extStart + extGap * 1, y: Y.external }, data: { label: "Azure Blob Storage" },    style: nodeStyle(C.external) },
  { id: "azure-openai", position: { x: extStart + extGap * 2, y: Y.external }, data: { label: "Azure OpenAI" },          style: nodeStyle(C.external) },
  { id: "azure-ad",     position: { x: extStart + extGap * 3, y: Y.external }, data: { label: "Azure AD SSO" },          style: nodeStyle(C.external) },
  { id: "asana",        position: { x: extStart + extGap * 4, y: Y.external }, data: { label: "Asana" },                 style: nodeStyle(C.external) },
  { id: "google-docs",  position: { x: extStart + extGap * 5, y: Y.external }, data: { label: "Google Dev Docs" },       style: nodeStyle(C.external) },

  // ── Future connectors ──────────────────────────────────────────────────
  { id: "marketo",    position: { x: extStart + extGap * 6, y: Y.external }, data: { label: "Marketo" },    style: nodeStyle(C.futureExt, true) },
];

// ---------------------------------------------------------------------------
// Edges — labeled only where the relationship is non-obvious
// ---------------------------------------------------------------------------

type EdgeDef = { source: string; target: string; label?: string; future?: boolean };

const edgeDefs: EdgeDef[] = [
  // ── Beacon → Foundation (current, labeled — establishes the pattern) ──
  { source: "beacon", target: "knowledge",    label: "reads" },
  { source: "beacon", target: "memory",       label: "reads + writes" },
  { source: "beacon", target: "ops",          label: "governed by" },
  { source: "beacon", target: "integrations", label: "connects through" },

  // ── Foundation → External systems (current, unlabeled — obvious) ──────
  { source: "integrations", target: "google-ads" },
  { source: "integrations", target: "azure-blob" },
  { source: "integrations", target: "azure-openai" },
  { source: "integrations", target: "azure-ad" },
  { source: "integrations", target: "asana" },
  { source: "knowledge",    target: "google-docs" },

  // ── TagPilot → Foundation (in development, unlabeled — same pattern) ──
  { source: "tagpilot", target: "knowledge", future: true },
  { source: "tagpilot", target: "memory",    future: true },
  { source: "tagpilot", target: "ops",       future: true },

  // ── Lumen → Foundation (planned, unlabeled) ───────────────────────────
  { source: "lumen", target: "knowledge", future: true },
  { source: "lumen", target: "memory",    future: true },
  { source: "lumen", target: "ops",       future: true },

  // ── Future workers → Foundation (unlabeled) ───────────────────────────
  { source: "linkedin", target: "knowledge",    future: true },
  { source: "linkedin", target: "integrations", future: true },
  { source: "meta",     target: "knowledge",    future: true },
  { source: "meta",     target: "integrations", future: true },

  // ── Future connectors (unlabeled) ─────────────────────────────────────
  { source: "integrations", target: "marketo",    future: true },

  // ── Coordinator → Workers (future, labeled once) ──────────────────────
  { source: "coordinator", target: "beacon",   label: "coordinates", future: true },
  { source: "coordinator", target: "tagpilot", future: true },
  { source: "coordinator", target: "lumen",    future: true },
  { source: "coordinator", target: "linkedin", future: true },
  { source: "coordinator", target: "meta",     future: true },

  // ── Secretary → Foundation (future, labeled once) ─────────────────────
  { source: "secretary", target: "knowledge", label: "reads", future: true },
  { source: "secretary", target: "memory",    future: true },
];

export const architectureEdges: Edge[] = edgeDefs.map((e, i) => ({
  id: `e-${i}`,
  source: e.source,
  target: e.target,
  label: e.label,
  type: "smoothstep",
  animated: false,
  style: {
    stroke: e.future ? "#ccc" : "#64b5f6",
    strokeWidth: e.future ? 1 : 1.5,
    strokeDasharray: e.future ? "6 3" : undefined,
  },
  labelStyle: {
    fontSize: 10,
    fill: e.future ? "#aaa" : "#1565c0",
    fontWeight: 500,
  },
  labelBgStyle: {
    fill: "#fff",
    fillOpacity: 0.85,
  },
}));
