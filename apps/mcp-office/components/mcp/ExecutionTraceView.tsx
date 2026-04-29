"use client";

/**
 * ExecutionTraceView — owner-only detail view over a single Beacon run.
 *
 * Renders 8 tabs (Overview, Timeline, Decision Log, AI Calls, External
 * Calls, Payloads, Validation, Push Audit) from the structured trace
 * produced by lib/mcp/execution-trace.ts.
 *
 * Heavy artifacts (brief/blueprint/localized bundle JSON) are rendered
 * inside collapsible <details> panels to keep the page scannable.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ExecutionTrace,
  type TraceEvent,
  type TraceStatus,
  type DecisionRecord,
  type AiCallRecord,
  type ExternalCallRecord,
  type ValidationSummary,
  type LocaleValidation,
  type PushAuditEntry,
  type FailureSummary,
  type FailureSeverity,
  type ReconciliationStatus,
  formatDurationShort,
} from "@/lib/mcp/execution-trace-types";
import { PAGE_PAD, PageHeader } from "@/components/mcp/McpPrimitives";

type TabKey =
  | "overview"
  | "timeline"
  | "decisions"
  | "ai"
  | "external"
  | "payloads"
  | "validation"
  | "push";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview",  label: "Overview" },
  { key: "timeline",  label: "Timeline" },
  { key: "decisions", label: "Decision Log" },
  { key: "ai",        label: "AI Calls" },
  { key: "external",  label: "External Calls" },
  { key: "payloads",  label: "Payloads" },
  { key: "validation",label: "Validation" },
  { key: "push",      label: "Push Audit" },
];

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

function statusChipClasses(status: TraceStatus) {
  switch (status) {
    case "ok":      return "border-[#a8ddc7] bg-[#e3f5ee] text-[#0c6a4e]";
    case "warning": return "border-[#fcd4a3] bg-[#fff1de] text-[#8c4400]";
    case "error":   return "border-rose-300/50 bg-rose-50 text-rose-700";
    case "blocked": return "border-[#cfd2d6] bg-[#f2f2f2] text-[#6b7079]";
    case "inferred":return "border-sky-300/50 bg-sky-50 text-sky-700";
    case "skipped": return "border-[#cfd2d6] bg-[#f2f2f2] text-[#6b7079]";
    case "pending": return "border-indigo-300/40 bg-indigo-50 text-indigo-700";
    default:        return "border-[#cfd2d6] bg-[#f2f2f2] text-[#6b7079]";
  }
}

function formatTs(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function tryPrettyJson(raw: string | null): string {
  if (!raw) return "(none)";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ExecutionTraceView({ trace }: { trace: ExecutionTrace }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const router = useRouter();

  // Live refresh: keep this run's view honest while the user is watching it
  // (e.g. status transitions, push attempts, new validation events). Page is
  // force-dynamic so router.refresh() re-reads SQLite. Pause on hidden tabs.
  useEffect(() => {
    const tick = () => {
      if (typeof document === "undefined" || !document.hidden) {
        router.refresh();
      }
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Beacon / Runs"
        title={trace.overview.campaign_name}
        subtitle={`Run ${trace.overview.run_id.slice(0, 8)} · ${trace.overview.selected_family} · ${trace.overview.status}`}
        statusBadge={trace.overview.validation_status === "ok" ? "live" : "in-development"}
      />

      {/* Failure / success summary */}
      <FailureSummaryCard summary={trace.failure_summary} />

      {/* Quick actions */}
      <div className="mt-3">
        <QuickActions trace={trace} />
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-[#ebecee]">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-t-[8px] border-b-2 px-3 py-1.5 text-[12px] font-medium transition ${
                tab === t.key
                  ? "border-[#25e2cc] bg-[#f3f6f9] text-[#003d5b]"
                  : "border-transparent text-[#6b7079] hover:bg-[#f6f7f8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      <div className="mt-4">
        {tab === "overview"   && <OverviewTab trace={trace} />}
        {tab === "timeline"   && <TimelineTab timeline={trace.timeline} />}
        {tab === "decisions"  && <DecisionsTab decisions={trace.decisions} />}
        {tab === "ai"         && <AiCallsTab calls={trace.ai_calls} />}
        {tab === "external"   && <ExternalCallsTab calls={trace.external_calls} />}
        {tab === "payloads"   && <PayloadsTab trace={trace} />}
        {tab === "validation" && <ValidationTab validation={trace.validation} />}
        {tab === "push"       && <PushAuditTab push={trace.push} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview                                                           */
/* ------------------------------------------------------------------ */

function OverviewTab({ trace }: { trace: ExecutionTrace }) {
  const o = trace.overview;
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
        <InnerLabel text="Brief intent" />
        <p className="mt-1 text-[13px] leading-6 text-[#4e525a]">{o.brief_intent}</p>

        <InnerLabel text="Family decision" className="mt-4" />
        <dl className="mt-1 grid grid-cols-2 gap-2 text-[12px]">
          <Kv k="Selected family" v={o.selected_family} />
          <Kv k="Recommended family" v={o.recommended_family} />
          <Kv k="Objective" v={o.objective || "\u2014"} />
          <Kv k="Primary language" v={o.primary_language} />
        </dl>
        <div className="mt-2 rounded-[8px] border border-dashed border-[#dfe1e4] bg-[#f6f7f8] px-3 py-2 text-[12px] leading-5 text-[#4e525a]">
          <div className="font-medium text-[#3a3d43]">Why selected</div>
          <div className="mt-0.5">{o.why_selected}</div>
        </div>

        <InnerLabel text="Campaign name" className="mt-4" />
        <div className="mt-1 break-all rounded-[8px] border border-[#dfe1e4] bg-[#f6f7f8] px-2.5 py-1.5 font-mono text-[11px] text-[#2a2b2c]">
          {o.campaign_name}
        </div>
        <div className="mt-1">
          <span className="text-[11px] text-[#8b9098]">_campaign: </span>
          <span className="break-all font-mono text-[11px] text-[#3a3d43]">{o.campaign_underscore}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <InnerLabel text="Run status" />
          <dl className="mt-1 grid grid-cols-1 gap-1.5 text-[12px]">
            <Kv k="Final status" v={o.status} />
            <Kv k="Validation" v={o.validation_status} />
            <Kv k="Push" v={o.push_status} />
            <Kv k="Total duration" v={formatDurationShort(o.total_duration_ms)} />
            <Kv k="Started" v={formatTs(o.started_at)} />
            <Kv k="Ended" v={formatTs(o.ended_at)} />
          </dl>
          <ReconciliationBadge reconciliation={o.reconciliation} />
          <div className="mt-3 border-t border-[#ebecee] pt-3">
            <InnerLabel text="Actor / account" />
            <dl className="mt-1 grid grid-cols-1 gap-1.5 text-[12px]">
              <dt className="text-[#8b9098]">Created by</dt>
              <dd className="font-medium text-[#2a2b2c]">
                {o.created_by ?? <span className="text-[#8b9098]">—</span>}
                {o.created_by_is_dev && (
                  <span className="ml-1.5 rounded-[3px] border border-[#fcd4a3] bg-[#fff1de] px-1 py-0.5 text-[10px] font-medium text-[#8c4400]">dev</span>
                )}
              </dd>
              <dt className="text-[#8b9098]">Account (customer_id)</dt>
              <dd className="font-mono font-medium text-[#2a2b2c]">
                {o.customer_id ?? <span className="font-sans text-[#8b9098]">not selected at intake</span>}
              </dd>
            </dl>
          </div>
        </div>

        <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <InnerLabel text="Markets / locales" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.markets.length === 0 && <span className="text-[11px] text-[#8b9098]">(none)</span>}
            {o.markets.map((m) => (
              <span key={m} className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 text-[10px] font-medium text-[#3a3d43]">
                {m}
              </span>
            ))}
          </div>
          {o.locales_generated.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-[0.06em] text-[#8b9098]">Locales generated</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {o.locales_generated.map((l) => (
                  <span key={l} className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

function TimelineTab({ timeline }: { timeline: TraceEvent[] }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="bg-[#f6f7f8] text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
          <tr><Th>Step</Th><Th>Status</Th><Th>Timestamp</Th><Th>Duration</Th><Th>Summary</Th></tr>
        </thead>
        <tbody>
          {timeline.map((e) => (
            <tr key={e.step_id} className="border-t border-[#ebecee] align-top">
              <Td>
                <div className="font-medium text-[#2a2b2c]">{e.label}</div>
                <div className="font-mono text-[10px] text-[#8b9098]">{e.event_type}</div>
              </Td>
              <Td><StatusChip status={e.status} /></Td>
              <Td><span className="font-mono text-[10px] text-[#6b7079]">{formatTs(e.timestamp)}</span></Td>
              <Td>
                <span className="font-mono text-[10px] text-[#6b7079]">
                  {e.duration_ms == null ? "\u2014" : formatDurationShort(e.duration_ms)}
                </span>
              </Td>
              <Td>
                <div className="text-[12px] text-[#4e525a]">{e.summary ?? "\u2014"}</div>
                {e.actor_label && (
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#8b9098]">
                    <span>by {e.actor_label}</span>
                    {e.actor_is_dev && (
                      <span className="rounded-[3px] border border-[#fcd4a3] bg-[#fff1de] px-1 py-0.5 text-[10px] font-medium text-[#8c4400]">dev</span>
                    )}
                  </div>
                )}
                {(e.input_summary || e.output_summary) && (
                  <div className="mt-0.5 space-y-0.5 text-[10px] text-[#8b9098]">
                    {e.input_summary && <div>in: {e.input_summary}</div>}
                    {e.output_summary && <div>out: {e.output_summary}</div>}
                  </div>
                )}
                {(e.provider || e.model) && (
                  <div className="mt-0.5 text-[10px] text-[#8b9098]">
                    {[e.provider, e.model].filter(Boolean).join(" · ")}
                  </div>
                )}
                {e.external_request_id && (
                  <div className="mt-0.5 font-mono text-[10px] text-[#8b9098]">req: {e.external_request_id}</div>
                )}
                {e.error_message && (
                  <div className="mt-0.5 text-[11px] text-rose-700">{e.error_message}</div>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Decision log                                                       */
/* ------------------------------------------------------------------ */

function DecisionsTab({ decisions }: { decisions: DecisionRecord[] }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="bg-[#f6f7f8] text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
          <tr><Th>Decision</Th><Th>Chosen value</Th><Th>Reason</Th><Th>Source</Th><Th>Time</Th></tr>
        </thead>
        <tbody>
          {decisions.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-6 text-center text-[12px] text-[#8b9098]">No structured decisions recorded for this run.</td></tr>
          )}
          {decisions.map((d) => (
            <tr key={d.decision_id} className="border-t border-[#ebecee] align-top">
              <Td>
                <div className="font-medium text-[#2a2b2c]">{d.label}</div>
                <div className="font-mono text-[10px] text-[#8b9098]">{d.decision_type}</div>
              </Td>
              <Td>
                <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 text-[11px] font-medium text-[#3a3d43]">
                  {d.chosen_value || "\u2014"}
                </span>
              </Td>
              <Td><div className="max-w-[640px] text-[12px] leading-5 text-[#4e525a]">{d.reason}</div></Td>
              <Td><span className="font-mono text-[10px] text-[#8b9098]">{d.source}</span></Td>
              <Td><span className="font-mono text-[10px] text-[#6b7079]">{formatTs(d.timestamp)}</span></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI calls                                                           */
/* ------------------------------------------------------------------ */

function AiCallsTab({ calls }: { calls: AiCallRecord[] }) {
  const [advanced, setAdvanced] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-[10px] border border-dashed border-[#dfe1e4] bg-[#f6f7f8] px-3 py-1.5">
        <p className="text-[11px] text-[#6b7079]">
          Beacon does not persist raw prompts or model responses. Prompt previews are
          reconstructed from inputs; response previews are excerpted from the persisted
          artifact. Toggle advanced mode to see the full artifact for each call.
        </p>
        <label className="ml-3 flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] text-[#003d5b]">
          <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="accent-[#003d5b]" />
          Advanced mode
        </label>
      </div>

      {calls.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-[#dfe1e4] bg-[#f6f7f8] p-4 text-center text-[12px] text-[#8b9098]">
          No AI calls recorded for this run.
        </div>
      )}

      {calls.map((c) => (
        <div key={c.call_id} className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-[#2a2b2c]">{c.purpose}</div>
            <StatusChip status={c.status} />
            <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 text-[10px] font-medium text-[#3a3d43]">{c.provider}</span>
            <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">{c.model}</span>
            {c.fallback_used && (
              <span className="rounded-[4px] border border-[#fcd4a3] bg-[#fff1de] px-1.5 py-0.5 text-[10px] font-medium text-[#8c4400]">fallback</span>
            )}
            <span className="ml-auto font-mono text-[10px] text-[#8b9098]">
              {c.duration_ms == null ? formatTs(c.timestamp) : formatDurationShort(c.duration_ms)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#4e525a]">
            <span className="text-[#8b9098]">Parsed output: </span>{c.parsed_output_summary}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8b9098]">Prompt preview</span>
                <SourceBadge kind={c.prompt_source} />
              </div>
              <CollapsibleBlock title="Show reconstructed prompt" body={c.prompt_preview} />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8b9098]">Response preview</span>
                <SourceBadge kind={c.response_source} />
              </div>
              <CollapsibleBlock title="Show response excerpt" body={c.response_preview} />
            </div>
          </div>
          {advanced && (
            <div className="mt-3 space-y-2 border-t border-dashed border-[#ebecee] pt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8b9098]">Advanced — real persisted artifact</span>
                <span className="rounded-[3px] border border-[#a8ddc7] bg-[#e3f5ee] px-1 py-0.5 text-[10px] font-medium text-[#0c6a4e]">persisted</span>
                {c.artifact_name && <span className="font-mono text-[10px] text-[#8b9098]">{c.artifact_name}</span>}
              </div>
              {c.artifact_json ? (
                <CollapsibleBlock title={`Full parsed response (${c.artifact_json.length.toLocaleString()} bytes)`} body={tryPrettyJson(c.artifact_json)} />
              ) : (
                <div className="rounded-[8px] border border-dashed border-[#dfe1e4] bg-[#f6f7f8] p-2 text-[11px] text-[#8b9098]">No persisted artifact for this call.</div>
              )}
              <div className="rounded-[8px] border border-dashed border-[#dfe1e4] bg-[#f3f6f9] p-2 text-[10px] leading-[1.5] text-[#4e525a]">
                <strong className="text-[#003d5b]">Note:</strong> Beacon does not currently persist raw prompts or raw model responses; only the parsed JSON artifact is stored.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ kind }: { kind: AiCallRecord["prompt_source"] | AiCallRecord["response_source"] }) {
  if (kind === "persisted" || kind === "persisted_artifact_excerpt") {
    return (
      <span className="rounded-[3px] border border-[#a8ddc7] bg-[#e3f5ee] px-1 py-0.5 text-[10px] font-medium text-[#0c6a4e]">
        {kind === "persisted" ? "persisted" : "from artifact"}
      </span>
    );
  }
  return (
    <span className="rounded-[3px] border border-[#fcd4a3] bg-[#fff1de] px-1 py-0.5 text-[10px] font-medium text-[#8c4400]">
      {kind === "synthetic_reconstruction" ? "synthetic" : "synthesized"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  External calls                                                     */
/* ------------------------------------------------------------------ */

function ExternalCallsTab({ calls }: { calls: ExternalCallRecord[] }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="bg-[#f6f7f8] text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
          <tr><Th>System</Th><Th>Purpose</Th><Th>Status</Th><Th>Request ID</Th><Th>Time</Th><Th>Summary</Th></tr>
        </thead>
        <tbody>
          {calls.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-[12px] text-[#8b9098]">No external calls recorded for this run.</td></tr>
          )}
          {calls.map((c) => (
            <tr key={c.call_id} className="border-t border-[#ebecee] align-top">
              <Td><span className="font-medium text-[#2a2b2c]">{c.system}</span></Td>
              <Td><span className="text-[12px] text-[#4e525a]">{c.purpose}</span></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <StatusChip status={c.status} />
                  {c.status_code != null && <span className="font-mono text-[10px] text-[#8b9098]">{c.status_code}</span>}
                </div>
              </Td>
              <Td><span className="font-mono text-[10px] text-[#6b7079]">{c.request_id ?? "\u2014"}</span></Td>
              <Td><span className="font-mono text-[10px] text-[#6b7079]">{c.timestamp ? formatTs(c.timestamp) : "\u2014"}</span></Td>
              <Td>
                <div className="max-w-[460px] text-[12px] text-[#4e525a]">{c.summary}</div>
                {c.error_excerpt && <div className="mt-0.5 text-[11px] text-rose-700">{c.error_excerpt}</div>}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payloads                                                           */
/* ------------------------------------------------------------------ */

function PayloadsTab({ trace }: { trace: ExecutionTrace }) {
  const p = trace.payloads;
  const blueprint = p.blueprint_json ? safeParse(p.blueprint_json) : null;
  const baseSnapshot = blueprint
    ? {
        campaign_summary:  (blueprint as Record<string, unknown>)["campaign_summary"],
        audience_summary:  (blueprint as Record<string, unknown>)["audience_summary"],
        geography_summary: (blueprint as Record<string, unknown>)["geography_summary"],
        budget_summary:    (blueprint as Record<string, unknown>)["budget_summary"],
        conversion_signal: (blueprint as Record<string, unknown>)["conversion_signal"],
        launch_readiness:  (blueprint as Record<string, unknown>)["launch_readiness"],
      }
    : null;

  const bundle = p.localized_bundle_json ? safeParse(p.localized_bundle_json) : null;
  const units = bundle ? ((bundle as Record<string, unknown>)["units"] as unknown[]) : [];

  const trackingParams = {
    _campaign:    trace.overview.campaign_underscore,
    utm_source:   "google",
    utm_medium:   "cpc",
    utm_campaign: trace.overview.campaign_underscore,
    utm_content:  `family:${trace.overview.selected_family.toLowerCase()}`,
  };

  return (
    <div className="space-y-3">
      <CollapsibleBlock title="Base blueprint snapshot" body={baseSnapshot ? JSON.stringify(baseSnapshot, null, 2) : "(none)"} defaultOpen />
      {Array.isArray(units) && units.length > 0 && (
        <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <InnerLabel text={`Localized units (${units.length})`} />
          <div className="mt-2 space-y-2">
            {units.map((u, i) => {
              const o = u as Record<string, unknown>;
              const locale = (o["locale"] ?? {}) as Record<string, unknown>;
              return (
                <CollapsibleBlock
                  key={i}
                  title={`${String(locale["locale_id"] ?? `unit_${i}`)} \u2014 ${String(o["campaign_name"] ?? "")}`}
                  body={JSON.stringify(u, null, 2)}
                />
              );
            })}
          </div>
        </div>
      )}
      <CollapsibleBlock title="Tracking / custom params" body={JSON.stringify(trackingParams, null, 2)} />
      <CollapsibleBlock title="Full brief JSON" body={tryPrettyJson(p.brief_json)} />
      <CollapsibleBlock title="Full blueprint JSON" body={tryPrettyJson(p.blueprint_json)} />
      {p.execution_brief_json && <CollapsibleBlock title="Execution brief JSON" body={tryPrettyJson(p.execution_brief_json)} />}
      {p.localized_bundle_json && <CollapsibleBlock title="Localized bundle JSON" body={tryPrettyJson(p.localized_bundle_json)} />}
    </div>
  );
}

function safeParse(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function ValidationTab({ validation }: { validation: ValidationSummary }) {
  const v = validation;
  return (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <InnerLabel text="Overall validation" />
          <StatusChip status={v.overall_status} />
          <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">mode: {v.mode}</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <ListBlock title="Hard gaps" items={v.hard_gaps} emptyText="None" tone="error" />
          <ListBlock title="Soft gaps" items={v.soft_gaps} emptyText="None" tone="warning" />
          <ListBlock title="Missing assets" items={v.missing_assets} emptyText="None" tone="warning" />
          <ListBlock title="Fallback notes" items={v.fallback_notes} emptyText="None" tone="neutral" />
        </div>
      </div>

      {v.issues.length > 0 && (
        <div className="overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead className="bg-[#f6f7f8] text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
              <tr><Th>Domain</Th><Th>Severity</Th><Th>Fields</Th><Th>Message</Th></tr>
            </thead>
            <tbody>
              {v.issues.map((i, idx) => (
                <tr key={idx} className="border-t border-[#ebecee] align-top">
                  <Td><span className="font-mono text-[10px] text-[#8b9098]">{i.domain}</span></Td>
                  <Td><StatusChip status={i.severity === "ok" ? "ok" : i.severity} /></Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {i.field_names.map((f) => (
                        <span key={f} className="rounded-[3px] border border-[#dfe1e4] bg-[#f6f7f8] px-1 py-0.5 font-mono text-[10px] text-[#3a3d43]">{f}</span>
                      ))}
                    </div>
                  </Td>
                  <Td><div className="max-w-[640px] text-[12px] text-[#4e525a]">{i.message}</div></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {v.per_locale.length > 0 && (
        <div className="overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <div className="border-b border-[#ebecee] bg-[#f6f7f8] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#8b9098]">Per-locale validation</div>
          <table className="w-full border-collapse text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
              <tr><Th>Locale</Th><Th>Valid?</Th><Th>Errors</Th><Th>Warnings</Th></tr>
            </thead>
            <tbody>
              {v.per_locale.map((l: LocaleValidation) => (
                <tr key={l.locale_id} className="border-t border-[#ebecee] align-top">
                  <Td><span className="font-mono text-[11px] text-[#3a3d43]">{l.locale_id}</span></Td>
                  <Td><StatusChip status={l.is_valid ? "ok" : "error"} /></Td>
                  <Td><InlineList items={l.errors} tone="error" /></Td>
                  <Td><InlineList items={l.warnings} tone="warning" /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {v.google_ads_request_ids.length > 0 && (
        <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
          <InnerLabel text="Google Ads request IDs" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {v.google_ads_request_ids.map((id) => (
              <span key={id} className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">{id}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Push audit                                                         */
/* ------------------------------------------------------------------ */

function PushAuditTab({ push }: { push: ExecutionTrace["push"] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-[#dfe1e4] bg-white p-4 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Pushed?" value={push.pushed ? "yes" : "no"} detail={push.latest_outcome ? `latest: ${push.latest_outcome}` : "no attempt"} />
          <Metric label="Mode" value={push.validate_only ? "validate-only" : "real create"} detail={push.paused ? "created paused" : "active"} />
          <Metric label="Campaign IDs" value={String(push.campaign_ids.length)} detail="returned from Google Ads" />
          <Metric label="Trigger" value="owner" detail={push.trigger_source} />
        </div>
        {push.campaign_ids.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {push.campaign_ids.map((id) => (
              <span key={id} className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">{id}</span>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="bg-[#f6f7f8] text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
            <tr><Th>Time</Th><Th>Outcome</Th><Th>Actor</Th><Th>Mode</Th><Th>Customer</Th><Th>Request ID</Th><Th>Detail</Th></tr>
          </thead>
          <tbody>
            {push.audit.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-[12px] text-[#8b9098]">No push attempts for this run.</td></tr>
            )}
            {push.audit.map((p: PushAuditEntry) => (
              <tr key={p.id} className="border-t border-[#ebecee] align-top">
                <Td><span className="font-mono text-[10px] text-[#6b7079]">{formatTs(p.timestamp)}</span></Td>
                <Td>
                  <StatusChip
                    status={p.outcome === "succeeded" ? "ok" : p.outcome === "blocked" ? "blocked" : "error"}
                    label={p.outcome}
                  />
                </Td>
                <Td>
                  {p.actor_email ? (
                    <>
                      {p.actor_email.endsWith("@beacon.local") ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-[#6b7079]">dev mode (no SSO)</span>
                          <span className="rounded-[3px] border border-[#fcd4a3] bg-[#fff1de] px-1 py-0.5 text-[10px] font-medium text-[#8c4400]">dev</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-[11px] text-[#3a3d43]">{p.actor_email}</div>
                          {p.actor_display_name && (
                            <div className="text-[10px] text-[#8b9098]">{p.actor_display_name}</div>
                          )}
                        </>
                      )}
                    </>
                  ) : p.user_id ? (
                    <span className="font-mono text-[10px] text-[#8b9098]" title={p.user_id}>{p.user_id.slice(0, 16)}…</span>
                  ) : (
                    <span className="text-[10px] text-[#8b9098]">—</span>
                  )}
                </Td>
                <Td>
                  <div className="text-[11px] text-[#4e525a]">{p.validate_only ? "validate-only" : "create"}</div>
                  <div className="text-[10px] text-[#8b9098]">{p.paused ? "paused" : "active"}</div>
                </Td>
                <Td>
                  <div className="font-mono text-[11px] text-[#3a3d43]">{p.customer_id}</div>
                  {p.account_name && <div className="text-[10px] text-[#8b9098]">{p.account_name}</div>}
                </Td>
                <Td><span className="font-mono text-[10px] text-[#6b7079]">{p.request_id ?? "\u2014"}</span></Td>
                <Td>
                  <div className="max-w-[460px] text-[11px] text-[#4e525a]">
                    {p.note ? (p.note.length > 200 ? p.note.slice(0, 200) + "\u2026" : p.note) : "\u2014"}
                  </div>
                  {p.per_locale_ids.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.per_locale_ids.map((pl) => (
                        <span key={pl.locale_id} className="rounded-[3px] border border-[#dfe1e4] bg-[#f6f7f8] px-1 py-0.5 font-mono text-[10px] text-[#3a3d43]">
                          {pl.locale_id}:{pl.campaign_id}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.error_excerpt && <div className="mt-1 text-[11px] text-rose-700">{p.error_excerpt}</div>}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}

function StatusChip({ status, label }: { status: TraceStatus; label?: string }) {
  return (
    <span className={`inline-flex rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium ${statusChipClasses(status)}`}>
      {label ?? status}
    </span>
  );
}

function InnerLabel({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b9098] ${className ?? ""}`}>
      {text}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-[#8b9098]">{k}</dt>
      <dd className="font-medium text-[#2a2b2c]">{v}</dd>
    </>
  );
}

/**
 * Surfaces drift between runs.review_status and the push_audit ledger so
 * an owner can spot runs where the recorded status doesn't match what the
 * Google Ads push log says actually happened.
 */
function ReconciliationBadge({ reconciliation }: { reconciliation: ReconciliationStatus }) {
  if (reconciliation === "consistent" || reconciliation === "no_push_attempts") {
    // Don't waste pixels on the happy path; only surface drift.
    return null;
  }
  const cls = "border-rose-300/50 bg-rose-50 text-rose-700";
  const label =
    reconciliation === "status_overstates_push"
      ? "Status drift: marked pushed, but no successful push audit entry"
      : "Status drift: latest push succeeded, but status was rolled back";
  return (
    <div className={`mt-3 rounded-[8px] border px-2.5 py-1.5 text-[11px] leading-5 ${cls}`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-70">Reconciliation</div>
      <div className="mt-0.5">{label}</div>
    </div>
  );
}

function CollapsibleBlock({ title, body, defaultOpen = false }: { title: string; body: string; defaultOpen?: boolean }) {
  return (
    <details className="rounded-[10px] border border-[#dfe1e4] bg-[#f6f7f8]" open={defaultOpen || undefined}>
      <summary className="cursor-pointer list-none px-3 py-1.5 text-[11px] font-medium text-[#3a3d43] hover:bg-[#eef1f3]">
        <span className="mr-1 text-[#8b9098]">&#9656;</span>{title}
      </summary>
      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words border-t border-[#ebecee] bg-white p-3 font-mono text-[10px] leading-[1.5] text-[#3a3d43]">
        {body}
      </pre>
    </details>
  );
}

function ListBlock({ title, items, emptyText, tone }: {
  title: string; items: string[]; emptyText: string; tone: "error" | "warning" | "neutral";
}) {
  const toneCls =
    tone === "error"   ? "border-rose-300/40 bg-rose-50/40" :
    tone === "warning" ? "border-[#fcd4a3]/60 bg-[#fff1de]/60" :
                         "border-[#dfe1e4] bg-[#f6f7f8]";
  return (
    <div className={`rounded-[10px] border p-3 ${toneCls}`}>
      <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8b9098]">{title}</div>
      {items.length === 0
        ? <div className="mt-1 text-[11px] text-[#8b9098]">{emptyText}</div>
        : <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-5 text-[#4e525a]">
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
      }
    </div>
  );
}

function InlineList({ items, tone }: { items: string[]; tone: "error" | "warning" }) {
  if (items.length === 0) return <span className="text-[10px] text-[#8b9098]">{"\u2014"}</span>;
  const toneCls = tone === "error" ? "text-rose-700" : "text-[#8c4400]";
  return (
    <ul className={`list-disc space-y-0.5 pl-4 text-[11px] ${toneCls}`}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-[#dfe1e4] bg-[#f6f7f8] px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8b9098]">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-[#2a2b2c]">{value}</div>
      <div className="mt-0.5 text-[10px] text-[#8b9098]">{detail}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Failure / success summary card                                     */
/* ------------------------------------------------------------------ */

function FailureSummaryCard({ summary }: { summary: FailureSummary }) {
  const tone = severityTone(summary.severity);
  return (
    <div className={`rounded-[12px] border p-4 ${tone.container}`}>
      <div className="flex flex-wrap items-start gap-2">
        <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${tone.glyph}`}>
          {severityGlyph(summary.severity)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-medium uppercase tracking-[0.08em] ${tone.label}`}>
              {summary.severity === "success" ? "Clean run" : summary.severity === "warning" ? "Completed with issues" : summary.severity === "info" ? "Info" : "Failure"}
            </span>
            {summary.stage !== "none" && (
              <span className="rounded-[3px] border border-[#dfe1e4] bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">
                stage: {summary.stage.replace(/_/g, " ")}
              </span>
            )}
            {summary.request_id && (
              <div className="flex items-center gap-1">
                <span className="rounded-[3px] border border-[#dfe1e4] bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-[#3a3d43]">
                  req: {summary.request_id}
                </span>
                <CopyButton text={summary.request_id} label="copy" />
              </div>
            )}
          </div>
          <p className={`mt-1 text-[13px] font-semibold leading-5 ${tone.headline}`}>{summary.headline}</p>
          {summary.findings.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] leading-5 text-[#4e525a]">
              {summary.findings.map((f, i) => (
                <li key={i}>
                  <span className="font-medium text-[#3a3d43]">{f.label}:</span> {f.detail}
                  {f.request_id && <span className="ml-1 font-mono text-[10px] text-[#8b9098]">(req: {f.request_id})</span>}
                </li>
              ))}
            </ul>
          )}
          {summary.recommended_action && (
            <div className={`mt-2 rounded-[8px] border border-dashed bg-white/60 px-2.5 py-1.5 text-[11px] leading-5 ${tone.action}`}>
              <span className="font-medium">Next:</span> {summary.recommended_action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function severityTone(severity: FailureSeverity): { container: string; glyph: string; label: string; headline: string; action: string } {
  switch (severity) {
    case "error":
      return { container: "border-rose-300/60 bg-rose-50", glyph: "border-rose-400 bg-rose-100 text-rose-700", label: "text-rose-700", headline: "text-rose-900", action: "border-rose-300/50 text-rose-800" };
    case "warning":
      return { container: "border-[#fcd4a3]/60 bg-[#fff1de]", glyph: "border-[#fcd4a3] bg-[#fff1de] text-[#8c4400]", label: "text-[#8c4400]", headline: "text-[#5c2d00]", action: "border-[#fcd4a3]/50 text-[#8c4400]" };
    case "info":
      return { container: "border-sky-300/60 bg-sky-50", glyph: "border-sky-400 bg-sky-100 text-sky-700", label: "text-sky-700", headline: "text-sky-900", action: "border-sky-300/50 text-sky-800" };
    case "success":
    default:
      return { container: "border-[#a8ddc7] bg-[#e3f5ee]", glyph: "border-[#a8ddc7] bg-[#e3f5ee] text-[#0c6a4e]", label: "text-[#0c6a4e]", headline: "text-[#003d5b]", action: "border-[#a8ddc7]/50 text-[#0c6a4e]" };
  }
}

function severityGlyph(severity: FailureSeverity): string {
  switch (severity) {
    case "error":   return "!";
    case "warning": return "\u25B2";
    case "info":    return "i";
    default:        return "\u2713";
  }
}

/* ------------------------------------------------------------------ */
/*  Quick actions                                                      */
/* ------------------------------------------------------------------ */

function QuickActions({ trace }: { trace: ExecutionTrace }) {
  const latestPush = trace.push.audit.length ? trace.push.audit[trace.push.audit.length - 1] : null;
  const requestId = latestPush?.request_id ?? trace.failure_summary.request_id ?? null;
  const rawPayload = trace.payloads.blueprint_json ?? trace.payloads.brief_json ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#dfe1e4] bg-[#f6f7f8] px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#8b9098]">Quick actions</span>
      <CopyButton text={requestId ?? ""} disabled={!requestId} label={requestId ? "Copy request id" : "No request id"} />
      <CopyButton text={trace.overview.campaign_underscore} label="Copy _campaign" />
      <CopyButton text={trace.overview.campaign_name} label="Copy campaign name" />
      <CopyButton text={rawPayload} disabled={!rawPayload} label={`Copy raw payload (${rawPayload ? rawPayload.length.toLocaleString() : 0} B)`} />
      <CopyButton text={trace.overview.run_id} label="Copy run id" />
      <div className="ml-auto flex items-center gap-1">
        <Link href={`/mcp/beacon/runs/compare?a=${trace.overview.run_id}`}
          className="rounded-[6px] border border-[#dfe1e4] bg-white px-2 py-1 text-[11px] font-medium text-[#6b7079] hover:bg-[#f3f6f9]">
          Compare with&hellip;
        </Link>
        <Link href="/mcp/beacon/runs"
          className="rounded-[6px] border border-[#dfe1e4] bg-white px-2 py-1 text-[11px] font-medium text-[#6b7079] hover:bg-[#f6f7f8]">
          All runs
        </Link>
      </div>
    </div>
  );
}

function CopyButton({ text, label, disabled }: { text: string; label: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async () => {
    if (disabled || !text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard unavailable */ }
  }, [text, disabled]);

  return (
    <button onClick={handle} disabled={disabled}
      className={`rounded-[6px] border px-2 py-1 text-[11px] font-medium transition ${
        disabled
          ? "cursor-not-allowed border-[#dfe1e4] bg-white text-[#b4b8be]"
          : copied
            ? "border-[#a8ddc7] bg-[#e3f5ee] text-[#0c6a4e]"
            : "border-[#dfe1e4] bg-white text-[#3a3d43] hover:border-[#7bb8c2] hover:bg-[#f9fbfa]"
      }`}
      title={disabled ? "not available" : `copy: ${text}`}>
      {copied ? "Copied" : label}
    </button>
  );
}
