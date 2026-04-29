/**
 * Data definitions for the Marketing MCP office UI.
 *
 * UI copy — NOT a source of truth for MCP domain, capability, or support claims.
 * Any strings here (titles, summaries, heroNotes) exist to populate the inspector;
 * do not cite them in documentation or AI answers about what MCP actually supports.
 * Canonical truth lives in the @mktg/* packages and src/knowledge/.
 *
 * officeNodes   – positions and metadata for scene elements and support cards.
 * detailPages   – content for each surface's detail view.
 * navSurfaces   – compact list for the cross-navigation bar on detail pages.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type McpOfficeNode = {
  id: string;
  title: string;
  shortLabel: string;
  href: string;
  kind: "worker" | "infrastructure" | "future";
  status: "live" | "active" | "in-development" | "planned";
  x: string;
  y: string;
  w: string;
  h: string;
  z: number;
};

export type McpDetailModule = {
  title: string;
  icon: "agent" | "memory" | "knowledge" | "tools" | "governance" | "activity";
  items: string[];
};

export type McpDetailPage = {
  id: string;
  title: string;
  subtitle: string;
  surfaceKind: "worker" | "infrastructure" | "future";
  status: "live" | "active" | "in-development" | "planned";
  summary: string;
  heroNote: string;
  modules: McpDetailModule[];
};

export type NavSurface = {
  id: string;
  label: string;
  href: string;
  kind: "worker" | "infrastructure" | "future";
  status: McpOfficeNode["status"];
};

/* ------------------------------------------------------------------ */
/*  Status display helpers                                             */
/* ------------------------------------------------------------------ */

export function statusDisplayLabel(status: McpOfficeNode["status"]): string {
  switch (status) {
    case "live":
      return "Live";
    case "active":
      return "Active";
    case "in-development":
      return "In development";
    case "planned":
      return "Planned";
    default:
      return status;
  }
}

/* ------------------------------------------------------------------ */
/*  Office scene nodes                                                 */
/* ------------------------------------------------------------------ */

export const officeNodes: McpOfficeNode[] = [
  {
    id: "knowledge",
    title: "Knowledge",
    shortLabel: "Knowledge",
    href: "/mcp/knowledge",
    kind: "infrastructure",
    status: "active",
    x: "11%",
    y: "11%",
    w: "18%",
    h: "19%",
    z: 1,
  },
  {
    id: "ops",
    title: "Ops",
    shortLabel: "Ops",
    href: "/mcp/ops",
    kind: "infrastructure",
    status: "active",
    x: "63%",
    y: "13%",
    w: "17%",
    h: "12%",
    z: 1,
  },
  {
    id: "integrations",
    title: "Integrations",
    shortLabel: "Integrations",
    href: "/mcp/integrations",
    kind: "infrastructure",
    status: "active",
    x: "12%",
    y: "68%",
    w: "16%",
    h: "11%",
    z: 1,
  },
  {
    id: "memory",
    title: "Memory",
    shortLabel: "Memory",
    href: "/mcp/memory",
    kind: "infrastructure",
    status: "active",
    x: "31%",
    y: "68%",
    w: "16%",
    h: "11%",
    z: 2,
  },
  {
    id: "beacon",
    title: "Beacon",
    shortLabel: "Beacon",
    href: "/mcp/beacon",
    kind: "worker",
    status: "live",
    x: "70%",
    y: "42%",
    w: "16%",
    h: "17%",
    z: 3,
  },
  {
    id: "tagpilot",
    title: "TagPilot",
    shortLabel: "TagPilot",
    href: "/mcp/tagpilot",
    kind: "future",
    status: "in-development",
    x: "53%",
    y: "70%",
    w: "14%",
    h: "12%",
    z: 2,
  },
  {
    id: "lumen",
    title: "Lumen",
    shortLabel: "Lumen",
    href: "/mcp/lumen",
    kind: "future",
    status: "planned",
    x: "70%",
    y: "70%",
    w: "14%",
    h: "12%",
    z: 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Navigation surface list                                            */
/* ------------------------------------------------------------------ */

export const navSurfaces: NavSurface[] = officeNodes.map((n) => ({
  id: n.id,
  label: n.shortLabel,
  href: n.href,
  kind: n.kind,
  status: n.status,
}));

/* ------------------------------------------------------------------ */
/*  Detail page content                                                */
/* ------------------------------------------------------------------ */

export const detailPages: Record<string, McpDetailPage> = {
  beacon: {
    id: "beacon",
    title: "Beacon",
    subtitle: "Google Ads campaign specialist",
    surfaceKind: "worker",
    status: "live",
    summary:
      "Beacon is the first and currently only active worker inside the Marketing MCP. It handles Google Ads campaign planning — assembling governed drafts with readiness checks, account context, and human approval gating. Beacon consumes shared domain knowledge from MCP but does not own it. Beacon owns its own workflow governance: decision policy, gap taxonomy, blueprint readiness, and the processing pipeline.",
    heroNote:
      "Current activity: assembling a governed campaign draft with readiness checks, account context, and approval gating before publish.",
    modules: [
      {
        title: "What Beacon owns",
        icon: "agent",
        items: [
          "Campaign brief intake, validation, and processing pipeline",
          "Decision policy — how to interpret ambiguous briefs",
          "Gap taxonomy — hard gap, soft gap, assumption, recommendation classification",
          "Blueprint readiness — ready / ready_with_gaps / blocked status model",
          "Review flow, approval controls, and publish orchestration",
          "Google Ads API integration and payload construction",
        ],
      },
      {
        title: "Tools and integrations",
        icon: "tools",
        items: [
          "Google Ads OAuth and account inventory access",
          "Asset, audience, and conversion retrieval",
          "Validation and campaign preview pathways",
          "Platform connector health checks",
        ],
      },
      {
        title: "Governance and approvals",
        icon: "governance",
        items: [
          "Human review required before any publish action",
          "Review-only and publish-ready state enforcement",
          "Publish permission requires authenticated user with publish role",
          "Readiness gates enforced before state transitions",
        ],
      },
      {
        title: "Live activity",
        icon: "activity",
        items: [
          "Draft campaign structure in progress",
          "Account signals queued for attachment",
          "Publish blocked until approval passes",
        ],
      },
    ],
  },

  knowledge: {
    id: "knowledge",
    title: "Knowledge",
    subtitle: "Source of truth for shared platform knowledge",
    surfaceKind: "infrastructure",
    status: "active",
    summary:
      "The knowledge layer is the canonical source of truth for all shared platform knowledge. It holds reference data (service taxonomy, people targeting, sitelink catalog), domain conventions (campaign naming, UTM templates, asset limits, readiness evaluation), and operational knowledge (MCC account context, capability registry). Workers consume this layer — they do not duplicate it.",
    heroNote:
      "Inspectable knowledge assets organized by type: reference data, domain conventions, and operational knowledge. All data shown is derived from the codebase.",
    modules: [
      {
        title: "Reference data",
        icon: "knowledge",
        items: [
          "Concentrix service taxonomy — 73 service offerings across 4 categories and 20 groups, with 44 service aliases for input normalization",
          "People-targeting catalog — 1,599 people roles across 8 industries, 5 service categories, 6 tiers (distinct from audience segments used for ad targeting)",
          "Sitelink catalog — pre-approved Concentrix sitelinks organized by service family",
          "Audience segment library — corporate and careers segments with ad group contexts",
        ],
      },
      {
        title: "Domain conventions",
        icon: "tools",
        items: [
          "Campaign naming convention — governed template, objective and family shortcodes, country code resolution",
          "UTM tracking templates — per-family tracking parameters for Search, Display, Demand Gen, Performance Max",
          "Asset limits — character and count constraints for all Google Ads asset types",
          "Readiness evaluation — 3-layer model across 6 dependency domains (destination, measurement, assets, audience, linkage, geo-language)",
        ],
      },
      {
        title: "Operational knowledge",
        icon: "governance",
        items: [
          "MCC account context — 24 accounts with export snapshot (698 campaigns, 40 active), career domain classification, naming patterns",
          "Supported capabilities registry — implementation status for Google Ads features",
          "Campaign family definitions — structural models, objectives, asset complexity, readiness flags for all families",
          "Bid strategy defaults and quality benchmarks from MCC operational data",
        ],
      },
    ],
  },

  memory: {
    id: "memory",
    title: "Memory",
    subtitle: "What the MCP remembers — run history, execution context, decision trails (backed by Beacon\u2019s runtime store)",
    surfaceKind: "infrastructure",
    status: "active",
    summary:
      "Knowledge is what the MCP knows. Memory is what the MCP remembers. This layer holds the operational history of work done by workers: campaign runs, status transitions, push outcomes, and decision traces. Today this data is persisted in Beacon's SQLite database. As more workers come online, Memory becomes the shared persistence layer that all workers read from and write to.",
    heroNote:
      "Operational memory backed by Beacon's beacon.sqlite. Run counts, event totals, and push audit records shown below are read live from the database on each page load.",
    modules: [
      {
        title: "Run history",
        icon: "memory",
        items: [
          "Campaign runs — each run tracks brief input, blueprint output, version history, and review status",
          "Status transitions — draft, approved, ready to push, pushed, push failed — all timestamped",
          "Push audit — every push attempt recorded with outcome, account, and detailed notes",
          "User sessions — who created or approved each run",
        ],
      },
      {
        title: "Execution context",
        icon: "agent",
        items: [
          "Brief versions — original input preserved alongside clarified and regenerated versions",
          "Execution briefs — brief with resolved campaign family stamped in before pipeline runs",
          "Localized bundles — multi-region campaign expansions stored per run",
        ],
      },
      {
        title: "Shared layer roadmap",
        icon: "activity",
        items: [
          "Today: Beacon writes to and reads from its own SQLite database (beacon.sqlite)",
          "MCP Office already reads this data for the Beacon activity and push log views",
          "Next: shared persistence layer accessible to all workers, not just Beacon",
          "Future: TagPilot and Lumen will write their own operational memory to this layer",
        ],
      },
    ],
  },

  integrations: {
    id: "integrations",
    title: "Integrations",
    subtitle: "Complete inventory of external system connections",
    surfaceKind: "infrastructure",
    status: "active",
    summary:
      "Every external system that the MCP and its workers connect to. Each integration listed here is real, active, and used in production. Integrations are owned by the connecting worker or by the MCP core layer.",
    heroNote:
      "6 active integrations across 3 providers (Google, Microsoft, Asana). All connections listed here are real and in use.",
    modules: [
      {
        title: "Google",
        icon: "tools",
        items: [
          "Google Ads API — campaign creation, account discovery, user lists, conversion actions, validation (read + write, Beacon)",
          "Google Developer Docs — vendor documentation search for Google Ads, GA4, GTM (read, MCP)",
        ],
      },
      {
        title: "Microsoft Azure",
        icon: "tools",
        items: [
          "Azure Blob Storage — creative asset upload and retrieval for images and media bundles (read + write, Beacon)",
          "Azure OpenAI — AI-backed blueprint generation, optional, falls back to deterministic pipeline (write, Beacon)",
          "Azure AD SSO — user authentication via Microsoft single sign-on (read, Beacon)",
        ],
      },
      {
        title: "Asana",
        icon: "tools",
        items: [
          "Asana API — support request task creation in Asana workspace (read + write, Beacon)",
        ],
      },
    ],
  },

  ops: {
    id: "ops",
    title: "Ops",
    subtitle: "Push controls, readiness gates, and brief validation rules",
    surfaceKind: "infrastructure",
    status: "active",
    summary:
      "Ops controls what can be published and under what conditions. It holds brief validation rules (what must be true before a blueprint is ready), readiness gates (what must be satisfied before a campaign can be drafted or activated), and the permission model (authenticated users with publish role).",
    heroNote:
      "All 24 MCC accounts are available for push. Publish requires an authenticated user with the correct role. Readiness gates and human review are enforced before any publish action.",
    modules: [
      {
        title: "Operational controls",
        icon: "governance",
        items: [
          "Human review queue before any publish action",
          "Readiness-state enforcement with hard blockers",
          "Publish permission enforced via user authentication and role",
          "Operational status and dependency visibility",
        ],
      },
    ],
  },

  tagpilot: {
    id: "tagpilot",
    title: "TagPilot",
    subtitle: "Measurement and tag governance",
    surfaceKind: "future",
    status: "in-development",
    summary:
      "TagPilot is the next specialist worker planned for the MCP. It will handle measurement governance, tag inspection, and analytics workflows. The desk is visible in the office but not yet active.",
    heroNote:
      "In development. The desk structure exists but no runtime, tools, or live integrations are connected yet.",
    modules: [
      {
        title: "Planned capabilities",
        icon: "tools",
        items: [
          "Measurement governance and tag auditing",
          "Google Tag Manager and GA4 workflow support",
          "Analytics inspection and validation",
        ],
      },
    ],
  },

  lumen: {
    id: "lumen",
    title: "Lumen",
    subtitle: "Insights and reporting",
    surfaceKind: "future",
    status: "planned",
    summary:
      "Lumen is a future specialist worker reserved for insight, reporting, and recommendation work. It has a planned desk in the office but no implementation exists yet.",
    heroNote: "Planned. No desk structure, runtime, or tools provisioned yet.",
    modules: [
      {
        title: "Planned capabilities",
        icon: "activity",
        items: [
          "Insight and reporting surfaces",
          "Recommendation and analysis workflows",
          "Cross-campaign performance visibility",
        ],
      },
    ],
  },
};
