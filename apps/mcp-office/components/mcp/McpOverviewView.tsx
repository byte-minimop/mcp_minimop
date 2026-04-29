"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PAGE_PAD,
  PageHeader,
  SectionLabel,
  StatusPill,
  MetricTile,
  ContentCard,
  ListRow,
  MonoId,
  MonoTime,
} from "@/components/mcp/McpPrimitives";
import type { REAL } from "@/lib/mcp/real-data";
import type { BeaconOperationalSnapshot, RecentEvent } from "@/lib/mcp/beacon-activity";

type RealData = typeof REAL;

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(11, 16) + " UTC";
}

function shortRunId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function describeEvent(e: RecentEvent): React.ReactNode {
  if (e.event_type === "status_changed") {
    return (
      <>
        Status: <span className="text-[#8b9098]">{e.from_status ?? ""}</span>
        {" → "}
        <strong className="text-[#003d5b]">{e.to_status ?? ""}</strong>
      </>
    );
  }
  return (
    <>
      Blueprint saved <span className="text-[#8b9098]">v{e.version_number ?? "?"} · {e.to_status ?? "draft"}</span>
    </>
  );
}

const MCP_CONSUME = (data: RealData, beacon: BeaconOperationalSnapshot | null) => [
  { id: "knowledge",    verb: "reads",       items: [`${data.dataFiles.serviceTaxonomyOfferings} service offerings`, `${data.dataFiles.peopleRoles.toLocaleString()} people roles`, `${data.capabilities.total} capabilities`, "naming convention · readiness"] },
  { id: "integrations", verb: "connects",    items: [`${data.accounts.total} MCC accounts`, `${data.integrations.length} active connectors`, "all accounts available for push"] },
  { id: "ops",          verb: "governed by", items: [`${data.rules.total} brief rules (${data.rules.hard} hard)`, "readiness gating", "publish requires auth + role"] },
  { id: "memory",       verb: "stores",      items: beacon
    ? [`${beacon.totals.runs.toLocaleString()} campaign runs`, `${beacon.totals.events.toLocaleString()} status events`, `${beacon.totals.pushes.toLocaleString()} push audits`]
    : ["beacon.sqlite unreachable", "(restart Beacon)", ""],
  },
] as const;

const INFRA_NAMES: Record<string, string> = { knowledge: "Knowledge", integrations: "Integrations", ops: "Ops", memory: "Memory" };

/* ── Component ────────────────────────────────────────────────────────── */

export function McpOverviewView({
  data,
  beacon,
}: {
  data: RealData;
  beacon: BeaconOperationalSnapshot | null;
}) {
  // Live refresh: this view shows live Beacon counts/events. The page is
  // force-dynamic on the server, so router.refresh() re-reads SQLite and
  // re-renders without manual reload. Mirrors the polling cadence used on
  // /mcp/beacon/runs so all MCP surfaces stay in lockstep with Beacon.
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined" || !document.hidden) router.refresh();
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  // Coworker roster — Beacon's run count is live; the rest are inactive
  // workers that don't have a SQLite source to draw from yet.
  const coworkers = [
    {
      id: "beacon",
      name: "Beacon",
      status: "live" as const,
      domain: "Google Ads",
      role: "Campaign specialist",
      runs: beacon ? beacon.totals.runs : 0,
    },
    { id: "tagpilot", name: "TagPilot", status: "in-development" as const, domain: "GTM + GA4",     role: "Tag governance", runs: 0 },
    { id: "lumen",    name: "Lumen",    status: "planned" as const,        domain: "SEO · Insights", role: "Reporting",      runs: 0 },
  ];

  const recentEvents = beacon?.recentEvents ?? [];
  const memoryDetail = beacon
    ? `${beacon.totals.events.toLocaleString()} events · ${beacon.totals.pushes.toLocaleString()} pushes`
    : "beacon.sqlite unreachable";
  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Workspace"
        title="Overview"
        subtitle="Concentrix marketing operating environment — one platform, every coworker."
      />

      {/* ── Hero strip ─────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        {/* Product statement */}
        <div
          className="relative overflow-hidden rounded-[14px] p-[22px]"
          style={{ background: "linear-gradient(135deg, #003d5b 0%, #003049 60%, #007380 100%)" }}
        >
          <div
            className="pointer-events-none absolute -right-[60px] -top-[60px] h-[260px] w-[260px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,226,204,0.27) 0%, transparent 70%)" }}
          />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#bff6ed]">
              CONCENTRIX · MARKETING MCP
            </div>
            <div className="mt-2 max-w-[560px] text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
              One operating environment for every marketing coworker.
            </div>
            <div className="mt-2.5 max-w-[560px] text-[13.5px] leading-[1.6] text-[#e8eef2]">
              Shared knowledge, memory, integrations and governance — so every specialist plugs into the same foundation.
            </div>
            <div className="mt-[18px] flex flex-wrap gap-2.5">
              <Link href="/mcp/office" className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#25e2cc] px-4 py-2 text-[13px] font-bold text-[#003d5b] transition hover:bg-[#57ead6]">
                Enter the office →
              </Link>
              <Link href="/mcp/architecture" className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/20 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10" style={{ background: "rgba(255,255,255,.08)" }}>
                System map
              </Link>
            </div>
          </div>
        </div>

        {/* 2×2 metric tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <MetricTile label="Workers live"    value="1"                       detail="Beacon · Google Ads"        accent />
          <MetricTile label="Infrastructure"  value="4"                       detail="All systems active" />
          <MetricTile label="Connectors"      value={data.integrations.length} detail="3 providers · 6 connections" />
          <MetricTile label="Runs in memory"  value={beacon ? beacon.totals.runs.toLocaleString() : "—"} detail={memoryDetail} badge="beacon.sqlite" />
        </div>
      </div>

      {/* ── System inventory ────────────────────────────────────────── */}
      <div className="mt-5">
        <SectionLabel badge="from codebase">System inventory</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          <MetricTile label="Families"          value={data.families.total}                         detail={`${data.families.publishReady} publish-ready`} />
          <MetricTile label="Service offerings" value={data.dataFiles.serviceTaxonomyOfferings}     detail={`${data.dataFiles.serviceTaxonomyCategories} cats · ${data.dataFiles.serviceTaxonomyGroups} groups`} />
          <MetricTile label="People roles"      value={data.dataFiles.peopleRoles.toLocaleString()} detail={`${data.dataFiles.peopleRoleIndustries} industries`} />
          <MetricTile label="Brief rules"       value={data.rules.total}                            detail={`${data.rules.hard} hard · ${data.rules.soft} soft`} />
          <MetricTile label="Capabilities"      value={data.capabilities.total}                     detail={`${data.capabilities.supported} supported`} />
          <MetricTile label="Sitelinks"         value={data.sitelinks.total}                        detail="approved catalog" />
        </div>
      </div>

      {/* ── Coworkers + recent activity ─────────────────────────────── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionLabel>Coworkers</SectionLabel>
          <div className="flex flex-col gap-2">
            {coworkers.map((cw) => {
              const avatarStyle =
                cw.status === "live"           ? { background: "#25e2cc", color: "#003d5b", boxShadow: "0 0 0 4px #dff9f4" }
                : cw.status === "in-development" ? { background: "#fff1de", color: "#8c4400", border: "1px solid #fcd4a3" }
                :                                  { background: "#f2f2f2", color: "#6b7079", border: "1px solid #cfd2d6" };
              return (
                <Link key={cw.id} href={`/mcp/${cw.id}`}
                  className="flex items-center gap-3.5 rounded-[12px] border border-[#ebecee] bg-white p-3.5 transition hover:border-[#dfe1e4] hover:bg-[#f6f7f8]"
                >
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[14px] font-extrabold" style={avatarStyle}>
                    {cw.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-bold tracking-[-0.01em] text-[#003d5b]">{cw.name}</span>
                      <StatusPill status={cw.status} />
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#8b9098]">{cw.domain} · {cw.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[14px] font-bold text-[#003d5b]">{cw.runs}</div>
                    <div className="text-[10.5px] text-[#8b9098]">runs</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel badge="beacon.sqlite">Recent activity</SectionLabel>
          <ContentCard>
            {recentEvents.length === 0 && (
              <ListRow last>
                <div className="text-[12.5px] text-[#8b9098]">
                  {beacon ? "No recent activity in Beacon yet." : "beacon.sqlite unreachable."}
                </div>
              </ListRow>
            )}
            {recentEvents.map((e, i) => (
              <ListRow key={e.id} last={i === recentEvents.length - 1}>
                <MonoTime>{formatTs(e.created_at)}</MonoTime>
                <Link href={`/mcp/beacon/runs/${e.run_id}`} className="hover:underline">
                  <MonoId>{shortRunId(e.run_id)}</MonoId>
                </Link>
                <div className="min-w-0 flex-1 text-[12.5px] text-[#4e525a]">{describeEvent(e)}</div>
              </ListRow>
            ))}
          </ContentCard>
          <div className="mt-2 text-[12px]">
            <Link href="/mcp/beacon" className="font-semibold text-[#007380] hover:text-[#003d5b]">
              Open Beacon activity log →
            </Link>
          </div>
        </div>
      </div>

      {/* ── How Beacon uses MCP ─────────────────────────────────────── */}
      <div className="mt-5">
        <SectionLabel badge="live path">How Beacon uses MCP</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {MCP_CONSUME(data, beacon).map((c) => (
            <Link key={c.id} href={`/mcp/${c.id}`}
              className="rounded-[12px] border border-[#ebecee] bg-white p-3.5 transition hover:border-[#25e2cc]/40 hover:bg-[#f6f7f8]"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="text-[14px] font-bold tracking-[-0.01em] text-[#003d5b]">{INFRA_NAMES[c.id]}</div>
                <span className="rounded-[4px] border border-[#bff6ed] bg-[#dff9f4] px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#0a8c7e]">
                  {c.verb}
                </span>
              </div>
              {c.items.map((it) => (
                <div key={it} className="text-[11.5px] leading-[1.6] text-[#6b7079]">{it}</div>
              ))}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
