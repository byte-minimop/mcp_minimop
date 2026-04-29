import type { SupportedCapabilityRegistry } from "./types";

const GOOGLE_ADS_SUPPORTED_CAPABILITIES: SupportedCapabilityRegistry = {
  platform: "google-ads",
  owner: "marketing-mcp",
  summary:
    "Declarative inventory of what marketing-mcp currently supports for Google Ads planning, readiness, and execution-related modeling. This is a documentation/consultation surface — it is not a runtime gate and is not consumed by Beacon's runtime enforcement. Beacon's push eligibility is gated separately by @mktg/adapter-beacon's PUSH_ALLOWED_ACCOUNTS and by Beacon's runtime launch-readiness recompute.",
  capabilities: [
    {
      id: "campaign-planning",
      label: "Campaign planning and blueprint modeling",
      supportLevel: "supported",
      notes: "Core Google Ads planning types, prompt shaping, and blueprint generation are implemented.",
    },
    {
      id: "family-specific-campaign-modeling",
      label: "Family-specific campaign model truth",
      supportLevel: "partial",
      notes: "marketing-mcp is introducing family-specific source-of-truth structures so non-Search families stop inheriting Search-shaped campaign models. Performance Max has an explicit asset-group-first model, and Demand Gen is the next explicit family-model refactor target.",
    },
    {
      id: "demand-gen-family-modeling",
      label: "Demand Gen family-specific modeling",
      supportLevel: "partial",
      notes: "Demand Gen is being moved to an ad-group-first family model with channel controls, audience structure, Demand Gen text asset requirements, product-feed optionality, and family-specific bidding/conversion settings as the source of truth. Generic Search-shaped compatibility fields remain temporary during the transition.",
    },
    {
      id: "performance-max-asset-group-modeling",
      label: "Performance Max asset-group-first modeling",
      supportLevel: "partial",
      notes: "Performance Max is being moved to an asset-group-first model with audience signals, search themes, final URL expansion, and family-correct text asset requirements as the source of truth. Search-shaped compatibility fields remain temporary during the transition.",
    },
    {
      id: "readiness-evaluation",
      label: "Readiness evaluation and guardrails",
      supportLevel: "supported",
      notes: "Readiness, asset limits, and supportability checks are modeled in MCP-owned domain logic.",
    },
    {
      id: "campaign-dates",
      label: "Campaign date modeling and payload mapping",
      supportLevel: "partial",
      notes: "Campaign date fields (start_date, end_date) are not modeled in MCP's domain types or readiness evaluation — absent from UNIVERSAL_FIELD_MODEL_V2 and ReadinessBriefSignals. Date handling is Beacon-owned. MCP's contribution is pass-through only.",
    },
    {
      id: "audience-modeling",
      label: "Audience mapping support",
      supportLevel: "partial",
      notes: "Full audience execution guidance is implemented for corporate context (17 segment mappings with user_list, custom_segment, and audience_signal candidates). Careers context has no governed execution mapping — non-relocation careers segments fall through to strategy-only guidance.",
    },
    {
      id: "sitelink-modeling-catalog",
      label: "Sitelink modeling and catalog support",
      supportLevel: "supported",
      notes: "Approved sitelink catalog logic and sitelink modeling exist in MCP-owned shared code.",
    },
    {
      id: "search-live-sitelink-attachment",
      label: "Search live sitelink asset attachment",
      supportLevel: "partial",
      notes: "Live sitelink attachment is limited to Search create flows and only for sitelinks with execution-safe final URLs.",
    },
    {
      id: "callout-modeling",
      label: "Callout modeling support",
      supportLevel: "partial",
      notes: "MCP owns the callout character limit constant (CALLOUT_TEXT_MAX = 25). Callout generation, validation, review editing, and persistence are Beacon-owned.",
    },
    {
      id: "search-live-callout-attachment",
      label: "Search live callout asset attachment",
      supportLevel: "partial",
      notes: "Live callout attachment is limited to Search create flows and only for callouts with non-empty text inside Google callout length limits.",
    },
    {
      id: "bidding-strategy-modeling",
      label: "Bidding strategy modeling support",
      supportLevel: "supported",
      notes: "Beacon and MCP model bidding strategy selection plus target CPA and target ROAS inputs in planning and readiness flows.",
    },
    {
      id: "search-live-bidding-execution",
      label: "Search live bidding execution",
      supportLevel: "partial",
      notes: "Search live execution maps supported bidding strategies to explicit Google Ads campaign bidding objects. Unsupported Search strategies remain modeled-only.",
    },
    {
      id: "performance-max-live-bidding-execution",
      label: "Performance Max live bidding execution",
      supportLevel: "partial",
      notes: "Performance Max live execution maps supported conversion-focused bidding strategies to explicit Google Ads campaign bidding objects. Unsupported strategies remain modeled-only.",
    },
    {
      id: "live-platform-push-surface",
      label: "Live platform push surface",
      supportLevel: "partial",
      notes: "Push infrastructure exists in Beacon's application layer (Phase 1: 2 accounts), but platform support is constrained by the push allowlist and implemented campaign families.",
    },
    {
      id: "vendor-doc-driven-enablement",
      label: "Automatic enablement from vendor documentation alone",
      supportLevel: "unsupported",
      notes: "Official Google documentation does not override MCP-owned support truth.",
    },
  ],
};

export function getGoogleAdsSupportedCapabilities(): SupportedCapabilityRegistry {
  return GOOGLE_ADS_SUPPORTED_CAPABILITIES;
}
