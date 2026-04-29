/**
 * mcc-knowledge.ts
 *
 * Structured Beacon knowledge extracted from MCC export analysis.
 * Source: data/mcc-export/insights-2026-04-02.md
 * Derived from: Google-Ads-Editor+2026-04-02.csv (74,538 rows, 24 accounts)
 *
 * This module is the primary interface between raw MCC observations and
 * Beacon's reasoning layer. It does not import other Beacon modules and
 * carries no runtime side effects — pure constants.
 *
 * Consumers:
 *   - beacon-policy.ts  → legacy domain detection, bid strategy defaults
 *   - beacon-rules.ts   → URL validation, tracking template validation
 *   - planner/prompt.ts → campaign defaults, relocation pattern recognition
 *   - beacon-benchmarks.ts → quality score baseline and targets
 *
 * Regeneration: re-run the extraction script in data/mcc-export/ after
 * each MCC export and update the KNOWLEDGE_PROVENANCE block below.
 */

// ── Provenance ─────────────────────────────────────────────────────────────

export const KNOWLEDGE_PROVENANCE = {
  source_file: "Google-Ads-Editor+2026-04-02.csv",
  extracted_at: "2026-04-02",
  row_count: 74538,
  account_count: 24,
  active_campaign_count: 40,
  insights_doc: "data/mcc-export/insights-2026-04-02.md",
} as const;

/**
 * Date of the most recent MCC snapshot these constants were extracted from.
 * Consumers that display MCC-derived figures should surface this so stale
 * numbers are not shown as live state.
 */
export const LAST_SNAPSHOT_DATE = "2026-04-02" as const;

// ── Legacy domains — hard validation signal ────────────────────────────────
//
// These domains appear in the MCC but belong to brands that no longer exist
// under the Concentrix identity (Convergys absorbed 2018, ServiceSource 2022,
// Webhelp 2023). Any brief or URL containing these should trigger a Hard gap.

export const LEGACY_CAREER_DOMAINS = [
  "www.convergys.com",
  "convergys.com",
  "workatconvergys.com",
  "convergys.wd1.myworkdayjobs.com",
  "www.servicesource.com",
  "servicesource.com",
  "offerpop.com",
  "webhelp.acquitysoftware.com",
  "jobs.webhelp.com",
  "www.webhelp.com",
] as const;

export type LegacyCareerDomain = (typeof LEGACY_CAREER_DOMAINS)[number];

/**
 * Returns true if the given URL contains a known legacy domain.
 * Case-insensitive. Does not require a full URL — works on domain strings too.
 */
export function isLegacyCareerDomain(url: string): boolean {
  const lower = url.toLowerCase();
  return LEGACY_CAREER_DOMAINS.some((d) => lower.includes(d));
}

// ── Canonical career landing page domains ─────────────────────────────────
//
// Approved landing page destinations observed across active campaigns.
// Ordered by frequency of use in the export.

export const CANONICAL_CAREER_DOMAINS = [
  "careers.concentrix.com",    // Primary careers portal (2,917 rows)
  "jobs.concentrix.com",       // Job listings / requisition URLs (932 rows)
  "apply.concentrix.com",      // Direct application path (41 rows)
  "cnx.wd1.myworkdayjobs.com", // Workday ATS (14 rows)
] as const;

// Country-specific ATS domains — pattern: concentrix-[country].talkpush.com
// These are valid but less common than the primary portals.
export const COUNTRY_ATS_DOMAIN_PATTERN = /^concentrix-[\w]+\.talkpush\.com$/i;

// Webhelp-lineage TeamTailor ATS domains (ex-Webhelp/Sweden/Norway/Latvia/Estonia accounts).
// These are still ACTIVE — do NOT add to LEGACY_CAREER_DOMAINS.
export const WEBHELP_ATS_DOMAIN_PATTERN = /^webhelp[\w]+\.teamtailor\.com$/i;

/**
 * Returns the career domain classification for a given URL.
 *   "canonical"  — matches a primary Concentrix portal
 *   "country_ats" — matches a country-specific Talkpush ATS instance
 *   "webhelp_ats" — matches an ex-Webhelp TeamTailor ATS instance (still active)
 *   "legacy"     — matches a known defunct/deprecated brand domain
 *   "unknown"    — not recognized as any of the above
 */
export function classifyCareerDomain(
  url: string
): "canonical" | "country_ats" | "webhelp_ats" | "legacy" | "unknown" {
  const lower = url.toLowerCase();

  if (LEGACY_CAREER_DOMAINS.some((d) => lower.includes(d))) return "legacy";

  const hostname = (() => {
    try { return new URL(lower).hostname; } catch { return lower; }
  })();

  if (CANONICAL_CAREER_DOMAINS.some((d) => lower.includes(d))) return "canonical";
  if (COUNTRY_ATS_DOMAIN_PATTERN.test(hostname)) return "country_ats";
  if (WEBHELP_ATS_DOMAIN_PATTERN.test(hostname)) return "webhelp_ats";

  return "unknown";
}

// ── Relocation recruitment pattern ────────────────────────────────────────
//
// A distinct Concentrix campaign type: recruiting foreign-language speakers
// living abroad to work in a specific country (most actively Portugal/Greece).
// This requires different geo/language strategy than local recruitment.

export interface RelocationRecruitmentConfig {
  /** The target country where the role is located */
  destination_country: string;
  /** Languages being recruited for (ISO 639-1 codes) */
  recruitment_languages: string[];
  /** Known origin countries where the target language is spoken */
  source_countries: string[];
  /** Account name(s) actively running this pattern */
  active_accounts: string[];
}

export const RELOCATION_RECRUITMENT_PATTERNS: RelocationRecruitmentConfig[] = [
  {
    destination_country: "Portugal",
    recruitment_languages: ["de", "fr", "es", "nl"],
    source_countries: ["Germany", "Austria", "Switzerland", "France", "Belgium",
                       "Spain", "Netherlands"],
    active_accounts: [
      "Concentrix Portugal (faturação Republica)",
      "Concentrix Portugal (faturação Yelo)",
    ],
  },
  {
    destination_country: "Greece",
    recruitment_languages: ["de", "fr"],
    source_countries: ["Germany", "Austria", "Switzerland", "France", "Belgium"],
    active_accounts: [
      "Concentrix Greece",  // historically active, currently paused
    ],
  },
  {
    destination_country: "Bulgaria",
    recruitment_languages: ["de", "fr", "es"],
    source_countries: ["Germany", "France", "Spain"],
    active_accounts: [],  // historically active, currently paused
  },
];

// Strong, unambiguous relocation signals — sufficient on their own
const EXPLICIT_RELOCATION_TERMS = [
  "relocation",
  "relocate",
  "move abroad",
  "work abroad",
  "expat",
  "international move",
] as const;

// Language/speaker terms — also used in normal language-targeted campaigns,
// so they require a known relocation destination to avoid false positives
const LANGUAGE_SPEAKER_TERMS = [
  "foreign speakers",
  "german speakers",
  "french speakers",
  "dutch speakers",
  "spanish speakers",
  "arbeiten in",       // "work in" (German)
  "travailler au",     // "work in" (French)
  "werken in",         // "work in" (Dutch)
] as const;

export const RELOCATION_KEYWORDS = [
  ...EXPLICIT_RELOCATION_TERMS,
  ...LANGUAGE_SPEAKER_TERMS,
] as const;

/**
 * Returns true when a brief signals relocation recruitment intent.
 *
 * Explicit relocation terms (relocation, expat, etc.) are sufficient alone.
 * Language/speaker terms (german speakers, etc.) require a known relocation
 * destination country alongside them to avoid false positives on ordinary
 * language-targeted campaigns.
 */
export function isRelocationRecruitmentSignal(
  geography: string,
  additionalNotes?: string
): boolean {
  const combined = `${geography} ${additionalNotes ?? ""}`.toLowerCase();

  if (EXPLICIT_RELOCATION_TERMS.some((kw) => combined.includes(kw))) return true;

  const hasKnownDestination = RELOCATION_RECRUITMENT_PATTERNS.some((p) =>
    combined.includes(p.destination_country.toLowerCase())
  );
  if (!hasKnownDestination) return false;

  return LANGUAGE_SPEAKER_TERMS.some((kw) => combined.includes(kw));
}

// ── Corporate vocabulary — confirmed strategic terms ───────────────────────
//
// Terms that appear in live corporate campaigns (search themes, sitelinks,
// ad copy). Beacon can treat these as pre-approved, high-confidence vocabulary
// when generating corporate campaign content.

export const CONFIRMED_CORPORATE_VOCAB = {
  /**
   * AI & automation terms confirmed in active PMax search themes (26+ instances)
   * and sitelinks. These are established Concentrix strategic messaging terms.
   */
  ai_themes: [
    "Agentic AI",
    "Human-AI collaboration",
    "AI readiness evaluation",
    "AI maturity assessment",
    "AI-powered business solutions",
    "Intelligent automation solutions",
    "AI governance",
    "AI process optimization",
    "Enterprise automation",
    "Collaborative AI",
    "AI risk mitigation",
    "Value-based AI",
    "AI-driven operations",
  ],

  /**
   * Service/product terms confirmed in active sitelinks and ad copy.
   * These reflect the current Concentrix brand vocabulary.
   */
  product_terms: [
    "iX Product Suite",
    "Enterprise Technology",
    "Trust & Safety",
    "Voice of the Customer",
    "Data and Analytics",
    "Digital Experience",
    "Agentic AI",
  ],

  /**
   * Careers-specific employer brand phrases confirmed in high-frequency
   * headlines and descriptions across the EMEA/UK portfolio.
   */
  careers_phrases: [
    "Your career starts here",
    "Work on behalf of",       // client-brand template: "Work on behalf of [Client]"
    "Full time permanent",
    "Join a fun, friendly team",
    "Work with a global brand",
    "Build your skills and career",
    "Earn performance bonuses",
    "Diverse, global team",
    "Career opportunities",
    "Concentrix University",
  ],
} as const;

// ── Client-brand campaign pattern ─────────────────────────────────────────
//
// Concentrix runs campaigns on behalf of clients (Vodafone, O2, EE, BT,
// Swisscom) where the client brand appears in the ad copy. This is a
// legitimate and high-frequency pattern in the careers portfolio.

export const CLIENT_BRAND_HEADLINE_TEMPLATE = "Work on behalf of {CLIENT}";

export const KNOWN_CLIENT_BRANDS_IN_ADS = [
  "Vodafone",
  "O2",
  "EE",
  "BT",
  "Swisscom",
  "1&1",
  "Santander",
  "Salt",
  "Soho",
] as const;

