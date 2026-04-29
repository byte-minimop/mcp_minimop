"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { McpOfficeScene } from "@/components/mcp/McpOfficeScene";
import { officeNodes, type McpOfficeNode } from "@/lib/mcp/office-data";
import type { BeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";
import {
  PAGE_PAD,
  PageHeader,
  SectionLabel,
  StatusPill,
  StatusDot,
  MetricTile,
} from "@/components/mcp/McpPrimitives";
import type { REAL } from "@/lib/mcp/real-data";

/* ── Status legend items ──────────────────────────────────────────────── */

const STATUS_LEGEND: McpOfficeNode["status"][] = ["live", "active", "in-development", "planned"];

const STATUS_DOT_GLOW: Record<McpOfficeNode["status"], string> = {
  live:             "bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.55)]",
  active:           "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.4)]",
  "in-development": "bg-amber-200 shadow-[0_0_12px_rgba(253,230,138,0.3)]",
  planned:          "bg-white/30",
};

function statusLabelText(s: McpOfficeNode["status"]) {
  const m: Record<McpOfficeNode["status"], string> = {
    live: "Live", active: "Active", "in-development": "In development", planned: "Planned",
  };
  return m[s] ?? s;
}

/* ── Static data ──────────────────────────────────────────────────────── */

const infraIds = new Set(["knowledge", "memory", "integrations", "ops"]);

const INFRA_DESCRIPTIONS: Record<string, string> = {
  knowledge:    "Service taxonomy, people roles, campaign naming, readiness models, MCC context, capability registry.",
  memory:       "Operational history: run data, status events, push audits. Currently backed by Beacon\u2019s SQLite.",
  integrations: "6 active connectors: Google Ads, Azure Blob, Azure OpenAI, Azure AD, Asana, Google Docs API.",
  ops:          "Brief validation rules, readiness gates, publish permissions, human review enforcement.",
};

const COWORKERS = [
  { id: "beacon",   name: "Beacon",   href: "/mcp/beacon",   status: "live"           as McpOfficeNode["status"], domain: "Google Ads",  role: "Campaign specialist" },
  { id: "tagpilot", name: "TagPilot", href: "/mcp/tagpilot", status: "in-development" as McpOfficeNode["status"], domain: "Measurement", role: "Tag governance" },
  { id: "lumen",    name: "Lumen",    href: "/mcp/lumen",    status: "planned"        as McpOfficeNode["status"], domain: "Insights",    role: "Reporting" },
];

/* ── Component ────────────────────────────────────────────────────────── */

export function McpOfficeView({
  data,
  beacon,
}: {
  data: typeof REAL;
  beacon: BeaconOperationalSnapshot | null;
}) {
  const router = useRouter();
  const handleNavigate = useCallback((href: string) => { router.push(href); }, [router]);
  const infraNodes = officeNodes.filter((n) => infraIds.has(n.id));

  // Live refresh: keep this in sync with Beacon activity at the same cadence
  // as /mcp/beacon/runs. Both surfaces re-poll every 5s, gated on tab focus.
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined" || !document.hidden) router.refresh();
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  const memoryItems = beacon
    ? [
        `${beacon.totals.runs.toLocaleString()} campaign runs`,
        `${beacon.totals.events.toLocaleString()} status events`,
        `${beacon.totals.pushes.toLocaleString()} push audits`,
      ]
    : ["beacon.sqlite unreachable", "(restart Beacon)", ""];

  const beaconConsumption = [
    { system: "Knowledge",    href: "/mcp/knowledge",    verb: "reads",    items: [`${data.dataFiles.serviceTaxonomyOfferings} service offerings`, `${data.dataFiles.peopleRoles.toLocaleString()} people roles`, "naming convention", "readiness model", `${data.capabilities.total} capabilities`] },
    { system: "Integrations", href: "/mcp/integrations", verb: "connects", items: [`${data.accounts.total} MCC accounts`, `${data.integrations.length} active connectors`, "all accounts available for push"] },
    { system: "Ops",          href: "/mcp/ops",          verb: "enforces", items: [`${data.rules.total} brief rules`, "readiness gating", "publish requires auth + role"] },
    { system: "Memory",       href: "/mcp/memory",       verb: "stores",   items: memoryItems },
  ];

  const metrics = [
    { label: "Families",          value: String(data.families.total),                        detail: `${data.families.publishReady} publish-ready` },
    { label: "Service offerings", value: String(data.dataFiles.serviceTaxonomyOfferings),    detail: `${data.dataFiles.serviceTaxonomyCategories} cats · ${data.dataFiles.serviceTaxonomyGroups} groups` },
    { label: "People roles",      value: data.dataFiles.peopleRoles.toLocaleString(),         detail: `${data.dataFiles.peopleRoleIndustries} industries` },
    { label: "Rules",             value: String(data.rules.total),                           detail: `${data.rules.hard} hard · ${data.rules.soft} soft` },
    { label: "Capabilities",      value: String(data.capabilities.total),                    detail: `${data.capabilities.supported} supported` },
    { label: "Sitelinks",         value: String(data.sitelinks.total),                       detail: "approved catalog" },
  ];

  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Workspace"
        title="Office"
        subtitle="The MCP floor — live workers, active infra, your operating environment."
        right={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {STATUS_LEGEND.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`h-[7px] w-[7px] rounded-full ${STATUS_DOT_GLOW[s]}`} />
                <span className="text-[11px] text-[#8b9098]">{statusLabelText(s)}</span>
              </div>
            ))}
            <Link href="/mcp/architecture" className="rounded-[6px] border border-[#c9b8db] bg-[#f3eef8] px-2.5 py-1 text-[11px] font-semibold text-[#6a4c93] transition hover:bg-[#e8ddf3]">
              Architecture →
            </Link>
          </div>
        }
      />

      {/* ── Office scene ───────────────────────────────────────────── */}
      <div className="mt-4 overflow-hidden rounded-[16px] border border-[#b1beb8] bg-[#4e4a45] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:rounded-[20px]">
        <McpOfficeScene onNavigate={handleNavigate} data={data} beacon={beacon} />
      </div>

      {/* ── Operational dashboard ──────────────────────────────────── */}
      <div className="mt-3 rounded-[16px] border border-[#ebecee] bg-white p-3 sm:p-4">

        <SectionLabel>Coworkers</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-3">
          {COWORKERS.map((cw) => (
            <Link key={cw.id} href={cw.href}
              className="rounded-[12px] border border-[#ebecee] bg-[#f6f7f8] px-4 py-3 transition hover:border-[#dfe1e4] hover:bg-white"
            >
              <div className="flex items-center gap-2">
                <StatusDot status={cw.status} />
                <span className="text-[13px] font-semibold text-[#003d5b]">{cw.name}</span>
                <span className="ml-auto text-[11px] text-[#8b9098]">{statusLabelText(cw.status)}</span>
              </div>
              <div className="mt-1.5 text-[12px] leading-[1.5] text-[#6b7079]">{cw.domain} · {cw.role}</div>
            </Link>
          ))}
        </div>

        <SectionLabel className="mb-2.5 mt-4">Beacon ← MCP infrastructure</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {beaconConsumption.map((c) => (
            <Link key={c.system} href={c.href}
              className="rounded-[10px] border border-[#ebecee] bg-[#f6f7f8] px-3 py-2.5 transition hover:border-[#dfe1e4] hover:bg-white"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#003d5b]">{c.system}</span>
                <span className="rounded-[3px] border border-[#bff6ed] bg-[#dff9f4] px-1.5 py-0.5 text-[10px] font-medium text-[#0a8c7e]">{c.verb}</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {c.items.map((item) => <div key={item} className="text-[11px] leading-4 text-[#6b7079]">{item}</div>)}
              </div>
            </Link>
          ))}
        </div>

        <SectionLabel badge="from codebase" className="mb-2.5 mt-4">System inventory</SectionLabel>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {metrics.map((m) => (
            <MetricTile key={m.label} label={m.label} value={m.value} detail={m.detail} />
          ))}
        </div>
      </div>

      {/* ── Infrastructure cards ───────────────────────────────────── */}
      <div className="mt-3">
        <SectionLabel>Infrastructure</SectionLabel>
        <div className="rounded-[16px] border border-[#ebecee] bg-white p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {infraNodes.map((node) => (
              <Link key={node.id} href={node.href}
                className="rounded-[12px] border border-[#ebecee] bg-[#f6f7f8] px-4 py-3 transition hover:border-[#dfe1e4] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-[#003d5b]">{node.shortLabel}</span>
                  <StatusDot status={node.status} />
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.5] text-[#6b7079]">
                  {INFRA_DESCRIPTIONS[node.id] ?? "MCP system"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
