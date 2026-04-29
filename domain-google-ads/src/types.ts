/**
 * Google Ads campaign domain types.
 *
 * These are canonical Google Ads / campaign intelligence types. They belong
 * in the intelligence layer, not in Beacon's product form schema.
 *
 * Beacon's types/brief.ts re-exports these so existing imports are unchanged.
 */

// ── Campaign family ────────────────────────────────────────────────────────

export type CampaignType =
  | "search"
  | "search_local"
  | "display"
  | "responsive_display"
  | "video"
  | "demand_gen"
  | "shopping"
  | "performance_max"
  | "performance_max_store_goals"
  | "app";

export type CampaignSubtype =
  | "standard_search"
  | "brand_search"
  | "non_brand_search"
  | "local_search"
  | "standard"
  | "retail_with_feed"
  | "store_goals"
  | "responsive_display"
  | "video_reach"
  | "video_views"
  | "video_action"
  | "with_product_feed"
  | "standard_shopping"
  | "shopping_feed_only"
  | "app_installs"
  | "app_engagement";

// ── Objectives ────────────────────────────────────────────────────────────

// NOTE: values are pending final confirmation against internal terminology.
export type CampaignObjective =
  | "generate_leads"
  | "attract_candidates"
  | "increase_website_traffic"
  | "build_brand_awareness";

/** Corporate (B2B) vs. careers (recruiting) campaign context. */
export type CampaignContext = "corporate" | "careers";

// ── Bidding ───────────────────────────────────────────────────────────────

export type BiddingStrategy =
  | "manual_cpc"
  | "maximize_clicks"
  | "manual_cpv"
  | "target_cpm"
  | "maximize_conversions"
  | "target_cpa"
  | "maximize_conversion_value"
  | "target_roas";

// ── Audience ──────────────────────────────────────────────────────────────

export type AudienceMode =
  | "not_used"
  | "signals_only"
  | "targeting_required"
  | "observation_only"
  | "remarketing"
  | "prospecting"
  | "mixed";

// ── Conversion ────────────────────────────────────────────────────────────

/** Conversion funnel stage — shared by the focus-event catalog and blueprint output. */
export type ConversionStage =
  | "engagement"
  | "early_conversion"
  | "lead"
  | "completed_conversion";

export type PrimaryConversionType =
  | "purchase"
  | "lead_form_submit"
  | "qualified_lead"
  | "phone_call"
  | "contact"
  | "store_visit"
  | "local_action"
  | "store_sales"
  | "app_install"
  | "in_app_action"
  | "page_view"
  | "engaged_visit"
  | "unknown";

export type ConversionTrackingStatus =
  | "confirmed_live"
  | "planned_not_live"
  | "unknown"
  | "missing";

// ── URL control ───────────────────────────────────────────────────────────

export type FinalUrlControlMode = "strict" | "flexible" | "unknown";

// ── Merchant Center / Shopping ────────────────────────────────────────────

export type MerchantCenterLinkStatus = "linked_confirmed" | "not_linked" | "unknown";

export type MerchantCenterFeedStatus =
  | "approved"
  | "limited_issues"
  | "disapproved"
  | "in_review"
  | "missing"
  | "unknown";

export type MerchantCenterFeedScope =
  | "all_products"
  | "selected_products"
  | "custom_label_filtered";

export type ListingGroupStrategy =
  | "all_products"
  | "brand_split"
  | "category_split"
  | "custom_label_split"
  | "top_sellers_split";

// ── Local / store ─────────────────────────────────────────────────────────

export type LocalGoalType = "store_visits" | "local_actions" | "store_sales";

// ── Keywords ──────────────────────────────────────────────────────────────

export type MatchTypeStrategy =
  | "exact_first"
  | "phrase_and_exact"
  | "broad_and_signals"
  | "mixed";

// ── Readiness evaluation ──────────────────────────────────────────────────
// Used by the readiness evaluator and surfaced in CampaignRequirementsReadiness.
// These are Google Ads intelligence types — they have no dependency on Beacon's
// product schema or workflow state.

export type ReadinessSeverity = "blocker" | "warning" | "satisfied";

export type DependencyDomain =
  | "destination"
  | "measurement"
  | "assets"
  | "audience"
  | "linkage"
  | "geo_language"
  | "feed"
  | "app"
  | "locations";

export type DraftabilityLevel =
  | "cannot_draft"
  | "can_draft_with_placeholders"
  | "can_draft_but_not_push"
  | "can_prepare_push_ready_draft";

export type ActivationReadiness = "not_ready" | "needs_review" | "push_ready";

export interface ReadinessCheck {
  domain: DependencyDomain;
  severity: ReadinessSeverity;
  field_names: string[];
  message: string;
}

export interface CampaignRequirementsReadiness {
  campaign_family: CampaignType;
  campaign_subtype: CampaignSubtype | null;
  family_objective_fit: "strong" | "acceptable" | "weak";
  draftability_level: DraftabilityLevel;
  activation_readiness: ActivationReadiness;
  fields_requiring_clarification: string[];
  blocking_dependencies: string[];
  warning_dependencies: string[];
  dependency_checks: ReadinessCheck[];
}

// ── Audience execution guidance ───────────────────────────────────────────
// Used by the audience-mapping module to translate Beacon audience segments
// into concrete Google Ads targeting candidates.

export type AudienceApplicationMode = "observation" | "targeting" | "signal";

export type AudienceExecutionStatus =
  | "strategy_only"
  | "requires_first_party_list"
  | "requires_custom_segment_definition"
  | "ready_with_existing_account_audience";

export type GoogleAdsAudienceEntityType =
  | "user_list"
  | "custom_segment"
  | "in_market_segment"
  | "audience_signal";

export interface AudienceExecutionCandidate {
  google_ads_entity_type: GoogleAdsAudienceEntityType;
  application_mode: AudienceApplicationMode;
  execution_status: AudienceExecutionStatus;
  candidate_label: string;
  implementation_hint: string;
  rationale: string;
}

export interface AudienceSegmentExecutionGuidance {
  beacon_segment: string;
  beacon_segment_label: string;
  strategy_summary: string;
  candidates: AudienceExecutionCandidate[];
}

export interface AudienceExecutionGuidance {
  campaign_family: CampaignType;
  advisory_note: string;
  segments: AudienceSegmentExecutionGuidance[];
}
