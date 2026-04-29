import type {
  AudienceMode,
  BiddingStrategy,
  CampaignObjective,
  CampaignSubtype,
  CampaignType,
  ConversionTrackingStatus,
  FinalUrlControlMode,
  ListingGroupStrategy,
  LocalGoalType,
  MatchTypeStrategy,
  MerchantCenterFeedScope,
  MerchantCenterFeedStatus,
  MerchantCenterLinkStatus,
  PrimaryConversionType,
} from "./types";
import {
  BUSINESS_NAME_MAX,
  DEMAND_GEN_DESCRIPTION_COUNT_MAX,
  DEMAND_GEN_HEADLINE_COUNT_MAX,
  DEMAND_GEN_HEADLINE_MAX,
  RSA_DESCRIPTION_MAX,
} from "./asset-limits";

export type CampaignFieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "date"
  | "image_upload"
  | "video_upload"
  | "logo_upload"
  | "structured_object";

export type RequirementState = "required" | "optional" | "conditional";
export type CampaignFamilyStatus =
  | "active_publish_ready"
  | "active_review_only"
  | "modeled_inactive"
  | "deferred_legacy";
export type CampaignObjectiveStatus = "active" | "deferred_legacy";

export interface CampaignFieldDefinition {
  // field_name is string rather than keyof BriefInput — the MCP has no
  // dependency on Beacon's form schema. Callers may narrow this as needed.
  field_name: string;
  field_label: string;
  field_type: CampaignFieldType;
  requirement: RequirementState;
  condition?: string;
  allowed_values?: readonly string[];
  validation_rules: string[];
  character_limits?: string;
  count_limits?: string;
  may_infer: boolean;
  block_if_missing: boolean;
  warn_if_missing: boolean;
  explanation: string;
}

export interface CampaignFamilyDefinition {
  family: CampaignType;
  label: string;
  structural_shape:
    | "search_keyword_first"
    | "search_plus_local"
    | "display_ad_group_first"
    | "demand_gen_ad_group_first"
    | "asset_group_first"
    | "feed_first"
    | "app_first";
  supported_objectives: CampaignObjective[];
  typical_subtypes: readonly CampaignSubtype[];
  destination_model: "landing_page" | "feed" | "app" | "location";
  audience_dependence: "low" | "medium" | "high";
  feed_dependence: "none" | "optional" | "required";
  location_dependence: "none" | "optional" | "required";
  conversion_dependence: "low" | "medium" | "high";
  asset_complexity: "low" | "medium" | "high";
  safe_with_partial_info: boolean;
  force_clarification_when_partial: boolean;
}

export interface PerformanceMaxTextAssetRequirements {
  headline: { min: number; max: number; max_characters: number };
  long_headline: { min: number; max: number; max_characters: number };
  description: { min: number; max: number; max_characters: number };
  business_name: { min: number; max: number; max_characters: number };
}

export interface DemandGenTextAssetRequirements {
  headline: { min: number; max: number; max_characters: number };
  description: { min: number; max: number; max_characters: number };
  business_name: { required: boolean; max_characters: number };
  cta_text: { required: boolean; max_characters: number };
}

export interface DemandGenChannelControls {
  mode: "all_channels" | "owned_and_operated" | "selected_channels";
  selected_channels: Array<"youtube" | "discover" | "gmail" | "display" | "maps" | string>;
}

export interface DemandGenAdGroupModel {
  name: string;
  theme: string;
  final_urls: string[];
  audience_signals: string[];
  channel_controls: DemandGenChannelControls;
  text_assets: {
    business_name: string | null;
    headlines: string[];
    descriptions: string[];
    cta_text: string | null;
  };
}

export interface DemandGenFamilyModel {
  family: "demand_gen";
  source_of_truth: "demand_gen_model";
  structure_type: "ad_group_first";
  bidding_strategy_family: string | null;
  conversion_focus: string | null;
  product_feed_state: "not_used" | "available" | "required_for_selected_subtype" | "unknown";
  text_asset_requirements: DemandGenTextAssetRequirements;
  ad_groups: DemandGenAdGroupModel[];
  legacy_compatibility_fields: Array<
    | "campaign_structure"
    | "build_requirements.audience_signals"
    | "build_requirements.keyword_sets"
    | "build_requirements.ad_group_keyword_plans"
    | "build_requirements.draft_ad_assets"
  >;
}

export interface PerformanceMaxAssetGroupModel {
  name: string;
  theme: string;
  final_urls: string[];
  audience_signals: string[];
  search_themes: string[];
  text_assets: {
    business_name: string | null;
    headlines: string[];
    long_headlines: string[];
    descriptions: string[];
  };
}

export interface PerformanceMaxFamilyModel {
  family: "performance_max";
  source_of_truth: "performance_max_model";
  structure_type: "asset_group_first";
  final_url_expansion: "enabled" | "disabled" | "unknown";
  text_asset_requirements: PerformanceMaxTextAssetRequirements;
  asset_groups: PerformanceMaxAssetGroupModel[];
  legacy_compatibility_fields: Array<
    "campaign_structure"
    | "build_requirements.keyword_sets"
    | "build_requirements.ad_group_keyword_plans"
  >;
}

export const DEMAND_GEN_TEXT_ASSET_REQUIREMENTS: DemandGenTextAssetRequirements = {
  headline: {
    min: 1,
    max: DEMAND_GEN_HEADLINE_COUNT_MAX,
    max_characters: DEMAND_GEN_HEADLINE_MAX,
  },
  description: {
    min: 1,
    max: DEMAND_GEN_DESCRIPTION_COUNT_MAX,
    max_characters: RSA_DESCRIPTION_MAX,
  },
  business_name: {
    required: true,
    max_characters: BUSINESS_NAME_MAX,
  },
  cta_text: {
    required: false,
    max_characters: 30,
  },
};

export const GOOGLE_ADS_CAMPAIGN_FAMILIES: readonly CampaignType[] = [
  "search",
  "search_local",
  "display",
  "responsive_display",
  "video",
  "demand_gen",
  "shopping",
  "performance_max",
  "performance_max_store_goals",
  "app",
] as const;

export const CAMPAIGN_FAMILY_STATUS: Record<CampaignType, CampaignFamilyStatus> = {
  search: "active_publish_ready",
  search_local: "active_review_only",
  display: "active_review_only",
  responsive_display: "active_publish_ready",
  video: "active_review_only",
  demand_gen: "active_publish_ready",
  shopping: "modeled_inactive",
  performance_max: "active_publish_ready",
  performance_max_store_goals: "modeled_inactive",
  app: "modeled_inactive",
};

export const ACTIVE_PUBLISH_READY_CAMPAIGN_FAMILIES = GOOGLE_ADS_CAMPAIGN_FAMILIES.filter(
  (family) => CAMPAIGN_FAMILY_STATUS[family] === "active_publish_ready"
);

export const ACTIVE_REVIEW_ONLY_CAMPAIGN_FAMILIES = GOOGLE_ADS_CAMPAIGN_FAMILIES.filter(
  (family) => CAMPAIGN_FAMILY_STATUS[family] === "active_review_only"
);

export const MODELED_INACTIVE_CAMPAIGN_FAMILIES = GOOGLE_ADS_CAMPAIGN_FAMILIES.filter(
  (family) => CAMPAIGN_FAMILY_STATUS[family] === "modeled_inactive"
);

export const DEFERRED_LEGACY_CAMPAIGN_FAMILIES = GOOGLE_ADS_CAMPAIGN_FAMILIES.filter(
  (family) => CAMPAIGN_FAMILY_STATUS[family] === "deferred_legacy"
);

export const GOOGLE_ADS_OBJECTIVES: readonly CampaignObjective[] = [
  "generate_leads",
  "attract_candidates",
  "increase_website_traffic",
  "build_brand_awareness",
] as const;

export const CAMPAIGN_OBJECTIVE_STATUS: Record<string, CampaignObjectiveStatus> = {
  generate_leads: "active",
  attract_candidates: "active",
  increase_website_traffic: "active",
  build_brand_awareness: "active",
  drive_sales: "deferred_legacy",
  promote_app: "deferred_legacy",
  drive_store_visits: "deferred_legacy",
};

export const BIDDING_STRATEGIES: readonly BiddingStrategy[] = [
  "manual_cpc",
  "maximize_clicks",
  "manual_cpv",
  "target_cpm",
  "maximize_conversions",
  "target_cpa",
  "maximize_conversion_value",
  "target_roas",
] as const;

export const AUDIENCE_MODES: readonly AudienceMode[] = [
  "not_used",
  "signals_only",
  "targeting_required",
  "observation_only",
  "remarketing",
  "prospecting",
  "mixed",
] as const;

export const PRIMARY_CONVERSION_TYPES: readonly PrimaryConversionType[] = [
  "purchase",
  "lead_form_submit",
  "qualified_lead",
  "phone_call",
  "contact",
  "store_visit",
  "local_action",
  "store_sales",
  "app_install",
  "in_app_action",
  "page_view",
  "engaged_visit",
  "unknown",
] as const;

export const CONVERSION_TRACKING_STATUSES: readonly ConversionTrackingStatus[] = [
  "confirmed_live",
  "planned_not_live",
  "unknown",
  "missing",
] as const;

export const FINAL_URL_CONTROL_MODES: readonly FinalUrlControlMode[] = [
  "strict",
  "flexible",
  "unknown",
] as const;

export const MERCHANT_CENTER_LINK_STATUSES: readonly MerchantCenterLinkStatus[] = [
  "linked_confirmed",
  "not_linked",
  "unknown",
] as const;

export const MERCHANT_CENTER_FEED_STATUSES: readonly MerchantCenterFeedStatus[] = [
  "approved",
  "limited_issues",
  "disapproved",
  "in_review",
  "missing",
  "unknown",
] as const;

export const MERCHANT_CENTER_FEED_SCOPES: readonly MerchantCenterFeedScope[] = [
  "all_products",
  "selected_products",
  "custom_label_filtered",
] as const;

export const LOCAL_GOAL_TYPES: readonly LocalGoalType[] = [
  "store_visits",
  "local_actions",
  "store_sales",
] as const;

export const MATCH_TYPE_STRATEGIES: readonly MatchTypeStrategy[] = [
  "exact_first",
  "phrase_and_exact",
  "broad_and_signals",
  "mixed",
] as const;

export const LISTING_GROUP_STRATEGIES: readonly ListingGroupStrategy[] = [
  "all_products",
  "brand_split",
  "category_split",
  "custom_label_split",
  "top_sellers_split",
] as const;

export const CAMPAIGN_SUBTYPES: Record<CampaignType, readonly CampaignSubtype[]> = {
  search: ["standard_search", "brand_search", "non_brand_search"],
  search_local: ["local_search"],
  display: ["responsive_display"],
  responsive_display: ["responsive_display"],
  video: ["video_reach", "video_views", "video_action"],
  demand_gen: ["standard", "with_product_feed"],
  shopping: ["standard_shopping", "shopping_feed_only"],
  performance_max: ["standard", "retail_with_feed"],
  performance_max_store_goals: ["store_goals"],
  app: ["app_installs", "app_engagement"],
};

export const CTA_CHOICES = [
  "automated",
  "learn_more",
  "get_quote",
  "apply_now",
  "sign_up",
  "contact_us",
  "book_now",
  "buy_now",
  "download",
  "get_offer",
  "shop_now",
  "request_demo",
] as const;

export const CAMPAIGN_FAMILY_DEFINITIONS: Record<CampaignType, CampaignFamilyDefinition> = {
  search: {
    family: "search",
    label: "Search",
    structural_shape: "search_keyword_first",
    supported_objectives: ["generate_leads", "attract_candidates", "increase_website_traffic"],
    typical_subtypes: CAMPAIGN_SUBTYPES.search,
    destination_model: "landing_page",
    audience_dependence: "medium",
    feed_dependence: "none",
    location_dependence: "none",
    conversion_dependence: "high",
    asset_complexity: "low",
    safe_with_partial_info: true,
    force_clarification_when_partial: true,
  },
  search_local: {
    family: "search_local",
    label: "Search (local)",
    structural_shape: "search_plus_local",
    supported_objectives: [],
    typical_subtypes: CAMPAIGN_SUBTYPES.search_local,
    destination_model: "location",
    audience_dependence: "medium",
    feed_dependence: "none",
    location_dependence: "required",
    conversion_dependence: "high",
    asset_complexity: "low",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  display: {
    family: "display",
    label: "Display",
    structural_shape: "display_ad_group_first",
    supported_objectives: ["build_brand_awareness", "increase_website_traffic"],
    typical_subtypes: CAMPAIGN_SUBTYPES.display,
    destination_model: "landing_page",
    audience_dependence: "high",
    feed_dependence: "optional",
    location_dependence: "none",
    conversion_dependence: "medium",
    asset_complexity: "high",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  responsive_display: {
    family: "responsive_display",
    label: "Responsive Display",
    structural_shape: "display_ad_group_first",
    supported_objectives: ["build_brand_awareness", "increase_website_traffic", "generate_leads", "attract_candidates"],
    typical_subtypes: CAMPAIGN_SUBTYPES.responsive_display,
    destination_model: "landing_page",
    audience_dependence: "high",
    feed_dependence: "optional",
    location_dependence: "none",
    conversion_dependence: "medium",
    asset_complexity: "high",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  video: {
    family: "video",
    label: "Video",
    structural_shape: "display_ad_group_first",
    supported_objectives: ["build_brand_awareness", "generate_leads", "attract_candidates"],
    typical_subtypes: CAMPAIGN_SUBTYPES.video,
    destination_model: "landing_page",
    audience_dependence: "high",
    feed_dependence: "none",
    location_dependence: "none",
    conversion_dependence: "medium",
    asset_complexity: "high",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  demand_gen: {
    family: "demand_gen",
    label: "Demand Gen",
    structural_shape: "demand_gen_ad_group_first",
    supported_objectives: ["generate_leads", "attract_candidates", "increase_website_traffic", "build_brand_awareness"],
    typical_subtypes: CAMPAIGN_SUBTYPES.demand_gen,
    destination_model: "landing_page",
    audience_dependence: "high",
    feed_dependence: "optional",
    location_dependence: "none",
    conversion_dependence: "high",
    asset_complexity: "high",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  shopping: {
    family: "shopping",
    label: "Shopping",
    structural_shape: "feed_first",
    supported_objectives: [],
    typical_subtypes: CAMPAIGN_SUBTYPES.shopping,
    destination_model: "feed",
    audience_dependence: "low",
    feed_dependence: "required",
    location_dependence: "none",
    conversion_dependence: "high",
    asset_complexity: "medium",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  performance_max: {
    family: "performance_max",
    label: "Performance Max",
    structural_shape: "asset_group_first",
    supported_objectives: ["generate_leads", "attract_candidates"],
    typical_subtypes: CAMPAIGN_SUBTYPES.performance_max,
    destination_model: "landing_page",
    audience_dependence: "medium",
    feed_dependence: "optional",
    location_dependence: "none",
    conversion_dependence: "high",
    asset_complexity: "high",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  performance_max_store_goals: {
    family: "performance_max_store_goals",
    label: "Performance Max (store goals)",
    structural_shape: "asset_group_first",
    supported_objectives: [],
    typical_subtypes: CAMPAIGN_SUBTYPES.performance_max_store_goals,
    destination_model: "location",
    audience_dependence: "medium",
    feed_dependence: "none",
    location_dependence: "required",
    conversion_dependence: "high",
    asset_complexity: "high",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
  app: {
    family: "app",
    label: "App",
    structural_shape: "app_first",
    supported_objectives: [],
    typical_subtypes: CAMPAIGN_SUBTYPES.app,
    destination_model: "app",
    audience_dependence: "medium",
    feed_dependence: "none",
    location_dependence: "none",
    conversion_dependence: "high",
    asset_complexity: "medium",
    safe_with_partial_info: false,
    force_clarification_when_partial: true,
  },
};

export const PERFORMANCE_MAX_TEXT_ASSET_REQUIREMENTS: PerformanceMaxTextAssetRequirements = {
  headline: { min: 3, max: 15, max_characters: 30 },
  long_headline: { min: 1, max: 5, max_characters: 90 },
  description: { min: 2, max: 5, max_characters: 90 },
  business_name: { min: 1, max: 1, max_characters: 25 },
};

export const UNIVERSAL_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "campaign_type",
    field_label: "Campaign type",
    field_type: "single_select",
    requirement: "required",
    allowed_values: GOOGLE_ADS_CAMPAIGN_FAMILIES,
    validation_rules: ["Must be one of the supported Beacon Google Ads campaign families."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Anchors the campaign-family requirements bundle Beacon should evaluate.",
  },
  {
    field_name: "campaign_objective",
    field_label: "Campaign objective",
    field_type: "single_select",
    requirement: "required",
    allowed_values: GOOGLE_ADS_OBJECTIVES,
    validation_rules: ["Must be one of the supported Beacon objective values."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "Defines what the campaign is trying to achieve and constrains family fit.",
  },
  {
    field_name: "landing_page_url",
    field_label: "Landing page URL",
    field_type: "url",
    requirement: "conditional",
    condition: "Required for all non-app, non-feed-only campaign families.",
    validation_rules: ["Must be a valid http:// or https:// URL."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "Provides the campaign destination and the source for landing-page analysis.",
  },
  {
    field_name: "budget_amount",
    field_label: "Budget amount",
    field_type: "number",
    requirement: "required",
    validation_rules: ["Must be greater than 0."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "Beacon needs a positive budget to produce a credible campaign draft.",
  },
  {
    field_name: "budget_type",
    field_label: "Budget type",
    field_type: "single_select",
    requirement: "required",
    allowed_values: ["daily", "total_campaign"],
    validation_rules: ["Must be either daily or total_campaign."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "Determines pacing interpretation.",
  },
  {
    field_name: "budget_currency",
    field_label: "Budget currency",
    field_type: "single_select",
    requirement: "required",
    validation_rules: ["Must be a supported ISO currency code in Beacon's runtime dataset."],
    may_infer: true,
    block_if_missing: true,
    warn_if_missing: true,
    explanation: "Ensures budget is interpreted correctly across markets.",
  },
  {
    field_name: "geography_targets",
    field_label: "Geography targets",
    field_type: "structured_object",
    requirement: "required",
    validation_rules: ["Must include at least one included geography target row in structured form."],
    may_infer: false,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Structured targeting model for country/state/city inclusion or exclusion.",
  },
  {
    field_name: "language_targets",
    field_label: "Language targets",
    field_type: "multi_select",
    requirement: "conditional",
    condition: "Required for most campaign families and all multilingual or non-English geographies.",
    validation_rules: ["Must use a supported language code from Beacon's maintained language dataset."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Controls the ad-language expectation and localization fit.",
  },
  {
    field_name: "primary_conversion_type",
    field_label: "Primary conversion type",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for all performance-oriented campaign families and objectives.",
    allowed_values: PRIMARY_CONVERSION_TYPES,
    validation_rules: ["Must be one of Beacon's supported conversion-type values."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Defines what success means operationally for bidding and readiness.",
  },
  {
    field_name: "conversion_tracking_status",
    field_label: "Conversion tracking status",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for push-ready performance campaigns.",
    allowed_values: CONVERSION_TRACKING_STATUSES,
    validation_rules: ["Must be one of the supported tracking-status values."],
    may_infer: false,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Separates blueprint interpretation from execution readiness.",
  },
];

export const SEARCH_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "match_type_strategy",
    field_label: "Match type strategy",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for build-ready Search and search_local campaign drafts.",
    allowed_values: MATCH_TYPE_STRATEGIES,
    validation_rules: ["Must be one of Beacon's supported match type strategy values."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Controls how Beacon frames keyword expansion and control level.",
  },
  {
    field_name: "preferred_ad_group_names",
    field_label: "Preferred ad group names",
    field_type: "structured_object",
    requirement: "optional",
    validation_rules: ["Maximum 8 preferred names for Beacon V1."],
    count_limits: "0-8 values",
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: false,
    explanation: "Lets the requester guide the account structure instead of relying fully on inference.",
  },
];

export const PERFORMANCE_MAX_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "campaign_subtype",
    field_label: "Performance Max subtype",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Relevant for Performance Max and Performance Max store-goal campaigns.",
    allowed_values: ["standard", "retail_with_feed", "store_goals"],
    validation_rules: ["Subtype must align to the chosen family."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Distinguishes standard, retail, and store-goal PMax requirement bundles.",
  },
  {
    field_name: "merchant_center_link_status",
    field_label: "Merchant Center link status",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for retail_with_feed Performance Max.",
    allowed_values: MERCHANT_CENTER_LINK_STATUSES,
    validation_rules: ["Must reflect actual linkage state."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: true,
    explanation: "Retail PMax depends on feed-backed commerce infrastructure.",
  },
];

export const DEMAND_GEN_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "audience_mode",
    field_label: "Audience mode",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for Demand Gen because audience strategy is central to setup.",
    allowed_values: AUDIENCE_MODES,
    validation_rules: ["Must be one of Beacon's supported audience mode values."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Determines whether Beacon treats audience configuration as targeting, signals, or remarketing.",
  },
];

export const SHOPPING_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "merchant_center_feed_status",
    field_label: "Merchant Center feed status",
    field_type: "single_select",
    requirement: "required",
    allowed_values: MERCHANT_CENTER_FEED_STATUSES,
    validation_rules: ["Must reflect actual feed health."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: true,
    explanation: "Shopping cannot be drafted credibly without real feed readiness.",
  },
  {
    field_name: "merchant_center_feed_scope",
    field_label: "Merchant Center feed scope",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required when Beacon needs to know whether all or filtered products are in scope.",
    allowed_values: MERCHANT_CENTER_FEED_SCOPES,
    validation_rules: ["Must describe the actual product selection model."],
    may_infer: false,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Helps Beacon reason about product inclusion and listing group logic.",
  },
  {
    field_name: "listing_group_strategy",
    field_label: "Listing group strategy",
    field_type: "single_select",
    requirement: "optional",
    allowed_values: LISTING_GROUP_STRATEGIES,
    validation_rules: ["Must be one of Beacon's supported listing-group strategy values."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Controls how Shopping inventory should be segmented operationally.",
  },
];

export const APP_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "app_platform",
    field_label: "App platform",
    field_type: "single_select",
    requirement: "required",
    allowed_values: ["android", "ios"],
    validation_rules: ["Must be android or ios."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "App campaigns need a real platform destination.",
  },
  {
    field_name: "app_store_url",
    field_label: "App store URL",
    field_type: "url",
    requirement: "required",
    validation_rules: ["Must be a valid App Store or Google Play URL."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "App campaigns need a valid store destination.",
  },
  {
    field_name: "app_id_or_package_name",
    field_label: "App ID or package name",
    field_type: "text",
    requirement: "required",
    validation_rules: ["Must match the app destination."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: false,
    explanation: "Allows Beacon to reason about app promotion and engagement readiness accurately.",
  },
];

export const LOCAL_FIELD_MODEL_V2: readonly CampaignFieldDefinition[] = [
  {
    field_name: "business_profile_link_status",
    field_label: "Business Profile link status",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for performance_max_store_goals and strongly relevant for search_local.",
    allowed_values: ["linked_confirmed", "not_linked", "unknown"],
    validation_rules: ["Must reflect actual location linkage state."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: true,
    explanation: "Store-goal campaigns need verified location infrastructure.",
  },
  {
    field_name: "location_source_type",
    field_label: "Location source type",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required when store goals are in scope.",
    allowed_values: ["business_profile", "affiliate_locations", "manual_store_list"],
    validation_rules: ["Must match the actual source of locations."],
    may_infer: false,
    block_if_missing: true,
    warn_if_missing: true,
    explanation: "Defines how Beacon should interpret local-location readiness.",
  },
  {
    field_name: "local_goal_type",
    field_label: "Local goal type",
    field_type: "single_select",
    requirement: "conditional",
    condition: "Required for search_local and performance_max_store_goals when optimizing for local action outcomes.",
    allowed_values: LOCAL_GOAL_TYPES,
    validation_rules: ["Must be one of Beacon's supported local goal values."],
    may_infer: true,
    block_if_missing: false,
    warn_if_missing: true,
    explanation: "Separates store visits, local actions, and store sales logic.",
  },
];

export function isCampaignFamilyValue(value?: string): value is CampaignType {
  return !!value && GOOGLE_ADS_CAMPAIGN_FAMILIES.includes(value as CampaignType);
}

export function familyLabel(family: CampaignType): string {
  return CAMPAIGN_FAMILY_DEFINITIONS[family].label;
}

export function objectiveFitForFamily(
  objective: CampaignObjective,
  family: CampaignType
): "strong" | "acceptable" | "weak" {
  const definition = CAMPAIGN_FAMILY_DEFINITIONS[family];
  if (definition.supported_objectives.includes(objective)) {
    return "strong";
  }

  // ── Strategist Overrides ────────────────────────────────────────────────
  
  // Video is 'strong' for awareness, but 'acceptable' for leads if using Video Action
  if (family === "video" && (objective === "generate_leads" || objective === "attract_candidates")) {
    return "acceptable";
  }

  // PMax is lead-focused but can be acceptable for traffic/awareness in specific contexts
  if (family === "performance_max" && (objective === "increase_website_traffic" || objective === "build_brand_awareness")) {
    return "acceptable";
  }

  if (
    (family === "responsive_display" && objective === "generate_leads") ||
    (family === "responsive_display" && objective === "attract_candidates")
  ) {
    return "acceptable";
  }

  return "weak";
}

export function defaultCampaignFamilyForObjective(objective: CampaignObjective): CampaignType {
  switch (objective) {
    case "generate_leads":
      return "search"; // Search remains the high-intent baseline
    case "attract_candidates":
      return "search"; 
    case "increase_website_traffic":
      return "search";
    case "build_brand_awareness":
      return "demand_gen"; // Demand Gen is the modern standard for B2B awareness
  }
}

export function fieldDefinitionForCampaignFamily(family: CampaignType): readonly CampaignFieldDefinition[] {
  switch (family) {
    case "search":
    case "search_local":
      return [...UNIVERSAL_FIELD_MODEL_V2, ...SEARCH_FIELD_MODEL_V2];
    case "performance_max":
    case "performance_max_store_goals":
      return [...UNIVERSAL_FIELD_MODEL_V2, ...PERFORMANCE_MAX_FIELD_MODEL_V2, ...LOCAL_FIELD_MODEL_V2];
    case "demand_gen":
      return [...UNIVERSAL_FIELD_MODEL_V2, ...DEMAND_GEN_FIELD_MODEL_V2];
    case "shopping":
      return [...UNIVERSAL_FIELD_MODEL_V2, ...SHOPPING_FIELD_MODEL_V2];
    case "app":
      return [...UNIVERSAL_FIELD_MODEL_V2, ...APP_FIELD_MODEL_V2];
    default:
      return UNIVERSAL_FIELD_MODEL_V2;
  }
}
