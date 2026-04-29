/**
 * Google Ads asset character limits and push-layer count caps.
 *
 * OWNERSHIP: Domain truth for Google Ads. Lives here so any system
 * reasoning about Google Ads asset constraints has a single authoritative source.
 *
 * All values reflect actual Google Ads API constraints for the campaign families
 * currently implemented (Search/RSA, Display/RDA, Demand Gen, PMax, App).
 * Video and Shopping values are included as informational references.
 *
 * NOTE ON CONSERVATIVE PMAX CAPS
 * PMax count caps are currently set below the Google API maximum.
 * PMAX_HEADLINE_COUNT_MAX = 3 (API supports 15)
 * PMAX_DESCRIPTION_COUNT_MAX = 2 (API supports 5)
 * These are intentional quality-control constraints, not API limits.
 * They should be revisited when PMax asset coverage is expanded.
 *
 * KNOWN DRIFT
 * prompt.ts currently says "one sentence" for sitelink descriptions rather
 * than referencing SITELINK_DESCRIPTION_MAX. That is a tracked gap.
 */

// ── Character limits per asset type ────────────────────────────────────────

/** RSA headline max chars — Search, App (same spec) */
export const RSA_HEADLINE_MAX = 30;

/** RSA description max chars — Search, RDA, App */
export const RSA_DESCRIPTION_MAX = 90;

/**
 * Demand Gen headline max chars.
 * Different from RSA: Google Ads allows up to 40 chars for Demand Gen headlines.
 */
export const DEMAND_GEN_HEADLINE_MAX = 40;

/**
 * Display / RDA headline max chars.
 * Same limit as Demand Gen per Google Ads spec.
 */
export const DISPLAY_HEADLINE_MAX = 40;

/** Long headline max chars — RDA, PMax */
export const LONG_HEADLINE_MAX = 90;

/** PMax headline max chars */
export const PMAX_HEADLINE_MAX = 30;

/** PMax description max chars */
export const PMAX_DESCRIPTION_MAX = 90;

/** Video hook / CTA max chars — informational only; Video is active_review_only */
export const VIDEO_HOOK_MAX = 60;

/** Shopping merchant title / promo text max chars — informational only; Shopping is modeled_inactive */
export const SHOPPING_TEXT_MAX = 70;

/** Sitelink link text max chars */
export const SITELINK_TEXT_MAX = 25;

/** Sitelink description max chars (Google Ads limit) */
export const SITELINK_DESCRIPTION_MAX = 35;

/** Callout text max chars */
export const CALLOUT_TEXT_MAX = 25;

/** Business name max chars — RDA, Demand Gen, PMax */
export const BUSINESS_NAME_MAX = 25;

/** Campaign name max chars */
export const CAMPAIGN_NAME_MAX = 250;

/**
 * PMax key_message truncation before CTA concatenation.
 * Not a Google limit — internal logic to prevent the combined string from
 * overflowing PMAX_DESCRIPTION_MAX when the CTA is appended.
 */
export const PMAX_KEY_MESSAGE_BEFORE_CTA_MAX = 75;

// ── Push-layer count caps (Google Ads API maxima) ───────────────────────────

/** Max RSA headlines the Google Ads API accepts per ad */
export const RSA_HEADLINE_COUNT_MAX = 15;

/** Max RSA descriptions the Google Ads API accepts per ad */
export const RSA_DESCRIPTION_COUNT_MAX = 4;

/** Max RDA headlines pushed */
export const RDA_HEADLINE_COUNT_MAX = 5;

/** Max RDA descriptions pushed */
export const RDA_DESCRIPTION_COUNT_MAX = 5;

/** Max Demand Gen headlines pushed */
export const DEMAND_GEN_HEADLINE_COUNT_MAX = 5;

/** Max Demand Gen descriptions pushed */
export const DEMAND_GEN_DESCRIPTION_COUNT_MAX = 5;

/**
 * Max PMax headlines pushed — conservative current implementation.
 * Google supports up to 15 headlines per asset group; currently 3 are pushed.
 */
export const PMAX_HEADLINE_COUNT_MAX = 3;

/**
 * Max PMax descriptions pushed — conservative current implementation.
 * Google supports up to 5 descriptions; currently 2 are pushed.
 */
export const PMAX_DESCRIPTION_COUNT_MAX = 2;

/** App headline count max pushed */
export const APP_HEADLINE_COUNT_MAX = 5;

/** App description count max pushed */
export const APP_DESCRIPTION_COUNT_MAX = 5;
