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
} from "@/components/mcp/McpPrimitives";
import type { REAL } from "@/lib/mcp/real-data";
import type { BeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";

type RealData = typeof REAL;

const INFRA = [
  { id: "knowledge",    tagline: "Canonical source of truth",    description: "Service taxonomy, people roles, campaign naming, readiness models, MCC context, capability registry." },
  { id: "memory",       tagline: "Operational history",          description: "Run data, status events, push audits. Currently backed by Beacon\u2019s SQLite." },
  { id: "integrations", tagline: "External system connectors",   description: "6 active connectors: Google Ads, Azure Blob, Azure OpenAI, Azure AD, Asana, Google Docs." },
  { id: "ops",          tagline: "Controls and governance",      description: "Brief validation rules, readiness gates, publish permissions, human review enforcement." },
];

function infraName(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function McpCoworkersView({
  data,
  beacon,
}: {
  data: RealData;
  beacon: BeaconOperationalSnapshot | null;
}) {
  // Same 5s polling cadence as the rest of the MCP Beacon-aware surfaces so
  // a freshly-saved run in Beacon shows up here without manual reload.
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined" || !document.hidden) router.refresh();
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  // Beacon's run count is now live; the other coworkers are pre-launch and
  // have no operational backing store, so they correctly read zero.
  const allCoworkers = [
    { id: "beacon",   name: "Beacon",       status: "live"            as const, domain: "Google Ads",    role: "Campaign specialist", runs: beacon ? beacon.totals.runs : 0, since: "March 2026" },
    { id: "tagpilot", name: "TagPilot",     status: "in-development"  as const, domain: "GTM + GA4",     role: "Tag governance",      runs: 0, since: "—" },
    { id: "lumen",    name: "Lumen",        status: "planned"         as const, domain: "SEO · Insights", role: "Reporting",          runs: 0, since: "—" },
    { id: "linkedin", name: "LinkedIn Ads", status: "future"          as const, domain: "LinkedIn Ads",  role: "Specialist",          runs: 0, since: "—" },
    { id: "meta",     name: "Meta Ads",     status: "future"          as const, domain: "Meta Ads",      role: "Specialist",          runs: 0, since: "—" },
  ];

  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Workspace"
        title="Coworkers"
        subtitle="Specialist workers and the shared infrastructure they run on."
      />

      {/* ── Workers grid ───────────────────────────────────────────── */}
      <div className="mt-5">
        <SectionLabel>Workers</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {allCoworkers.map((cw) => {
            const isLive  = cw.status === "live";
            const isInDev = cw.status === "in-development";
            const avatarBg    = isLive ? "#25e2cc" : isInDev ? "#fff1de" : "#f2f2f2";
            const avatarColor = isLive ? "#003d5b" : isInDev ? "#8c4400" : "#6b7079";
            const avatarShadow = isLive ? "0 0 0 4px #dff9f4" : "none";
            const isDim = cw.status === "future" || cw.status === "planned";
            return (
              <Link key={cw.id} href={`/mcp/${cw.id}`}
                className={`flex min-h-[190px] flex-col rounded-[14px] border border-[#ebecee] bg-white p-[18px] transition hover:border-[#dfe1e4] hover:bg-[#f6f7f8] ${isDim ? "opacity-70 hover:opacity-100" : ""}`}
              >
                <div className="mb-3.5 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] text-[18px] font-extrabold"
                    style={{ background: avatarBg, color: avatarColor, boxShadow: avatarShadow }}
                  >
                    {cw.name[0]}
                  </div>
                  <StatusPill status={cw.status} />
                </div>
                <div className="text-[18px] font-extrabold tracking-[-0.01em] text-[#003d5b]">{cw.name}</div>
                <div className="mt-0.5 text-[12px] text-[#8b9098]">{cw.domain}</div>
                <div className="text-[12px] text-[#8b9098]">{cw.role}</div>
                <div className="mt-auto border-t border-[#ebecee] pt-3">
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <div className="text-[#8b9098]">Runs</div>
                      <div className="font-mono text-[14px] font-bold text-[#003d5b]">{cw.runs}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#8b9098]">Live since</div>
                      <div className="font-mono text-[12px] font-semibold text-[#4e525a]">{cw.since}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Infrastructure grid ─────────────────────────────────────── */}
      <div className="mt-6">
        <SectionLabel>Infrastructure</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {INFRA.map((i) => (
            <Link key={i.id} href={`/mcp/${i.id}`}
              className="rounded-[14px] border border-[#ebecee] bg-white p-4 transition hover:border-[#dfe1e4] hover:bg-[#f6f7f8]"
            >
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <div className="text-[15px] font-bold text-[#003d5b]">{infraName(i.id)}</div>
              </div>
              <div className="text-[11px] font-semibold text-[#007380]">{i.tagline}</div>
              <div className="mt-1.5 text-[12px] leading-[1.55] text-[#6b7079]">{i.description}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Platform inventory ──────────────────────────────────────── */}
      <div className="mt-6">
        <SectionLabel badge="from codebase">Platform inventory</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <MetricTile label="Families"          value={data.families.total}                         detail={`${data.families.publishReady} publish-ready`} />
          <MetricTile label="Service offerings" value={data.dataFiles.serviceTaxonomyOfferings}     detail={`${data.dataFiles.serviceAliases} aliases`} />
          <MetricTile label="People roles"      value={data.dataFiles.peopleRoles.toLocaleString()} detail={`${data.dataFiles.peopleRoleIndustries} industries`} />
          <MetricTile label="Brief rules"       value={data.rules.total}                            detail={`${data.rules.hard} hard`} />
          <MetricTile label="MCC accounts"      value={data.accounts.total}                         detail="all push-eligible" />
          <MetricTile label="Connectors"        value={data.integrations.length}                    detail="3 providers" />
        </div>
      </div>
    </div>
  );
}
