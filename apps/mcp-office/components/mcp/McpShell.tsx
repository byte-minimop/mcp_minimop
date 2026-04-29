"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Grid3x3,
  Users,
  GitBranch,
  BookOpen,
  Database,
  Plug,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type NavStatus = "live" | "active" | "in-development" | "planned" | "future";

function statusDotColor(s: NavStatus) {
  if (s === "live") return "bg-[#168f6b]";
  if (s === "active") return "bg-[#007380]";
  if (s === "in-development") return "bg-[#ff8400]";
  return "bg-[#b4b8be]";
}

const WORKSPACE: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "overview",     label: "Overview",     icon: LayoutDashboard, href: "/mcp" },
  { id: "office",       label: "Office",       icon: Grid3x3,         href: "/mcp/office" },
  { id: "coworkers",    label: "Coworkers",    icon: Users,           href: "/mcp/coworkers" },
  { id: "architecture", label: "Architecture", icon: GitBranch,       href: "/mcp/architecture" },
];

const INFRA: Array<{ id: string; label: string; icon: LucideIcon; href: string; status: NavStatus }> = [
  { id: "knowledge",    label: "Knowledge",    icon: BookOpen,    href: "/mcp/knowledge",    status: "live"   },
  { id: "learning",     label: "Learning",     icon: TrendingUp,  href: "/mcp/learning",     status: "live"   },
  { id: "memory",       label: "Memory",       icon: Database,    href: "/mcp/memory",       status: "active" },
  { id: "integrations", label: "Integrations", icon: Plug,        href: "/mcp/integrations", status: "active" },
  { id: "ops",          label: "Ops",          icon: ShieldCheck, href: "/mcp/ops",          status: "active" },
];

const WORKERS: Array<{ id: string; label: string; href: string; status: NavStatus; sub?: boolean }> = [
  { id: "beacon",   label: "Beacon",   href: "/mcp/beacon",       status: "live" },
  { id: "runs",     label: "Runs",     href: "/mcp/beacon/runs",  status: "live",           sub: true },
  { id: "tagpilot", label: "TagPilot", href: "/mcp/tagpilot",     status: "in-development" },
  { id: "lumen",    label: "Lumen",    href: "/mcp/lumen",        status: "planned" },
];

export function McpShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/mcp") return pathname === "/mcp";
    return pathname === href;
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col overflow-y-auto border-r border-[#dfe1e4] bg-white">

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-[18px] pb-4 pt-[18px]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#003d5b]">
            <div className="relative h-[11px] w-5 rounded-[999px] bg-[#25e2cc]">
              <div className="absolute right-[1px] top-[1px] h-[9px] w-[9px] rounded-full bg-white" />
            </div>
          </div>
          <div>
            <div className="font-display text-[15px] font-extrabold leading-none tracking-[-0.01em] text-[#003d5b]">
              Marketing MCP
            </div>
            <div className="mt-0.5 text-[10.5px] font-medium tracking-[0.02em] text-[#8b9098]">
              Concentrix · v0.9 beta
            </div>
          </div>
        </div>

        <div className="mx-3.5 h-px bg-[#ebecee]" />

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3.5">
          <NavSection label="Workspace">
            {WORKSPACE.map((item) => (
              <NavItem key={item.id} href={item.href} active={isActive(item.href)}
                label={item.label} Icon={item.icon} />
            ))}
          </NavSection>

          <NavSection label="Infrastructure" className="mt-[18px]">
            {INFRA.map((item) => (
              <NavItem key={item.id} href={item.href} active={isActive(item.href)}
                label={item.label} Icon={item.icon} status={item.status} compact />
            ))}
          </NavSection>

          <NavSection label="Coworkers" className="mt-[18px]">
            {WORKERS.map((item) => (
              <NavItem key={item.id} href={item.href} active={isActive(item.href)}
                label={item.label} status={item.status} compact sub={item.sub} />
            ))}
          </NavSection>
        </nav>

        {/* Status widget */}
        <div className="mx-3 mb-3 rounded-[10px] border border-[#bff6ed] bg-[#eefcf9] p-3">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex">
              <span className="h-2 w-2 rounded-full bg-[#168f6b]" />
              <span className="absolute inset-[-3px] animate-ping rounded-full bg-[#168f6b] opacity-25" />
            </span>
            <span className="font-display text-[12px] font-bold text-[#003d5b]">All systems nominal</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-[1.5] text-[#4e525a]">
            1 worker live · 4 infra active · 6 connectors up
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 border-t border-[#ebecee] px-3.5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007380] font-display text-[12px] font-bold text-white">
            MV
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-none text-[#2a2b2c]">Aitor Aguilar</div>
            <div className="mt-0.5 text-[11px] text-[#8b9098]">Platform · Marketing</div>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function NavSection({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-1 ${className ?? ""}`}>
      <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9098]">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({
  href,
  active,
  label,
  Icon,
  status,
  compact,
  sub,
}: {
  href: string;
  active: boolean;
  label: string;
  Icon?: LucideIcon;
  status?: NavStatus;
  compact?: boolean;
  sub?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2.5 rounded-[7px] text-[13px] transition-all ${
        sub ? "py-[5px] pl-8 pr-3 text-[12px]" : compact ? "px-3 py-[6px]" : "px-3 py-2"
      } ${
        active
          ? "bg-[#f3f6f9] font-semibold text-[#003d5b]"
          : "font-medium text-[#4e525a] hover:bg-[#f6f7f8] hover:text-[#2a2b2c]"
      }`}
    >
      {active && (
        <span className="absolute bottom-[6px] left-0 top-[6px] w-[3px] rounded-r-[3px] bg-[#25e2cc]" />
      )}
      {Icon && (
        <Icon
          size={15}
          strokeWidth={2}
          className={`shrink-0 ${active ? "text-[#003d5b]" : "text-[#8b9098]"}`}
        />
      )}
      <span className="flex-1">{label}</span>
      {status && (
        <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${statusDotColor(status)}`} />
      )}
    </Link>
  );
}
