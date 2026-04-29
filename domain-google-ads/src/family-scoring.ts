import type { CampaignObjective, CampaignType } from "./types";

// ── Publish-ready families ────────────────────────────────────────────────────

export const PUBLISH_READY_CAMPAIGN_TYPES = [
  "search",
  "search_local",
  "display",
  "responsive_display",
  "demand_gen",
  "performance_max",
] as const satisfies readonly CampaignType[];

type PublishReadyType = (typeof PUBLISH_READY_CAMPAIGN_TYPES)[number];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  search: "Search",
  search_local: "Search (local)",
  display: "Uploaded Display",
  responsive_display: "Responsive Display",
  video: "Video",
  demand_gen: "Demand Gen",
  shopping: "Shopping",
  performance_max: "Performance Max",
  performance_max_store_goals: "Performance Max (store goals)",
  app: "App",
};

export interface CampaignFamilyImplication {
  readiness_burden: string;
  asset_burden: string;
  execution_support: string;
  known_path_note: string;
}

export const CAMPAIGN_FAMILY_IMPLICATIONS: Record<PublishReadyType, CampaignFamilyImplication> = {
  search: {
    readiness_burden: "Lowest readiness burden — text-led, fast to launch.",
    asset_burden: "Low. Text ads, sitelinks, and callouts are the main inputs.",
    execution_support: "Most mature Beacon execution path.",
    known_path_note:
      "Strongest starting point for intent-based lead capture. Highest control, lowest asset burden, fastest launch. Most B2B campaigns should start here.",
  },
  search_local: {
    readiness_burden:
      "Higher than Search — local linkage and location readiness must be satisfied.",
    asset_burden: "Low creative burden, but higher local infrastructure burden.",
    execution_support: "Supported when location linkage is confirmed.",
    known_path_note:
      "Business Profile linkage and location setup can block launch even if base Search structure is ready.",
  },
  display: {
    readiness_burden: "Higher — uploaded creative validity and HTML5 eligibility both matter.",
    asset_burden: "Highest in this selector. Requires one valid HTML5 ZIP media bundle.",
    execution_support:
      "Supported for uploaded Display HTML5 creative on accounts with confirmed eligibility.",
    known_path_note: "Unknown or missing HTML5 eligibility remains blocking.",
  },
  responsive_display: {
    readiness_burden:
      "Moderate — text, images, and optional video influence launch confidence.",
    asset_burden: "Medium. Images required; YouTube video supported when provided.",
    execution_support:
      "Supported for image/logo execution and YouTube video attachment.",
    known_path_note:
      "More asset-sensitive than Search but lighter than uploaded Display. Consider when visual reach matters more than search intent.",
  },
  demand_gen: {
    readiness_burden:
      "Moderate — stronger audience and asset expectations than Search.",
    asset_burden: "Medium to high. Visual assets required for effectiveness.",
    execution_support:
      "Supported for image/logo execution and YouTube video on the Demand Gen video path.",
    known_path_note:
      "Upper-funnel visual distribution. Strongest when the brief explicitly calls for creative-led discovery or awareness. Not the default for direct-response lead gen.",
  },
  performance_max: {
    readiness_burden: "Highest — Beacon evaluates the most execution prerequisites.",
    asset_burden:
      "High. Text, images, logos, and YouTube video all expected for full coverage.",
    execution_support: "Supported end to end, including the YouTube video path.",
    known_path_note:
      "Widest reach but lowest targeting control. Best when full asset coverage is confirmed and broad distribution is explicitly wanted. Not the default starting point for intent-led B2B campaigns.",
  },
};

// ── Minimal brief interface for scoring ───────────────────────────────────────

/**
 * Minimal brief fields required by the family scoring functions.
 * Structurally compatible with Beacon's full BriefInput — any BriefInput
 * satisfies this interface without casting.
 */
export interface BriefForRanking {
  campaign_objective: CampaignObjective;
  landing_page_url?: string | null;
  key_message?: string | null;
  product_or_service?: string | null;
  available_videos?: unknown[] | null;
  responsive_display_youtube_videos?: unknown[] | null;
  demand_gen_youtube_videos?: unknown[] | null;
  performance_max_youtube_videos?: unknown[] | null;
  video_asset_status?: string | null;
  available_images?: unknown[] | null;
  selected_account_images?: unknown[] | null;
  image_asset_status?: string | null;
  audience_buying_stage?: string | null;
}

// ── Channel signal detection ──────────────────────────────────────────────────

export interface ChannelSignals {
  hasVideoAsset: boolean;
  hasImageAssets: boolean;
  visualLanguageDetected: boolean;
  brandSignalDetected: boolean;
  displayExplicitDetected: boolean;
  awarenessStageDetected: boolean;
  brandLandingPage: boolean;
  detectedSignalLabels: string[];
}

const AWARENESS_PATTERN =
  /\b(awareness|brand awareness|impression|reach|visibility|exposure|brand reach|brand exposure)\b/i;
const VISUAL_ASSET_PATTERN =
  /\b(video|videos|image|images|visual|visuals|banner|animation|youtube|footage|film|clip)\b/i;
const BRAND_SIGNAL_PATTERN =
  /\b(brand|branded|branding|visibility|exposure|brand awareness)\b/i;
const DISPLAY_EXPLICIT_PATTERN =
  /\b(display ad|display campaign|demand gen|demand generation|responsive display|banner ad|image ad|visual ad|performance max)\b/i;

/** Reads asset state + intent text to detect visual/brand channel preference. */
export function detectChannelSignals(
  brief: BriefForRanking,
  intentText?: string,
): ChannelSignals {
  const searchText = [
    intentText ?? "",
    brief.key_message ?? "",
    brief.product_or_service ?? "",
  ].join(" ");

  const hasVideoAsset =
    (brief.available_videos?.length ?? 0) > 0 ||
    (brief.responsive_display_youtube_videos?.length ?? 0) > 0 ||
    (brief.demand_gen_youtube_videos?.length ?? 0) > 0 ||
    (brief.performance_max_youtube_videos?.length ?? 0) > 0 ||
    brief.video_asset_status === "available";

  const hasImageAssets =
    (brief.available_images?.length ?? 0) > 0 ||
    (brief.selected_account_images?.length ?? 0) > 0 ||
    brief.image_asset_status === "available";

  const visualLanguageDetected = VISUAL_ASSET_PATTERN.test(searchText);
  const brandSignalDetected = BRAND_SIGNAL_PATTERN.test(searchText);
  const displayExplicitDetected = DISPLAY_EXPLICIT_PATTERN.test(searchText);
  const awarenessStageDetected = brief.audience_buying_stage === "awareness";
  const brandLandingPage = /\/(about|brand)\b/.test(brief.landing_page_url ?? "");

  const detectedSignalLabels: string[] = [];
  if (hasVideoAsset) detectedSignalLabels.push("Video asset available");
  if (hasImageAssets) detectedSignalLabels.push("Image assets available");
  if (visualLanguageDetected) detectedSignalLabels.push("Visual-first language detected");
  if (brandSignalDetected) detectedSignalLabels.push("Brand/awareness intent detected");
  if (displayExplicitDetected) detectedSignalLabels.push("Explicit display preference detected");
  if (awarenessStageDetected) detectedSignalLabels.push("Awareness buying stage");
  if (brandLandingPage) detectedSignalLabels.push("Brand-oriented landing page");

  return {
    hasVideoAsset,
    hasImageAssets,
    visualLanguageDetected,
    brandSignalDetected,
    displayExplicitDetected,
    awarenessStageDetected,
    brandLandingPage,
    detectedSignalLabels,
  };
}

// ── Family ranking ────────────────────────────────────────────────────────────

export interface RankedFamilyRecommendation {
  family: PublishReadyType;
  strategic_score: number;
  execution_maturity: number;
  detected_signals: string[];
}

const EXECUTION_MATURITY: Record<PublishReadyType, number> = {
  search: 100,
  search_local: 80,
  performance_max: 90,
  demand_gen: 85,
  responsive_display: 85,
  display: 45,
};

const OBJECTIVE_BASE_SCORES: Record<
  CampaignObjective,
  Partial<Record<PublishReadyType, number>>
> = {
  generate_leads:           { search: 90, search_local: 60, performance_max: 55, demand_gen: 40, responsive_display: 35, display: 20 },
  attract_candidates:       { search: 92, search_local: 65, performance_max: 40, demand_gen: 35, responsive_display: 30, display: 15 },
  increase_website_traffic: { search: 78, search_local: 45, performance_max: 62, demand_gen: 58, responsive_display: 55, display: 50 },
  build_brand_awareness:    { search: 5,  search_local: 0,  performance_max: 65, demand_gen: 85, responsive_display: 80, display: 70 },
};

const VISUAL_FAMILIES = new Set<string>([
  "demand_gen",
  "responsive_display",
  "display",
  "performance_max",
]);
const VIDEO_CAPABLE_FAMILIES = new Set<string>([
  "demand_gen",
  "responsive_display",
  "performance_max",
]);

function computeStrategicScore(
  family: PublishReadyType,
  objective: CampaignObjective,
  signals: ChannelSignals,
): number {
  let score = OBJECTIVE_BASE_SCORES[objective][family] ?? 0;

  const isVisual = VISUAL_FAMILIES.has(family);
  const isVideoCapable = VIDEO_CAPABLE_FAMILIES.has(family);
  const isSearch = family === "search" || family === "search_local";

  if (isVisual) {
    if (signals.hasVideoAsset && isVideoCapable) score += 12;
    if (signals.hasImageAssets) score += 5;
    if (signals.visualLanguageDetected) score += 3;
    if (signals.brandSignalDetected) score += 2;
    if (signals.displayExplicitDetected) score += 15;
    if (signals.awarenessStageDetected) score += 10;
    if (signals.brandLandingPage) score += 3;
  }

  if (isSearch) {
    if (signals.hasVideoAsset) score -= 5;
    if (signals.visualLanguageDetected) score -= 2;
    if (signals.displayExplicitDetected) score -= 15;
    if (signals.brandSignalDetected && objective !== "attract_candidates") score -= 3;
    if (signals.awarenessStageDetected) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Returns all publish-ready families ranked by strategic fit for this brief.
 * Pass `intentText` to enable visual/brand language detection from free-form input.
 * Strategic score and execution maturity are kept separate so callers can surface
 * "strong strategic fit / preview-only" vs "good fit / push-ready" independently.
 */
export function rankFamiliesForBrief(
  brief: BriefForRanking,
  intentText?: string,
): RankedFamilyRecommendation[] {
  const signals = detectChannelSignals(brief, intentText);
  return (
    PUBLISH_READY_CAMPAIGN_TYPES as readonly PublishReadyType[]
  )
    .map((family) => ({
      family,
      strategic_score: computeStrategicScore(family, brief.campaign_objective, signals),
      execution_maturity: EXECUTION_MATURITY[family],
      detected_signals: signals.detectedSignalLabels,
    }))
    .filter((r) => r.strategic_score > 0)
    .sort((a, b) =>
      b.strategic_score !== a.strategic_score
        ? b.strategic_score - a.strategic_score
        : b.execution_maturity - a.execution_maturity,
    );
}
