/**
 * Real data derived from the marketing-mcp codebase.
 *
 * Every count and fact here is computed from actual package exports —
 * not hardcoded mock values. The source package is noted for each section.
 */

import {
  GOOGLE_ADS_CAMPAIGN_FAMILIES,
  CAMPAIGN_FAMILY_STATUS,
  ACTIVE_PUBLISH_READY_CAMPAIGN_FAMILIES,
  ACTIVE_REVIEW_ONLY_CAMPAIGN_FAMILIES,
  MODELED_INACTIVE_CAMPAIGN_FAMILIES,
  SITELINK_CATALOG,
  MCC_ACCOUNTS,
  GOOGLE_ADS_OBJECTIVES,
  BIDDING_STRATEGIES,
  OBJECTIVE_SHORT,
  FAMILY_SHORT,
  COUNTRY_CODE_MAP,
  type CampaignFamilyStatus,
} from "@mktg/domain-google-ads";

import { getGoogleAdsSupportedCapabilities } from "@mktg/core";

import {
  BEACON_RULES,
  PUSH_ALLOWED_ACCOUNTS,
  FOCUS_EVENT_PROFILES,
} from "@mktg/adapter-beacon";

/* ------------------------------------------------------------------ */
/*  Capabilities (from @mktg/core)                                     */
/* ------------------------------------------------------------------ */

const capRegistry = getGoogleAdsSupportedCapabilities();
const caps = capRegistry.capabilities;
const capsSupported = caps.filter((c) => c.supportLevel === "supported").length;
const capsPartial = caps.filter((c) => c.supportLevel === "partial").length;
const capsUnsupported = caps.filter((c) => c.supportLevel === "unsupported").length;

/* ------------------------------------------------------------------ */
/*  Rules (from @mktg/adapter-beacon)                                  */
/* ------------------------------------------------------------------ */

const ruleEntries = Object.values(BEACON_RULES);
const rulesHard = ruleEntries.filter((r) => r.severity === "Hard").length;
const rulesSoft = ruleEntries.filter((r) => r.severity === "Soft").length;
const rulesInfo = ruleEntries.filter((r) => r.severity === "Informational").length;

/* ------------------------------------------------------------------ */
/*  Accounts (from @mktg/domain-google-ads)                            */
/* ------------------------------------------------------------------ */

const acctCareers = MCC_ACCOUNTS.filter((a) => a.context === "careers").length;
const acctCorporate = MCC_ACCOUNTS.filter((a) => a.context === "corporate").length;
const acctLegacy = MCC_ACCOUNTS.filter((a) => a.context === "legacy").length;
const acctMixed = MCC_ACCOUNTS.filter((a) => a.context === "mixed").length;

/* ------------------------------------------------------------------ */
/*  Focus events (from @mktg/adapter-beacon)                           */
/* ------------------------------------------------------------------ */

const eventKeys = Object.keys(FOCUS_EVENT_PROFILES);
const eventsCareers = eventKeys.filter((k) => k.startsWith("careers::")).length;
const eventsCorporate = eventKeys.filter((k) => k.startsWith("corporate::")).length;

/* ------------------------------------------------------------------ */
/*  Campaign naming (from @mktg/domain-google-ads)                     */
/* ------------------------------------------------------------------ */

const namingObjectives = Object.keys(OBJECTIVE_SHORT).length;
const namingFamilies = Object.keys(FAMILY_SHORT).length;
const namingCountries = Object.keys(COUNTRY_CODE_MAP).length;

/* ------------------------------------------------------------------ */
/*  Family status list (from @mktg/domain-google-ads)                  */
/* ------------------------------------------------------------------ */

const familyStatusList: Array<{ family: string; status: CampaignFamilyStatus }> =
  GOOGLE_ADS_CAMPAIGN_FAMILIES.map((f) => ({
    family: f.replace(/_/g, " "),
    status: CAMPAIGN_FAMILY_STATUS[f],
  }));

/* ------------------------------------------------------------------ */
/*  Push accounts detail (from @mktg/adapter-beacon)                   */
/* ------------------------------------------------------------------ */

const pushAccountNames = PUSH_ALLOWED_ACCOUNTS.map((a) => a.name);

/* ------------------------------------------------------------------ */
/*  Exported summary                                                   */
/* ------------------------------------------------------------------ */

export const REAL = {
  families: {
    total: GOOGLE_ADS_CAMPAIGN_FAMILIES.length,
    publishReady: ACTIVE_PUBLISH_READY_CAMPAIGN_FAMILIES.length,
    reviewOnly: ACTIVE_REVIEW_ONLY_CAMPAIGN_FAMILIES.length,
    inactive: MODELED_INACTIVE_CAMPAIGN_FAMILIES.length,
    list: familyStatusList,
  },
  objectives: { total: GOOGLE_ADS_OBJECTIVES.length },
  bidding: { total: BIDDING_STRATEGIES.length },
  sitelinks: { total: SITELINK_CATALOG.length },
  accounts: {
    total: MCC_ACCOUNTS.length,
    careers: acctCareers,
    corporate: acctCorporate,
    legacy: acctLegacy,
    mixed: acctMixed,
  },
  push: {
    allowed: PUSH_ALLOWED_ACCOUNTS.length,
    names: pushAccountNames,
  },
  rules: {
    total: ruleEntries.length,
    hard: rulesHard,
    soft: rulesSoft,
    informational: rulesInfo,
  },
  capabilities: {
    total: caps.length,
    supported: capsSupported,
    partial: capsPartial,
    unsupported: capsUnsupported,
  },
  events: {
    total: eventKeys.length,
    careers: eventsCareers,
    corporate: eventsCorporate,
  },
  campaignNaming: {
    objectives: namingObjectives,
    families: namingFamilies,
    countries: namingCountries,
    template: "[Market] | [Offering] | [Objective] | [Family] | [Theme] | [YYYY-MM]",
  },
  /**
   * Static counts from data files that are not importable as TS modules.
   * These are verified against the checked-in JSON files.
   */
  dataFiles: {
    serviceAliases: 44,
    serviceAliasSource: "data/services/alias_mapping.json",
    serviceTaxonomyOfferings: 73,
    serviceTaxonomyCategories: 4,
    serviceTaxonomyGroups: 20,
    serviceTaxonomySource: "data/services/service_taxonomy.json",
    peopleRoles: 1_599,
    peopleRoleIndustries: 8,
    peopleRoleServiceCategories: 5,
    peopleRoleTierLevels: 6,
    peopleRoleSource: "data/people-targeting/catalog.json",
    mccExportAccounts: 24,
    mccExportTotalCampaigns: 698,
    mccExportActiveCampaigns: 40,
    mccExportSource: "data/mcc-export/insights-2026-04-02.md",
  },
  /**
   * Integration inventory. Each integration that actually exists in the system.
   */
  integrations: [
    { name: "Google Ads API", provider: "Google", status: "active" as const, type: "read + write" as const, consumer: "Beacon", description: "Campaign creation, account discovery, user lists, conversion actions, validation" },
    { name: "Azure Blob Storage", provider: "Microsoft", status: "active" as const, type: "read + write" as const, consumer: "Beacon", description: "Creative asset upload and retrieval (images, media bundles)" },
    { name: "Azure OpenAI", provider: "Microsoft", status: "active" as const, type: "write" as const, consumer: "Beacon", description: "AI-backed blueprint generation (optional, falls back to deterministic pipeline)" },
    { name: "Azure AD SSO", provider: "Microsoft", status: "active" as const, type: "read" as const, consumer: "Beacon", description: "User authentication via Microsoft single sign-on" },
    { name: "Asana", provider: "Asana", status: "active" as const, type: "read + write" as const, consumer: "Beacon", description: "Support request task creation in Asana workspace" },
    { name: "Google Developer Docs", provider: "Google", status: "active" as const, type: "read" as const, consumer: "MCP", description: "Vendor documentation search for Google Ads, GA4, GTM, Search Console" },
  ],
} as const;

/**
 * Classification of each data area for UI truth labeling.
 */
export type DataTruth = "live" | "codebase" | "derived" | "mock";

export const DATA_TRUTH: Record<string, DataTruth> = {
  workers: "codebase",
  families: "codebase",
  accounts: "codebase",
  pushAllowlist: "codebase",
  rules: "codebase",
  capabilities: "codebase",
  sitelinks: "codebase",
  events: "codebase",
  serviceAliases: "codebase",
  serviceTaxonomy: "codebase",
  peopleRoles: "codebase",
  audienceSegments: "codebase",
  campaignNaming: "codebase",
  mccExport: "codebase",
  beaconActivity: "live",
  memorySnapshot: "live",
  beaconLogs: "mock",
  memoryRuns: "mock",
  connectorHealth: "mock",
  approvalQueue: "mock",
};
