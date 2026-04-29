/**
 * Governed campaign naming and tracking value generation.
 *
 * Naming convention:
 *   [Market] | [Offering] | [Objective] | [Family] | [Theme] | [YYYY-MM]
 *
 * Examples:
 *   "ES | Data Engineering | Lead Gen | Search | Brand | 2026-04"
 *   "US | CX Consulting | Lead Gen | PMax | Core | 2026-04"
 *
 * The tracking-safe `_campaign` value is derived automatically:
 *   "es_data-engineering_lead-gen_search_brand_2026-04"
 */

import type { CampaignType, CampaignObjective } from "./types";

// ---------------------------------------------------------------------------
// Minimal brief interface — consumers pass their own brief types.
// TypeScript structural typing means BriefInput (or any compatible shape)
// satisfies this without an explicit cast.
// ---------------------------------------------------------------------------

export interface CampaignNamingBrief {
  campaign_objective: CampaignObjective;
  target_country?: string;
  geography_targets?: Array<{ include: boolean; country_code: string }>;
  target_geography: string;
  product_or_service?: string;
  brand_name?: string;
  audience_mode?: string;
  customer_match_available?: boolean;
  preferred_ad_group_contexts?: string[];
  start_date?: string;
}

export interface CampaignNamingLocale {
  region: string;
  language_code: string;
}

// ---------------------------------------------------------------------------
// Objective shorthand — compact labels for campaign names
// ---------------------------------------------------------------------------

export const OBJECTIVE_SHORT: Record<CampaignObjective, string> = {
  generate_leads: "Lead Gen",
  attract_candidates: "Candidates",
  increase_website_traffic: "Traffic",
  build_brand_awareness: "Awareness",
};

// ---------------------------------------------------------------------------
// Family shorthand — compact labels for campaign names
// ---------------------------------------------------------------------------

export const FAMILY_SHORT: Record<string, string> = {
  search: "Search",
  search_local: "Search Local",
  display: "Display",
  responsive_display: "Display",
  video: "Video",
  demand_gen: "Demand Gen",
  shopping: "Shopping",
  performance_max: "PMax",
  performance_max_store_goals: "PMax",
  app: "App",
};

// ---------------------------------------------------------------------------
// Country code map — free-text geography → ISO 3166-1 alpha-2
// ---------------------------------------------------------------------------

export const COUNTRY_CODE_MAP: Record<string, string> = {
  "united states": "US", "usa": "US", "us": "US",
  "united kingdom": "GB", "uk": "GB", "gb": "GB",
  "germany": "DE", "deutschland": "DE", "de": "DE",
  "france": "FR", "fr": "FR",
  "spain": "ES", "españa": "ES", "es": "ES",
  "italy": "IT", "italia": "IT", "it": "IT",
  "canada": "CA", "ca": "CA",
  "australia": "AU", "au": "AU",
  "japan": "JP", "jp": "JP",
  "brazil": "BR", "br": "BR",
  "mexico": "MX", "mx": "MX",
  "netherlands": "NL", "nl": "NL",
  "portugal": "PT", "pt": "PT",
  "india": "IN", "in": "IN",
  "south korea": "KR", "korea": "KR", "kr": "KR",
  "colombia": "CO", "co": "CO",
  "argentina": "AR", "ar": "AR",
  "chile": "CL", "cl": "CL",
  "peru": "PE", "pe": "PE",
  "poland": "PL", "pl": "PL",
  "sweden": "SE", "se": "SE",
  "switzerland": "CH", "ch": "CH",
  "austria": "AT", "at": "AT",
  "belgium": "BE", "be": "BE",
  "ireland": "IE", "ie": "IE",
  "czech republic": "CZ", "czechia": "CZ", "cz": "CZ",
  "romania": "RO", "ro": "RO",
  "turkey": "TR", "türkiye": "TR", "tr": "TR",
  "philippines": "PH", "ph": "PH",
  "indonesia": "ID", "id": "ID",
  "thailand": "TH", "th": "TH",
  "vietnam": "VN", "vn": "VN",
  "malaysia": "MY", "my": "MY",
  "singapore": "SG", "sg": "SG",
  "hong kong": "HK", "hk": "HK",
  "taiwan": "TW", "tw": "TW",
  "china": "CN", "cn": "CN",
};

// ---------------------------------------------------------------------------
// Market resolution — derive a compact market code from the brief
// ---------------------------------------------------------------------------

function resolveMarket(brief: CampaignNamingBrief): string {
  if (brief.target_country) return brief.target_country.toUpperCase().slice(0, 2);

  if (brief.geography_targets?.length) {
    const codes = brief.geography_targets
      .filter((g) => g.include)
      .map((g) => g.country_code.toUpperCase());
    if (codes.length === 1) return codes[0];
    if (codes.length <= 3) return codes.join("-");
    return `${codes.slice(0, 2).join("-")}+${codes.length - 2}`;
  }

  const geo = brief.target_geography.trim();

  const parts = geo.split(/[,/&]/).map((s) => s.trim()).filter(Boolean);
  const resolved = parts
    .map((p) => COUNTRY_CODE_MAP[p.toLowerCase()] ?? null)
    .filter((c): c is string => c !== null);

  if (resolved.length === 1) return resolved[0];
  if (resolved.length > 1 && resolved.length <= 3) return resolved.join("-");
  if (resolved.length > 3) return `${resolved.slice(0, 2).join("-")}+${resolved.length - 2}`;

  if (/^[A-Za-z]{2}$/.test(geo)) return geo.toUpperCase();

  return geo.slice(0, 5).replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Offering resolution — derive from product_or_service
// ---------------------------------------------------------------------------

function resolveOffering(brief: CampaignNamingBrief): string {
  const raw = (brief.product_or_service || brief.brand_name || "Campaign").trim();
  return raw.replace(/\s+/g, " ").slice(0, 25);
}

// ---------------------------------------------------------------------------
// Theme resolution — a lightweight signal about the campaign angle
// ---------------------------------------------------------------------------

function resolveTheme(brief: CampaignNamingBrief): string {
  if (brief.audience_mode === "remarketing" || brief.customer_match_available) return "Remarketing";
  if (brief.audience_mode === "prospecting") return "Prospecting";

  const contexts = brief.preferred_ad_group_contexts ?? [];
  if (contexts.some((c) => /\bbrand\b/i.test(c))) return "Brand";
  if (contexts.some((c) => /\bnon.?brand\b/i.test(c))) return "Non-Brand";

  return "Core";
}

// ---------------------------------------------------------------------------
// Date label — YYYY-MM
// ---------------------------------------------------------------------------

function resolveDateLabel(startDate?: string): string {
  if (startDate) {
    const d = new Date(startDate + "T00:00:00");
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Public: generate governed campaign name
// ---------------------------------------------------------------------------

export function generateCampaignName(
  brief: CampaignNamingBrief,
  family: CampaignType
): string {
  const market = resolveMarket(brief);
  const offering = resolveOffering(brief);
  const objective = OBJECTIVE_SHORT[brief.campaign_objective] ?? "Campaign";
  const familyLabel = FAMILY_SHORT[family] ?? family;
  const theme = resolveTheme(brief);
  const date = resolveDateLabel(brief.start_date);

  return `${market} | ${offering} | ${objective} | ${familyLabel} | ${theme} | ${date}`;
}

// ---------------------------------------------------------------------------
// Public: generate governed campaign name for a localized unit
// ---------------------------------------------------------------------------

export function generateLocalizedCampaignName(
  brief: CampaignNamingBrief,
  family: CampaignType,
  locale: CampaignNamingLocale
): string {
  const offering = resolveOffering(brief);
  const objective = OBJECTIVE_SHORT[brief.campaign_objective] ?? "Campaign";
  const familyLabel = FAMILY_SHORT[family] ?? family;
  const theme = resolveTheme(brief);
  const date = resolveDateLabel(brief.start_date);
  const market = `${locale.region}/${locale.language_code}`;

  return `${market} | ${offering} | ${objective} | ${familyLabel} | ${theme} | ${date}`;
}

// ---------------------------------------------------------------------------
// Public: generate tracking-safe _campaign value
// ---------------------------------------------------------------------------

/**
 * Normalizes a campaign name into a tracking-safe `_campaign` custom parameter value.
 *
 * Rules:
 *   - lowercase
 *   - replace `|` and `/` segment separators with `_`
 *   - replace spaces with `-`
 *   - remove characters unsafe for URL parameters
 *   - collapse repeated separators
 *   - trim leading/trailing separators
 */
export function generateTrackingCampaignValue(campaignName: string): string {
  return campaignName
    .toLowerCase()
    .replace(/\s*\|\s*/g, "_")
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_\.]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/_{2,}/g, "_")
    .replace(/[-_]{2,}/g, (m) => m[0])
    .replace(/^[-_]+|[-_]+$/g, "");
}
