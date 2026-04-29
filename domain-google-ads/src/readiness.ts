import type {
  AudienceMode,
  ActivationReadiness,
  BiddingStrategy,
  CampaignRequirementsReadiness,
  CampaignSubtype,
  CampaignType,
  ConversionTrackingStatus,
  DependencyDomain,
  DraftabilityLevel,
  LocalGoalType,
  MerchantCenterFeedStatus,
  MerchantCenterLinkStatus,
  PrimaryConversionType,
  ReadinessCheck,
  ReadinessSeverity,
  CampaignObjective,
} from "./types";
import {
  defaultCampaignFamilyForObjective,
  familyLabel,
  objectiveFitForFamily,
} from "./model";
import {
  classifyCareerDomain,
  isRelocationRecruitmentSignal,
} from "@mktg/core";
import {
  resolveAccountContext,
  UTM_TRACKING_TEMPLATES,
  BID_STRATEGY_DEFAULTS,
} from "./concentrix-context";

// Structural interface covering only the brief fields that readiness evaluation
// actually reads. Beacon's BriefInput satisfies this via structural typing —
// no import of BriefInput or any Beacon product type is required.
interface ReadinessBriefSignals {
  account_id?: string;
  campaign_objective: CampaignObjective;
  campaign_type?: CampaignType;
  campaign_subtype?: CampaignSubtype;
  landing_page_url?: string;
  bidding_strategy?: BiddingStrategy;
  target_cpa?: number;
  target_roas?: number;
  tracking_template?: string;
  product_or_service?: string;
  additional_notes?: string;
  // App campaigns
  app_store_url?: string;
  app_platform?: string;
  app_id_or_package_name?: string;
  // Merchant Center / Shopping
  merchant_center_link_status?: MerchantCenterLinkStatus;
  merchant_center_feed_status?: MerchantCenterFeedStatus;
  // Measurement
  primary_conversion_type?: PrimaryConversionType;
  conversion_tracking_status?: ConversionTrackingStatus;
  // Assets
  available_headlines?: unknown[];
  available_descriptions?: unknown[];
  available_images?: unknown[];
  available_logos?: unknown[];
  available_videos?: unknown[];
  image_asset_status?: string;
  logo_asset_status?: string;
  video_asset_status?: string;
  // Audience
  audience_mode?: AudienceMode;
  target_audience_segments?: string[];
  // Geography / language
  target_geography?: string;
  geography_targets?: unknown[];
  target_language?: string;
  target_language_code?: string;
  language_targets?: string[];
  // Local / store-goal
  business_profile_link_status?: string;
  store_locations_defined?: boolean;
  local_goal_type?: LocalGoalType;
}

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function hasValidUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasAny(values?: unknown[]): boolean {
  return !!values && values.length > 0;
}

function pushCheck(
  checks: ReadinessCheck[],
  severity: ReadinessSeverity,
  domain: DependencyDomain,
  field_names: string[],
  message: string
) {
  checks.push({ severity, domain, field_names, message });
}

function inferResolvedFamily(brief: ReadinessBriefSignals): CampaignType {
  return brief.campaign_type ?? defaultCampaignFamilyForObjective(brief.campaign_objective);
}

function evaluateDestination(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  if (family === "app") {
    if (!brief.app_store_url || !hasValidUrl(brief.app_store_url)) {
      pushCheck(checks, "blocker", "app", ["app_store_url"], "App campaigns require a valid App Store or Google Play URL.");
    }
    if (!brief.app_platform) {
      pushCheck(checks, "blocker", "app", ["app_platform"], "App campaigns require the app platform.");
    }
    if (!brief.app_id_or_package_name) {
      pushCheck(checks, "blocker", "app", ["app_id_or_package_name"], "App campaigns require the app ID or package name.");
    }
    return;
  }

  if (family === "shopping") {
    if (brief.merchant_center_link_status !== "linked_confirmed") {
      pushCheck(checks, "blocker", "feed", ["merchant_center_link_status"], "Shopping requires a linked Merchant Center account.");
    }
    if (!brief.merchant_center_feed_status || brief.merchant_center_feed_status === "missing" || brief.merchant_center_feed_status === "disapproved") {
      pushCheck(checks, "blocker", "feed", ["merchant_center_feed_status"], "Shopping requires an approved or usable product feed.");
    }
    return;
  }

  if (!brief.landing_page_url || !hasValidUrl(brief.landing_page_url)) {
    pushCheck(checks, "blocker", "destination", ["landing_page_url"], `${familyLabel(family)} requires a valid landing page URL.`);
    return;
  }

  // ── Strategist Reasoning: Careers Domain Validation ──────────────────────
  const account = brief.account_id ? resolveAccountContext(brief.account_id) : null;
  const isCareersContext = account?.context === "careers" || brief.campaign_objective === "attract_candidates";

  if (isCareersContext) {
    const classification = classifyCareerDomain(brief.landing_page_url);
    if (classification === "legacy") {
      pushCheck(checks, "blocker", "destination", ["landing_page_url"], "This destination uses a legacy brand domain (e.g. Convergys/Webhelp) that is no longer permitted for active recruitment.");
    } else if (classification === "canonical") {
      pushCheck(checks, "satisfied", "destination", ["landing_page_url"], "Destination aligns with canonical Concentrix career portals. High confidence in routing.");
    } else if (classification === "unknown") {
      pushCheck(checks, "warning", "destination", ["landing_page_url"], "This careers destination is not a recognized canonical portal. Ensure it is a valid client ATS or microsite.");
    }
  }
}

function evaluateMeasurement(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  const performanceObjective = brief.campaign_objective !== "build_brand_awareness";
  const conversionRequiredFamilies: CampaignType[] = [
    "search",
    "search_local",
    "performance_max",
    "performance_max_store_goals",
    "shopping",
    "app",
    "demand_gen",
  ];

  if (performanceObjective && conversionRequiredFamilies.includes(family)) {
    if (!brief.primary_conversion_type || brief.primary_conversion_type === "unknown") {
      pushCheck(checks, "warning", "measurement", ["primary_conversion_type"], "Primary conversion type is missing or still unknown.");
    }
    if (!brief.conversion_tracking_status || brief.conversion_tracking_status === "missing") {
      pushCheck(checks, "warning", "measurement", ["conversion_tracking_status"], "Conversion tracking status is not confirmed.");
    } else if (brief.conversion_tracking_status === "confirmed_live") {
      pushCheck(checks, "satisfied", "measurement", ["conversion_tracking_status"], "Live conversion tracking confirmed. This is essential for the requested performance objective.");
    }
  }

  if (
    ["performance_max", "performance_max_store_goals", "shopping", "app"].includes(family) &&
    (!brief.conversion_tracking_status || brief.conversion_tracking_status === "missing")
  ) {
    pushCheck(checks, "blocker", "measurement", ["conversion_tracking_status"], `${familyLabel(family)} cannot be treated as push-ready without confirmed measurement status.`);
  }
}

function evaluateAssets(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  const headlines = hasAny(brief.available_headlines);
  const descriptions = hasAny(brief.available_descriptions);
  const images = hasAny(brief.available_images) || brief.image_asset_status === "available";
  const logos = hasAny(brief.available_logos) || brief.logo_asset_status === "available";
  const videos = hasAny(brief.available_videos) || brief.video_asset_status === "available";

  if (family === "search" || family === "search_local") {
    if (!headlines || !descriptions) {
      pushCheck(checks, "warning", "assets", ["available_headlines", "available_descriptions"], "Search campaigns work best when headline and description assets are confirmed explicitly.");
    } else {
      pushCheck(checks, "satisfied", "assets", ["available_headlines", "available_descriptions"], "Core text assets are defined. Performance will depend on keyword relevance and ad strength.");
    }
    return;
  }

  if (family === "video") {
    if (!videos) {
      pushCheck(checks, "blocker", "assets", ["available_videos", "video_asset_status"], "Video campaigns require at least one usable video asset.");
    }
    return;
  }

  if (family === "display" || family === "responsive_display" || family === "demand_gen") {
    if (!images) {
      pushCheck(checks, "blocker", "assets", ["available_images", "image_asset_status"], `${familyLabel(family)} requires image assets.`);
    }
    if (!logos) {
      pushCheck(checks, "warning", "assets", ["available_logos", "logo_asset_status"], `${familyLabel(family)} is weaker without logo coverage.`);
    }
    if (!headlines || !descriptions) {
      pushCheck(checks, "warning", "assets", ["available_headlines", "available_descriptions"], `${familyLabel(family)} should have structured text assets before push.`);
    }
    return;
  }

  if (family === "performance_max" || family === "performance_max_store_goals") {
    if (brief.campaign_subtype !== "retail_with_feed") {
      if (!images || !logos) {
        pushCheck(checks, "blocker", "assets", ["available_images", "available_logos"], "Performance Max needs image and logo coverage unless it is explicitly feed-led retail setup.");
      }
      if (!headlines || !descriptions) {
        pushCheck(checks, "warning", "assets", ["available_headlines", "available_descriptions"], "Performance Max should have structured text assets before activation.");
      }
      if (!videos) {
        pushCheck(checks, "warning", "assets", ["available_videos", "video_asset_status"], "Performance Max can auto-generate videos, but Beacon should flag the reduced control.");
      }
    }
  }
}

function evaluateAudience(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  const audienceRequiredFamilies: CampaignType[] = [
    "display",
    "responsive_display",
    "video",
    "demand_gen",
  ];

  if (audienceRequiredFamilies.includes(family)) {
    if (!brief.audience_mode || brief.audience_mode === "not_used") {
      pushCheck(checks, "warning", "audience", ["audience_mode"], `${familyLabel(family)} usually needs a defined audience strategy.`);
    }
    if (!hasAny(brief.target_audience_segments as unknown[])) {
      pushCheck(checks, "warning", "audience", ["target_audience_segments"], `${familyLabel(family)} is weaker without audience segments or signals.`);
    }
  }
}

function evaluateGeoLanguage(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  if (!brief.target_geography && (!brief.geography_targets || (brief.geography_targets as unknown[]).length === 0)) {
    pushCheck(checks, "blocker", "geo_language", ["target_geography", "geography_targets"], "Campaign geography is missing.");
  }

  // ── Strategist Reasoning: Relocation Signal Detection ────────────────────
  if (isRelocationRecruitmentSignal(brief.target_geography ?? "", brief.additional_notes)) {
    pushCheck(checks, "satisfied", "geo_language", ["target_geography"], "Detected relocation recruitment pattern. Strategy should prioritize origin markets for the target language speakers.");
  }

  const normalizedGeo = normalize(brief.target_geography);
  const multilingual = /emea|apac|latam|global|worldwide|international/.test(normalizedGeo);
  const nonEnglish = /france|germany|spain|portugal|italy|japan|korea|brazil|mexico|poland|netherlands|belgium|switzerland/.test(normalizedGeo);
  const hasLanguage = hasAny(brief.language_targets) || !!brief.target_language || !!brief.target_language_code;

  if ((family !== "shopping" || nonEnglish || multilingual) && !hasLanguage) {
    pushCheck(checks, "warning", "geo_language", ["language_targets", "target_language"], "Language targeting is missing or under-specified.");
  }
}

function evaluateStrategy(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  const liveStrategySupport: Partial<Record<CampaignType, BiddingStrategy[]>> = {
    search: [
      "manual_cpc",
      "maximize_clicks",
      "maximize_conversions",
      "target_cpa",
      "maximize_conversion_value",
      "target_roas",
    ],
    search_local: [
      "manual_cpc",
      "maximize_clicks",
      "maximize_conversions",
      "target_cpa",
      "maximize_conversion_value",
      "target_roas",
    ],
    performance_max: [
      "maximize_conversions",
      "target_cpa",
      "maximize_conversion_value",
      "target_roas",
    ],
    display: [
      "maximize_clicks",
      "maximize_conversions",
      "target_cpa",
    ],
    responsive_display: [
      "maximize_clicks",
      "maximize_conversions",
      "target_cpa",
    ],
    demand_gen: [
      "maximize_conversions",
      "target_cpa",
    ],
  };

  // Families where absent bidding_strategy maps to a well-defined Beacon default (targetSpend / maximize_clicks).
  // No advisory is needed when strategy is unset — the push behavior is intentional and stable.
  const absentStrategyDefaultFamilies = new Set<CampaignType>(["display", "responsive_display", "demand_gen"]);

  const supportedStrategies = liveStrategySupport[family];

  if (!supportedStrategies) {
    if (brief.bidding_strategy) {
      pushCheck(
        checks,
        "warning",
        "measurement",
        ["bidding_strategy"],
        `${familyLabel(family)} does not have family-specific live bidding execution. Beacon will apply its default bidding configuration at push time; the specified strategy will not be honored.`
      );
      return;
    }
  } else if (!brief.bidding_strategy && !absentStrategyDefaultFamilies.has(family)) {
    pushCheck(
      checks,
      "warning",
      "measurement",
      ["bidding_strategy"],
      `${familyLabel(family)} can execute live bidding for a supported strategy set, but no explicit bidding strategy is selected. Beacon may infer a default, so confirm the optimization mode before push.`
    );
  }

  // ── Bid Strategy Validation ──────────────────────────────────────────────
  if (brief.bidding_strategy) {
    if (supportedStrategies && !supportedStrategies.includes(brief.bidding_strategy)) {
      pushCheck(
        checks,
        "blocker",
        "measurement",
        ["bidding_strategy"],
        `${familyLabel(family)} does not currently support live execution for bidding strategy '${brief.bidding_strategy}'.`
      );
      return;
    }

    if (brief.bidding_strategy === "target_cpa" && (!brief.target_cpa || brief.target_cpa <= 0)) {
      pushCheck(checks, "blocker", "measurement", ["target_cpa"], "Target CPA bidding requires a positive target CPA value.");
      return;
    }

    if (brief.bidding_strategy === "target_roas" && (!brief.target_roas || brief.target_roas <= 0)) {
      pushCheck(checks, "blocker", "measurement", ["target_roas"], "Target ROAS bidding requires a positive target ROAS value.");
      return;
    }

    const isPerformance = brief.campaign_objective !== "build_brand_awareness";
    const expected = isPerformance ? BID_STRATEGY_DEFAULTS.primary : BID_STRATEGY_DEFAULTS.fallback;

    if (brief.bidding_strategy !== expected) {
      pushCheck(checks, "warning", "measurement", ["bidding_strategy"], `Current MCC benchmarks suggest '${expected}' for this objective, but '${brief.bidding_strategy}' is selected.`);
    } else {
      pushCheck(checks, "satisfied", "measurement", ["bidding_strategy"], `Bidding strategy '${brief.bidding_strategy}' aligns with active portfolio benchmarks for this objective.`);
    }
  }

  // ── Tracking Template Validation ─────────────────────────────────────────
  if (brief.tracking_template) {
    const canonical = (UTM_TRACKING_TEMPLATES as any)[family];
    if (canonical && brief.tracking_template !== canonical) {
      pushCheck(checks, "warning", "linkage", ["tracking_template"], "Tracking template does not match the standardized Concentrix UTM pattern for this campaign family.");
    } else if (canonical) {
      pushCheck(checks, "satisfied", "linkage", ["tracking_template"], "UTM tracking template matches the standardized Concentrix pattern.");
    }
  }
}

function evaluateLinkage(brief: ReadinessBriefSignals, family: CampaignType, checks: ReadinessCheck[]) {
  if (family === "performance_max" && brief.campaign_subtype === "retail_with_feed") {
    if (brief.merchant_center_link_status !== "linked_confirmed") {
      pushCheck(checks, "blocker", "linkage", ["merchant_center_link_status"], "Retail Performance Max requires a linked Merchant Center account.");
    }
    if (!brief.merchant_center_feed_status || ["missing", "disapproved"].includes(brief.merchant_center_feed_status)) {
      pushCheck(checks, "blocker", "feed", ["merchant_center_feed_status"], "Retail Performance Max requires an approved or usable feed.");
    }
  }

  if (family === "performance_max_store_goals" || family === "search_local") {
    if (brief.business_profile_link_status !== "linked_confirmed") {
      pushCheck(checks, "blocker", "locations", ["business_profile_link_status"], "Local/store-goal campaigns require linked location infrastructure.");
    }
    if (!brief.store_locations_defined) {
      pushCheck(checks, "blocker", "locations", ["store_locations_defined"], "Local/store-goal campaigns require defined store locations.");
    }
    if (!brief.local_goal_type) {
      pushCheck(checks, "warning", "locations", ["local_goal_type"], "Local/store-goal campaigns should define the local goal type.");
    }
  }
}

export function evaluateGoogleAdsReadiness(brief: ReadinessBriefSignals): CampaignRequirementsReadiness {
  const family = inferResolvedFamily(brief);
  const checks: ReadinessCheck[] = [];

  evaluateDestination(brief, family, checks);
  evaluateMeasurement(brief, family, checks);
  evaluateAssets(brief, family, checks);
  evaluateAudience(brief, family, checks);
  evaluateGeoLanguage(brief, family, checks);
  evaluateLinkage(brief, family, checks);
  evaluateStrategy(brief, family, checks);

  const blockers = checks.filter((check) => check.severity === "blocker");
  const warnings = checks.filter((check) => check.severity === "warning");

  let draftability_level: DraftabilityLevel = "can_prepare_push_ready_draft";
  let activation_readiness: ActivationReadiness = "push_ready";

  if (blockers.length > 0) {
    activation_readiness = "not_ready";
    if (family === "shopping" || family === "app" || family === "performance_max_store_goals") {
      draftability_level = "cannot_draft";
    } else {
      draftability_level = "can_draft_but_not_push";
    }
  } else if (warnings.length > 0) {
    activation_readiness = "needs_review";
    draftability_level = "can_draft_with_placeholders";
  }

  return {
    campaign_family: family,
    campaign_subtype: brief.campaign_subtype ?? null,
    family_objective_fit: objectiveFitForFamily(brief.campaign_objective, family),
    draftability_level,
    activation_readiness,
    fields_requiring_clarification: Array.from(
      new Set(
        checks
          .filter((check) => check.severity !== "satisfied")
          .flatMap((check) => check.field_names)
      )
    ),
    blocking_dependencies: blockers.map((check) => check.message),
    warning_dependencies: warnings.map((check) => check.message),
    dependency_checks: checks,
  };
}
