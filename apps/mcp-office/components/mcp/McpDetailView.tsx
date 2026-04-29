import Link from "next/link";
import { BookOpen, Database, Plug, ShieldCheck } from "lucide-react";
import {
  type McpDetailPage,
  type McpDetailModule,
} from "@/lib/mcp/office-data";
import type { REAL } from "@/lib/mcp/real-data";
import { NEW_REALITIES } from "@/lib/knowledge/new-realities";
import type { BeaconActivity, BeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";
import { LivePoll } from "@/components/mcp/LivePoll";
import {
  PAGE_PAD,
  PageHeader,
  SectionLabel,
  StatusPill,
  MetricTile,
  ContentCard,
  SideCard,
  ListRow,
  MonoId,
  MonoTime,
} from "@/components/mcp/McpPrimitives";

type RealData = typeof REAL;

/* ================================================================== */
/*  Shared sub-components                                              */
/* ================================================================== */

function ModuleCard({ module, id }: { module: McpDetailModule; id?: string }) {
  const icons: Record<McpDetailModule["icon"], string> = {
    agent: "◉", memory: "◎", knowledge: "◪", tools: "⬡", governance: "◫", activity: "◌",
  };
  return (
    <ContentCard id={id}>
      <div className="flex items-center gap-3 border-b border-[#ebecee] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#dfe1e4] bg-[#f6f7f8] text-sm text-[#4e525a]">
          {icons[module.icon]}
        </div>
        <h2 className="text-[14px] font-semibold text-[#003d5b]">{module.title}</h2>
      </div>
      <div className="px-4 py-2">
        {module.items.map((item) => (
          <div key={item} className="border-b border-[#f2f2f2] py-2 text-[13px] leading-6 text-[#4e525a] last:border-b-0">
            {item}
          </div>
        ))}
      </div>
    </ContentCard>
  );
}

function SectionCard({ title, items, id, badge }: { title: string; items: string[]; id?: string; badge?: string }) {
  return (
    <div id={id} className="rounded-[12px] border border-[#ebecee] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#003d5b]">{title}</div>
        {badge && <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-2 py-0.5 text-[10px] text-[#8b9098]">{badge}</span>}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item} className="rounded-[8px] border border-[#f2f2f2] bg-[#f6f7f8] px-3 py-2 text-[13px] leading-6 text-[#4e525a]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowseIndex({ entries }: { entries: Array<{ id: string; label: string }> }) {
  return (
    <ContentCard>
      <div className="p-4">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b9098]">Sections</div>
        <div className="flex flex-wrap gap-1.5">
          {entries.map((e) => (
            <a key={e.id} href={`#${e.id}`}
              className="rounded-[999px] border border-[#dfe1e4] bg-[#f6f7f8] px-3 py-1 text-[12px] text-[#4e525a] transition hover:border-[#25e2cc]/40 hover:bg-white">
              {e.label}
            </a>
          ))}
        </div>
      </div>
    </ContentCard>
  );
}

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatUtcTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mn = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mn} UTC`;
}

/* ================================================================== */
/*  Hero blocks — consistent structure, different color treatments     */
/* ================================================================== */

function WorkerHero({ page }: { page: McpDetailPage }) {
  return (
    <div className="flex items-center gap-5 rounded-[14px] border border-[#8bf0e1] p-5"
      style={{ background: "linear-gradient(135deg, #fff 0%, #eefcf9 100%)" }}>
      <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[18px] text-[34px] font-black text-[#003d5b]"
        style={{ background: "#25e2cc", boxShadow: "0 0 0 6px #dff9f4" }}>
        {page.title[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <StatusPill status={page.status} />
          <span className="rounded-full border border-[#bff6ed] bg-[#dff9f4] px-2.5 py-0.5 text-[12px] font-semibold text-[#0a6d63]">
            Campaign specialist
          </span>
          <span className="font-mono text-[11px] text-[#8b9098]">Live since March 2026</span>
        </div>
        <div className="font-display text-[28px] font-extrabold leading-none tracking-[-0.02em] text-[#003d5b]">
          {page.title}
        </div>
        <div className="mt-1.5 max-w-[680px] text-[13px] leading-[1.6] text-[#4e525a]">{page.subtitle}</div>
      </div>
    </div>
  );
}

function InfraHero({ page }: { page: McpDetailPage }) {
  type LucideComp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  const icons: Record<string, LucideComp> = {
    knowledge: BookOpen,
    memory: Database,
    integrations: Plug,
    ops: ShieldCheck,
  };
  const LucideIcon = icons[page.id];
  return (
    <div
      className="flex items-center gap-[22px] rounded-[14px] p-[22px] text-white"
      style={{ background: "linear-gradient(135deg, #003d5b 0%, #003049 100%)" }}
    >
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px]"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        {LucideIcon && <LucideIcon size={28} color="#25e2cc" strokeWidth={1.75} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(37,226,204,0.4)] bg-[rgba(37,226,204,0.15)] px-2.5 py-0.5 text-[12px] font-semibold text-[#25e2cc]">
            Infrastructure
          </span>
          <StatusPill status="active" />
        </div>
        <div className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">
          {page.title}
        </div>
        <div className="mt-1.5 max-w-[680px] text-[13px] leading-[1.55] text-[#e8eef2]">
          {page.subtitle}
        </div>
      </div>
    </div>
  );
}

function FutureWorkerHero({ page }: { page: McpDetailPage }) {
  const isInDev = page.status === "in-development";
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[620px] rounded-[14px] p-8 text-center"
        style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: isInDev ? "#fcd4a3" : "#cfd2d6", background: isInDev ? "#fff9f3" : "#f6f7f8" }}>
        <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[18px] text-[30px] font-black"
          style={{ background: isInDev ? "#fff1de" : "#f2f2f2", border: `1.5px dashed ${isInDev ? "#f5b872" : "#cfd2d6"}`, color: isInDev ? "#8c4400" : "#6b7079" }}>
          {page.title[0]}
        </div>
        <StatusPill status={page.status} />
        <div className="mt-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[#003d5b]">{page.title}</div>
        <div className="mt-1 text-[13px] text-[#8b9098]">{page.subtitle}</div>
        <div className="mx-auto mt-4 max-w-[440px] text-[13.5px] leading-[1.65] text-[#4e525a]">
          {isInDev
            ? "Desk provisioned in the office, but runtime, tools, and integrations are not connected yet."
            : "Reserved seat in the office. No desk, runtime, or tools provisioned yet."}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  McpDetailView                                                      */
/* ================================================================== */

export function McpDetailView({
  page, data, beaconActivity, memorySnapshot,
}: {
  page: McpDetailPage;
  data: RealData;
  beaconActivity?: BeaconActivity | null;
  memorySnapshot?: BeaconOperationalSnapshot | null;
}) {
  const crumb = page.surfaceKind === "worker" ? "Workers" : page.surfaceKind === "infrastructure" ? "Infrastructure" : "Workers";
  const subtitleMap: Record<string, string> = {
    beacon:       "Google Ads campaign specialist · live",
    knowledge:    "Source of truth for shared knowledge",
    memory:       "Run history and execution context",
    integrations: "External system connections",
    ops:          "Push controls and readiness gates",
    tagpilot:     "Measurement specialist · in development",
    lumen:        "SEO / insights specialist · planned",
  };
  const subtitle = subtitleMap[page.id] ?? page.summary.slice(0, 120) + "…";

  return (
    <div className={PAGE_PAD}>
      <PageHeader crumb={crumb} title={page.title} subtitle={subtitle} />

      <div className="mt-5">
        {page.id === "beacon" ? (
          <BeaconDetail page={page} data={data} activity={beaconActivity ?? null} />
        ) : page.id === "knowledge" ? (
          <KnowledgeDetail page={page} data={data} />
        ) : page.surfaceKind === "infrastructure" ? (
          <InfraDetail page={page} data={data} memorySnapshot={memorySnapshot} />
        ) : (
          <FutureWorkerDetail page={page} />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Beacon detail                                                      */
/* ================================================================== */

function BeaconDetail({ page, data, activity }: { page: McpDetailPage; data: RealData; activity: BeaconActivity | null }) {
  return (
    <>
      {/* Keep this surface in lockstep with Beacon's SQLite — a freshly-saved
          run/event/push appears here within ~5s without manual reload. */}
      <LivePoll />
      <WorkerHero page={page} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricTile label="Families"     value={String(data.families.total)}   detail={`${data.families.publishReady} publish-ready, ${data.families.reviewOnly} review-only`}                                                badge="from codebase" />
        <MetricTile label="Brief rules"  value={String(data.rules.total)}      detail={`${data.rules.hard} hard · ${data.rules.soft} soft · ${data.rules.informational} info`}                                               badge="from codebase" />
        <MetricTile label="MCC accounts" value={String(data.accounts.total)}   detail="all available for push"                                                                                                                badge="from codebase" />
        <MetricTile label="Focus events" value={String(data.events.total)}     detail={`${data.events.careers} careers · ${data.events.corporate} corporate`}                                                                 badge="from codebase" />
        {activity
          ? <MetricTile label="Push history" value={String(activity.pushSummary.total)} detail={`${activity.pushSummary.succeeded} succeeded · ${activity.pushSummary.validation_failed} vf`} badge="from beacon.sqlite" accent />
          : <MetricTile label="Push history" value="—" detail="no database connection" badge="no source yet" />}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <BrowseIndex entries={[
            { id: "current-activity", label: "Activity" },
            { id: "mcp-consumption",  label: "MCP consumption" },
            ...page.modules.map((m) => ({ id: slugify(m.title), label: m.title })),
            { id: "push-log", label: "Push log" },
          ]} />

          {/* Activity */}
          {activity ? (
            <SectionCard title="Recent Activity" id="current-activity" badge="from beacon.sqlite" items={
              activity.recentEvents.map((e) => {
                const t = formatUtcTime(e.created_at);
                return e.event_type === "status_changed"
                  ? `${t} — ${e.from_status} → ${e.to_status}`
                  : `${t} — Blueprint saved (v${e.version_number ?? "?"}, ${e.to_status ?? "draft"})`;
              })
            } />
          ) : (
            <SectionCard title="Recent Activity" id="current-activity" badge="no source yet" items={["No database connection — Beacon SQLite not available"]} />
          )}

          {/* MCP consumption */}
          <div id="mcp-consumption" className="rounded-[12px] border border-[#ebecee] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#003d5b]">MCP Consumption</div>
              <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-2 py-0.5 text-[10px] text-[#8b9098]">from codebase</span>
            </div>
            <div className="space-y-2.5">
              {[
                { href: "/mcp/knowledge#reference-data", pkg: "@mktg/core", via: "Knowledge →", items: [`Service taxonomy — ${data.dataFiles.serviceTaxonomyOfferings} service offerings, ${data.dataFiles.serviceAliases} aliases`, `People targeting — ${data.dataFiles.peopleRoles.toLocaleString()} people roles`, `MCC knowledge — ${data.accounts.total} accounts, naming patterns`] },
                { href: "/mcp/knowledge#domain-conventions", pkg: "@mktg/domain-google-ads", via: "Knowledge →", items: [`Campaign families — ${data.families.total} definitions (${data.families.publishReady} publish-ready)`, `Readiness evaluation — 6 dependency domains, 3 layers`, `Sitelinks — ${data.sitelinks.total} pre-approved catalog entries`] },
                { href: "/mcp/ops", pkg: "@mktg/adapter-beacon", via: "Ops →", items: [`Brief rules — ${data.rules.total} (${data.rules.hard} hard, ${data.rules.soft} soft)`, `Conversion events — ${data.events.total} focus event profiles`, `Push control — auth + publish role required`] },
              ].map((row) => (
                <Link key={row.pkg} href={row.href}
                  className="block rounded-[10px] border border-[#ebecee] bg-[#f6f7f8] p-3 transition hover:border-[#25e2cc]/40 hover:bg-white">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[12px] font-bold text-[#003d5b]">{row.pkg}</div>
                    <span className="text-[10px] text-[#8b9098]">{row.via}</span>
                  </div>
                  <div className="mt-1.5 space-y-1 text-[13px] text-[#4e525a]">
                    {row.items.map((it) => <div key={it}>{it}</div>)}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {page.modules.map((m) => <ModuleCard key={m.title} module={m} id={slugify(m.title)} />)}

          {/* Push log */}
          {activity ? (
            <SectionCard title="Push Log" id="push-log" badge="from beacon.sqlite" items={
              activity.recentPushes.map((p) => {
                const t = formatUtcTime(p.created_at);
                const acct = p.account_name ?? p.customer_id;
                const note = p.note ? ` — ${p.note}` : "";
                return `${t} — ${acct}: ${p.outcome}${note}`;
              })
            } />
          ) : (
            <SectionCard title="Push Log" id="push-log" badge="no source yet" items={["No database connection — Beacon SQLite not available"]} />
          )}
        </div>

        <aside className="space-y-3">
          {activity ? (
            <SideCard label="Run status" highlight>
              <div className="space-y-1 text-[13px] text-[#0a8c7e]">
                <p>{activity.runStatus.total} total runs</p>
                <p>{activity.runStatus.draft} draft · {activity.runStatus.approved} approved · {activity.runStatus.ready_to_push} ready to push</p>
                <p>{activity.runStatus.pushed} pushed · {activity.runStatus.push_failed} push failed</p>
                {activity.runStatus.other > 0 && <p>{activity.runStatus.other} other</p>}
              </div>
              {activity.governanceGapCount > 0 && (
                <div className="mt-2 pt-2 border-t border-[#a8ddc7]">
                  <p className="text-[12px] font-semibold" style={{ color: "#8c4400" }}>
                    {activity.governanceGapCount} gov. audit gap{activity.governanceGapCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[11px] text-[#6b7079] mt-0.5">MCP post-validation skipped on these runs</p>
                </div>
              )}
            </SideCard>
          ) : (
            <SideCard label="Operational context" highlight>
              <p className="text-[13px] leading-7 text-[#0a8c7e]">{page.heroNote}</p>
            </SideCard>
          )}
          <SideCard label="Ownership boundary">
            <div className="space-y-2 text-[13px] text-[#4e525a]">
              <div><div className="font-semibold text-[#003d5b]">Beacon owns</div><p className="mt-0.5 text-[12px]">Pipeline, decision policy, gap taxonomy, blueprint readiness, review flow, Google Ads API integration</p></div>
              <div><div className="font-semibold text-[#003d5b]">MCP owns</div><p className="mt-0.5 text-[12px]">All shared domain knowledge: families, readiness, naming, service taxonomy, people targeting, sitelinks, MCC context</p></div>
            </div>
          </SideCard>
          <SideCard label="Connected systems">
            <div className="space-y-1.5 text-[13px] text-[#4e525a]">
              <p>Knowledge — domain truth and references</p>
              <p>Memory — run context and review history</p>
              <p>Integrations — connectors and validation</p>
              <p>Ops — approvals and readiness gates</p>
            </div>
          </SideCard>
        </aside>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Knowledge detail                                                   */
/* ================================================================== */

function KnowledgeDetail({ page, data }: { page: McpDetailPage; data: RealData }) {
  const nr = NEW_REALITIES;

  const referenceData = [
    { id: "service-taxonomy", title: "Concentrix Service Taxonomy",  kind: "Reference",    count: `${data.dataFiles.serviceTaxonomyOfferings} service offerings · ${data.dataFiles.serviceTaxonomyCategories} categories · ${data.dataFiles.serviceTaxonomyGroups} groups · ${data.dataFiles.serviceAliases} aliases`, excerpt: "The canonical Concentrix service catalog. 44 service aliases normalize informal inputs to canonical offerings.", source: "@mktg/core" },
    { id: "people-targeting",  title: "People-Targeting Catalog",    kind: "Reference",    count: `${data.dataFiles.peopleRoles.toLocaleString()} people roles · ${data.dataFiles.peopleRoleIndustries} industries · ${data.dataFiles.peopleRoleServiceCategories} service categories`, excerpt: "Industry-specific job titles with buying considerations and service context. Each people role maps to an industry, service category, tier, and intent signals.", source: "@mktg/core" },
    { id: "sitelinks",         title: "Sitelink Catalog",            kind: "Reference",    count: `${data.sitelinks.total} pre-approved sitelinks by service family`, excerpt: "Concentrix-approved sitelinks. Selection follows: exact URL → normalized path → service family → generic.", source: "@mktg/domain-google-ads" },
    { id: "campaign-naming",   title: "Campaign Naming Convention",  kind: "Convention",   count: `${data.campaignNaming.objectives} objectives · ${data.campaignNaming.families} families · ${data.campaignNaming.countries} countries`, excerpt: `Template: ${data.campaignNaming.template}. Includes objective shortcodes, family shortcodes, country code resolution.`, source: "@mktg/domain-google-ads" },
    { id: "readiness-model",   title: "Campaign-Family Readiness",   kind: "Convention",   count: `${data.families.total} families · 6 dependency domains · 3 layers`, excerpt: "Evaluates readiness across destination, measurement, assets, audience, linkage, and geo-language.", source: "@mktg/domain-google-ads" },
    { id: "asset-limits",      title: "Asset Limits & UTM Templates",kind: "Convention",   count: "All Google Ads asset types", excerpt: "Character limits for all asset types. UTM tracking templates per family.", source: "@mktg/domain-google-ads" },
    { id: "mcc-knowledge",     title: "MCC Account Knowledge",       kind: "Operational",  count: `${data.dataFiles.mccExportAccounts} accounts · ${data.dataFiles.mccExportTotalCampaigns} campaigns · ${data.dataFiles.mccExportActiveCampaigns} active`, excerpt: "Full Concentrix MCC context: 24 accounts (careers, corporate, legacy), career domain classification, naming conventions.", source: "@mktg/core" },
    { id: "capability-registry",title: "Supported Capabilities",    kind: "Operational",  count: `${data.capabilities.total} tracked (${data.capabilities.supported} supported, ${data.capabilities.partial} partial)`, excerpt: "What Google Ads features marketing-mcp currently supports, with granular support levels.", source: "@mktg/core" },
    { id: "family-definitions", title: "Campaign Family Definitions",kind: "Operational",  count: `${data.families.total} (${data.families.publishReady} publish-ready, ${data.families.reviewOnly} review-only)`, excerpt: "Structural definitions for all campaign families: objectives, audience dependence, asset complexity, readiness flags.", source: "@mktg/domain-google-ads" },
  ];

  const corporateKnowledge = [
    {
      id: "corporate-identity",
      title: "New Realities Pack — Identity & Hierarchy",
      kind: "Platform",
      count: `v${nr.pack_version} · "${nr.identity.campaign_platform}" · "${nr.identity.campaign_line}"`,
      excerpt: `Brand position: "${nr.identity.brand_position}". Brand mandate: "${nr.identity.brand_mandate.phrase}" (corporate contexts only). ${nr.messaging_hierarchy.length} hierarchy levels enforce correct phrase usage — these levels must not be collapsed into each other.`,
      source: "new-realities.ts",
    },
    {
      id: "positioning-rules",
      title: "Positioning Rules",
      kind: "Governance",
      count: `${nr.positioning.must_not_be_positioned_as.length} must-not · ${nr.positioning.must_be_positioned_as.length} must-be`,
      excerpt: `Must NOT be positioned as: ${nr.positioning.must_not_be_positioned_as.join(", ")}. Must be positioned as: ${nr.positioning.must_be_positioned_as.join(", ")}. Enforced at runtime by copy governance.`,
      source: "new-realities.ts",
    },
    {
      id: "campaign-stories",
      title: "Campaign Stories",
      kind: "Narrative",
      count: `${nr.campaign_stories.length} stories · awareness → consideration → conversion → authority`,
      excerpt: `${nr.campaign_stories.map((s) => `${s.name} (${s.stage})`).join(" · ")}. Use the story that matches the campaign's funnel objective.`,
      source: "new-realities.ts",
    },
    {
      id: "message-pillars",
      title: "Message Pillars & Narrative Direction",
      kind: "Messaging",
      count: `${nr.message_pillars.length} pillars · ${nr.narrative_direction.emphasizes.length} narrative signals`,
      excerpt: `Pillars: ${nr.message_pillars.map((p) => p.phrase).join(" · ")}. Challenges AI hype and pilot theater; emphasizes real operational execution, full lifecycle accountability, and integrated human + AI operations.`,
      source: "new-realities.ts",
    },
    {
      id: "audience-strategy",
      title: "Audience Strategy",
      kind: "Audience",
      count: `${nr.audience.primary_buyers.length} primary buyers · ${nr.audience.influencers.length} influencers`,
      excerpt: `Primary buyers: ${nr.audience.primary_buyers.map((a) => a.role).join(", ")}. ${nr.audience.tone_guidance}`,
      source: "new-realities.ts",
    },
    {
      id: "copy-governance-wiring",
      title: "Runtime Copy Governance",
      kind: "Operational",
      count: "4 active surfaces · copy drift scan active",
      excerpt: "Positioning constraints from this pack are enforced at runtime: translator prompt copy guard, post-generation drift scan against must_not_be_positioned_as, planner corporate messaging block, and MCPContextBundle MCPCorporateMessagingGuidance.",
      source: "copy-governance.ts",
    },
  ];

  const categories = [
    { id: "reference-data",        label: "Reference data",        subtitle: "Canonical datasets consumed by workers",               items: referenceData.slice(0, 3) },
    { id: "domain-conventions",    label: "Domain conventions",    subtitle: "Governed rules and templates for campaign construction", items: referenceData.slice(3, 6) },
    { id: "operational-knowledge", label: "Operational knowledge", subtitle: "Live system state and capability truth",                items: referenceData.slice(6) },
    { id: "corporate-knowledge",   label: "Corporate knowledge",   subtitle: `New Realities pack · authoritative corporate truth for all workers (v${nr.pack_version})`, items: corporateKnowledge },
  ];

  return (
    <>
      <InfraHero page={page} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricTile label="Knowledge assets"  value={String(referenceData.length + corporateKnowledge.length)} detail={`${referenceData.length} domain/reference · ${corporateKnowledge.length} corporate`} badge="from codebase" />
        <MetricTile label="Service offerings" value={String(data.dataFiles.serviceTaxonomyOfferings)} detail={`${data.dataFiles.serviceTaxonomyCategories} categories · ${data.dataFiles.serviceTaxonomyGroups} groups`} badge="from codebase" />
        <MetricTile label="People roles"      value={data.dataFiles.peopleRoles.toLocaleString()} detail={`${data.dataFiles.peopleRoleIndustries} industries · ${data.dataFiles.peopleRoleServiceCategories} service categories`} badge="from codebase" />
        <MetricTile label="MCC coverage"      value={String(data.dataFiles.mccExportAccounts)} detail={`${data.dataFiles.mccExportTotalCampaigns} campaigns · ${data.dataFiles.mccExportActiveCampaigns} active`}             badge="from codebase" />
        <MetricTile label="Capabilities"      value={String(data.capabilities.total)} detail={`${data.capabilities.supported} supported · ${data.capabilities.partial} partial`}         badge="from codebase" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <BrowseIndex entries={[
            ...referenceData.map((a) => ({ id: a.id, label: a.title })),
            ...corporateKnowledge.map((a) => ({ id: a.id, label: a.title })),
          ]} />
          {categories.map((cat) => (
            <div key={cat.id} id={cat.id} className="rounded-[12px] border border-[#ebecee] bg-white p-4">
              <div className="mb-3">
                <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#003d5b]">{cat.label}</div>
                <div className="mt-0.5 text-[11px] text-[#8b9098]">{cat.subtitle}</div>
              </div>
              <div className="space-y-2">
                {cat.items.map((a) => (
                  <div key={a.id} id={a.id} className="rounded-[10px] border border-[#f2f2f2] bg-[#f6f7f8] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-semibold text-[#003d5b]">{a.title}</div>
                        <div className="mt-0.5 text-[11px] text-[#8b9098]">{a.kind} · {a.count}</div>
                      </div>
                      <span className="rounded-[4px] border border-[#dfe1e4] bg-white px-2 py-0.5 font-mono text-[10px] text-[#4e525a]">{a.source}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-[#4e525a]">{a.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {page.modules.map((m) => <ModuleCard key={m.title} module={m} id={slugify(m.title)} />)}
        </div>

        <aside className="space-y-3">
          <SideCard label="Source of truth" highlight>
            <p className="text-[13px] leading-7 text-[#0a8c7e]">Knowledge is the canonical source of truth. Workers consume from this layer and do not hold local copies of reference data, domain conventions, or operational context.</p>
          </SideCard>
          <SideCard label="Package sources">
            <div className="space-y-2.5 text-[13px] text-[#4e525a]">
              <a href="#reference-data" className="block transition hover:text-[#003d5b]"><div className="font-semibold text-[#003d5b]">@mktg/core</div><p className="mt-0.5 text-[12px]">Service taxonomy, people targeting, MCC knowledge, audience segments</p></a>
              <a href="#domain-conventions" className="block transition hover:text-[#003d5b]"><div className="font-semibold text-[#003d5b]">@mktg/domain-google-ads</div><p className="mt-0.5 text-[12px]">Campaign families, readiness model, naming, sitelinks, asset limits, UTM templates</p></a>
              <Link href="/mcp/ops" className="block transition hover:text-[#003d5b]"><div className="font-semibold text-[#003d5b]">@mktg/adapter-beacon</div><p className="mt-0.5 text-[12px]">Brief validation rules, conversion events, push control</p></Link>
              <a href="#corporate-knowledge" className="block transition hover:text-[#003d5b]"><div className="font-semibold text-[#003d5b]">new-realities.ts</div><p className="mt-0.5 text-[12px]">Corporate campaign platform, positioning rules, stories, pillars, audience strategy</p></a>
            </div>
          </SideCard>
          <SideCard label="Current consumers">
            <div className="space-y-1.5 text-[13px] text-[#4e525a]">
              <p>Beacon — service taxonomy for campaign grounding</p>
              <p>Beacon — people roles for audience recommendations</p>
              <p>Beacon — campaign naming for governed draft names</p>
              <p>Beacon — readiness model for publish gating</p>
              <p>Beacon — New Realities pack via planner + translator</p>
              <p>MCP — corporate messaging in every context bundle</p>
            </div>
          </SideCard>
          <SideCard label="Corporate governance">
            <div className="space-y-1.5 text-[13px] text-[#4e525a]">
              <p>Copy drift scan — post-generation positioning audit</p>
              <p>Translator prompt — copy guard NEVER/MUST rules</p>
              <p>Planner prompt — corporate messaging block injection</p>
              <p>MCPContextBundle — full guidance in every context call</p>
            </div>
          </SideCard>
        </aside>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Infra detail (Memory / Integrations / Ops)                        */
/* ================================================================== */

function InfraDetail({ page, data, memorySnapshot }: { page: McpDetailPage; data: RealData; memorySnapshot?: BeaconOperationalSnapshot | null }) {
  const content = buildInfraContent(page.id, data, memorySnapshot);
  return (
    <>
      <InfraHero page={page} />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {content.metrics.map(([label, value, detail, badge]) => (
          <MetricTile key={label} label={label} value={value} detail={detail} badge={badge} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {content.sections.map((s) => <SectionCard key={s.title} title={s.title} items={s.items} id={slugify(s.title)} badge={s.badge} />)}
          {page.modules.map((m) => <ModuleCard key={m.title} module={m} id={slugify(m.title)} />)}
        </div>
        <aside className="space-y-3">
          <SideCard label="About this layer" highlight>
            <p className="text-[13px] leading-7 text-[#0a8c7e]">{page.heroNote}</p>
          </SideCard>
          <SideCard label="Role in the MCP">
            <p className="text-[13px] leading-6 text-[#4e525a]">{content.role}</p>
          </SideCard>
          {content.sidebar.map((s) => (
            <SideCard key={s.label} label={s.label}>
              <div className="space-y-1.5 text-[13px] text-[#4e525a]">{s.items.map((i) => <p key={i}>{i}</p>)}</div>
            </SideCard>
          ))}
        </aside>
      </div>
    </>
  );
}

type SysContent = {
  metrics: Array<[string, string, string, string?]>;
  sections: Array<{ title: string; items: string[]; badge?: string }>;
  role: string;
  sidebar: Array<{ label: string; items: string[] }>;
};

function buildInfraContent(id: string, d: RealData, snapshot?: BeaconOperationalSnapshot | null): SysContent {
  switch (id) {
    case "memory": {
      const runs = snapshot?.totals.runs ?? null;
      const events = snapshot?.totals.events ?? null;
      const pushes = snapshot?.totals.pushes ?? null;
      const badge = snapshot ? "live from beacon.sqlite" : "database unavailable";
      const runsLabel = runs !== null ? String(runs) : "—";
      const eventsLabel = events !== null ? String(events) : "—";
      const pushesLabel = pushes !== null ? String(pushes) : "—";
      return {
        metrics: [
          ["Campaign runs", runsLabel, "With version history and review status", badge],
          ["Status events", eventsLabel, "Timestamped transitions across all runs", badge],
          ["Push audits",   pushesLabel, "Every push attempt with outcome and notes", badge],
        ],
        sections: [
          { title: "Current operational memory", badge, items: [
            `${runsLabel} campaign runs — each with brief input, blueprint output, version history, and review status`,
            `${eventsLabel} status transition events — draft → approved → ready to push → pushed, all timestamped`,
            `${pushesLabel} push audit records — outcome (succeeded, failed, validation failed), account, detailed notes`,
          ]},
          { title: "Where Memory is going", items: ["Today: backed by Beacon's SQLite — one worker, one database", "Next: shared persistence layer that MCP Office and future workers can access directly", "Future: TagPilot and Lumen write their own operational traces to the same layer"] },
        ],
        role: "Knowledge is what the MCP knows. Memory is what the MCP remembers. Currently backed by Beacon's SQLite, this layer becomes shared infrastructure as more workers come online.",
        sidebar: [
          { label: "Current backing store", items: ["Beacon's beacon.sqlite", "Read by MCP Office for observability", "Written by Beacon during campaign processing"] },
          { label: "Current consumers", items: ["Beacon — writes runs, events, push audits", "MCP Office — reads for Beacon activity view"] },
        ],
      };
    }
    case "integrations": return {
      metrics: [
        ["Active connectors", String(d.integrations.length), `${new Set(d.integrations.map(i => i.provider)).size} providers`, "from codebase"],
        ["MCC accounts",      String(d.accounts.total),      `${d.accounts.careers} careers · ${d.accounts.corporate} corporate · ${d.accounts.legacy} legacy`, "from codebase"],
        ["Publish model",     "Auth + role",                 "All accounts available for push", "from codebase"],
      ],
      sections: [
        { title: "Active Integrations", badge: "from codebase", items: d.integrations.map(i => `${i.name} — ${i.description} (${i.type}, ${i.consumer})`) },
        { title: "MCC Account Inventory", badge: "from codebase", items: [`${d.accounts.total} accounts: ${d.accounts.careers} careers, ${d.accounts.corporate} corporate, ${d.accounts.mixed} mixed, ${d.accounts.legacy} legacy`, "All accounts are available for push when the user is authenticated with publish permission"] },
      ],
      role: "Integrations is the complete inventory of external system connections. Every connector listed here is real and active.",
      sidebar: [
        { label: "Consumers", items: ["Beacon — 5 connectors (Google Ads, Azure Blob, Azure OpenAI, Azure AD, Asana)", "MCP — 1 connector (Google Developer Docs)"] },
        { label: "Publish model", items: ["User must be authenticated (Azure AD SSO)", "User must have publish role/permission", "Account must be selected via Google Ads connection", "All 24 MCC accounts are eligible — no account-level blocking"] },
      ],
    };
    case "ops": return {
      metrics: [
        ["Brief rules",    String(d.rules.total),                          `${d.rules.hard} hard · ${d.rules.soft} soft · ${d.rules.informational} info`, "from codebase"],
        ["Publish model",  "Auth + role",                                  "Authenticated user with publish permission", "from codebase"],
        ["Family gating",  `${d.families.publishReady} / ${d.families.total}`, "publish-ready families", "from codebase"],
      ],
      sections: [
        { title: "Publish Permission Model", badge: "from codebase", items: [`Publish requires an authenticated user with the publish role`, `All ${d.accounts.total} MCC accounts are available for push — no account-level blocking`, "Human review is required before any publish action"] },
        { title: "Brief Validation Rules",   badge: "from codebase", items: [`${d.rules.total} rules total: ${d.rules.hard} hard (block readiness), ${d.rules.soft} soft (warn but allow), ${d.rules.informational} informational`, "Rules are defined in @mktg/adapter-beacon and enforced by Beacon's pipeline"] },
        { title: "Readiness Gates",          badge: "from codebase", items: [`${d.families.publishReady} families are publish-ready, ${d.families.reviewOnly} are review-only, ${d.families.inactive} are modeled but inactive`, "Readiness evaluation covers 6 dependency domains: destination, measurement, assets, audience, linkage, geo-language"] },
      ],
      role: "Ops controls what can be published and under what conditions. Brief validation rules, readiness gates, and the publish permission model.",
      sidebar: [
        { label: "Enforced for",    items: ["Beacon — all publish actions gated", "All future workers — same governance model"] },
        { label: "Control inventory", items: [`${d.rules.total} brief validation rules`, `${d.accounts.total} MCC accounts (all available for push)`, `${d.families.publishReady} publish-ready campaign families`, "6 readiness dependency domains"] },
      ],
    };
    default: return { metrics: [["Status", "Planned", "Future system"]], sections: [], role: "Future system.", sidebar: [] };
  }
}

/* ================================================================== */
/*  Future worker detail                                               */
/* ================================================================== */

function FutureWorkerDetail({ page }: { page: McpDetailPage }) {
  return (
    <>
      <FutureWorkerHero page={page} />
      <div className="mt-5 space-y-3">
        {page.modules.map((m) => <ModuleCard key={m.title} module={m} id={slugify(m.title)} />)}
      </div>
    </>
  );
}
