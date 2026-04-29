/**
 * concentrix-context.ts
 *
 * Google Ads-specific Concentrix operational context extracted from mcc-knowledge.ts.
 * Contains UTM templates, bid strategy defaults, campaign structural defaults,
 * quality benchmarks, campaign naming conventions, and MCC account data.
 *
 * Consumers:
 *   - readiness.ts   → bid strategy defaults, UTM templates, account context
 *   - Beacon wrappers → MCC accounts, naming conventions, quality benchmarks
 */

// ── UTM tracking templates ─────────────────────────────────────────────────
//
// Standardized templates observed across all active MCC campaigns.
// Use these as defaults when generating tracking templates.
// {lpurl} is the Google Ads ValueTrack parameter for the landing page URL.

export const UTM_TRACKING_TEMPLATES = {
  /**
   * Search campaigns.
   * Captures keyword-level signal via utm_term.
   */
  search:
    "{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}",

  /**
   * Display and Responsive Display campaigns.
   * Uses 'display' as a static utm_term (keywords not applicable).
   * utm_content captures the creative ID for creative-level reporting.
   */
  display:
    "{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term=display",

  /**
   * Performance Max campaigns.
   * Captures asset group ID for PMax-level breakdowns.
   */
  performance_max:
    "{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content=pmax_{assetgroupid}&utm_term=pmax",

  /**
   * Demand Gen campaigns.
   * Same structure as Display — no keyword signal.
   */
  demand_gen:
    "{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term=display",
} as const;

export type UtmTrackingCampaignType = keyof typeof UTM_TRACKING_TEMPLATES;

// ── Bid strategy defaults ──────────────────────────────────────────────────
//
// Observed from 40 active campaigns (Apr 2026). Both values confirmed.
// No active campaigns use Target CPA, Target ROAS, Manual CPC, or Enhanced CPC.

export const BID_STRATEGY_DEFAULTS = {
  /**
   * Primary default across all active campaign types (Search, PMax, Display).
   * Used when conversion tracking is available or assumed.
   */
  primary: "maximize_conversions" as const,

  /**
   * Secondary default — used when conversion tracking is unavailable,
   * or when the objective is traffic/awareness rather than lead capture.
   * Also used for some recruitment awareness campaigns.
   */
  fallback: "maximize_clicks" as const,

  /**
   * Used for PMax campaigns targeting conversion value rather than volume.
   * Observed in Egypt PMax campaign (EMEA, Egypt account).
   */
  pmax_value: "maximize_conversion_value" as const,
} as const;

// ── Campaign structural defaults ───────────────────────────────────────────
//
// Operational defaults extracted from the active campaign portfolio.

export const CAMPAIGN_STRUCTURAL_DEFAULTS = {
  /**
   * Ad rotation: all 40 active campaigns use "Optimize for clicks" (Optimize).
   * "Rotate indefinitely" is not in use in the active portfolio.
   */
  ad_rotation: "optimize" as const,

  /**
   * Broad match keywords: 33 of 40 active campaigns have broad match OFF.
   * Only 7 use broad match, primarily in awareness/traffic campaigns.
   */
  broad_match_default: false,

  /**
   * Networks: the MCC default is Google search + Search Partners + Display.
   * This should be flagged as a conscious choice, not assumed blindly —
   * Display Network inclusion may not always be intentional.
   */
  default_network_includes_display: true,

  /**
   * Phone extensions: extremely rare in this MCC (3 rows across 24 accounts).
   * Beacon should not suggest call extensions unless explicitly requested.
   */
  call_extensions_common: false,
} as const;

// ── Quality benchmarks ─────────────────────────────────────────────────────
//
// Derived from the 404 keywords with Quality Score data in the export.
// RSA ad strength from 2,275 scored RSAs across all campaigns.

export const QUALITY_BENCHMARKS = {
  quality_score: {
    /**
     * MCC observed average: 4.1 (n=404 keywords with QS data).
     * This is the real-world baseline — most keywords are below 5.
     */
    mcc_average: 4.1,

    /**
     * Target Beacon sets for new campaigns.
     * QS 7+ is the widely accepted benchmark for well-optimised accounts.
     */
    beacon_target: 7,

    /**
     * Warning threshold — below this should surface as a quality concern.
     */
    warning_threshold: 5,
  },

  ad_strength: {
    /**
     * Distribution across all RSAs in the MCC (includes legacy/paused).
     * Poor: 51%, Average: 29%, Good: 14%, Excellent: 2%
     */
    mcc_distribution: {
      poor: 0.51,
      average: 0.29,
      good: 0.14,
      incomplete: 0.024,
      excellent: 0.019,
    },

    /**
     * Active RSA portfolio (69 ads): Average 55%, Good 23%, Poor 17%.
     * No active RSAs are Excellent — the live account is underperforming.
     */
    active_distribution: {
      average: 0.55,
      good: 0.23,
      poor: 0.17,
    },

    /**
     * Target strength for Beacon-generated RSAs.
     * Beacon should aim for "Good" at minimum, "Excellent" as the ideal.
     */
    beacon_target: "good" as const,
  },
} as const;

// ── Campaign naming conventions ────────────────────────────────────────────
//
// Documented patterns for named Concentrix accounts. These are reference-only
// — Beacon does not enforce these conventions but can use them to parse
// campaign names from inbound briefs or MCC imports.

export const CAMPAIGN_NAMING_CONVENTIONS = {
  /**
   * GOO_ convention (Google_Ads_CNX and Google_Ads_CNX-WH accounts / DACH).
   * Format: GOO_[CITY_CODE]_[CLIENT/PRODUCT]_[JOB_REQ_ID]_[MMYY]
   * Example: GOO_BER_B2B_Dutch_R1628790_0126
   */
  goo: {
    prefix: "GOO_",
    description: "DACH recruitment campaigns (CNX/CNX-WH accounts)",
    fields: ["CITY_CODE", "CLIENT_OR_PRODUCT", "JOB_REQ_ID", "MMYY"],
    city_codes: {
      BER: "Berlin",
      DUI: "Duisburg",
      NUE: "Nuremberg",
      HAM: "Hamburg",
      CH: "Switzerland",
      HU: "Hungary",
      GTM: "Guatemala",
    },
  },

  /**
   * R45_ convention (Concentrix Portugal Republica account).
   * Format: R45_[CampaignType]_Recrutamento_[LANG]/PT[/EU][_City]_[MM/YY]
   * Example: R45_Search_Recrutamento_DE/PT/EU_Porto_09/25
   */
  r45: {
    prefix: "R45_",
    description: "Portugal recruitment campaigns (Republica account)",
    fields: ["CAMPAIGN_TYPE", "Recrutamento", "LANG/PT[/EU]", "City?", "MM/YY"],
    language_codes: {
      DE: "German",
      FR: "French",
      ES: "Spanish",
      NL: "Dutch",
      AR: "Arabic",
      PTBR: "Brazilian Portuguese",
    },
  },

  /**
   * FY convention (Concentrix Corporate account).
   * Format: FY[YY] | [Type] | [Product/Brand] | [Optional qualifier]
   * Example: FY26 | PMAX | Product | Collections Agent | Q1
   */
  fy: {
    prefix: "FY",
    description: "Corporate brand and product campaigns",
    fields: ["YEAR", "CAMPAIGN_TYPE", "PRODUCT_OR_BRAND", "QUALIFIER?"],
  },
} as const;

// ── Active accounts — reference map ───────────────────────────────────────
//
// Maps account IDs to their name, region context, and primary use case.
// Useful for resolving account context from a brief's account_id field.

export type AccountContext = "careers" | "corporate" | "mixed" | "legacy";

export interface MccAccountRecord {
  id: string;
  name: string;
  context: AccountContext;
  primary_region: string;
  notes?: string;
}

export const MCC_ACCOUNTS: readonly MccAccountRecord[] = [
  { id: "117-006-9740", name: "NA, United States",                      context: "legacy",    primary_region: "NA",   notes: "Convergys-era account, mostly paused" },
  { id: "187-314-0377", name: "EMEA, Tunisia",                          context: "careers",   primary_region: "EMEA" },
  { id: "228-500-1109", name: "EMEA Professional Recruitment",           context: "careers",   primary_region: "EMEA" },
  { id: "272-374-8809", name: "Concentrix Greece",                       context: "careers",   primary_region: "EMEA", notes: "German/French relocation campaigns" },
  { id: "345-305-4762", name: "Concentrix Portugal (faturação Yelo)",    context: "careers",   primary_region: "EMEA", notes: "Dutch speaker recruitment" },
  { id: "379-792-0830", name: "NA, Canada",                              context: "legacy",    primary_region: "NA",   notes: "Convergys-era account, ended" },
  { id: "476-269-7188", name: "Concentrix - Sweden",                     context: "careers",   primary_region: "EMEA", notes: "Ex-Webhelp, TeamTailor ATS" },
  { id: "488-694-6625", name: "EMEA, Egypt",                             context: "careers",   primary_region: "EMEA", notes: "Active PMax, USD budget" },
  { id: "499-063-5619", name: "Concentrix B2B Sales",                    context: "corporate", primary_region: "NA" },
  { id: "546-962-8244", name: "Concentrix PMG",                          context: "corporate", primary_region: "NA",   notes: "B2B solutions and CX products" },
  { id: "575-935-6243", name: "ServiceSource_Main",                       context: "legacy",    primary_region: "NA",   notes: "ServiceSource acquired 2022" },
  { id: "582-434-7572", name: "North America",                            context: "careers",   primary_region: "NA" },
  { id: "606-928-5580", name: "Mktg, Information Management (IM)",        context: "corporate", primary_region: "NA" },
  { id: "612-236-3773", name: "EMEA, General",                           context: "legacy",    primary_region: "EMEA", notes: "Large legacy account, 38% disapproval rate from ETAs" },
  { id: "621-144-3278", name: "Concentrix ANZ",                          context: "mixed",     primary_region: "APAC" },
  { id: "702-064-4227", name: "Google_Ads_CNX",                          context: "careers",   primary_region: "EMEA", notes: "DACH recruitment, GOO_ naming" },
  { id: "714-517-3859", name: "LATAM, Nicaragua",                        context: "legacy",    primary_region: "LATAM", notes: "64% disapproval from ETAs" },
  { id: "716-983-5493", name: "Concentrix __Romania_ EMEA",              context: "careers",   primary_region: "EMEA", notes: "Ex-Webhelp Romania" },
  { id: "802-952-2037", name: "Concentrix Portugal (faturação Republica)", context: "careers", primary_region: "EMEA", notes: "Most active careers account (19 live campaigns)" },
  { id: "810-201-8021", name: "Concentrix Corporate",                    context: "corporate", primary_region: "Global", notes: "Brand + B2B, highest corporate budget ($333/day)" },
  { id: "847-771-2419", name: "Google_Ads_CNX-WH",                      context: "careers",   primary_region: "EMEA", notes: "DACH + Swiss multilingual, GOO_ naming" },
  { id: "900-224-3225", name: "Mktg, Relationship Technology Management (RTM)", context: "corporate", primary_region: "NA" },
  { id: "932-721-8072", name: "Recruiting & HR Mgmt (HRM)",              context: "legacy",    primary_region: "NA",   notes: "Convergys-era HRM account" },
  { id: "955-450-0596", name: "Menulog",                                 context: "legacy",    primary_region: "APAC", notes: "100% disapproval — fully inactive" },
] as const;

/**
 * Resolve an account context from account ID.
 * Returns null if the ID is not in the MCC account list.
 */
export function resolveAccountContext(accountId: string): MccAccountRecord | null {
  const stripped = accountId.replace(/-/g, "");
  return MCC_ACCOUNTS.find((a) => a.id.replace(/-/g, "") === stripped) ?? null;
}
