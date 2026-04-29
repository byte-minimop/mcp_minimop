"use client";

import {
  PAGE_PAD,
  PageHeader,
  StatusPill,
} from "@/components/mcp/McpPrimitives";

/* ── Design tokens (inline for SVG — CSS vars don't reach SVG text) ── */
const T = {
  navy: "#003d5b", navy800: "#003049", navy200: "#d4dfe6", navy50: "#f3f6f9",
  mint: "#25e2cc", mint700: "#19bdab", mint200: "#bff6ed", mint100: "#dff9f4",
  teal: "#007380", teal300: "#7bb8c2",
  success: "#168f6b", orange: "#ff8400", warningBg: "#fff1de",
  n200: "#cfd2d6", n300: "#b4b8be", n400: "#8b9098", n500: "#6b7079", n700: "#3a3d43",
  fontDisplay: "Nunito, system-ui, sans-serif",
  fontSans: "Inter, system-ui, sans-serif",
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
};

/* ── Data ────────────────────────────────────────────────────────────── */
const WORKERS = [
  { id: "beacon",   name: "Beacon",   sub: "Google Ads", status: "live",           x: 100 },
  { id: "tagpilot", name: "TagPilot", sub: "GTM + GA4",  status: "in-development", x: 270 },
  { id: "lumen",    name: "Lumen",    sub: "SEO",        status: "planned",        x: 440 },
  { id: "linkedin", name: "LinkedIn", sub: "Specialist", status: "future",         x: 610 },
  { id: "meta",     name: "Meta",     sub: "Specialist", status: "future",         x: 780 },
];

const FOUNDATION = [
  { id: "knowledge",    name: "Knowledge",    x: 100 },
  { id: "memory",       name: "Memory",       x: 320 },
  { id: "integrations", name: "Integrations", x: 540 },
  { id: "ops",          name: "Ops",          x: 760 },
];

const EXTERNALS: Array<{ name: string; x: number; future?: boolean }> = [
  { name: "Google Ads API",    x: 40  },
  { name: "Azure Blob",        x: 170 },
  { name: "Azure OpenAI",      x: 300 },
  { name: "Azure AD",          x: 430 },
  { name: "Asana",             x: 560 },
  { name: "Google Dev Docs",   x: 690 },
];

const PRINCIPLES = [
  { label: "Shared foundation",  body: "Knowledge, Memory, Integrations, and Ops are shared. No specialist rebuilds what the platform already provides." },
  { label: "Specialist workers", body: "Each worker owns a domain. A new specialist connects to the same foundation — it doesn't need its own infrastructure." },
  { label: "Platform connectors", body: "External systems are accessed through Integrations. A new connector extends reach to every worker, not just one." },
  { label: "Coordination",       body: "The Coordinator plans which specialists act and in what order. The Secretary helps people navigate the system." },
];

const ROWS = { orch: 40, workers: 160, foundation: 320, external: 480 };
const W = 1000, H = 580;

/* ── ArchNode SVG component ──────────────────────────────────────────── */
type NodeKind = "worker" | "orch" | "foundation" | "external";

function ArchNode({
  x, y, w, h, title, sub, kind = "worker", status, dashed,
}: {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string;
  kind?: NodeKind; status?: string; dashed?: boolean;
}) {
  const statusFill: Record<string, string> = {
    live: T.success, "in-development": T.orange, planned: T.n300, future: T.n200,
  };
  const styles: Record<NodeKind, { bg: string; border: string; text: string }> = {
    worker: {
      bg:     status === "live" ? T.mint100 : status === "in-development" ? T.warningBg : "#fff",
      border: status === "live" ? T.mint700 : status === "in-development" ? "#f5b872" : T.n200,
      text:   status === "live" ? T.navy : T.n700,
    },
    orch:       { bg: T.navy50, border: T.navy200, text: T.navy },
    foundation: { bg: T.navy,   border: T.navy800, text: "#fff" },
    external:   { bg: "#fff",   border: T.n200,    text: T.n700 },
  };
  const s = styles[kind];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8"
        fill={s.bg} stroke={s.border} strokeWidth="1.2"
        strokeDasharray={dashed ? "4 3" : undefined} />
      {kind === "worker" && status && (
        <circle cx={x + 10} cy={y + 10} r="3.5"
          fill={statusFill[status] ?? T.n300} />
      )}
      <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 4)}
        textAnchor="middle"
        fontFamily={T.fontDisplay}
        fontWeight="700" fontSize="13" fill={s.text}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 12}
          textAnchor="middle"
          fontFamily={T.fontSans}
          fontSize="10"
          fill={kind === "foundation" ? T.mint200 : T.n500}>
          {sub}
        </text>
      )}
    </g>
  );
}

/* ── SVG Architecture Map ────────────────────────────────────────────── */
function ArchitectureMap() {
  const beaconX = WORKERS[0].x + 60;
  const beaconY = ROWS.workers + 40;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", fontFamily: T.fontSans }}>
      <defs>
        <marker id="arch-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M 0 0 L 8 5 L 0 10 z" fill={T.mint700} />
        </marker>
      </defs>

      {/* Row labels */}
      {([
        ["ORCHESTRATION (FUTURE)", 14],
        ["SPECIALIST WORKERS", ROWS.workers - 14],
        ["MCP FOUNDATION", ROWS.foundation - 14],
        ["EXTERNAL SYSTEMS", ROWS.external - 14],
      ] as [string, number][]).map(([label, y]) => (
        <text key={label} x="12" y={y} fontSize="9" fontFamily={T.fontMono}
          fill={T.n400} letterSpacing="1.5">
          {label}
        </text>
      ))}

      {/* Orchestration nodes (future) */}
      <ArchNode x={40}  y={ROWS.orch} w={180} h={42} kind="orch" dashed title="Secretary"   sub="System navigation" />
      <ArchNode x={780} y={ROWS.orch} w={180} h={42} kind="orch" dashed title="Coordinator" sub="Multi-worker planning" />

      {/* Beacon → Foundation edges (live, bezier) */}
      {FOUNDATION.map((f) => {
        const px = f.x + 55;
        const py = ROWS.foundation;
        return (
          <path key={f.id}
            d={`M ${beaconX} ${beaconY + 42} C ${beaconX} ${(beaconY + py) / 2}, ${px} ${(beaconY + py) / 2}, ${px} ${py}`}
            stroke={T.mint700} strokeWidth="1.2" fill="none"
            markerEnd="url(#arch-arrow)" opacity="0.75" />
        );
      })}

      {/* Future worker → Foundation (dashed) */}
      {WORKERS.slice(1, 3).flatMap((w) =>
        FOUNDATION.slice(0, 3).map((f) => (
          <path key={w.id + f.id}
            d={`M ${w.x + 60} ${ROWS.workers + 42} L ${f.x + 55} ${ROWS.foundation}`}
            stroke={T.n300} strokeWidth="0.8" fill="none" strokeDasharray="3 3" opacity="0.7" />
        ))
      )}

      {/* Foundation → External edges */}
      {EXTERNALS.slice(0, 6).map((e) => (
        <path key={e.name}
          d={`M ${FOUNDATION[2].x + 55} ${ROWS.foundation + 42} L ${e.x + 55} ${ROWS.external}`}
          stroke={T.teal300} strokeWidth="1" fill="none" opacity="0.6" />
      ))}

      {/* Worker nodes */}
      {WORKERS.map((w) => (
        <ArchNode key={w.id} x={w.x} y={ROWS.workers} w={120} h={42}
          title={w.name} sub={w.sub} status={w.status}
          dashed={w.status === "future" || w.status === "planned"} />
      ))}

      {/* Foundation nodes */}
      {FOUNDATION.map((f) => (
        <ArchNode key={f.id} x={f.x} y={ROWS.foundation} w={110} h={42}
          title={f.name} kind="foundation" />
      ))}

      {/* External nodes */}
      {EXTERNALS.map((e) => (
        <ArchNode key={e.name} x={e.x} y={ROWS.external} w={110} h={34}
          title={e.name} kind="external" dashed={e.future} />
      ))}

      {/* Shared-foundation rail */}
      <rect x="30" y={ROWS.foundation - 10} width={W - 60} height="62" rx="12"
        fill="none" stroke={T.navy200} strokeDasharray="2 4" />
      <text x={W - 40} y={ROWS.foundation - 14} fontSize="9" fontFamily={T.fontMono}
        fill={T.navy} letterSpacing="1" textAnchor="end">SHARED</text>
    </svg>
  );
}

/* ── Page component ──────────────────────────────────────────────────── */
export function McpArchitectureView() {
  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Workspace"
        title="Architecture"
        subtitle="How every piece fits the foundation."
      />

      {/* Description + pills */}
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-[780px] text-[13px] leading-[1.65] text-[#3a3d43]">
          The MCP is a common foundation. Every specialist, connector, and coordination role has a place in it.
          Specialists own a domain but share the same infrastructure: what the MCP knows (Knowledge), remembers
          (Memory), connects to (Integrations), and governs (Ops).
        </p>
        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          <StatusPill status="live" />
          <StatusPill status="in-development" />
          <StatusPill status="planned" />
        </div>
      </div>

      {/* SVG map card */}
      <div className="mt-4 overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-[#f9fbfa] p-5 shadow-[0_1px_2px_rgba(0,61,91,.06),0_1px_3px_rgba(0,61,91,.04)]">
        <ArchitectureMap />
      </div>

      {/* Design principles */}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {PRINCIPLES.map((p) => (
          <div key={p.label} className="rounded-[12px] border border-[#dfe1e4] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,61,91,.06),0_1px_3px_rgba(0,61,91,.04)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b9098]">{p.label}</div>
            <p className="mt-1.5 text-[13px] leading-6 text-[#4e525a]">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
