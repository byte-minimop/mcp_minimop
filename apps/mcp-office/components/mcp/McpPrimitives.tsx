/**
 * Shared design-system primitives for all MCP pages.
 * No "use client" — works in both server and client component trees.
 */

import React from "react";
import { McpHeaderSearch } from "@/components/mcp/McpHeaderSearch";

/* ================================================================== */
/*  Layout                                                             */
/* ================================================================== */

/** Outer padding applied to every page's content area (below the TopBar). */
export const PAGE_PAD = "px-6 py-6 sm:px-7 sm:py-[22px]";

/* ================================================================== */
/*  PageHeader — full-bleed white TopBar                               */
/*  Uses negative margins to break out of PAGE_PAD container.          */
/* ================================================================== */

export function PageHeader({
  crumb,
  title,
  subtitle,
  badge,
  statusBadge,
  right,
}: {
  crumb: string;
  title: string;
  subtitle: string;
  badge?: string;
  statusBadge?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="-mx-6 -mt-6 mb-6 border-b border-[#ebecee] bg-white px-6 py-[18px] sm:-mx-7 sm:-mt-[22px] sm:px-7">
      <div className="flex items-end justify-between gap-5">
        <div className="min-w-0 flex-1">
          {crumb && (
            <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b9098]">
              {crumb}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#003d5b]">
              {title}
            </h1>
            {badge && (
              <span className="rounded-[5px] border border-[#c9b8db] bg-[#f3eef8] px-2 py-0.5 text-[11px] font-semibold text-[#6a4c93]">
                {badge}
              </span>
            )}
            {statusBadge && <StatusPill status={statusBadge} />}
          </div>
          {subtitle && (
            <p className="mt-1 text-[13px] text-[#6b7079]">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <McpHeaderSearch />
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SectionLabel — with horizontal divider                            */
/* ================================================================== */

export function SectionLabel({
  children,
  badge,
  className,
  id,
}: {
  children: React.ReactNode;
  badge?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`flex items-center gap-2.5 ${className !== undefined ? className : "mb-2.5"}`}
    >
      <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b9098]">
        {children}
      </span>
      {badge && (
        <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 text-[9px] text-[#8b9098]">
          {badge}
        </span>
      )}
      <div className="h-px flex-1 bg-[#ebecee]" />
    </div>
  );
}

/* ================================================================== */
/*  StatusPill — pill shape (rounded-full) matching design             */
/* ================================================================== */

const STATUS_STYLES: Record<string, string> = {
  live:             "bg-[#e3f5ee] border-[#a8ddc7] text-[#0c6a4e]",
  active:           "bg-[#d6ebee] border-[#7bb8c2] text-[#004047]",
  "in-development": "bg-[#fff1de] border-[#fcd4a3] text-[#8c4400]",
  planned:          "bg-[#f2f2f2] border-[#cfd2d6] text-[#6b7079]",
  future:           "bg-[#f2f2f2] border-[#cfd2d6] text-[#6b7079]",
};
const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  active: "Active",
  "in-development": "In development",
  planned: "Planned",
  future: "Future",
};
const STATUS_DOTS: Record<string, string> = {
  live:             "bg-[#168f6b]",
  active:           "bg-[#007380]",
  "in-development": "bg-[#ff8400]",
  planned:          "bg-[#b4b8be]",
  future:           "bg-[#cfd2d6]",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${
        STATUS_STYLES[status] ?? STATUS_STYLES.planned
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] ?? STATUS_DOTS.planned}`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Small dot-only indicator (no label) used in dense rows. */
export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block h-[7px] w-[7px] rounded-full ${
        STATUS_DOTS[status] ?? STATUS_DOTS.planned
      }`}
    />
  );
}

/* ================================================================== */
/*  MetricTile — Nunito font-display, 28px value                      */
/* ================================================================== */

export function MetricTile({
  label,
  value,
  detail,
  badge,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  badge?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[12px] border p-[14px_16px] shadow-[0_1px_2px_rgba(0,61,91,.06),0_1px_3px_rgba(0,61,91,.04)] ${
        accent ? "border-[#a8ddc7] bg-[#e3f5ee]" : "border-[#dfe1e4] bg-white"
      }`}
    >
      {accent && (
        <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#25e2cc]" />
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7079]">
          {label}
        </div>
        {badge && (
          <span className="shrink-0 rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[9px] text-[#8b9098]">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`mt-1 font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] ${
          accent ? "text-[#0c6a4e]" : "text-[#003d5b]"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] text-[#6b7079]">{detail}</div>
    </div>
  );
}

/* ================================================================== */
/*  ContentCard                                                        */
/* ================================================================== */

export function ContentCard({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_1px_2px_rgba(0,61,91,.06),0_1px_3px_rgba(0,61,91,.04)] ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

export function TrayCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border border-[#dfe1e4] bg-[#f6f7f8] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  SideCard                                                           */
/* ================================================================== */

export function SideCard({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border p-4 shadow-[0_1px_2px_rgba(0,61,91,.06),0_1px_3px_rgba(0,61,91,.04)] ${
        highlight
          ? "border-[#a8ddc7] bg-[#e3f5ee]"
          : "border-[#dfe1e4] bg-white"
      }`}
    >
      <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#8b9098]">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ================================================================== */
/*  SourceBadge                                                        */
/* ================================================================== */

export function SourceBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[4px] border border-[#dfe1e4] bg-[#f6f7f8] px-1.5 py-0.5 font-mono text-[9px] text-[#8b9098]">
      {children}
    </span>
  );
}

/* ================================================================== */
/*  List row helpers                                                   */
/* ================================================================== */

export function ListRow({
  children,
  last,
}: {
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-2.5 ${
        last ? "" : "border-b border-[#ebecee]"
      }`}
    >
      {children}
    </div>
  );
}

export function MonoId({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-[80px] shrink-0 font-mono text-[11.5px] font-bold text-[#003d5b]">
      {children}
    </span>
  );
}

export function MonoTime({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-[72px] shrink-0 font-mono text-[10px] text-[#8b9098]">
      {children}
    </span>
  );
}
