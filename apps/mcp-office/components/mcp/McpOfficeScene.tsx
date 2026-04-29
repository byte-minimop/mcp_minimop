"use client";

import { useEffect, useState } from "react";

type RealData = typeof import("@/lib/mcp/real-data").REAL;

/* ------------------------------------------------------------------ */
/*  Design tokens (Concentrix palette)                                 */
/* ------------------------------------------------------------------ */
const T = {
  navy: "#003d5b", navy900: "#002a3f", navy800: "#003049", navy700: "#003d5b",
  navy600: "#0e5478", navy500: "#2f6c8f", navy400: "#6a95ad", navy300: "#a9c1ce",
  navy200: "#d4dfe6", navy100: "#e8eef2", navy50: "#f3f6f9",
  mint: "#25e2cc", mint900: "#0a8c7e", mint700: "#19bdab", mint600: "#1fd0bd",
  mint500: "#25e2cc", mint400: "#57ead6", mint300: "#8bf0e1", mint200: "#bff6ed",
  mint100: "#dff9f4", mint50: "#eefcf9",
  teal: "#007380", teal500: "#1a8a98", teal300: "#7bb8c2", teal100: "#d6ebee",
  pink: "#cc3262", orange: "#ff8400", yellow: "#fbca18",
  n0: "#ffffff", n25: "#fbfbfc", n50: "#f6f7f8", n75: "#f2f2f2",
  n100: "#ebecee", n150: "#dfe1e4", n200: "#cfd2d6", n300: "#b4b8be",
  n400: "#8b9098", n500: "#6b7079", n600: "#4e525a", n700: "#3a3d43",
  n800: "#2a2b2c", n900: "#17181a",
  success: "#168f6b", successBg: "#e3f5ee",
  shadowLg: "0 4px 8px rgba(0,61,91,.06), 0 12px 24px rgba(0,61,91,.08)",
  shadowSm: "0 1px 2px rgba(0,61,91,.06), 0 1px 3px rgba(0,61,91,.04)",
  fontSans: "var(--font-geist-sans), Inter, system-ui, sans-serif",
  fontMono: "var(--font-geist-mono), ui-monospace, monospace",
  fontDisplay: "var(--font-geist-sans), system-ui, sans-serif",
};

/* ------------------------------------------------------------------ */
/*  Static scene data                                                  */
/* ------------------------------------------------------------------ */
const D = {
  infra: [
    { id: "knowledge", name: "Knowledge", status: "active", tagline: "Canonical source of truth",
      description: "Service taxonomy, people roles, campaign naming, readiness models, MCC context, capability registry." },
    { id: "memory", name: "Memory", status: "active", tagline: "Operational history",
      description: "Run data, status events, push audits. Currently backed by Beacon\u2019s SQLite." },
    { id: "integrations", name: "Integrations", status: "active", tagline: "External system connectors",
      description: "6 active connectors: Google Ads, Azure Blob, Azure OpenAI, Azure AD, Asana, Google Docs." },
    { id: "ops", name: "Ops", status: "active", tagline: "Controls and governance",
      description: "Brief validation rules, readiness gates, publish permissions, human review enforcement." },
  ],
  coworkers: [
    { id: "beacon", name: "Beacon", status: "live", domain: "Google Ads", role: "Campaign specialist",
      runs: 215, lastActive: "2 minutes ago", since: "March 2026" },
    { id: "tagpilot", name: "TagPilot", status: "in-development", domain: "GTM + GA4", role: "Tag governance",
      runs: 0, lastActive: "in development", since: "\u2014" },
    { id: "lumen", name: "Lumen", status: "planned", domain: "SEO \u00b7 Insights", role: "Reporting",
      runs: 0, lastActive: "\u2014", since: "\u2014" },
  ],
  recentEvents: [
    { time: "12:42 UTC", run: "RUN-0215", event: "Status changed", from: "approved", to: "ready_to_push" },
    { time: "12:31 UTC", run: "RUN-0214", event: "Blueprint saved", version: 3, status: "draft" },
    { time: "12:18 UTC", run: "RUN-0213", event: "Status changed", from: "draft", to: "approved" },
    { time: "12:04 UTC", run: "RUN-0212", event: "Status changed", from: "ready_to_push", to: "pushed" },
    { time: "11:47 UTC", run: "RUN-0211", event: "Blueprint saved", version: 1, status: "draft" },
  ],
  recentPushes: [
    { time: "12:04 UTC", run: "RUN-0212", account: "Concentrix Careers \u2014 APAC", outcome: "succeeded" },
    { time: "11:12 UTC", run: "RUN-0209", account: "Concentrix Corporate \u2014 EMEA", outcome: "succeeded" },
    { time: "10:58 UTC", run: "RUN-0208", account: "Concentrix Careers \u2014 NAM", outcome: "validation_failed" },
    { time: "10:33 UTC", run: "RUN-0207", account: "Concentrix Corporate \u2014 NAM", outcome: "succeeded" },
  ],
};

type ArticleRecord = {
  title: string;
  category: string;
  summary: string;
  status: "live" | "active" | "in-development" | "planned";
  lastUpdated: string;
};

type IntegrationRecord = {
  name: string;
  status: "live" | "active" | "in-development" | "planned";
  connectsTo: string;
  dependsOn: string[];
  direction: string;
  notes: string;
};

type SurfaceInspectRecord = {
  id: string;
  title: string;
  kind: string;
  status: string;
  summary: string;
  ownership: string;
  outputs: string[];
  systems: string[];
  dependsOn: string[];
  breaksWhen: string[];
  articles?: ArticleRecord[];
  integrations?: IntegrationRecord[];
};

const KNOWLEDGE_ARTICLES: ArticleRecord[] = [
  {
    title: "Service taxonomy catalog",
    category: "Reference data",
    summary: "Canonical offering map used for service normalization, planning context, and downstream labeling.",
    status: "active",
    lastUpdated: "2026-04-02",
  },
  {
    title: "People targeting catalog",
    category: "Audience intelligence",
    summary: "Role, industry, service-category, and tier dataset used to shape targeting recommendations.",
    status: "active",
    lastUpdated: "2026-04-02",
  },
  {
    title: "Google Ads readiness model",
    category: "Domain rules",
    summary: "Guardrail logic covering readiness signals, publish blocks, and review-only gating.",
    status: "live",
    lastUpdated: "2026-04-18",
  },
  {
    title: "Campaign naming conventions",
    category: "Operational convention",
    summary: "Shared naming template and objective/family/country abbreviations consumed by workers.",
    status: "active",
    lastUpdated: "2026-04-11",
  },
  {
    title: "Supported capabilities registry",
    category: "Capability map",
    summary: "Tracks what Google Ads capabilities are supported, partial, or still unimplemented.",
    status: "active",
    lastUpdated: "2026-04-19",
  },
];

const INSPECT_RELATIONS = [
  { from: "beacon", to: "knowledge", label: "reads" },
  { from: "beacon", to: "integrations", label: "pushes" },
  { from: "beacon", to: "ops", label: "gated by" },
  { from: "beacon", to: "memory", label: "writes" },
  { from: "tagpilot", to: "knowledge", label: "planned read" },
  { from: "tagpilot", to: "integrations", label: "planned use" },
  { from: "lumen", to: "knowledge", label: "planned read" },
  { from: "lumen", to: "memory", label: "planned analysis" },
  { from: "ops", to: "integrations", label: "controls" },
  { from: "knowledge", to: "beacon", label: "feeds" },
];

/* ------------------------------------------------------------------ */
/*  Route map                                                          */
/* ------------------------------------------------------------------ */
const ROUTES: Record<string, string> = {
  beacon: "/mcp/beacon", tagpilot: "/mcp/tagpilot", lumen: "/mcp/lumen",
  knowledge: "/mcp/knowledge", memory: "/mcp/memory",
  integrations: "/mcp/integrations", ops: "/mcp/ops",
};

function buildInspectRecords(data: RealData): Record<string, SurfaceInspectRecord> {
  const integrationItems: IntegrationRecord[] = data.integrations.map((integration) => ({
    name: integration.name,
    status: integration.status === "active" ? "active" : "planned",
    connectsTo: integration.provider === "Google" ? "External Google surfaces" : `${integration.provider} services`,
    dependsOn: integration.consumer === "Beacon" ? ["Beacon"] : ["Beacon", "TagPilot", "Lumen"],
    direction: integration.type === "read + write" ? "reads + writes" : integration.type === "write" ? "writes" : "reads",
    notes: integration.description,
  }));

  return {
    knowledge: {
      id: "knowledge",
      title: "Knowledge",
      kind: "Knowledge surface",
      status: "active",
      summary: "Canonical internal knowledge surface with browsable articles, catalogs, and domain rules.",
      ownership: "Owned by MCP shared domain packages",
      outputs: ["Service normalization context", "People-targeting reference", "Readiness rules", "Capability truth"],
      systems: ["Beacon", "TagPilot (planned)", "Lumen (planned)"],
      dependsOn: ["Checked-in domain packages", "Data files", "Registry exports"],
      breaksWhen: ["Workers lose canonical context", "Recommendations drift from domain truth", "Naming/readiness become inconsistent"],
      articles: KNOWLEDGE_ARTICLES,
    },
    integrations: {
      id: "integrations",
      title: "Integrations",
      kind: "Dependency surface",
      status: "active",
      summary: "Live connector inventory with dependency direction, owning worker, and blast radius.",
      ownership: "Owned by MCP connectors + worker runtime implementations",
      outputs: ["External reads", "Push pathways", "Credential-backed access", "Platform dependencies"],
      systems: ["Beacon", "Google Docs knowledge search", "Planned measurement/SEO workers"],
      dependsOn: ["OAuth/session auth", "Connector implementations", "Vendor APIs"],
      breaksWhen: ["Beacon loses publish/retrieval paths", "Knowledge lookups degrade", "Worker outputs become partial or blocked"],
      integrations: integrationItems,
    },
    memory: {
      id: "memory",
      title: "Memory",
      kind: "Operational history",
      status: "active",
      summary: "Execution memory for runs, state transitions, and publish audits.",
      ownership: "Beacon runtime + persistence layer",
      outputs: ["Run history", "Status timelines", "Push audit context"],
      systems: ["Beacon", "Future reporting surfaces"],
      dependsOn: ["Beacon SQLite", "Run/event writers"],
      breaksWhen: ["Recent execution state becomes opaque", "Audits cannot be inspected", "Reporting loses traceability"],
    },
    ops: {
      id: "ops",
      title: "Ops",
      kind: "Governance controls",
      status: "active",
      summary: "Readiness, brief rules, and publish controls that govern worker behavior.",
      ownership: "Adapter-beacon governance layer",
      outputs: ["Readiness decisions", "Policy enforcement", "Publish guardrails"],
      systems: ["Beacon", "Integrations", "Human review checkpoints"],
      dependsOn: ["Brief rules", "Readiness evaluation", "Push permissions"],
      breaksWhen: ["Unsafe publishes may slip through", "Readiness loses consistency", "Approval boundaries blur"],
    },
    secretary: {
      id: "secretary",
      title: "Secretary",
      kind: "Support workstation",
      status: "active",
      summary: "Front-of-office intake surface that routes briefs and triages incoming work before a specialist picks it up.",
      ownership: "Operational support role inside the office metaphor",
      outputs: ["Intake routing", "Work triage", "Initial task handoff"],
      systems: ["Beacon", "Ops"],
      dependsOn: ["Incoming briefs", "Routing rules", "Queue visibility"],
      breaksWhen: ["New work is harder to route cleanly", "Intake becomes opaque", "Specialist assignment slows down"],
    },
    admin: {
      id: "admin",
      title: "Administrator",
      kind: "Governance workstation",
      status: "active",
      summary: "Governance desk responsible for policy stewardship, account constraints, and controlled execution boundaries.",
      ownership: "Administrative governance role",
      outputs: ["Policy oversight", "Permission context", "Governance sign-off"],
      systems: ["Ops", "Beacon", "Knowledge"],
      dependsOn: ["Rule catalog", "Account permissions", "Naming/readiness truth"],
      breaksWhen: ["Policy stewardship becomes unclear", "Operational ownership blurs", "Governance reviews lose a clear home"],
    },
    beacon: {
      id: "beacon",
      title: "Beacon",
      kind: "Coworker",
      status: "live",
      summary: "Active Google Ads specialist assembling governed campaign outputs from MCP knowledge and connectors.",
      ownership: "Beacon worker runtime",
      outputs: ["Campaign blueprints", "Readiness evaluations", "Push-ready payloads", "Run history"],
      systems: ["Knowledge", "Integrations", "Ops", "Memory"],
      dependsOn: ["Google Ads API", "Shared domain truth", "Readiness controls", "Account inventory"],
      breaksWhen: ["Pushes cannot execute", "Planning drifts from platform rules", "Run auditing becomes incomplete"],
    },
    tagpilot: {
      id: "tagpilot",
      title: "TagPilot",
      kind: "Coworker",
      status: "in-development",
      summary: "Measurement governance specialist planned to reuse MCP knowledge and connector patterns.",
      ownership: "Planned worker runtime",
      outputs: ["Tag governance audits", "GTM workspace actions", "GA4 tracking checks"],
      systems: ["Knowledge", "Integrations"],
      dependsOn: ["GA4/GTM connectors", "Vendor docs", "Shared governance patterns"],
      breaksWhen: ["Measurement work stays manual", "GTM oversight remains unmodeled"],
    },
    lumen: {
      id: "lumen",
      title: "Lumen",
      kind: "Coworker",
      status: "planned",
      summary: "SEO and insight worker planned to consume memory and knowledge for reporting surfaces.",
      ownership: "Reserved future runtime",
      outputs: ["SEO insight reports", "Search opportunity summaries", "Trend analysis"],
      systems: ["Knowledge", "Memory"],
      dependsOn: ["Search Console-like connectors", "Historical memory", "Knowledge surfaces"],
      breaksWhen: ["No inspectable insight worker exists", "System reporting remains fragmented"],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Isometric math                                                     */
/* ------------------------------------------------------------------ */
const TW = 26;
const TH = 13;
function iso(x: number, y: number, z = 0) {
  const yaw = (PROJECTION.yawDeg * Math.PI) / 180;
  const dx = x - PROJECTION.centerX;
  const dy = y - PROJECTION.centerY;
  const rx = dx * Math.cos(yaw) - dy * Math.sin(yaw);
  const ry = dx * Math.sin(yaw) + dy * Math.cos(yaw);
  const px = rx + PROJECTION.centerX;
  const py = ry + PROJECTION.centerY;
  return { x: (px - py) * TW, y: (px + py) * TH - z * TH * 2 };
}

/* ------------------------------------------------------------------ */
/*  Floor plan                                                         */
/* ------------------------------------------------------------------ */
const GRID_W = 34;
const GRID_D = 24;
const WALL_H = 4.6;
const WALL_T = 0.2;
const PROJECTION = {
  centerX: GRID_W / 2,
  centerY: GRID_D / 2,
  yawDeg: 0,
};

type Room = { x1: number; y1: number; x2: number; y2: number; name: string; tagline: string; door?: { side: string; x: number } };
const ROOMS: Record<string, Room> = {
  knowledge:    { x1: 0,  y1: 0,  x2: 9,  y2: 6,  name: "Knowledge",     tagline: "Library",     door: { side: "S", x: 4.5 } },
  admin:        { x1: 9,  y1: 0,  x2: 15, y2: 6,  name: "Administrator", tagline: "Admin office", door: { side: "S", x: 12 } },
  ops:          { x1: 15, y1: 0,  x2: 34, y2: 6,  name: "Ops",           tagline: "War room",    door: { side: "S", x: 21.5 } },
  open:         { x1: 0,  y1: 7,  x2: 34, y2: 16, name: "Central Office", tagline: "Open plan" },
  memory:       { x1: 0,  y1: 18, x2: 13, y2: 24, name: "Memory",         tagline: "Archive",     door: { side: "N", x: 6 } },
  integrations: { x1: 13, y1: 18, x2: 34, y2: 24, name: "Integrations",   tagline: "Connectors",  door: { side: "N", x: 23 } },
};

type DeskDef = { id: string; name: string; domain: string; status: string; role: string; cx: number; cy: number; rot: number; occupied: boolean | "ghost"; tint: string };
const DESKS: DeskDef[] = [
  { id: "beacon",    name: "Beacon",        domain: "Google Ads",      status: "live",           role: "specialist", cx: 18,   cy: 11,   rot: 0, occupied: true,    tint: "mint" },
  { id: "tagpilot",  name: "TagPilot",      domain: "Measurement",     status: "in-development", role: "specialist", cx: 6.5,  cy: 10,   rot: 0, occupied: false,   tint: "orange" },
  { id: "lumen",     name: "Lumen",         domain: "Insights",        status: "planned",        role: "specialist", cx: 10.8, cy: 10,   rot: 0, occupied: false,   tint: "gray" },
  { id: "linkedin",  name: "LinkedIn",      domain: "LinkedIn Ads",    status: "planned",        role: "specialist", cx: 6.5,  cy: 14,   rot: 0, occupied: false,   tint: "gray" },
  { id: "meta",      name: "Meta",          domain: "Meta Ads",        status: "planned",        role: "specialist", cx: 10.8, cy: 14,   rot: 0, occupied: false,   tint: "gray" },
  { id: "secretary", name: "Secretary",     domain: "Intake \u00b7 triage", status: "active",  role: "secretary",  cx: 28.5, cy: 13.8, rot: 0, occupied: "ghost", tint: "mint" },
  { id: "admin",     name: "Administrator", domain: "Governance",      status: "active",         role: "admin",      cx: 12,   cy: 3,    rot: 0, occupied: "ghost", tint: "navy" },
];

const CAMERA_PRESETS = [
  { id: "overview", label: "Overview", yaw: 0, panX: 0, panY: 0, zoom: 1 },
  { id: "beacon", label: "Beacon", yaw: -12, panX: -12, panY: 16, zoom: 1.22 },
  { id: "systems", label: "Systems", yaw: 11, panX: 18, panY: -6, zoom: 1.05 },
];

const DEFAULT_CAMERA = CAMERA_PRESETS[0];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

const ZONES = [
  { id: "knowledge",    room: "knowledge",    stat: { a: "73",  b: "offerings" } },
  { id: "ops",          room: "ops",          stat: { a: "12",  b: "ready to push" } },
  { id: "memory",       room: "memory",       stat: { a: "215", b: "runs" } },
  { id: "integrations", room: "integrations", stat: { a: "6",   b: "connectors" } },
];

type BeaconOfficeActivity = {
  surface: "desk" | "knowledge" | "ops" | "memory" | "integrations";
  label: string;
  detail: string;
  cx: number;
  cy: number;
  atDesk: boolean;
};

function getBeaconOfficeActivity(
  beacon: import("@/lib/mcp/beacon-activity").BeaconOperationalSnapshot | null
): BeaconOfficeActivity {
  if (!beacon) {
    return {
      surface: "desk",
      label: "Beacon standby",
      detail: "Beacon SQLite is unreachable, so the office is showing the default desk position.",
      cx: 18,
      cy: 12.1,
      atDesk: true,
    };
  }

  const currentStatus = beacon.currentRun?.effective_status ?? null;
  const latestEvent = beacon.recentEvents[0] ?? null;
  const latestPush = beacon.lastPush ?? null;

  if (latestPush && (!latestEvent || Date.parse(latestPush.created_at) >= Date.parse(latestEvent.created_at))) {
    return {
      surface: "integrations",
      label: latestPush.outcome === "succeeded" ? "Pushing through Integrations" : "Push review in Integrations",
      detail: `${latestPush.run_id} · ${latestPush.outcome.replace(/_/g, " ")}`,
      cx: 23.3,
      cy: 17.35,
      atDesk: false,
    };
  }

  if (currentStatus === "ready_to_push" || currentStatus === "approved") {
    return {
      surface: "ops",
      label: "Clearing governance in Ops",
      detail: `${beacon.currentRun?.run_id ?? "current run"} · ${currentStatus.replace(/_/g, " ")}`,
      cx: 22.2,
      cy: 6.7,
      atDesk: false,
    };
  }

  if (currentStatus === "draft" || currentStatus === "regenerated") {
    return {
      surface: "knowledge",
      label: "Planning with Knowledge",
      detail: `${beacon.currentRun?.campaign_title ?? beacon.currentRun?.run_id ?? "draft"}`,
      cx: 4.7,
      cy: 6.45,
      atDesk: false,
    };
  }

  if (latestEvent?.event_type === "version_saved" || latestEvent?.event_type === "status_changed") {
    return {
      surface: "memory",
      label: "Writing execution memory",
      detail: `${latestEvent.run_id} · ${latestEvent.event_type.replace(/_/g, " ")}`,
      cx: 6.4,
      cy: 17.35,
      atDesk: false,
    };
  }

  return {
    surface: "desk",
    label: "Monitoring from Beacon desk",
    detail: `${beacon.totals.runs} runs · ${beacon.queueAwaiting} awaiting review`,
    cx: 18,
    cy: 12.1,
    atDesk: true,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function tilePoints(x1: number, y1: number, x2: number, y2: number) {
  const a = iso(x1, y1), b = iso(x2, y1), c = iso(x2, y2), d = iso(x1, y2);
  return `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;
}

function statusDotColor(status: string) {
  switch (status) {
    case "live":           return T.success;
    case "active":         return T.mint700;
    case "in-development": return T.orange;
    default:               return T.n400;
  }
}

function statusLabelText(status: string) {
  switch (status) {
    case "live":           return "Live";
    case "active":         return "Active";
    case "in-development": return "In dev";
    case "planned":        return "Planned";
    default:               return "Reserved";
  }
}

/* ------------------------------------------------------------------ */
/*  IsoBox                                                             */
/* ------------------------------------------------------------------ */
function IsoBox({ x1, y1, x2, y2, h, topColor = "#fff", leftColor = "url(#wall-left)", rightColor = "url(#wall-right)", stroke = "#bfbaae", strokeWidth = 0.8, topStroke, opacity = 1 }: {
  x1: number; y1: number; x2: number; y2: number; h: number;
  topColor?: string; leftColor?: string; rightColor?: string;
  stroke?: string; strokeWidth?: number; topStroke?: string; opacity?: number;
}) {
  const tl = iso(x1, y1, h), tr = iso(x2, y1, h);
  const br = iso(x2, y2, h), bl = iso(x1, y2, h);
  const g0 = iso(x1, y1, 0), g1 = iso(x2, y1, 0), g2 = iso(x2, y2, 0);
  const rightFace = `${g0.x},${g0.y} ${g1.x},${g1.y} ${tr.x},${tr.y} ${tl.x},${tl.y}`;
  const leftFace  = `${g1.x},${g1.y} ${g2.x},${g2.y} ${br.x},${br.y} ${tr.x},${tr.y}`;
  const topFace   = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
  return (
    <g opacity={opacity}>
      <polygon points={rightFace} fill={leftColor} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points={leftFace}  fill={rightColor} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points={topFace}   fill={topColor} stroke={topStroke ?? stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG Defs                                                           */
/* ------------------------------------------------------------------ */
function IsoDefs() {
  return (
    <defs>
      <filter id="iso-shadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#1c2833" floodOpacity="0.14" />
      </filter>
      <filter id="iso-shadow-soft" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1c2833" floodOpacity="0.1" />
      </filter>
      <linearGradient id="wall-left" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#e6e3dc" /><stop offset="1" stopColor="#d9d5cb" />
      </linearGradient>
      <linearGradient id="wall-right" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#f4f1ea" /><stop offset="1" stopColor="#ebe7dd" />
      </linearGradient>
      <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={T.teal100} stopOpacity="0.55" />
        <stop offset="1" stopColor={T.mint200} stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#d6b98a" /><stop offset="1" stopColor="#b99566" />
      </linearGradient>
      <linearGradient id="wood-light" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#e8d2ab" /><stop offset="1" stopColor="#cda975" />
      </linearGradient>
      <linearGradient id="screen-live" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={T.navy} /><stop offset="1" stopColor={T.navy900} />
      </linearGradient>
      <pattern id="floor-oak" width="40" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-26)">
        <rect width="40" height="8" fill="none" />
        <line x1="0" y1="0" x2="40" y2="0" stroke="#c6a876" strokeWidth="0.4" opacity="0.45" />
        <line x1="20" y1="4" x2="60" y2="4" stroke="#c6a876" strokeWidth="0.4" opacity="0.3" />
      </pattern>
      <pattern id="floor-tile" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-26)">
        <rect width="22" height="22" fill="none" />
        <line x1="0" y1="0" x2="22" y2="0" stroke="#b4b8be" strokeWidth="0.3" opacity="0.3" />
        <line x1="0" y1="0" x2="0" y2="22" stroke="#b4b8be" strokeWidth="0.3" opacity="0.3" />
      </pattern>
      <pattern id="floor-carpet" width="3" height="3" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="0.4" fill="#b4a98d" opacity="0.5" />
      </pattern>
      <pattern id="floor-corridor" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-26)">
        <rect width="14" height="14" fill="none" />
        <line x1="0" y1="0" x2="14" y2="0" stroke="#a4a8ae" strokeWidth="0.3" opacity="0.35" />
      </pattern>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/*  Floors                                                             */
/* ------------------------------------------------------------------ */
function RoomFloor({ room, color, pattern, hover, active, onEnter, onLeave, onClick }: {
  room: Room; color: string; pattern?: string;
  hover?: boolean; active?: boolean;
  onEnter?: () => void; onLeave?: () => void; onClick?: () => void;
}) {
  const pts = tilePoints(room.x1, room.y1, room.x2, room.y2);
  const patId = pattern === "oakstrip" ? "url(#floor-oak)"
    : pattern === "tile" ? "url(#floor-tile)"
    : pattern === "carpet" ? "url(#floor-carpet)" : null;
  const borderColor = hover || active ? T.mint700 : "#c9c4b7";
  const sw = hover || active ? 1.4 : 0.5;
  return (
    <g style={{ cursor: onEnter ? "pointer" : "default" }}
      onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick}>
      <polygon points={pts} fill={color} stroke={borderColor} strokeWidth={sw} />
      {patId && <polygon points={pts} fill={patId} opacity="0.6" />}
    </g>
  );
}

function CorridorFloor({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const a = iso(x1, (y1 + y2) / 2), b = iso(x2, (y1 + y2) / 2);
  return (
    <g>
      <polygon points={tilePoints(x1, y1, x2, y2)} fill="#e3e1d9" stroke="#b4b8be" strokeWidth="0.35" />
      <polygon points={tilePoints(x1, y1, x2, y2)} fill="url(#floor-corridor)" opacity="0.7" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.mint700} strokeWidth="0.6" opacity="0.25" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Walls                                                              */
/* ------------------------------------------------------------------ */
function PartitionWall({ x1, y1, x2, y2, h = WALL_H, topColor = "#efece4" }: { x1: number; y1: number; x2: number; y2: number; h?: number; topColor?: string }) {
  const nx1 = Math.min(x1, x2), nx2 = Math.max(x1, x2);
  const ny1 = Math.min(y1, y2), ny2 = Math.max(y1, y2);
  const isVert = (nx2 - nx1) < 0.5;
  const rx1 = isVert ? nx1 - WALL_T / 2 : nx1;
  const rx2 = isVert ? nx1 + WALL_T / 2 : nx2;
  const ry1 = isVert ? ny1 : ny1 - WALL_T / 2;
  const ry2 = isVert ? ny2 : ny1 + WALL_T / 2;
  return <IsoBox x1={rx1} y1={ry1} x2={rx2} y2={ry2} h={h} topColor={topColor} stroke="#b4aea2" strokeWidth={0.4} />;
}

function BuildingOuterWallsBack() {
  return (
    <g>
      <IsoBox x1={0} y1={-WALL_T} x2={GRID_W} y2={0} h={WALL_H} topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke="#9e9787" strokeWidth={0.4} />
      <IsoBox x1={-WALL_T} y1={0} x2={0} y2={16} h={WALL_H} topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke="#9e9787" strokeWidth={0.4} />
    </g>
  );
}

function LintelAboveDoor({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <IsoBox x1={x1} y1={y - WALL_T / 2} x2={x2} y2={y + WALL_T / 2} h={WALL_H}
      topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke="#9e9787" strokeWidth={0.4} />
  );
}

function DoorLeaf({ x, y }: { x: number; y: number }) {
  const W = 1.6, H = 3.0;
  return (
    <IsoBox x1={x + W - 0.08} y1={y - 0.9} x2={x + W} y2={y}
      h={H} topColor={T.navy300} leftColor={T.navy400} rightColor={T.navy500} stroke={T.navy700} strokeWidth={0.4} />
  );
}

function BackRoomSouthWalls() {
  const rooms = [ROOMS.knowledge, ROOMS.admin, ROOMS.ops];
  return (
    <g>
      {rooms.map((r) => {
        const dx = r.door!.x;
        return (
          <g key={r.name}>
            <PartitionWall x1={r.x1} y1={6} x2={dx - 0.8} y2={6} />
            <PartitionWall x1={dx + 0.8} y1={6} x2={r.x2} y2={6} />
            <LintelAboveDoor x1={dx - 0.8} x2={dx + 0.8} y={6} />
            <DoorLeaf x={dx - 0.8} y={6} />
          </g>
        );
      })}
    </g>
  );
}

function WindowWallEast({ x1, y1, y2 }: { x1: number; y1: number; y2: number }) {
  const sillH = 0.9, glassTop = WALL_H - 0.2;
  const panels = 5, len = y2 - y1, step = len / panels;
  const frameColor = "#bfbaae";
  const a = iso(x1 - 0.2, y1 + 0.5, 0), b = iso(x1 - 6, y2 - 0.5, 0);
  const c = iso(x1 - 6, y1 + 1.2, 0), d = iso(x1 - 1.5, y1 + 0.7, 0);
  return (
    <g>
      <IsoBox x1={x1} y1={y1} x2={x1 + WALL_T} y2={y2} h={sillH} topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke={frameColor} strokeWidth={0.4} />
      {Array.from({ length: panels }).map((_, i) => {
        const py1 = y1 + i * step, py2 = y1 + (i + 1) * step - 0.08;
        return <IsoBox key={i} x1={x1} y1={py1} x2={x1 + WALL_T} y2={py2} h={glassTop} topColor={frameColor} leftColor="url(#glass)" rightColor="url(#glass)" stroke={frameColor} strokeWidth={0.4} opacity={0.92} />;
      })}
      <polygon points={`${a.x},${a.y} ${d.x},${d.y} ${c.x},${c.y} ${b.x},${b.y}`} fill={T.yellow} opacity="0.09" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Room Interiors                                                     */
/* ------------------------------------------------------------------ */
function Bookshelf({ x, y }: { x: number; y: number }) {
  const W = 1.0, D = 0.35, H = 3.6;
  const colors = [T.navy, T.mint700, T.teal, T.pink, T.orange, T.navy600, T.yellow];
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + W} y2={y + D} h={H} topColor="#a77a4e" leftColor="#a67f55" rightColor="#8a5f35" stroke="#6b4620" strokeWidth={0.5} />
      {[0.3, 1.1, 1.9, 2.7].map((bh, rowIdx) =>
        Array.from({ length: 6 }).map((_, i) => {
          const bx = x + 0.05 + i * 0.155;
          const h = 0.6 + ((i + rowIdx) % 3) * 0.08;
          const col = colors[(i * 7 + rowIdx * 3) % colors.length];
          const a = iso(bx, y, bh), b = iso(bx + 0.15, y, bh);
          const c2 = iso(bx + 0.15, y, bh + h), d = iso(bx, y, bh + h);
          return <polygon key={`${rowIdx}-${i}`} points={`${a.x},${a.y} ${b.x},${b.y} ${c2.x},${c2.y} ${d.x},${d.y}`} fill={col} stroke="#00000022" strokeWidth="0.25" />;
        })
      )}
    </g>
  );
}

function ReadingChair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + 0.9} y2={y + 0.9} h={0.5} topColor={T.navy600} leftColor={T.navy} rightColor={T.navy800} stroke={T.navy900} strokeWidth={0.4} />
      <IsoBox x1={x} y1={y + 0.65} x2={x + 0.9} y2={y + 0.9} h={1.6} topColor={T.navy} leftColor={T.navy} rightColor={T.navy900} stroke={T.navy900} strokeWidth={0.4} />
    </g>
  );
}

function SideTable({ x, y }: { x: number; y: number }) {
  return <IsoBox x1={x} y1={y} x2={x + 0.5} y2={y + 0.5} h={0.55} topColor="#d6b98a" leftColor="#a67f55" rightColor="#8a5f35" stroke="#6b4620" strokeWidth={0.4} />;
}

function FloorLamp({ x, y }: { x: number; y: number }) {
  const base = iso(x, y, 0), top = iso(x, y, 2.8);
  const shade1 = iso(x - 0.2, y - 0.2, 2.8), shade2 = iso(x + 0.2, y + 0.2, 2.8);
  return (
    <g>
      <ellipse cx={base.x} cy={base.y} rx="6" ry="2.2" fill="#4e525a" />
      <line x1={base.x} y1={base.y - 2} x2={top.x} y2={top.y} stroke="#4e525a" strokeWidth="1.2" />
      <polygon points={`${shade1.x},${shade1.y} ${shade2.x},${shade2.y} ${top.x + 7},${top.y + 13} ${top.x - 7},${top.y + 13}`} fill={T.yellow} opacity="0.7" />
      <ellipse cx={base.x} cy={base.y + 3} rx="22" ry="8" fill={T.yellow} opacity="0.12" />
    </g>
  );
}

function Plant({ x, y, small, wilted }: { x: number; y: number; small?: boolean; wilted?: boolean }) {
  const base = iso(x, y, 0), S = small ? 0.7 : 1;
  const leafColor1 = wilted ? "#8b9b72" : "#2f6b4e";
  const leafColor2 = wilted ? "#7b8a62" : "#3a8560";
  return (
    <g>
      <path d={`M ${base.x - 6 * S} ${base.y} l 1 ${7 * S} h ${10 * S} l 1 ${-7 * S} z`} fill="#c27b5a" stroke="#7d4724" strokeWidth="0.5" />
      {!wilted && (
        <g>
          <ellipse cx={base.x - 6 * S} cy={base.y - 14 * S} rx={4 * S} ry={5 * S} fill={leafColor1} transform={`rotate(-22 ${base.x - 6 * S} ${base.y - 14 * S})`} />
          <ellipse cx={base.x + 6 * S} cy={base.y - 14 * S} rx={4 * S} ry={5 * S} fill={leafColor2} transform={`rotate(22 ${base.x + 6 * S} ${base.y - 14 * S})`} />
          <ellipse cx={base.x} cy={base.y - 18 * S} rx={3 * S} ry={4 * S} fill="#5cb089" />
        </g>
      )}
      {wilted && <path d={`M ${base.x - 1} ${base.y - 3} q -3 -6 3 -9`} stroke={leafColor1} strokeWidth="1.4" fill="none" />}
    </g>
  );
}

function WallPlaque({ x, y, w, h, z0, fill, stroke }: { x: number; y: number; w: number; h: number; z0: number; fill: string; stroke: string }) {
  const tl = iso(x, y, z0 + h), tr = iso(x + w, y, z0 + h);
  const br = iso(x + w, y, z0), bl = iso(x, y, z0);
  return <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`} fill={fill} stroke={stroke} strokeWidth="0.5" />;
}

function SideWallPlaque({ x, y, w, h, z0 }: { x: number; y: number; w: number; h: number; z0: number }) {
  const a = iso(x, y, z0 + h), b = iso(x, y + w, z0 + h);
  const c = iso(x, y + w, z0), d = iso(x, y, z0);
  return (
    <g>
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="#ffffff" stroke={T.n300} strokeWidth="0.4" />
      {[0.2, 0.5, 0.8].map((t, i) => {
        const p1 = iso(x, y + 0.15, z0 + h * (1 - t));
        return <rect key={i} x={p1.x - 1.5} y={p1.y - 1} width="10" height="1.6" fill={T.mint700} opacity="0.55" />;
      })}
    </g>
  );
}

function BigScreen({ x, y, tick }: { x: number; y: number; tick: number }) {
  const W = 3.0, H = 1.5, z0 = 1.9, z1 = z0 + H;
  const tl = iso(x, y, z1), tr = iso(x + W, y, z1);
  const br = iso(x + W, y, z0), bl = iso(x, y, z0);
  return (
    <g>
      <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`} fill="url(#screen-live)" stroke={T.navy900} strokeWidth="0.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const bx = x + 0.2 + i * 0.34, h = 0.35 + ((i * 13) % 9) * 0.1;
        const a = iso(bx, y, z0 + 0.2), b = iso(bx + 0.18, y, z0 + 0.2);
        const c = iso(bx + 0.18, y, z0 + 0.2 + h), d = iso(bx, y, z0 + 0.2 + h);
        const col = i === 7 ? T.mint : T.mint700;
        return <polygon key={i} points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={col} opacity={i === 7 ? 0.95 : 0.7} />;
      })}
      <text x={(tl.x + tr.x) / 2} y={tl.y + 12} fontSize="7" fill={T.mint200} fontFamily={T.fontMono} textAnchor="middle" letterSpacing="1.5">OPS · READINESS</text>
    </g>
  );
}

function ConferenceTable({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + 3.5} y2={y + 1.1} h={0.6} topColor="#faf8f3" leftColor="#d9d5cb" rightColor="#c5c0b2" stroke="#a39e92" strokeWidth={0.4} />
      {[0, 1].map(i => <MiniChair key={`n${i}`} x={x + 0.35 + i * 2.2} y={y - 0.55} />)}
      {[0, 1].map(i => <MiniChair key={`s${i}`} x={x + 0.35 + i * 2.2} y={y + 1.25} />)}
    </g>
  );
}

function MiniChair({ x, y }: { x: number; y: number }) {
  return <IsoBox x1={x} y1={y} x2={x + 0.5} y2={y + 0.5} h={0.45} topColor={T.n300} leftColor={T.n400} rightColor={T.n500} stroke={T.n600} strokeWidth={0.3} />;
}

function LowGlass({ x1, y, x2 }: { x1: number; y: number; x2: number }) {
  const a = iso(x1, y, 0), b = iso(x2, y, 0);
  const c = iso(x2, y, 0.4), d = iso(x1, y, 0.4);
  const e = iso(x2, y, 1.6), f = iso(x1, y, 1.6);
  return (
    <g>
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={T.n200} stroke={T.n300} strokeWidth="0.4" />
      <polygon points={`${d.x},${d.y} ${c.x},${c.y} ${e.x},${e.y} ${f.x},${f.y}`} fill="url(#glass)" stroke={T.teal300} strokeWidth="0.5" opacity="0.65" />
    </g>
  );
}

function KnowledgeInterior({ tick: _tick }: { tick: number }) {
  const r = ROOMS.knowledge;
  return (
    <g>
      <polygon points={tilePoints(r.x1 + 4.5, r.y1 + 2.3, r.x1 + 7, r.y1 + 3.8)} fill={T.teal100} stroke={T.teal300} strokeWidth="0.5" opacity="0.8" />
      {Array.from({ length: 5 }).map((_, i) => <Bookshelf key={i} x={r.x1 + 0.6 + i * 1.2} y={r.y1 + 0.1} />)}
      <ReadingChair x={r.x1 + 5} y={r.y1 + 2.6} />
      <SideTable x={r.x1 + 6.2} y={r.y1 + 2.7} />
      <FloorLamp x={r.x1 + 6.7} y={r.y1 + 3.3} />
      <Plant x={r.x1 + 0.4} y={r.y1 + 3.5} />
    </g>
  );
}

function AdminInterior({ tick: _tick }: { tick: number }) {
  const r = ROOMS.admin;
  return (
    <g>
      <WallPlaque x={r.x1 + 2} y={r.y1} w={1.6} h={1.1} z0={2.2} fill="#ffffff" stroke={T.n300} />
      <MiniChair x={r.x1 + 1.5} y={r.y1 + 3.6} />
      <MiniChair x={r.x1 + 3.2} y={r.y1 + 3.6} />
      <Plant x={r.x1 + 0.5} y={r.y1 + 0.6} small />
    </g>
  );
}

function OpsInterior({ tick }: { tick: number }) {
  const r = ROOMS.ops;
  return (
    <g>
      <BigScreen x={r.x1 + 2.5} y={r.y1 + 0.05} tick={tick} />
      <ConferenceTable x={r.x1 + 3} y={r.y1 + 2.4} />
      <SideWallPlaque x={r.x1 + 0.3} y={r.y1 + 1.3} w={1.8} h={1.0} z0={2.2} />
      <Plant x={r.x2 - 0.6} y={r.y1 + 0.6} small />
      <LowGlass x1={r.x1 + 0.6} y={r.y2 - 0.3} x2={r.x2 - 0.6} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Open office                                                        */
/* ------------------------------------------------------------------ */
function Couch({ x, y }: { x: number; y: number }) {
  const offsets = [0.15, 0.95, 1.75];
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + 2.4} y2={y + 0.9} h={0.45} topColor={T.navy600} leftColor={T.navy700} rightColor={T.navy800} stroke={T.navy900} strokeWidth={0.4} />
      <IsoBox x1={x} y1={y + 0.6} x2={x + 2.4} y2={y + 0.9} h={1.2} topColor={T.navy700} leftColor={T.navy700} rightColor={T.navy900} stroke={T.navy900} strokeWidth={0.4} />
      {offsets.map((ox, i) => {
        const p = iso(x + ox + 0.2, y + 0.3, 0.45);
        return <rect key={i} x={p.x - 6} y={p.y - 3} width="12" height="4" fill={T.mint} opacity="0.7" rx="1" />;
      })}
    </g>
  );
}

function CoffeeTable({ x, y }: { x: number; y: number }) {
  const p = iso(x + 0.4, y + 0.4, 0.4);
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + 1.6} y2={y + 0.9} h={0.4} topColor="#c6a876" leftColor="#a67f55" rightColor="#8a5f35" stroke="#6b4620" strokeWidth={0.4} />
      <rect x={p.x - 5} y={p.y - 3} width="10" height="6" fill="#fff" stroke={T.n300} />
    </g>
  );
}

function LongPlanter({ x, y, len }: { x: number; y: number; len: number }) {
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + 0.5} y2={y + len} h={0.4} topColor="#c27b5a" leftColor="#a65c3b" rightColor="#7d4724" stroke="#5a2e10" strokeWidth={0.4} />
      {Array.from({ length: 6 }).map((_, i) => {
        const yy = y + 0.3 + i * (len / 6), p = iso(x + 0.25, yy, 0.4);
        return (
          <g key={i}>
            <ellipse cx={p.x - 2} cy={p.y - 5} rx="3" ry="4" fill="#3a8560" />
            <ellipse cx={p.x + 2} cy={p.y - 4} rx="3" ry="4" fill="#4ca27a" />
          </g>
        );
      })}
    </g>
  );
}

function OpenOfficeDecor({ tick: _tick }: { tick: number }) {
  const r = ROOMS.open;
  return (
    <g>
      <Couch x={r.x2 - 4.6} y={r.y1 + 1.1} />
      <CoffeeTable x={r.x2 - 4.1} y={r.y1 + 2.8} />
      <Plant x={r.x1 + 0.6} y={r.y1 + 0.5} />
      <Plant x={r.x1 + 0.6} y={r.y2 - 0.7} />
      <Plant x={r.x2 - 1.2} y={r.y2 - 0.7} />
      <LongPlanter x={14.2} y={r.y1 + 1.4} len={7.2} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Front rooms                                                        */
/* ------------------------------------------------------------------ */
function ServerRack({ x, y, tick, offset }: { x: number; y: number; tick: number; offset: number }) {
  const W = 0.9, D = 0.7, H = 2.4;
  const p = iso(x + W / 2, y, H);
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + W} y2={y + D} h={H} topColor={T.navy900} leftColor={T.navy800} rightColor={T.navy900} stroke="#000" strokeWidth={0.4} />
      {[0.4, 0.8, 1.2, 1.6, 2.0].map((zz, i) => {
        const pp = iso(x + W / 2, y, zz);
        const pulse = ((tick * 0.003 + offset * 0.4 + i * 0.2) % 1) < 0.12;
        const col = i === 0 ? T.mint : i < 4 ? T.teal300 : T.navy400;
        return (
          <g key={i}>
            <circle cx={pp.x - 4} cy={pp.y} r="1.4" fill={pulse ? T.mint : col} opacity="0.9" />
            <rect x={pp.x} y={pp.y - 1.2} width="9" height="1.2" fill={T.mint700} opacity="0.4" />
          </g>
        );
      })}
      <text x={p.x} y={p.y - 3} fontSize="5.5" fill={T.mint200} fontFamily={T.fontMono} textAnchor="middle" letterSpacing="1.2">R{offset + 1}</text>
    </g>
  );
}

function FilingCabinet({ x, y }: { x: number; y: number }) {
  const W = 0.9, D = 0.7, H = 1.7;
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + W} y2={y + D} h={H} topColor={T.n400} leftColor={T.n500} rightColor={T.n600} stroke={T.n800} strokeWidth={0.4} />
      {[0.45, 0.9, 1.35].map((zz, i) => {
        const a = iso(x, y, zz), b = iso(x + W, y, zz);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.n800} strokeWidth="0.5" />;
      })}
      {[0.22, 0.67, 1.12].map((zz, i) => {
        const pp = iso(x + W / 2, y, zz);
        return <rect key={i} x={pp.x - 3} y={pp.y - 0.4} width="6" height="1" fill={T.n800} />;
      })}
    </g>
  );
}

function ArchiveStack({ x, y, offset = 0 }: { x: number; y: number; offset?: number }) {
  const W = 0.7, D = 0.55, H = 0.5;
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + W} y2={y + D} h={H} topColor="#d9c79a" leftColor="#c2ae80" rightColor="#a68c5e" stroke="#7a5e32" strokeWidth={0.4} />
      <IsoBox x1={x + 0.05} y1={y + 0.05} x2={x + W - 0.05} y2={y + D - 0.05} h={H * 2} topColor="#e4d4a9" leftColor="#ccb887" rightColor="#ae9665" stroke="#7a5e32" strokeWidth={0.4} />
      {offset === 0 && <IsoBox x1={x + 0.1} y1={y + 0.1} x2={x + W - 0.1} y2={y + D - 0.1} h={H * 3} topColor="#d9c79a" leftColor="#c2ae80" rightColor="#a68c5e" stroke="#7a5e32" strokeWidth={0.4} />}
    </g>
  );
}

function Printer({ x, y, tick }: { x: number; y: number; tick: number }) {
  const W = 1.0, D = 0.8, H = 0.8;
  const blink = ((tick * 0.003) % 1) < 0.15;
  const pp = iso(x + W / 2, y, H * 0.5);
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + W} y2={y + D} h={H} topColor={T.n100} leftColor={T.n150} rightColor={T.n200} stroke={T.n500} strokeWidth={0.4} />
      <IsoBox x1={x + 0.15} y1={y + 0.2} x2={x + W - 0.15} y2={y + 0.5} h={H + 0.2} topColor="#ffffff" leftColor={T.n100} rightColor={T.n150} stroke={T.n400} strokeWidth={0.35} />
      <circle cx={pp.x - 5} cy={pp.y} r="1" fill={blink ? T.mint : T.n400} />
    </g>
  );
}

function PatchPanel({ x, y, tick }: { x: number; y: number; tick: number }) {
  const W = 4.5, D = 0.5, H = 2.3;
  const colors = [T.mint, T.teal, T.orange, T.pink, T.yellow, T.navy400];
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + W} y2={y + D} h={H} topColor="#2a2b2c" leftColor="#1d1e20" rightColor="#2f3135" stroke="#000" strokeWidth={0.4} />
      {Array.from({ length: 6 }).map((_, i) => {
        const px = x + 0.3 + i * 0.7;
        const base = iso(px, y, 1.1), cableEnd = iso(px, y - 0.5 - (i % 2) * 0.2, 0.4);
        const pulseOn = ((tick * 0.002 + i * 0.15) % 1) < 0.12;
        const col = colors[i];
        return (
          <g key={i}>
            <circle cx={base.x} cy={base.y} r="3.5" fill="#111" />
            <circle cx={base.x} cy={base.y} r="2" fill={pulseOn ? T.mint : col} opacity="0.9" />
            <path d={`M ${base.x} ${base.y} Q ${base.x - 6} ${base.y + 14}, ${cableEnd.x} ${cableEnd.y}`} stroke={col} strokeWidth="1.3" fill="none" opacity="0.7" />
          </g>
        );
      })}
    </g>
  );
}

function Bench({ x, y }: { x: number; y: number }) {
  return <IsoBox x1={x} y1={y} x2={x + 2.4} y2={y + 0.6} h={0.55} topColor="url(#wood-light)" leftColor="#b6915a" rightColor="#936f3a" stroke="#5e4418" strokeWidth={0.4} />;
}

function ConnectorChips({ x, y }: { x: number; y: number }) {
  const colors = [T.mint, T.teal, T.orange, T.pink, T.yellow, T.navy400];
  return (
    <g>
      {colors.map((col, i) => {
        const pp = iso(x + i * 0.38, y + 0.2, 0.58);
        return (
          <g key={i}>
            <rect x={pp.x - 5} y={pp.y - 3} width="10" height="6" rx="1" fill="#fff" stroke={T.n300} strokeWidth="0.3" />
            <rect x={pp.x - 3} y={pp.y - 1.5} width="6" height="3" fill={col} />
          </g>
        );
      })}
    </g>
  );
}

function FrontRoomsWallsAndFurniture({ tick }: { tick: number }) {
  const m = ROOMS.memory, ii = ROOMS.integrations;
  return (
    <g>
      <IsoBox x1={0} y1={GRID_D} x2={GRID_W} y2={GRID_D + WALL_T} h={WALL_H} topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke="#9e9787" strokeWidth={0.4} />
      <IsoBox x1={-WALL_T} y1={16} x2={0} y2={GRID_D} h={WALL_H} topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke="#9e9787" strokeWidth={0.4} />
      <IsoBox x1={GRID_W} y1={16} x2={GRID_W + WALL_T} y2={GRID_D} h={WALL_H} topColor="#e9e4d7" leftColor="#cdc5b4" rightColor="#dbd4c2" stroke="#9e9787" strokeWidth={0.4} />
      <PartitionWall x1={13} y1={18} x2={13} y2={GRID_D} />
      {[m, ii].map((r) => {
        const dx = r.door!.x;
        return (
          <g key={r.name}>
            <PartitionWall x1={r.x1} y1={18} x2={dx - 0.8} y2={18} />
            <PartitionWall x1={dx + 0.8} y1={18} x2={r.x2} y2={18} />
            <LintelAboveDoor x1={dx - 0.8} x2={dx + 0.8} y={18} />
            <DoorLeaf x={dx + 0.8 - 1.6} y={18} />
          </g>
        );
      })}
      <ServerRack x={m.x1 + 0.5} y={m.y1 + 0.5} tick={tick} offset={0} />
      <ServerRack x={m.x1 + 1.8} y={m.y1 + 0.5} tick={tick} offset={1} />
      <ServerRack x={m.x1 + 3.1} y={m.y1 + 0.5} tick={tick} offset={2} />
      <ServerRack x={m.x1 + 4.4} y={m.y1 + 0.5} tick={tick} offset={3} />
      <FilingCabinet x={m.x1 + 6.4} y={m.y1 + 0.5} />
      <ArchiveStack x={m.x1 + 1} y={m.y2 - 1.3} />
      <ArchiveStack x={m.x1 + 2.3} y={m.y2 - 1.1} offset={1} />
      <Printer x={m.x1 + 7.8} y={m.y2 - 1.2} tick={tick} />
      <Plant x={m.x2 - 1.3} y={m.y2 - 0.7} small />
      <PatchPanel x={ii.x1 + 0.5} y={ii.y1 + 0.5} tick={tick} />
      <Bench x={ii.x1 + 1} y={ii.y2 - 1.3} />
      <ConnectorChips x={ii.x1 + 1.2} y={ii.y2 - 1.1} />
      <Plant x={ii.x1 + 0.5} y={ii.y2 - 0.7} small />
      <Plant x={ii.x2 - 1} y={ii.y2 - 0.7} small />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Desks                                                              */
/* ------------------------------------------------------------------ */
function MonitorGraphics({ variant, tl, tr, br, bl: _bl, tick }: {
  variant: string; tl: {x:number;y:number}; tr: {x:number;y:number};
  br: {x:number;y:number}; bl: {x:number;y:number}; tick: number;
}) {
  const leftX = tl.x + 4, topY = tl.y + 3;
  const w = (tr.x - tl.x) - 8, h = (br.y - tr.y) - 4;
  if (variant === "canvas") {
    return (
      <g>
        <rect x={leftX} y={topY} width={w} height="5" fill={T.mint700} opacity="0.85" />
        {[0, 1, 2].map(i => <rect key={i} x={leftX + 2} y={topY + 9 + i * 7} width={w - 4} height="5" rx="1" fill="#fff" opacity={i === 0 ? 0.5 : 0.18} />)}
        <rect x={leftX + 2} y={topY + h - 4} width={(w - 4) * (0.3 + (Math.sin(tick * 0.001) + 1) * 0.18)} height="1.5" fill={T.mint} />
      </g>
    );
  }
  if (variant === "log") {
    return (
      <g>
        <rect x={leftX} y={topY} width={w} height="4" fill={T.navy600} opacity="0.85" />
        {[0.6, 0.85, 0.7, 0.5, 0.75].map((wv, i) => (
          <g key={i}>
            <rect x={leftX} y={topY + 7 + i * 5} width="2.5" height="2.5" fill={i === 2 ? T.mint : T.mint700} opacity={i === 2 ? 1 : 0.6} />
            <rect x={leftX + 4} y={topY + 7 + i * 5 + 0.7} width={(w - 6) * wv} height="1.3" fill={i === 2 ? T.mint : T.teal300} opacity={i === 2 ? 0.95 : 0.5} />
          </g>
        ))}
      </g>
    );
  }
  if (variant === "intake") {
    return (
      <g>
        <rect x={leftX} y={topY} width={w} height="4" fill={T.mint700} opacity="0.85" />
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <circle cx={leftX + 3} cy={topY + 8 + i * 5} r="1.3" fill={T.mint} opacity={i === 0 ? 1 : 0.4} />
            <rect x={leftX + 6} y={topY + 7 + i * 5} width={(w - 10) * (0.65 - i * 0.08)} height="2" fill="#fff" opacity="0.6" />
          </g>
        ))}
      </g>
    );
  }
  if (variant === "memo") {
    return (
      <g>
        <rect x={leftX} y={topY} width={w} height="3" fill={T.navy600} opacity="0.9" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={leftX + 2} y={topY + 6 + i * 2.4} width={(w - 4) * (0.9 - (i % 3) * 0.12)} height="1" fill="#fff" opacity="0.4" />
        ))}
      </g>
    );
  }
  if (variant === "loading") {
    return (
      <g>
        <rect x={leftX} y={topY + h / 2 - 2} width={w} height="1.2" fill={T.orange} opacity="0.5" />
        <rect x={leftX} y={topY + h / 2 - 2} width={w * ((Math.sin(tick * 0.002) + 1) / 2)} height="1.2" fill={T.orange} />
      </g>
    );
  }
  return null;
}

function DeskMonitor({ x, y, live, tick, variant }: { x: number; y: number; live: boolean; tick: number; variant: string }) {
  const z0 = 0.9, z1 = 1.75, W = 0.78;
  const tl = iso(x, y, z1), tr = iso(x + W, y, z1);
  const br = iso(x + W, y, z0), bl = iso(x, y, z0);
  const s1 = iso(x + W / 2, y + 0.2, 0.75), s2 = iso(x + W / 2, y + 0.2, 0.95);
  return (
    <g>
      <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`} fill={T.navy900} stroke="#000" strokeWidth="0.4" />
      <polygon points={`${tl.x + 1.8},${tl.y + 2} ${tr.x - 1.8},${tr.y + 2} ${br.x - 1.8},${br.y - 2} ${bl.x + 1.8},${bl.y - 2}`} fill={live ? "url(#screen-live)" : T.n800} />
      {live && <MonitorGraphics variant={variant} tl={tl} tr={tr} br={br} bl={bl} tick={tick} />}
      <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke="#1d1e20" strokeWidth="2.2" />
      <ellipse cx={s1.x} cy={s1.y} rx="7" ry="2.2" fill="#1d1e20" />
    </g>
  );
}

function Keyboard({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <IsoBox x1={x} y1={y} x2={x + 0.9} y2={y + 0.28} h={0.78} topColor="#ffffff" leftColor="#d4d0c4" rightColor="#c5c0b2" stroke="#a39e92" strokeWidth={0.25} />
      <IsoBox x1={x + 1.05} y1={y + 0.08} x2={x + 1.15} y2={y + 0.2} h={0.78} topColor="#fff" leftColor="#d4d0c4" rightColor="#c5c0b2" stroke="#a39e92" strokeWidth={0.25} />
    </g>
  );
}

function Mug({ x, y }: { x: number; y: number }) {
  const base = iso(x, y, 0.75), top = iso(x, y, 1.0);
  return (
    <g>
      <ellipse cx={top.x} cy={top.y} rx="4" ry="1.4" fill={T.mint700} />
      <path d={`M ${top.x - 4} ${top.y} L ${base.x - 4} ${base.y} A 4 1.5 0 0 0 ${base.x + 4} ${base.y} L ${top.x + 4} ${top.y} Z`} fill={T.mint} stroke={T.mint700} strokeWidth="0.4" />
      <ellipse cx={top.x} cy={top.y} rx="3" ry="1" fill={T.navy900} />
      <path d={`M ${top.x - 2.5} ${top.y - 3} q 1.5 -3 3 -1.5 q 1.5 1.5 -1 3.5`} stroke={T.n300} strokeWidth="0.6" fill="none" opacity="0.6" />
    </g>
  );
}

function Papers({ x, y }: { x: number; y: number }) {
  const p = iso(x, y, 0.76);
  return (
    <g>
      <rect x={p.x - 6} y={p.y - 5} width="12" height="9" fill="#fff" stroke={T.n200} strokeWidth="0.5" transform={`rotate(-8 ${p.x} ${p.y})`} />
      <rect x={p.x - 4} y={p.y - 2} width="8" height="0.8" fill={T.n300} transform={`rotate(-8 ${p.x} ${p.y})`} />
    </g>
  );
}

function OfficeChair({ x, y, occupied, tint }: { x: number; y: number; occupied: boolean; tint: string }) {
  const seatColor = occupied ? T.navy : T.n400;
  const backColor = occupied ? T.navy800 : T.n500;
  void tint;
  const p1 = iso(x, y, 0.1), p2 = iso(x, y, 0.55);
  return (
    <g>
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        const ex = x + Math.cos(rad) * 0.3, ey = y + Math.sin(rad) * 0.22;
        const pp1 = iso(x, y, 0.1), pp2 = iso(ex, ey, 0);
        return <line key={i} x1={pp1.x} y1={pp1.y} x2={pp2.x} y2={pp2.y} stroke="#2a2b2c" strokeWidth="1.2" />;
      })}
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#2a2b2c" strokeWidth="2" />
      <IsoBox x1={x - 0.35} y1={y - 0.3} x2={x + 0.35} y2={y + 0.25} h={0.65} topColor={seatColor} leftColor={seatColor} rightColor={backColor} stroke="#1d1e20" strokeWidth={0.35} />
      <IsoBox x1={x - 0.3} y1={y + 0.18} x2={x + 0.3} y2={y + 0.25} h={1.5} topColor={backColor} leftColor={backColor} rightColor="#1d1e20" stroke="#1d1e20" strokeWidth={0.35} />
    </g>
  );
}

function BeaconFigure({ cx, cy, tick }: { cx: number; cy: number; tick: number }) {
  const breathe = Math.sin(tick * 0.002) * 0.015;
  const torsoX = cx - 0.3, torsoY = cy - 0.12;
  const p = iso(cx, cy, 1.5 + breathe);
  const sL = iso(cx - 0.3, cy + 0.05, 0.95), sR = iso(cx + 0.3, cy + 0.05, 0.95);
  const hL = iso(cx - 0.28, cy - 0.55, 0.8), hR = iso(cx + 0.28, cy - 0.55, 0.8);
  return (
    <g>
      <IsoBox x1={torsoX} y1={torsoY} x2={torsoX + 0.6} y2={torsoY + 0.36} h={1.05 + breathe} topColor={T.navy} leftColor={T.navy800} rightColor={T.navy900} stroke={T.navy900} strokeWidth={0.4} />
      <ellipse cx={p.x - 0.3} cy={p.y + 0.5} rx="7.5" ry="9" fill={T.navy900} opacity="0.9" />
      <ellipse cx={p.x} cy={p.y} rx="6.8" ry="7.8" fill="#d9b892" stroke="#a8825a" strokeWidth="0.35" />
      <ellipse cx={p.x + 3.2} cy={p.y + 1} rx="3" ry="4.5" fill="#b8946a" opacity="0.35" />
      <path d={`M ${p.x - 6.8} ${p.y - 2} Q ${p.x - 8} ${p.y - 9} ${p.x} ${p.y - 8.6} Q ${p.x + 8} ${p.y - 9} ${p.x + 6.8} ${p.y - 2} L ${p.x + 4.8} ${p.y - 4.3} L ${p.x - 4.8} ${p.y - 4.3} Z`} fill={T.navy900} />
      <path d={`M ${p.x - 7} ${p.y - 3} Q ${p.x} ${p.y - 10} ${p.x + 7} ${p.y - 3}`} fill="none" stroke={T.n700} strokeWidth="1.3" strokeLinecap="round" />
      <rect x={p.x + 5} y={p.y - 1.3} width="3.5" height="4.5" rx="1.3" fill={T.n800} />
      <circle cx={p.x + 3.5} cy={p.y + 5} r="0.85" fill={T.mint} />
      <g fill="none" strokeLinecap="round">
        <path d={`M ${sL.x} ${sL.y} Q ${sL.x - 3} ${sL.y + 5} ${hL.x} ${hL.y}`} stroke={T.navy800} strokeWidth="5" />
        <path d={`M ${sR.x} ${sR.y} Q ${sR.x + 3} ${sR.y + 5} ${hR.x} ${hR.y}`} stroke={T.navy800} strokeWidth="5" />
        <circle cx={hL.x} cy={hL.y} r="2" fill="#d9b892" stroke="#a8825a" strokeWidth="0.3" />
        <circle cx={hR.x} cy={hR.y} r="2" fill="#d9b892" stroke="#a8825a" strokeWidth="0.3" />
      </g>
    </g>
  );
}

function GhostFigure({ cx, cy, tick, shirt, subtle }: { cx: number; cy: number; tick: number; shirt: string; subtle?: boolean }) {
  const breathe = Math.sin(tick * 0.0015) * 0.012;
  const torsoX = cx - 0.28, torsoY = cy - 0.1;
  const p = iso(cx, cy, 1.4 + breathe);
  return (
    <g opacity={subtle ? 0.9 : 1}>
      <IsoBox x1={torsoX} y1={torsoY} x2={torsoX + 0.56} y2={torsoY + 0.32} h={1.0 + breathe} topColor={shirt} leftColor={shirt} rightColor={T.navy900} stroke={T.navy900} strokeWidth={0.35} />
      <ellipse cx={p.x} cy={p.y} rx="6" ry="7" fill="#d9b892" stroke="#a8825a" strokeWidth="0.3" />
      <path d={`M ${p.x - 6} ${p.y - 1.5} Q ${p.x - 7} ${p.y - 8} ${p.x} ${p.y - 7.5} Q ${p.x + 7} ${p.y - 8} ${p.x + 6} ${p.y - 1.5} L ${p.x + 4} ${p.y - 4} L ${p.x - 4} ${p.y - 4} Z`} fill={T.navy900} />
    </g>
  );
}

function DeskNameplate({
  desk,
  emphasis,
  showMeta,
}: {
  desk: DeskDef;
  emphasis?: boolean;
  showMeta?: boolean;
}) {
  const DeskD = 0.95;
  const p = iso(desk.cx, desk.cy + DeskD / 2 - 0.08, 0.78);
  const tone = desk.status === "live" ? T.success
    : desk.status === "active" ? T.navy600
    : desk.status === "in-development" ? T.orange : T.n400;
  const width = emphasis ? 78 : 62;
  const height = showMeta ? 21 : 15;
  const textY = showMeta ? -1 : 3;
  return (
    <g transform={`translate(${p.x}, ${p.y})`} style={{ pointerEvents: "none" }}>
      <rect x={-width / 2} y={-8} width={width} height={height} rx="3" fill="#ffffff" stroke={T.n200} strokeWidth="0.55" opacity="0.98" />
      <rect x={-width / 2} y={-8} width="2" height={height} fill={tone} />
      <text x={-width / 2 + 6} y={textY} fontSize={emphasis ? "9.4" : "8.4"} fontWeight="700" fill={T.navy} fontFamily={T.fontSans} letterSpacing="0.15">
        {emphasis ? `${desk.name} workspace` : desk.name}
      </text>
      {showMeta && (
        <text x={-width / 2 + 6} y="9" fontSize="6.8" fill={T.n500} fontFamily={T.fontMono} letterSpacing="0.7">
          {statusLabelText(desk.status).toUpperCase()}
        </text>
      )}
    </g>
  );
}

function BeaconActivityAgent({ activity, tick }: { activity: BeaconOfficeActivity; tick: number }) {
  if (activity.atDesk) return null;

  const p = iso(activity.cx, activity.cy, 0.04);
  const pulse = 1 + Math.sin(tick * 0.004) * 0.08;
  const surfaceTone = activity.surface === "integrations" ? T.teal
    : activity.surface === "ops" ? T.orange
    : activity.surface === "knowledge" ? T.mint700
    : T.navy600;

  return (
    <g style={{ pointerEvents: "none" }}>
      <ellipse
        cx={p.x}
        cy={p.y + 5}
        rx={28 * pulse}
        ry={13 * pulse}
        fill={surfaceTone}
        opacity="0.14"
      />
      <ellipse cx={p.x} cy={p.y + 5} rx="22" ry="10" fill="none" stroke={surfaceTone} strokeWidth="1.1" strokeDasharray="3 3" opacity="0.65" />
      <BeaconFigure cx={activity.cx} cy={activity.cy} tick={tick} />
      <g transform={`translate(${p.x + 34}, ${p.y - 40})`}>
        <rect x="-4" y="-16" width="184" height="43" rx="8" fill="#fff" stroke={T.n200} strokeWidth="0.7" filter="url(#iso-shadow-soft)" />
        <rect x="-4" y="-16" width="4" height="43" rx="2" fill={surfaceTone} />
        <text x="8" y="-1" fontSize="10" fontWeight="800" fill={T.navy} fontFamily={T.fontSans}>{activity.label}</text>
        <text x="8" y="14" fontSize="8" fill={T.n500} fontFamily={T.fontMono}>{activity.detail.slice(0, 34)}</text>
      </g>
    </g>
  );
}

function Desk({ desk, tick, hover, active, showLabel, beaconAway, onEnter, onLeave, onClick }: {
  desk: DeskDef; tick: number; hover: boolean; active: boolean;
  showLabel: boolean;
  beaconAway?: boolean;
  onEnter: () => void; onLeave: () => void; onClick: () => void;
}) {
  const { cx, cy, occupied, status } = desk;
  const DeskW = desk.role === "secretary" ? 3.1 : desk.id === "beacon" ? 3.0 : 2.55;
  const DeskD = desk.id === "beacon" ? 1.2 : 1.08;
  const x = cx - DeskW / 2, y = cy - DeskD / 2;
  const isBeacon = desk.id === "beacon";
  const isSecretary = desk.role === "secretary";
  const isAdmin = desk.role === "admin";
  const effectiveOccupied = isBeacon && beaconAway ? false : !!occupied;

  return (
    <g style={{ cursor: "pointer" }} onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick}>
      <IsoBox x1={x} y1={y} x2={x + DeskW} y2={y + DeskD} h={0.75}
        topColor={isSecretary ? "#ffffff" : isAdmin ? "url(#wood)" : "url(#wood-light)"}
        leftColor={isSecretary ? T.n200 : isAdmin ? "#936f3a" : "#b6915a"}
        rightColor={isSecretary ? T.n300 : isAdmin ? "#6e4f22" : "#936f3a"}
        stroke={isSecretary ? T.n500 : "#5e4418"} strokeWidth={hover ? 1.2 : 0.6} />
      {isSecretary && <IsoBox x1={x - 0.08} y1={y + DeskD - 0.05} x2={x + DeskW + 0.08} y2={y + DeskD + 0.08} h={1.25} topColor={T.navy600} leftColor={T.navy700} rightColor={T.navy800} stroke={T.navy900} strokeWidth={0.4} />}
      {isBeacon && (
        <>
          <DeskMonitor x={x + 0.2}  y={y + 0.2} live={true} tick={tick} variant="canvas" />
          <DeskMonitor x={x + 1.05} y={y + 0.2} live={true} tick={tick} variant="log" />
        </>
      )}
      {!isBeacon && !isSecretary && !isAdmin && <DeskMonitor x={x + 0.45} y={y + 0.25} live={status === "in-development"} tick={tick} variant={status === "in-development" ? "loading" : "dark"} />}
      {isSecretary && <DeskMonitor x={x + 1.2} y={y + 0.25} live={true} tick={tick} variant="intake" />}
      {isAdmin && <DeskMonitor x={x + 0.5} y={y + 0.2} live={true} tick={tick} variant="memo" />}
      {isBeacon && <><Keyboard x={x + 0.45} y={y + 0.6} /><Mug x={x + 1.82} y={y + 0.72} /><Plant x={x + 0.08} y={y + 0.15} small /></>}
      {!isBeacon && !isSecretary && !isAdmin && <Keyboard x={x + 0.7} y={y + 0.6} />}
      {isSecretary && <><Keyboard x={x + 0.2} y={y + 0.6} /><Papers x={x + 0.6} y={y + 0.3} /></>}
      {isAdmin && <Keyboard x={x + 0.7} y={y + 0.6} />}
      {!isSecretary && !isAdmin && <OfficeChair x={cx} y={y + DeskD + 0.35} occupied={effectiveOccupied} tint={desk.tint} />}
      {isAdmin && <OfficeChair x={cx} y={y + DeskD + 0.35} occupied={true} tint="navy" />}
      {isBeacon && !beaconAway && <BeaconFigure cx={cx} cy={y + DeskD + 0.5} tick={tick} />}
      {isSecretary && <GhostFigure cx={cx - 0.35} cy={y + DeskD + 0.4} tick={tick} shirt={T.mint} />}
      {isAdmin && <GhostFigure cx={cx} cy={y + DeskD + 0.4} tick={tick} shirt={T.navy} subtle />}
      {!isBeacon && !isSecretary && !isAdmin && occupied === false && (() => {
        const cp = iso(cx, y + DeskD + 0.45, 0.5);
        return (
          <g>
            <rect x={cp.x - 20} y={cp.y - 7} width="40" height="14" rx="7" fill="#fff" stroke={T.n200} strokeWidth="0.5" filter="url(#iso-shadow-soft)" />
            <text x={cp.x} y={cp.y + 3} fontSize="7" fontFamily={T.fontMono} fill={status === "in-development" ? T.orange : T.n500} textAnchor="middle" letterSpacing="1">
              {status === "in-development" ? "IN DEV" : "RESERVED"}
            </text>
          </g>
        );
      })()}
      {showLabel && <DeskNameplate desk={desk} emphasis={isBeacon} showMeta={hover || isBeacon} />}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Door signage                                                       */
/* ------------------------------------------------------------------ */
function DoorSignage({ room, zoneId, hover, admin, front: _front }: { room: Room; zoneId: string; hover: boolean; admin?: boolean; front?: boolean }) {
  const stats: Record<string, { a: string; b: string }> = {
    knowledge:    { a: "73",  b: "offerings" },
    ops:          { a: "12",  b: "ready to push" },
    memory:       { a: "215", b: "runs" },
    integrations: { a: "6",   b: "connectors" },
    admin:        { a: "\u2014", b: "governance" },
  };
  const stat = stats[zoneId];
  const dx = room.door ? room.door.x : (room.x1 + room.x2) / 2;
  const dy = room.door ? (room.door.side === "S" ? room.y2 : room.y1) : room.y1;
  const p = iso(dx, dy, WALL_H + 0.8);
  const bg = hover ? T.navy : "#ffffff";
  const fg = hover ? "#fff" : T.navy;
  const accent = hover ? T.mint : T.mint700;
  const sub = hover ? T.mint200 : T.n500;
  const width = hover ? 122 : 96;
  const showSupplemental = hover && !admin && stat;
  return (
    <g transform={`translate(${p.x}, ${p.y})`} style={{ pointerEvents: "none" }}>
      <line x1="0" y1="18" x2="0" y2="28" stroke={T.n300} strokeWidth="0.6" strokeDasharray="1.5 2" />
      <rect x={-width / 2} y="-12" width={width} height="22" rx="11" fill={bg} stroke={hover ? T.navy : T.n200} strokeWidth="0.7" filter="url(#iso-shadow-soft)" />
      <circle cx={-width / 2 + 10} cy="-1" r="2.8" fill={T.success} />
      <text x={-width / 2 + 18} y="3" fontSize="10.2" fontWeight="700" fill={fg} fontFamily={T.fontSans} letterSpacing="0.12">
        {room.name}
      </text>
      {showSupplemental && (
        <>
          <text x={width / 2 - 24} y="3" fontSize="10" fontWeight="700" fill={accent} fontFamily={T.fontMono} textAnchor="end" letterSpacing="0.2">
            {stat.a}
          </text>
          <text x={width / 2 - 22} y="3" fontSize="8" fill={sub} fontFamily={T.fontSans}>
            {stat.b}
          </text>
        </>
      )}
      {hover && admin && (
        <text x={width / 2 - 8} y="3" fontSize="8" fill={sub} fontFamily={T.fontSans} textAnchor="end">
          {room.tagline}
        </text>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Signal ribbons                                                     */
/* ------------------------------------------------------------------ */
function SignalRibbons({ tick }: { tick: number }) {
  const beacon = DESKS[0];
  const start = iso(beacon.cx, beacon.cy, 1.3);
  const targets = ZONES.map((z) => {
    const r = ROOMS[z.room];
    return { id: z.id, p: iso((r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2, 1.2) };
  });
  return (
    <g style={{ pointerEvents: "none" }}>
      {targets.map((t, i) => {
        const phase = ((tick * 0.0007 + i * 0.25) % 1);
        const midX = (start.x + t.p.x) / 2;
        const midY = Math.min(start.y, t.p.y) - 60 - i * 8;
        const x = (1 - phase) ** 2 * start.x + 2 * (1 - phase) * phase * midX + phase ** 2 * t.p.x;
        const y = (1 - phase) ** 2 * start.y + 2 * (1 - phase) * phase * midY + phase ** 2 * t.p.y;
        return (
          <g key={t.id}>
            <path d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${t.p.x} ${t.p.y}`} stroke={T.mint} strokeWidth="1" fill="none" opacity="0.18" strokeDasharray="1 4" />
            <circle cx={x} cy={y} r="2.5" fill={T.mint} />
            <circle cx={x} cy={y} r="5" fill={T.mint} opacity="0.3" />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Beacon live toast                                                  */
/* ------------------------------------------------------------------ */
function BeaconToast({ tick }: { tick: number }) {
  const cycle = (tick % 6000) / 1000;
  if (cycle > 4) return null;
  const alpha = cycle < 0.4 ? cycle / 0.4 : cycle > 3.6 ? (4 - cycle) / 0.4 : 1;
  const beacon = DESKS[0];
  const p = iso(beacon.cx, beacon.cy, 2.6);
  return (
    <g style={{ pointerEvents: "none" }} opacity={alpha}>
      <g transform={`translate(${p.x + 60}, ${p.y - 20 - cycle * 4})`}>
        <rect x="-70" y="-16" width="140" height="32" rx="8" fill="#fff" stroke={T.mint300} strokeWidth="0.8" filter="url(#iso-shadow)" />
        <circle cx="-58" cy="0" r="4" fill={T.success} />
        <circle cx="-58" cy="0" r="8" fill={T.success} opacity="0.25" />
        <text x="-48" y="-3" fontSize="10" fontWeight="700" fill={T.navy} fontFamily={T.fontSans}>R-0215 → pushed</text>
        <text x="-48" y="9" fontSize="8.5" fill={T.n500} fontFamily={T.fontMono}>CAREERS · APAC · NEW GOAL</text>
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Hover card                                                         */
/* ------------------------------------------------------------------ */
function HoverCard({ id, onNavigate }: { id: string; onNavigate: (href: string) => void }) {
  const zone = ZONES.find((r) => r.id === id);
  const desk = DESKS.find((d) => d.id === id);
  let title = "", sub = "", body = "", status = "";
  if (zone) {
    const inf = D.infra.find((x) => x.id === id)!;
    title = inf.name; sub = inf.tagline; body = inf.description; status = inf.status;
  } else if (desk) {
    if (desk.role === "secretary") {
      title = "Secretary"; sub = "Intake \u00b7 triage";
      body = "First point of contact for incoming briefs. Routes work to the right specialist.";
      status = "active";
    } else if (desk.role === "admin") {
      title = "Administrator"; sub = "Governance \u00b7 accounts \u00b7 rules";
      body = "Owns readiness rules, permissions, and the campaign-naming catalog.";
      status = "active";
    } else {
      const cw = D.coworkers.find((x) => x.id === desk.id);
      if (cw) {
        title = cw.name; sub = `${cw.domain} \u00b7 ${cw.role}`;
        body = cw.status === "live" ? `${cw.runs} runs \u00b7 live since ${cw.since}`
          : cw.status === "in-development" ? "Desk provisioned. Runtime not yet connected."
          : "Reserved seat. No runtime or tools yet.";
        status = cw.status;
      }
    }
  } else return null;
  const hasRoute = !!ROUTES[id];
  return (
    <div style={{
      position: "absolute", right: 16, top: 66, width: 288,
      background: "rgba(255,255,255,.97)", backdropFilter: "blur(8px)",
      border: `1px solid ${T.n200}`, borderRadius: 12, padding: 14,
      boxShadow: T.shadowLg, pointerEvents: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor(status), display: "inline-block" }} />
        <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.n500, textTransform: "uppercase", letterSpacing: ".1em" }}>
          {statusLabelText(status)}
        </span>
      </div>
      <div style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 18, color: T.navy, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: 12, color: T.n500, marginTop: 2 }}>{sub}</div>
      <div style={{ fontSize: 12.5, color: T.n700, marginTop: 10, lineHeight: 1.55 }}>{body}</div>
      {hasRoute && (
        <div style={{ fontSize: 11, color: T.mint700, marginTop: 10, fontWeight: 600, fontFamily: T.fontMono }}
          onClick={() => onNavigate(ROUTES[id])}>
          Click to open →
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event ticker                                                       */
/* ------------------------------------------------------------------ */
function EventTicker({
  tick,
  beacon,
}: {
  tick: number;
  beacon: import("@/lib/mcp/beacon-activity").BeaconOperationalSnapshot | null;
}) {
  // Live ticker now reads real run_events from Beacon SQLite (was D.recentEvents,
  // hardcoded fake RUN-0215/0214/0213/0212/0211).
  const items = (beacon?.recentEvents ?? []).slice(0, 5);
  const formatTs = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(11, 16);
  };
  const shortRid = (id: string) => id.slice(0, 8).toUpperCase();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 18, overflow: "hidden",
      padding: "8px 16px", borderTop: `1px solid ${T.n150}`, whiteSpace: "nowrap",
      fontSize: 11, fontFamily: T.fontMono, color: T.n600, letterSpacing: ".04em",
      background: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.mint700, fontWeight: 700, flexShrink: 0 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: T.success, display: "inline-block",
          boxShadow: `0 0 0 ${3 + Math.sin(tick * 0.004) * 1.5}px ${T.mint}44`,
        }} />
        LIVE FEED
      </div>
      <div style={{ width: 1, height: 14, background: T.n150, flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 24, overflow: "hidden", flex: 1 }}>
        {items.length === 0 && (
          <span style={{ color: T.n400 }}>
            {beacon ? "No recent Beacon activity." : "beacon.sqlite unreachable"}
          </span>
        )}
        {items.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ color: T.n400 }}>{formatTs(e.created_at)}</span>
            <span style={{ color: T.navy, fontWeight: 700 }}>{shortRid(e.run_id)}</span>
            <span style={{ color: T.n500 }}>
              {e.event_type === "status_changed" ? "Status changed" : "Blueprint saved"}
            </span>
            {e.event_type === "status_changed" && e.from_status && (
              <>
                <span style={{ color: T.n400 }}>{e.from_status}</span>
                <span style={{ color: T.mint700 }}>→</span>
                <span style={{ color: e.to_status === "pushed" ? T.success : e.to_status === "push_failed" ? T.pink : T.navy, fontWeight: 600 }}>{e.to_status}</span>
              </>
            )}
            {e.event_type === "version_saved" && e.version_number !== null && (
              <span style={{ color: T.n500 }}>v{e.version_number} · {e.to_status ?? "draft"}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  On-the-floor row                                                   */
/* ------------------------------------------------------------------ */
function OnTheFloorRow({
  onNavigate,
  tick: _tick,
  beacon,
}: {
  onNavigate: (href: string) => void;
  tick: number;
  beacon: import("@/lib/mcp/beacon-activity").BeaconOperationalSnapshot | null;
}) {
  // All three cards now read from live Beacon SQLite (via the snapshot the
  // server passes in). Previously these were hardcoded to fake R-0215, etc.
  const currentRun = beacon?.currentRun ?? null;
  const queueAwaiting = beacon?.queueAwaiting ?? 0;
  const lastPush = beacon?.lastPush ?? null;
  const cellBase: React.CSSProperties = {
    flex: 1, textAlign: "left", padding: "12px 16px",
    background: "#fff", border: "none", borderRight: `1px solid ${T.n100}`,
    cursor: "pointer", fontFamily: "inherit", display: "block",
  };
  const shortRid = (id: string) => id.slice(0, 8).toUpperCase();
  const titleize = (s: string) => s.replace(/_/g, " ");
  const isLive = beacon !== null;
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "#fff", borderTop: `1px solid ${T.n150}` }}>
      <div style={{ padding: "12px 16px", background: T.navy50, display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `1px solid ${T.n150}`, minWidth: 150 }}>
        <div style={{ fontSize: 10, fontFamily: T.fontMono, fontWeight: 700, letterSpacing: ".12em", color: T.n500, textTransform: "uppercase" }}>On the floor</div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: isLive ? T.mint700 : T.n500, fontFamily: T.fontMono, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? T.success : T.n400, display: "inline-block" }} />
          {isLive ? "BEACON · LIVE" : "BEACON · UNREACHABLE"}
        </div>
      </div>
      <button
        onClick={() => onNavigate(currentRun ? `/mcp/beacon/runs/${currentRun.run_id}` : ROUTES.beacon)}
        style={cellBase}
      >
        <div style={{ fontSize: 10.5, color: T.n500, fontFamily: T.fontMono, letterSpacing: ".08em", textTransform: "uppercase" }}>Current run</div>
        {currentRun ? (
          <>
            <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.navy, fontSize: 15 }}>{shortRid(currentRun.run_id)}</span>
              <span style={{ fontSize: 11, color: T.mint700, fontWeight: 600 }}>{titleize(currentRun.effective_status)}</span>
            </div>
            <div style={{ fontSize: 11, color: T.n600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {[currentRun.family, currentRun.geography, currentRun.campaign_title].filter(Boolean).join(" · ")}
            </div>
          </>
        ) : (
          <div style={{ marginTop: 4, fontSize: 12, color: T.n500 }}>Nothing in flight.</div>
        )}
      </button>
      <button onClick={() => onNavigate(ROUTES.ops)} style={cellBase}>
        <div style={{ fontSize: 10.5, color: T.n500, fontFamily: T.fontMono, letterSpacing: ".08em", textTransform: "uppercase" }}>Queue at ops</div>
        <div style={{ marginTop: 2, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: T.fontDisplay, fontWeight: 800, color: T.navy, fontSize: 20 }}>{queueAwaiting}</span>
          <span style={{ fontSize: 11, color: T.n600 }}>runs awaiting gate</span>
        </div>
        <div style={{ fontSize: 11, color: T.n500, marginTop: 2 }}>draft + regenerated</div>
      </button>
      <button onClick={() => onNavigate(lastPush ? `/mcp/beacon/runs/${lastPush.run_id}` : ROUTES.memory)} style={{ ...cellBase, borderRight: "none" }}>
        <div style={{ fontSize: 10.5, color: T.n500, fontFamily: T.fontMono, letterSpacing: ".08em", textTransform: "uppercase" }}>Last push</div>
        {lastPush ? (
          <>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                background: lastPush.outcome === "succeeded" ? T.success : lastPush.outcome === "failed" ? T.pink : T.orange,
              }} />
              <span style={{ fontSize: 13, color: T.navy, fontWeight: 700, fontFamily: T.fontMono }}>{shortRid(lastPush.run_id)}</span>
              <span style={{ fontSize: 11, color: T.n600 }}>{lastPush.outcome.replace(/_/g, " ")}</span>
            </div>
            <div style={{ fontSize: 11, color: T.n500, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {lastPush.account_name ?? lastPush.customer_id}
            </div>
          </>
        ) : (
          <div style={{ marginTop: 4, fontSize: 12, color: T.n500 }}>No pushes yet.</div>
        )}
      </button>
    </div>
  );
}

function CameraButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? T.mint300 : T.n200}`,
        background: active ? T.mint50 : "#ffffff",
        color: active ? T.navy : T.n600,
        borderRadius: 8,
        padding: "7px 10px",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function nodeAnchor(id: string) {
  const zone = ZONES.find((item) => item.id === id);
  if (zone) {
    const room = ROOMS[zone.room];
    return iso((room.x1 + room.x2) / 2, (room.y1 + room.y2) / 2, 1.25);
  }
  const desk = DESKS.find((item) => item.id === id);
  if (desk) {
    return iso(desk.cx, desk.cy, 1.2);
  }
  return null;
}

function InspectOverlay({ selectedId }: { selectedId: string | null }) {
  const visible = INSPECT_RELATIONS.filter((relation) => !selectedId || relation.from === selectedId || relation.to === selectedId);
  return (
    <g style={{ pointerEvents: "none" }}>
      {visible.map((relation) => {
        const from = nodeAnchor(relation.from);
        const to = nodeAnchor(relation.to);
        if (!from || !to) return null;
        const active = selectedId ? relation.from === selectedId || relation.to === selectedId : false;
        const midX = (from.x + to.x) / 2;
        const midY = Math.min(from.y, to.y) - 34;
        return (
          <g key={`${relation.from}-${relation.to}-${relation.label}`}>
            <path
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              stroke={active ? T.mint700 : T.navy400}
              strokeWidth={active ? "1.7" : "1.05"}
              fill="none"
              opacity={active ? "0.82" : "0.32"}
              strokeDasharray={active ? "none" : "4 5"}
            />
            <rect x={midX - 18} y={midY - 11} width="36" height="12" rx="6" fill="#ffffff" opacity="0.96" stroke={active ? T.mint300 : T.n200} strokeWidth="0.45" />
            <text x={midX} y={midY - 2.5} textAnchor="middle" fontSize="6.8" fill={active ? T.mint700 : T.n500} fontFamily={T.fontMono} letterSpacing="0.4">
              {relation.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function DrawerSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: `1px solid ${T.n150}`, borderRadius: 12, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${T.n100}`, background: T.n25 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.navy }}>{title}</div>
        {badge && <span style={{ fontSize: 10, color: T.n500, border: `1px solid ${T.n150}`, borderRadius: 999, padding: "2px 7px" }}>{badge}</span>}
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

function InspectDrawer({
  selectedId,
  data,
  onClose,
  onNavigate,
}: {
  selectedId: string;
  data: RealData;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const record = buildInspectRecords(data)[selectedId];
  if (!record) return null;
  const surfaceHref = ROUTES[selectedId];

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        bottom: 16,
        width: 350,
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 12,
        borderRadius: 16,
        background: "rgba(255,255,255,0.97)",
        border: `1px solid ${T.n200}`,
        boxShadow: T.shadowLg,
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusDotColor(record.status), display: "inline-block" }} />
            <span style={{ fontSize: 10.5, fontFamily: T.fontMono, color: T.n500, textTransform: "uppercase", letterSpacing: ".12em" }}>
              {record.kind} · {statusLabelText(record.status)}
            </span>
          </div>
          <div style={{ fontSize: 23, fontWeight: 800, color: T.navy, letterSpacing: "-0.02em" }}>{record.title}</div>
          <div style={{ fontSize: 12.5, color: T.n600, marginTop: 4, lineHeight: 1.55 }}>{record.summary}</div>
        </div>
        <button type="button" onClick={onClose} style={{ border: `1px solid ${T.n200}`, background: "#fff", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: T.n600 }}>
          ×
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[...record.systems].map((item) => (
          <span key={item} style={{ fontSize: 11, color: T.navy, background: T.navy50, border: `1px solid ${T.n200}`, borderRadius: 999, padding: "4px 8px" }}>
            {item}
          </span>
        ))}
      </div>

      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 2 }}>
        <DrawerSection title="Ownership" badge="who owns this">
          <div style={{ fontSize: 12.5, color: T.n700, lineHeight: 1.55 }}>{record.ownership}</div>
        </DrawerSection>

        <DrawerSection title="Dependencies" badge="what it needs">
          <div style={{ display: "grid", gap: 8 }}>
            {record.dependsOn.map((item) => (
              <div key={item} style={{ padding: "9px 10px", borderRadius: 10, background: T.n25, border: `1px solid ${T.n100}`, fontSize: 12.5, color: T.n700 }}>
                {item}
              </div>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection title="Outputs" badge="what it creates">
          <div style={{ display: "grid", gap: 8 }}>
            {record.outputs.map((item) => (
              <div key={item} style={{ padding: "9px 10px", borderRadius: 10, background: T.mint50, border: `1px solid ${T.mint200}`, fontSize: 12.5, color: T.navy }}>
                {item}
              </div>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection title="Failure Impact" badge="what breaks">
          <div style={{ display: "grid", gap: 8 }}>
            {record.breaksWhen.map((item) => (
              <div key={item} style={{ padding: "9px 10px", borderRadius: 10, background: "#fff8f1", border: `1px solid #f5d4aa`, fontSize: 12.5, color: T.n700 }}>
                {item}
              </div>
            ))}
          </div>
        </DrawerSection>

        {record.articles && (
          <DrawerSection title="Articles" badge={`${record.articles.length} browseable`}>
            <div style={{ display: "grid", gap: 10 }}>
              {record.articles.map((article) => (
                <div key={article.title} style={{ border: `1px solid ${T.n100}`, borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{article.title}</div>
                    <span style={{ fontSize: 10.5, color: T.n500 }}>{article.lastUpdated}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, color: T.n500, border: `1px solid ${T.n150}`, borderRadius: 999, padding: "2px 6px" }}>{article.category}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: T.n500 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor(article.status), display: "inline-block" }} />
                      {statusLabelText(article.status)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12.5, color: T.n700, lineHeight: 1.5 }}>{article.summary}</div>
                </div>
              ))}
            </div>
          </DrawerSection>
        )}

        {record.integrations && (
          <DrawerSection title="Integration Map" badge={`${record.integrations.length} live`}>
            <div style={{ display: "grid", gap: 10 }}>
              {record.integrations.map((integration) => (
                <div key={integration.name} style={{ border: `1px solid ${T.n100}`, borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{integration.name}</div>
                    <span style={{ fontSize: 10.5, color: T.n500 }}>{statusLabelText(integration.status)}</span>
                  </div>
                  <div style={{ marginTop: 6, display: "grid", gap: 5 }}>
                    <div style={{ fontSize: 12, color: T.n600 }}><strong style={{ color: T.navy }}>Direction:</strong> {integration.direction}</div>
                    <div style={{ fontSize: 12, color: T.n600 }}><strong style={{ color: T.navy }}>Connects to:</strong> {integration.connectsTo}</div>
                    <div style={{ fontSize: 12, color: T.n600 }}><strong style={{ color: T.navy }}>Depends on:</strong> {integration.dependsOn.join(", ")}</div>
                    <div style={{ fontSize: 12, color: T.n600, lineHeight: 1.5 }}>{integration.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          </DrawerSection>
        )}
      </div>

      {surfaceHref && (
        <button
          type="button"
          onClick={() => onNavigate(surfaceHref)}
          style={{
            border: `1px solid ${T.mint300}`,
            background: T.mint50,
            color: T.navy,
            borderRadius: 10,
            padding: "10px 12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Open full surface
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */
export function McpOfficeScene({
  onNavigate,
  data,
  beacon,
}: {
  onNavigate: (href: string) => void;
  data: RealData;
  beacon: import("@/lib/mcp/beacon-activity").BeaconOperationalSnapshot | null;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [tick, setTick] = useState(0);
  const [camera, setCamera] = useState({
    yaw: DEFAULT_CAMERA.yaw,
    panX: DEFAULT_CAMERA.panX,
    panY: DEFAULT_CAMERA.panY,
    zoom: DEFAULT_CAMERA.zoom,
    preset: DEFAULT_CAMERA.id,
  });

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const loop = (t: number) => { setTick(t - start); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  PROJECTION.yawDeg = camera.yaw;
  const beaconActivity = getBeaconOfficeActivity(beacon);

  const corners = [iso(0, 0), iso(GRID_W, 0), iso(0, GRID_D), iso(GRID_W, GRID_D)];
  const minX = Math.min(...corners.map((c) => c.x)) - 40;
  const maxX = Math.max(...corners.map((c) => c.x)) + 40;
  const minY = Math.min(...corners.map((c) => c.y)) - 90;
  const maxY = Math.max(...corners.map((c) => c.y)) + 80;
  const vbW = maxX - minX, vbH = maxY - minY;
  const centerX = minX + vbW / 2;
  const centerY = minY + vbH / 2;
  const sceneTransform = [
    `translate(${camera.panX} ${camera.panY})`,
    `translate(${centerX} ${centerY})`,
    `scale(${camera.zoom})`,
    `translate(${-centerX} ${-centerY})`,
  ].join(" ");

  const inspect = (id: string) => {
    setSelected(id);
    setHover(null);
  };
  const onEnter = (id: string) => setHover(id);
  const onLeave = () => setHover(null);
  const setPreset = (id: string) => {
    const preset = CAMERA_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setCamera({ yaw: preset.yaw, panX: preset.panX, panY: preset.panY, zoom: preset.zoom, preset: preset.id });
  };
  const nudgePan = (dx: number, dy: number) => {
    setCamera((current) => ({
      ...current,
      panX: clamp(current.panX + dx, -80, 80),
      panY: clamp(current.panY + dy, -80, 80),
      preset: "custom",
    }));
  };
  const nudgeZoom = (delta: number) => {
    setCamera((current) => ({
      ...current,
      zoom: clamp(Number((current.zoom + delta).toFixed(2)), 0.8, 1.65),
      preset: "custom",
    }));
  };
  const nudgeYaw = (delta: number) => {
    setCamera((current) => ({
      ...current,
      yaw: normalizeAngle(current.yaw + delta),
      preset: "custom",
    }));
  };

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${T.n200}`, boxShadow: T.shadowLg, background: "#fff" }}>
      {/* Topbar */}
      <div style={{ padding: "12px 18px", background: T.navy, color: "#fff", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${T.navy600}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", color: T.mint200 }}>
            MCP · OFFICE · FLOOR 01
          </span>
          <span style={{ fontSize: 12.5, color: T.navy200, marginLeft: 6, fontWeight: 500 }}>
            1 specialist on the floor · 2 staff on duty
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 11, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {["live", "active", "in-development", "planned"].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor(s), display: "inline-block" }} />
                <span style={{ color: T.navy200 }}>{statusLabelText(s)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 560 }}>
            {CAMERA_PRESETS.map((preset) => (
              <CameraButton key={preset.id} active={camera.preset === preset.id} onClick={() => setPreset(preset.id)}>
                {preset.label}
              </CameraButton>
            ))}
            <CameraButton onClick={() => nudgeZoom(0.08)}>+</CameraButton>
            <CameraButton onClick={() => nudgeZoom(-0.08)}>-</CameraButton>
            <CameraButton onClick={() => nudgeYaw(-4)}>←</CameraButton>
            <CameraButton onClick={() => nudgeYaw(4)}>→</CameraButton>
            <CameraButton onClick={() => nudgePan(10, 0)}>◁</CameraButton>
            <CameraButton onClick={() => nudgePan(-10, 0)}>▷</CameraButton>
            <CameraButton active={inspectMode} onClick={() => setInspectMode((current) => !current)}>
              Inspect
            </CameraButton>
            {selected && <CameraButton onClick={() => setSelected(null)}>Clear</CameraButton>}
            <CameraButton onClick={() => setPreset(DEFAULT_CAMERA.id)}>Reset</CameraButton>
          </div>
        </div>
      </div>

      {/* Scene */}
      <div
        style={{ position: "relative", background: "linear-gradient(180deg, #f5f4ee 0%, #edeae2 100%)" }}
        onWheel={(event) => {
          event.preventDefault();
          nudgeZoom(event.deltaY > 0 ? -0.06 : 0.06);
        }}
      >
        <svg
          viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
          style={{ width: "100%", height: "clamp(540px, 68vw, 860px)", display: "block", fontFamily: T.fontSans }}
        >
          <IsoDefs />
          <ellipse cx={iso(GRID_W / 2, GRID_D / 2).x} cy={iso(GRID_W / 2, GRID_D / 2).y + 26} rx={vbW * 0.43} ry={vbH * 0.28} fill="#2a2b2c" opacity="0.05" />
          <g transform={sceneTransform}>

            {/* Floor slabs */}
            <RoomFloor room={ROOMS.knowledge}    color="#f3e8d0" pattern="wood"     hover={hover === "knowledge"}    active={selected === "knowledge" || beaconActivity.surface === "knowledge"} onEnter={() => onEnter("knowledge")}    onLeave={onLeave} onClick={() => inspect("knowledge")} />
            <RoomFloor room={ROOMS.admin}        color="#ece7dc" pattern="carpet" hover={hover === "admin"} active={selected === "admin"} onEnter={() => onEnter("admin")} onLeave={onLeave} onClick={() => inspect("admin")} />
            <RoomFloor room={ROOMS.ops}          color="#e3ecee" pattern="tile"     hover={hover === "ops"}          active={selected === "ops" || beaconActivity.surface === "ops"} onEnter={() => onEnter("ops")}          onLeave={onLeave} onClick={() => inspect("ops")} />
            <CorridorFloor x1={0} y1={6} x2={GRID_W} y2={7} />
            <RoomFloor room={ROOMS.open}         color="#f0ede5" pattern="oakstrip" />
            <CorridorFloor x1={0} y1={16} x2={GRID_W} y2={18} />
            <RoomFloor room={ROOMS.memory}       color="#e6e6e1" pattern="tile"     hover={hover === "memory"}       active={selected === "memory" || beaconActivity.surface === "memory"} onEnter={() => onEnter("memory")}       onLeave={onLeave} onClick={() => inspect("memory")} />
            <RoomFloor room={ROOMS.integrations} color="#e8ebe3" pattern="tile"     hover={hover === "integrations"} active={selected === "integrations" || beaconActivity.surface === "integrations"} onEnter={() => onEnter("integrations")} onLeave={onLeave} onClick={() => inspect("integrations")} />

            {/* Beacon rug */}
            <polygon points={tilePoints(14.2, 8.7, 22.2, 13.4)} fill={T.navy50} stroke={T.navy200} strokeWidth="0.7" />

            {/* Walls */}
            <BuildingOuterWallsBack />
            <PartitionWall x1={9}  y1={0} x2={9}  y2={6} h={WALL_H} />
            <PartitionWall x1={15} y1={0} x2={15} y2={6} h={WALL_H} />
            <BackRoomSouthWalls />
            <WindowWallEast x1={GRID_W} y1={7} y2={16} />

            {/* Room interiors */}
            <KnowledgeInterior tick={tick} />
            <AdminInterior tick={tick} />
            <OpsInterior tick={tick} />

            {/* Open office */}
            <OpenOfficeDecor tick={tick} />

            {/* Desks */}
            {DESKS.slice().sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy)).map((d) => (
              <Desk key={d.id} desk={d} tick={tick}
                hover={hover === d.id} active={selected === d.id} showLabel={d.id === "beacon" || hover === d.id || selected === d.id}
                beaconAway={d.id === "beacon" && !beaconActivity.atDesk}
                onEnter={() => onEnter(d.id)} onLeave={onLeave} onClick={() => inspect(d.id)} />
            ))}

            <BeaconActivityAgent activity={beaconActivity} tick={tick} />

            {/* Front rooms */}
            <FrontRoomsWallsAndFurniture tick={tick} />

            {(inspectMode || selected) && <InspectOverlay selectedId={selected} />}

            {/* Door signage */}
            <DoorSignage room={ROOMS.knowledge}    zoneId="knowledge"    hover={hover === "knowledge"} />
            <DoorSignage room={ROOMS.admin}        zoneId="admin"        hover={hover === "admin"}     admin />
            <DoorSignage room={ROOMS.ops}          zoneId="ops"          hover={hover === "ops"} />
            <DoorSignage room={ROOMS.memory}       zoneId="memory"       hover={hover === "memory"}       front />
            <DoorSignage room={ROOMS.integrations} zoneId="integrations" hover={hover === "integrations"} front />
          </g>
        </svg>

        {hover && !selected && <HoverCard id={hover} onNavigate={onNavigate} />}
        {selected && <InspectDrawer selectedId={selected} data={data} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
        <EventTicker tick={tick} beacon={beacon} />
      </div>

      <OnTheFloorRow onNavigate={onNavigate} tick={tick} beacon={beacon} />
    </div>
  );
}
