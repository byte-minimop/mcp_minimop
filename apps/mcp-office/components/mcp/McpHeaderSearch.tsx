"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SearchTarget = {
  id: string;
  label: string;
  href: string;
  kind: string;
  description: string;
  keywords: string[];
};

const SEARCH_TARGETS: SearchTarget[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/mcp",
    kind: "Workspace",
    description: "System summary, worker status, and top-level MCP metrics.",
    keywords: ["dashboard", "workspace", "summary", "systems"],
  },
  {
    id: "office",
    label: "Office",
    href: "/mcp/office",
    kind: "Workspace",
    description: "Interactive office view across systems, memory, and operators.",
    keywords: ["workspace", "office", "rooms", "systems"],
  },
  {
    id: "coworkers",
    label: "Coworkers",
    href: "/mcp/coworkers",
    kind: "Workspace",
    description: "Workers, responsibilities, and execution ownership.",
    keywords: ["workers", "people", "specialists", "systems"],
  },
  {
    id: "architecture",
    label: "Architecture",
    href: "/mcp/architecture",
    kind: "Workspace",
    description: "How orchestration, foundation, and external systems fit together.",
    keywords: ["orchestration", "systems", "integrations", "connectors"],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    href: "/mcp/knowledge",
    kind: "Infrastructure",
    description: "What the MCP knows: references, docs, and domain truth.",
    keywords: ["docs", "documentation", "search", "reference", "system"],
  },
  {
    id: "memory",
    label: "Memory",
    href: "/mcp/memory",
    kind: "Infrastructure",
    description: "Operational history for runs, state transitions, and push audits.",
    keywords: ["history", "runs", "trace", "audit", "system"],
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/mcp/integrations",
    kind: "Infrastructure",
    description: "Connected external systems and platform connectors.",
    keywords: ["systems", "connectors", "apis", "google ads", "azure", "asana"],
  },
  {
    id: "ops",
    label: "Ops",
    href: "/mcp/ops",
    kind: "Infrastructure",
    description: "Brief rules, readiness gates, and publish permissions.",
    keywords: ["rules", "validation", "governance", "permissions", "readiness"],
  },
  {
    id: "beacon",
    label: "Beacon",
    href: "/mcp/beacon",
    kind: "Worker",
    description: "Google Ads worker status, activity, and delivery surfaces.",
    keywords: ["worker", "google ads", "campaigns", "system"],
  },
  {
    id: "runs",
    label: "Runs",
    href: "/mcp/beacon/runs",
    kind: "Worker",
    description: "Search and inspect Beacon campaign runs.",
    keywords: ["run", "campaign", "trace", "execution", "request id"],
  },
  {
    id: "tagpilot",
    label: "TagPilot",
    href: "/mcp/tagpilot",
    kind: "Worker",
    description: "GTM and GA4 specialist worker surface.",
    keywords: ["gtm", "ga4", "tagging", "measurement"],
  },
  {
    id: "lumen",
    label: "Lumen",
    href: "/mcp/lumen",
    kind: "Worker",
    description: "SEO and insights specialist worker surface.",
    keywords: ["seo", "insights", "reporting"],
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function scoreTarget(target: SearchTarget, query: string): number {
  const q = normalize(query);
  if (!q) return 1;

  const haystack = normalize(
    [target.label, target.kind, target.description, ...target.keywords].join(" "),
  );
  const terms = q.split(/\s+/).filter(Boolean);
  if (!terms.every((term) => haystack.includes(term))) return 0;

  let score = 0;
  if (normalize(target.label) === q) score += 100;
  if (normalize(target.label).startsWith(q)) score += 40;
  if (haystack.includes(q)) score += 20;
  score += Math.max(0, 10 - terms.length);
  return score;
}

export function McpHeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const ranked = SEARCH_TARGETS
      .map((target) => ({ target, score: scoreTarget(target, query) }))
      .filter((entry) => entry.score > 0 && entry.target.href !== pathname)
      .sort((a, b) => b.score - a.score || a.target.label.localeCompare(b.target.label))
      .slice(0, 7)
      .map((entry) => entry.target);

    if (!query.trim()) return ranked;

    return [
      {
        id: "runs-query",
        label: `Search runs for "${query.trim()}"`,
        href: `/mcp/beacon/runs?q=${encodeURIComponent(query.trim())}`,
        kind: "Search",
        description: "Filter Beacon runs by run id, campaign, locale, family, or request id.",
        keywords: [],
      },
      ...ranked,
    ];
  }, [pathname, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onSubmit() {
    const chosen = results[activeIndex] ?? results[0];
    if (!chosen) return;
    navigate(chosen.href);
  }

  return (
    <div ref={containerRef} className="relative flex min-w-[280px] items-center gap-2 rounded-[8px] border border-[#dfe1e4] bg-[#f6f7f8] px-3 py-[7px]">
      <Search className="h-3.5 w-3.5 shrink-0 text-[#8b9098]" />
      <input
        ref={inputRef}
        type="search"
        aria-label="Search systems, runs, rules"
        placeholder="Search systems, runs, rules…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="flex-1 bg-transparent text-[12.5px] text-[#3a3d43] outline-none placeholder:text-[#8b9098]"
      />
      <kbd className="rounded-[4px] border border-[#dfe1e4] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#8b9098]">
        ⌘K
      </kbd>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[12px] border border-[#dfe1e4] bg-white shadow-[0_8px_30px_rgba(0,61,91,.12)]">
          <div className="border-b border-[#ebecee] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b9098]">
            {query.trim() ? "Search results" : "Jump to"}
          </div>
          <div className="max-h-[320px] overflow-y-auto p-1.5">
            {results.map((result, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={result.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigate(result.href)}
                  className={`block w-full rounded-[10px] px-3 py-2 text-left transition ${
                    active ? "bg-[#f3f6f9]" : "hover:bg-[#f6f7f8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#003d5b]">
                        {result.label}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[#6b7079]">
                        {result.description}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#dfe1e4] bg-[#f6f7f8] px-2 py-0.5 text-[10px] font-semibold text-[#6b7079]">
                      {result.kind}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
