import {
  getPromotedPatterns,
  getCandidatePatterns,
  getLearningEventStats,
} from "@/lib/learning/store";
import type { LearningPatternRow } from "@/lib/learning/schema";
import type { FamilyOverrideContext, ServiceCorrectionContext, RecurringBlockerContext } from "@/lib/learning/schema";
import {
  PageHeader,
  SectionLabel,
  ContentCard,
  SourceBadge,
  PAGE_PAD,
} from "@/components/mcp/McpPrimitives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Display helpers ────────────────────────────────────────────────────────────

const PATTERN_META: Record<string, { label: string; color: string; dot: string; runtimeUse: string | null }> = {
  family_override_preference: {
    label: "Family override preference",
    color: "bg-[#fff1de] border-[#fcd4a3] text-[#8c4400]",
    dot:   "bg-[#ff8400]",
    runtimeUse: "Biasing family guidance scoring",
  },
  recurring_blocker_pattern: {
    label: "Recurring blocker",
    color: "bg-[#fef2f2] border-[#fca5a5] text-[#7f1d1d]",
    dot:   "bg-[#ef4444]",
    runtimeUse: "In MCPContextBundle recurring_blocker_warnings",
  },
  service_normalization_candidate: {
    label: "Service normalization",
    color: "bg-[#f3eef8] border-[#c9b8db] text-[#6a4c93]",
    dot:   "bg-[#8b5cf6]",
    runtimeUse: null, // not yet wired to runtime
  },
};

const PROMOTION_THRESHOLDS: Record<string, number> = {
  family_override_preference: 3,
  service_normalization_candidate: 2,
  recurring_blocker_pattern: 3,
};

function PatternContextSummary({ row }: { row: LearningPatternRow }) {
  try {
    const ctx = JSON.parse(row.context_json);
    switch (row.pattern_type) {
      case "family_override_preference": {
        const c = ctx as FamilyOverrideContext;
        return (
          <span className="text-[11px] text-[#6b7079]">
            <span className="font-mono text-[#003d5b]">{c.recommended_family}</span>
            {" → "}
            <span className="font-mono font-semibold text-[#003d5b]">{c.selected_family}</span>
            {c.service_category ? <span className="ml-1 text-[#8b9098]">· {c.service_category}</span> : null}
          </span>
        );
      }
      case "service_normalization_candidate": {
        const c = ctx as ServiceCorrectionContext;
        return (
          <span className="text-[11px] text-[#6b7079]">
            <span className="font-mono text-[#003d5b]">{c.raw_input}</span>
            {" → "}
            <span className="font-mono font-semibold text-[#003d5b]">{c.mcp_canonical}</span>
          </span>
        );
      }
      case "recurring_blocker_pattern": {
        const c = ctx as RecurringBlockerContext;
        return (
          <span className="text-[11px] text-[#6b7079]">
            <span className="font-mono text-[#003d5b]">{c.rule_id}</span>
            {" · "}
            <span className="text-[#8b9098]">{c.family}</span>
            {c.service_category ? <span className="ml-1 text-[#8b9098]">· {c.service_category}</span> : null}
          </span>
        );
      }
      default:
        return <span className="text-[11px] text-[#8b9098]">—</span>;
    }
  } catch {
    return <span className="text-[11px] text-[#8b9098]">—</span>;
  }
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function McpLearningPage() {
  let promoted: LearningPatternRow[] = [];
  let candidates: LearningPatternRow[] = [];
  let eventStats: Array<{ event_type: string; count: number }> = [];

  try {
    promoted  = getPromotedPatterns();
    candidates = getCandidatePatterns();
    eventStats = getLearningEventStats();
  } catch {
    // learning.sqlite may not exist yet if no events have been captured
  }

  const totalEvents = eventStats.reduce((sum, s) => sum + s.count, 0);
  const activePromoted = promoted.filter(
    (p) => PATTERN_META[p.pattern_type]?.runtimeUse !== null
  );

  return (
    <div className={PAGE_PAD}>
      <PageHeader
        crumb="Infrastructure / Learning"
        title="Learning"
        subtitle="Curated operational patterns derived from Beacon activity. Promoted patterns actively improve runtime guidance."
        statusBadge="live"
      />

      {/* Summary tiles */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: "Events captured",       value: totalEvents,          detail: "raw signals from Beacon" },
          { label: "Promoted patterns",     value: promoted.length,      detail: "runtime-active or advisory", accent: promoted.length > 0 },
          { label: "Runtime-active",        value: activePromoted.length, detail: "influencing guidance now",   accent: activePromoted.length > 0 },
          { label: "Candidate patterns",    value: candidates.length,     detail: "below promotion threshold" },
        ].map((t) => (
          <div key={t.label} className={`overflow-hidden rounded-[12px] border p-[14px_16px] shadow-[0_1px_2px_rgba(0,61,91,.06)] ${t.accent ? "border-[#a8ddc7] bg-[#e3f5ee]" : "border-[#dfe1e4] bg-white"}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7079]">{t.label}</div>
            <div className={`mt-1 font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] ${t.accent ? "text-[#0c6a4e]" : "text-[#003d5b]"}`}>{t.value}</div>
            <div className="mt-1 text-[12px] text-[#6b7079]">{t.detail}</div>
          </div>
        ))}
      </div>

      {/* Event stats */}
      {eventStats.length > 0 && (
        <div className="mb-6">
          <SectionLabel>Captured events by type</SectionLabel>
          <ContentCard>
            <div className="divide-y divide-[#ebecee]">
              {eventStats.map((s) => (
                <div key={s.event_type} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-[200px] shrink-0 font-mono text-[12px] text-[#003d5b]">{s.event_type}</span>
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebecee]">
                      <div
                        className="h-full rounded-full bg-[#007380]"
                        style={{ width: `${Math.min(100, (s.count / Math.max(totalEvents, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-[40px] shrink-0 text-right font-mono text-[12px] font-bold text-[#003d5b]">{s.count}</span>
                  <SourceBadge>events</SourceBadge>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      )}

      {/* Promoted patterns */}
      <div className="mb-6">
        <SectionLabel badge={`${promoted.length} promoted`}>Promoted patterns</SectionLabel>
        {promoted.length === 0 ? (
          <ContentCard>
            <div className="px-5 py-5 text-center">
              <p className="text-[13px] text-[#8b9098]">No promoted patterns yet.</p>
              <p className="mt-1 text-[12px] text-[#b4b8be]">Patterns are promoted when they cross the observation threshold (2–3 occurrences).</p>
            </div>
          </ContentCard>
        ) : (
          <ContentCard>
            <div className="divide-y divide-[#ebecee]">
              {promoted.map((p, i) => {
                const meta = PATTERN_META[p.pattern_type];
                const threshold = PROMOTION_THRESHOLDS[p.pattern_type] ?? 3;
                return (
                  <div key={p.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full ${meta?.dot ?? "bg-[#b4b8be]"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-[5px] border px-2 py-0.5 text-[10px] font-semibold ${meta?.color ?? "bg-[#f6f7f8] border-[#dfe1e4] text-[#6b7079]"}`}>
                            {meta?.label ?? p.pattern_type}
                          </span>
                          {meta?.runtimeUse ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#a8ddc7] bg-[#e3f5ee] px-2 py-0.5 text-[10px] font-semibold text-[#0c6a4e]">
                              <span className="h-[5px] w-[5px] rounded-full bg-[#168f6b]" />
                              Runtime active · {meta.runtimeUse}
                            </span>
                          ) : (
                            <span className="rounded-full border border-[#dfe1e4] bg-[#f6f7f8] px-2 py-0.5 text-[10px] text-[#8b9098]">
                              Advisory only
                            </span>
                          )}
                          <span className="ml-auto shrink-0 font-mono text-[11px] text-[#8b9098]">
                            {p.occurrence_count}× · threshold {threshold}
                          </span>
                        </div>
                        <div className="mb-1">
                          <PatternContextSummary row={p} />
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#8b9098]">{p.advisory_note}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#b4b8be]">
                          {p.promoted_at && <span>Promoted {fmt(p.promoted_at)}</span>}
                          <span>Last seen {fmt(p.last_seen)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ContentCard>
        )}
      </div>

      {/* Candidate patterns */}
      {candidates.length > 0 && (
        <div>
          <SectionLabel badge={`${candidates.length} below threshold`}>Candidate patterns · advisory only</SectionLabel>
          <ContentCard>
            <div className="divide-y divide-[#ebecee]">
              {candidates.map((p) => {
                const meta = PATTERN_META[p.pattern_type];
                const threshold = PROMOTION_THRESHOLDS[p.pattern_type] ?? 3;
                const pct = Math.min(100, Math.round((p.occurrence_count / threshold) * 100));
                return (
                  <div key={p.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-1 h-[7px] w-[7px] shrink-0 rounded-full bg-[#b4b8be]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-[5px] border px-1.5 py-0.5 text-[10px] font-semibold ${meta?.color ?? "bg-[#f6f7f8] border-[#dfe1e4] text-[#6b7079]"}`}>
                          {meta?.label ?? p.pattern_type}
                        </span>
                        <PatternContextSummary row={p} />
                        <span className="ml-auto shrink-0 font-mono text-[10px] text-[#8b9098]">{p.occurrence_count}/{threshold}</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-[#ebecee]">
                        <div className="h-full rounded-full bg-[#b4b8be]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ContentCard>
        </div>
      )}
    </div>
  );
}
