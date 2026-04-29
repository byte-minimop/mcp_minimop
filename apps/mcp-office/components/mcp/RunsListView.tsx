"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type RunListRow,
  type TraceStatus,
  formatDurationShort,
} from "@/lib/mcp/execution-trace-types";
import { PAGE_PAD, PageHeader, SectionLabel } from "@/components/mcp/McpPrimitives";

/* ------------------------------------------------------------------ */
/*  Status chip helpers                                                */
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

function reviewStatusChipClasses(status: string) {
  switch (status) {
    case "pushed":        return "border-[#a8ddc7] bg-[#e3f5ee] text-[#0c6a4e]";
    case "ready_to_push": return "border-[#7bb8c2] bg-[#d6ebee] text-[#004047]";
    case "approved":      return "border-indigo-300/50 bg-indigo-50 text-indigo-700";
    case "push_failed":   return "border-rose-300/50 bg-rose-50 text-rose-700";
    case "draft":         return "border-[#cfd2d6] bg-[#f2f2f2] text-[#6b7079]";
    default:              return "border-[#cfd2d6] bg-[#f2f2f2] text-[#6b7079]";
  }
}

function pushChipClasses(status: RunListRow["push_status"]) {
  switch (status) {
    case "pushed":            return "border-[#a8ddc7] bg-[#e3f5ee] text-[#0c6a4e]";
    case "validation_failed":
    case "failed":            return "border-rose-300/50 bg-rose-50 text-rose-700";
    case "blocked":           return "border-[#fcd4a3] bg-[#fff1de] text-[#8c4400]";
    default:                  return "border-[#cfd2d6] bg-[#f2f2f2] text-[#6b7079]";
  }
}

function pushLabel(status: RunListRow["push_status"]): string {
  switch (status) {
    case "pushed":            return "pushed";
    case "validation_failed": return "validation failed";
    case "failed":            return "failed";
    case "blocked":           return "blocked";
    case "not_pushed":        return "not pushed";
    default:                  return status;
  }
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 16) + "Z";
}

/* ------------------------------------------------------------------ */
/*  Filter state                                                       */
/* ------------------------------------------------------------------ */

type TriState = "any" | "yes" | "no";

interface Filters {
  q: string;
  status: string;
  family: string;
  validation: string;
  push: string;
  multilingual: TriState;
  fallback: TriState;
  warnings: TriState;
  errors: TriState;
}

const EMPTY_FILTERS: Filters = {
  q: "", status: "", family: "", validation: "", push: "",
  multilingual: "any", fallback: "any", warnings: "any", errors: "any",
};

function matchesTri(value: boolean, tri: TriState): boolean {
  if (tri === "any") return true;
  return tri === "yes" ? value : !value;
}

function matchesQuery(row: RunListRow, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.run_id, row.campaign_title, row.campaign_underscore,
    row.family, row.markets.join(" "), row.locales.join(" "),
    row.request_ids.join(" "), row.status,
    row.customer_id ?? "", row.creator ?? "",
  ].join(" ").toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((term) => hay.includes(term));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export type RunsListScope =
  | { kind: "all" }
  | { kind: "customer"; customer_id: string };

export function RunsListView({
  runs,
  available,
  scope = { kind: "all" },
  initialQuery = "",
}: {
  runs: RunListRow[];
  available: boolean;
  scope?: RunsListScope;
  initialQuery?: string;
}) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, q: initialQuery });
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setFilters((prev) => (prev.q === initialQuery ? prev : { ...prev, q: initialQuery }));
  }, [initialQuery]);

  // Live refresh: the page is force-dynamic, so router.refresh() re-runs the
  // server component and re-reads the SQLite. Polling at 5s keeps the view
  // honest without requiring user action. Tab visibility is respected so
  // background tabs don't burn cycles.
  useEffect(() => {
    if (!available) return;
    const tick = () => {
      if (typeof document === "undefined" || !document.hidden) {
        router.refresh();
      }
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [available, router]);

  const families = useMemo(() => {
    const s = new Set<string>();
    for (const r of runs) s.add(r.family);
    return Array.from(s).sort();
  }, [runs]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    for (const r of runs) s.add(r.status);
    return Array.from(s).sort();
  }, [runs]);

  const filtered = useMemo(() => {
    return runs.filter((r) => {
      if (!matchesQuery(r, filters.q)) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.family && r.family !== filters.family) return false;
      if (filters.validation && r.validation_status !== filters.validation) return false;
      if (filters.push && r.push_status !== filters.push) return false;
      if (!matchesTri(r.multilingual, filters.multilingual)) return false;
      if (!matchesTri(r.fallback_used, filters.fallback)) return false;
      if (!matchesTri(r.has_warnings, filters.warnings)) return false;
      if (!matchesTri(r.has_errors, filters.errors)) return false;
      return true;
    });
  }, [runs, filters]);

  const totalPushed = filtered.filter((r) => r.push_status === "pushed").length;
  const totalValidationFailed = filtered.filter((r) => r.push_status === "validation_failed").length;
  const totalError = filtered.filter((r) => r.has_errors).length;
  const totalWarning = filtered.filter((r) => r.has_warnings).length;

  function toggleSelected(runId: string) {
    setSelected((prev) => {
      if (prev.includes(runId)) return prev.filter((x) => x !== runId);
      if (prev.length >= 2) return [prev[1], runId];
      return [...prev, runId];
    });
  }

  function compareSelected() {
    if (selected.length !== 2) return;
    router.push(`/mcp/beacon/runs/compare?a=${selected[0]}&b=${selected[1]}`);
  }

  const activeFilterCount =
    (filters.status ? 1 : 0) + (filters.family ? 1 : 0) +
    (filters.validation ? 1 : 0) + (filters.push ? 1 : 0) +
    (filters.multilingual !== "any" ? 1 : 0) + (filters.fallback !== "any" ? 1 : 0) +
    (filters.warnings !== "any" ? 1 : 0) + (filters.errors !== "any" ? 1 : 0);

  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Beacon"
        title="Runs"
        subtitle={
          scope.kind === "customer"
            ? `Scoped to account ${scope.customer_id} — same lens as Beacon Queue. View all: remove ?scope=account or ?customer_id`
            : "All accounts (admin-wide). Add ?scope=account to match Beacon Queue's active account lens."
        }
        statusBadge="live"
      />

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "In view",            value: String(filtered.length),         detail: `${runs.length} total` },
          { label: "Pushed",             value: String(totalPushed),             detail: "succeeded on Google Ads" },
          { label: "With errors",        value: String(totalError),              detail: "hard gaps or push fails" },
          { label: "With warnings",      value: String(totalWarning),            detail: "soft gaps / bundle warn" },
          { label: "Validation fails",   value: String(totalValidationFailed),   detail: "Google Ads validateOnly" },
        ].map((m) => (
          <div key={m.label} className="rounded-[12px] border border-[#dfe1e4] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,61,91,.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6b7079]">{m.label}</div>
            <div className="mt-1 font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#003d5b]">{m.value}</div>
            <div className="mt-0.5 text-[11px] text-[#6b7079]">{m.detail}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mt-4 rounded-[12px] border border-[#dfe1e4] bg-[#f6f7f8] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search run id, campaign, locale, request id…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="min-w-[260px] flex-1 rounded-[8px] border border-[#dfe1e4] bg-white px-3 py-1.5 text-[12px] text-[#2a2b2c] placeholder:text-[#8b9098] focus:border-[#7bb8c2] focus:outline-none"
          />
          <Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}
            options={[{ value: "", label: "Any status" }, ...statuses.map((s) => ({ value: s, label: s }))]} />
          <Select value={filters.family} onChange={(v) => setFilters({ ...filters, family: v })}
            options={[{ value: "", label: "Any family" }, ...families.map((f) => ({ value: f, label: f }))]} />
          <Select value={filters.validation} onChange={(v) => setFilters({ ...filters, validation: v })}
            options={[
              { value: "", label: "Any valid." }, { value: "ok", label: "OK" },
              { value: "warning", label: "Warning" }, { value: "error", label: "Error" },
            ]} />
          <Select value={filters.push} onChange={(v) => setFilters({ ...filters, push: v })}
            options={[
              { value: "", label: "Any push" }, { value: "pushed", label: "Pushed" },
              { value: "validation_failed", label: "Validation failed" }, { value: "failed", label: "Failed" },
              { value: "blocked", label: "Blocked" }, { value: "not_pushed", label: "Not pushed" },
            ]} />
          {activeFilterCount > 0 && (
            <button onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-[6px] border border-[#dfe1e4] bg-white px-2.5 py-1 text-[11px] font-medium text-[#003d5b] hover:bg-[#f3f6f9]">
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6b7079]">
          <TriFilter label="Multilingual" value={filters.multilingual} onChange={(v) => setFilters({ ...filters, multilingual: v })} />
          <TriFilter label="Fallback used" value={filters.fallback} onChange={(v) => setFilters({ ...filters, fallback: v })} />
          <TriFilter label="Has warnings" value={filters.warnings} onChange={(v) => setFilters({ ...filters, warnings: v })} />
          <TriFilter label="Has errors" value={filters.errors} onChange={(v) => setFilters({ ...filters, errors: v })} />
        </div>
      </div>

      {/* Compare bar */}
      <div className="mt-3 flex items-center justify-between rounded-[10px] border border-dashed border-[#dfe1e4] bg-[#f9fbfa] px-3 py-1.5">
        <div className="text-[11px] text-[#6b7079]">
          {selected.length === 0 && <>Tick any two rows to compare them side-by-side.</>}
          {selected.length === 1 && <>1 run selected. Pick one more to compare.</>}
          {selected.length === 2 && (
            <>Comparing <span className="font-mono">{selected[0].slice(0, 8)}</span>{" \u2194 "}<span className="font-mono">{selected[1].slice(0, 8)}</span></>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={() => setSelected([])}
              className="rounded-[6px] border border-[#dfe1e4] bg-white px-2 py-1 text-[11px] font-medium text-[#6b7079] hover:bg-[#f6f7f8]">
              Clear
            </button>
          )}
          <button onClick={compareSelected} disabled={selected.length !== 2}
            className={`rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition ${
              selected.length === 2
                ? "border border-[#a8ddc7] bg-[#e3f5ee] text-[#0c6a4e] hover:bg-[#d2f0e4]"
                : "border border-[#dfe1e4] bg-white text-[#b4b8be]"
            }`}>
            Compare &rarr;
          </button>
        </div>
      </div>

      {/* Runs table */}
      <div className="mt-3 overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06)]">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="bg-[#f6f7f8] text-[10px] uppercase tracking-[0.08em] text-[#8b9098]">
            <tr>
              <Th>&nbsp;</Th>
              <Th>Run ID</Th>
              <Th>Brief / campaign</Th>
              <Th>Family</Th>
              <Th>Markets / locales</Th>
              <Th>Status</Th>
              <Th>Started</Th>
              <Th>Dur.</Th>
              <Th>Valid.</Th>
              <Th>Push</Th>
              <Th>Flags</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-[12px] text-[#8b9098]">
                  {!available
                    ? "Beacon SQLite not reachable — Execution Trace is disabled. Set BEACON_SQLITE_PATH to enable."
                    : runs.length === 0
                      ? "No runs in beacon.sqlite."
                      : "No runs match the current filters."}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.run_id}
                className={`border-t border-[#ebecee] hover:bg-[#f9fbfa] ${selected.includes(r.run_id) ? "bg-[#f3f6f9]" : ""}`}>
                <Td>
                  <input type="checkbox" aria-label={`Select run ${r.run_id}`}
                    checked={selected.includes(r.run_id)} onChange={() => toggleSelected(r.run_id)}
                    className="accent-[#003d5b]" />
                </Td>
                <Td>
                  <Link href={`/mcp/beacon/runs/${r.run_id}`} className="font-mono text-[11px] text-[#003d5b] hover:underline">
                    {r.run_id.slice(0, 8)}
                  </Link>
                </Td>
                <Td>
                  <Link href={`/mcp/beacon/runs/${r.run_id}`}
                    className="block max-w-[360px] truncate font-medium text-[#2a2b2c] hover:underline"
                    title={r.campaign_title}>
                    {r.campaign_title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#8b9098]">
                    {r.customer_id && (
                      <span className="font-mono">{r.customer_id}</span>
                    )}
                    {r.creator && (
                      <span className="flex items-center gap-1">
                        {r.creator}
                        {r.creator_is_dev && (
                          <span className="rounded-[3px] border border-[#fcd4a3] bg-[#fff1de] px-1 py-0.5 font-medium text-[#8c4400]">dev</span>
                        )}
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 text-[10px] font-medium text-[#3a3d43]">
                    {r.family}
                  </span>
                </Td>
                <Td>
                  <div className="text-[11px] text-[#6b7079]">
                    {r.markets.length > 0 ? r.markets.join(", ") : "\u2014"}
                  </div>
                  {r.locales.length > 0 && (
                    <div className="mt-0.5 font-mono text-[10px] text-[#8b9098]">
                      {r.locales.join(" · ")}
                    </div>
                  )}
                </Td>
                <Td>
                  <span className={`inline-flex rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium ${reviewStatusChipClasses(r.status)}`}>
                    {r.status}
                  </span>
                </Td>
                <Td>
                  <span className="font-mono text-[10px] text-[#6b7079]">{formatTs(r.started_at)}</span>
                </Td>
                <Td>
                  <span className="font-mono text-[10px] text-[#6b7079]">{formatDurationShort(r.duration_ms)}</span>
                </Td>
                <Td>
                  <span className={`inline-flex rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium ${statusChipClasses(r.validation_status)}`}>
                    {r.validation_status}
                  </span>
                </Td>
                <Td>
                  <span className={`inline-flex rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium ${pushChipClasses(r.push_status)}`}>
                    {pushLabel(r.push_status)}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-0.5">
                    {r.multilingual && <Flag color="teal">multi</Flag>}
                    {r.fallback_used && <Flag color="orange">fallback</Flag>}
                    {r.has_errors && <Flag color="red">err</Flag>}
                    {!r.has_errors && r.has_warnings && <Flag color="orange">warn</Flag>}
                    {r.reconciliation === "status_overstates_push" && (
                      <Flag color="red" title="runs.review_status='pushed' but no successful push audit entry">drift</Flag>
                    )}
                    {r.reconciliation === "status_understates_push" && (
                      <Flag color="orange" title="latest push succeeded but status was rolled back">drift</Flag>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-[#8b9098]">
        Source of truth: Beacon SQLite tables <code className="font-mono">runs</code>,{" "}
        <code className="font-mono">run_versions</code>,{" "}
        <code className="font-mono">run_events</code>,{" "}
        <code className="font-mono">push_audit</code>. Read-only.
      </p>
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

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-[6px] border border-[#dfe1e4] bg-white px-2 py-1 text-[11px] text-[#3a3d43] focus:border-[#7bb8c2] focus:outline-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function TriFilter({ label, value, onChange }: {
  label: string; value: TriState; onChange: (v: TriState) => void;
}) {
  const opts: TriState[] = ["any", "yes", "no"];
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-[#8b9098]">{label}</span>
      <div className="inline-flex overflow-hidden rounded-[6px] border border-[#dfe1e4]">
        {opts.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-1.5 py-0.5 text-[10px] font-medium transition ${
              value === o ? "bg-[#f3f6f9] text-[#003d5b]" : "bg-white text-[#6b7079] hover:bg-[#f6f7f8]"
            }`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Flag({ children, color, title }: { children: React.ReactNode; color: "teal" | "orange" | "red"; title?: string }) {
  const cls =
    color === "teal"   ? "border-[#7bb8c2] bg-[#d6ebee] text-[#004047]" :
    color === "orange" ? "border-[#fcd4a3] bg-[#fff1de] text-[#8c4400]" :
                         "border-rose-300/50 bg-rose-50 text-rose-700";
  return (
    <span title={title} className={`inline-flex rounded-[3px] border px-1 py-0.5 text-[10px] font-medium ${cls}`}>
      {children}
    </span>
  );
}
