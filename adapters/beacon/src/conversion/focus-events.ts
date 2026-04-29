/**
 * Concentrix conversion event catalog and objective-to-conversion defaults.
 *
 * OWNERSHIP: This is domain truth for Concentrix Google Ads campaigns.
 * It lives here (MCP) because it is reusable across any system that needs to
 * reason about Concentrix conversion events — not just Beacon.
 *
 * Beacon owns the resolution priority chain (user_selected → lp_classified →
 * objective_inferred) and the blueprint output shape. It imports this catalog.
 *
 * CATALOG SCOPE
 * ─────────────
 * careers:: events  — application-funnel signals for recruiting campaigns
 * corporate:: events — lead/content signals for B2B demand generation
 *
 * DO NOT ADD events without confirming they exist in the live Concentrix
 * GA4 / Google Tag implementation.
 */

import type {
  CampaignContext,
  CampaignObjective,
  ConversionStage,
  PrimaryConversionType,
} from "@mktg/domain-google-ads";

// ── Focus event profile ───────────────────────────────────────────────────

export interface FocusEventProfile {
  campaign_context: CampaignContext;
  event: string;
  conversion_label: string;
  conversion_intent: string;
  conversion_stage: ConversionStage;
  primary_conversion_type: PrimaryConversionType;
  google_ads_mapping_hint: string;
}

/**
 * Canonical catalog of Concentrix conversion events by context::event key.
 *
 * Keys follow the format "context::event_name" to allow unambiguous resolution
 * across careers and corporate contexts.
 */
export const FOCUS_EVENT_PROFILES: Record<string, FocusEventProfile> = {
  "careers::apply_start": {
    campaign_context: "careers",
    event: "apply_start",
    conversion_label: "Career application start",
    conversion_intent: "Early application conversion",
    conversion_stage: "early_conversion",
    primary_conversion_type: "lead_form_submit",
    google_ads_mapping_hint:
      "Map as an application-start conversion action or equivalent early application submit event.",
  },
  "careers::jobs_view": {
    campaign_context: "careers",
    event: "jobs_view",
    conversion_label: "Job detail view",
    conversion_intent: "Job-detail engagement signal",
    conversion_stage: "engagement",
    primary_conversion_type: "engaged_visit",
    google_ads_mapping_hint:
      "Map as an engagement conversion or secondary job-interest signal rather than a completed application.",
  },
  "careers::thanks_view": {
    campaign_context: "careers",
    event: "thanks_view",
    conversion_label: "Completed application",
    conversion_intent: "Completed application and strong downstream conversion signal",
    conversion_stage: "completed_conversion",
    primary_conversion_type: "qualified_lead",
    google_ads_mapping_hint:
      "Map as the strongest completed-application conversion action available.",
  },
  "corporate::contact_form_submission": {
    campaign_context: "corporate",
    event: "contact_form_submission",
    conversion_label: "Contact form submission",
    conversion_intent: "Lead form conversion",
    conversion_stage: "lead",
    primary_conversion_type: "lead_form_submit",
    google_ads_mapping_hint:
      "Map as the main lead-form conversion action for corporate demand capture.",
  },
  "corporate::Download_gated": {
    campaign_context: "corporate",
    event: "Download_gated",
    conversion_label: "Gated content download",
    conversion_intent: "Gated content lead conversion",
    conversion_stage: "lead",
    primary_conversion_type: "lead_form_submit",
    google_ads_mapping_hint:
      "Map as a lead conversion tied to gated-content form completion.",
  },
  "corporate::Download_now": {
    campaign_context: "corporate",
    event: "Download_now",
    conversion_label: "Content download",
    conversion_intent: "Content conversion",
    conversion_stage: "early_conversion",
    primary_conversion_type: "engaged_visit",
    google_ads_mapping_hint:
      "Map as a content-download conversion if treated as a primary content response action.",
  },
  "corporate::download_ungated": {
    campaign_context: "corporate",
    event: "download_ungated",
    conversion_label: "Ungated content download",
    conversion_intent: "Non-gated content engagement",
    conversion_stage: "engagement",
    primary_conversion_type: "engaged_visit",
    google_ads_mapping_hint:
      "Map as an engagement event or secondary content-interest action.",
  },
  "corporate::take_the_assessment": {
    campaign_context: "corporate",
    event: "take_the_assessment",
    conversion_label: "Assessment start",
    conversion_intent: "Assessment conversion",
    conversion_stage: "lead",
    primary_conversion_type: "qualified_lead",
    google_ads_mapping_hint:
      "Map as a qualified assessment conversion or high-intent lead action.",
  },
  "corporate::Watch_now": {
    campaign_context: "corporate",
    event: "Watch_now",
    conversion_label: "Media watch action",
    conversion_intent: "Media and content engagement",
    conversion_stage: "engagement",
    primary_conversion_type: "engaged_visit",
    google_ads_mapping_hint:
      "Map as a video or media engagement signal rather than a lead form conversion.",
  },
  "corporate::webinar_registration": {
    campaign_context: "corporate",
    event: "webinar_registration",
    conversion_label: "Webinar registration",
    conversion_intent: "Event registration conversion",
    conversion_stage: "lead",
    primary_conversion_type: "lead_form_submit",
    google_ads_mapping_hint:
      "Map as an event-registration lead conversion action.",
  },
};

// ── Objective-to-conversion defaults ──────────────────────────────────────

/**
 * Per-objective default conversion profile used when no user-selected event
 * and no LP classification is available (objective_inferred fallback).
 *
 * Beacon owns the resolution priority chain. This catalog owns the default
 * data that the fallback resolves to.
 */
export interface ObjectiveConversionDefault {
  conversion_label: string;
  conversion_intent: string;
  conversion_stage: ConversionStage;
  primary_conversion_type: PrimaryConversionType;
  google_ads_mapping_hint: string;
}

export const OBJECTIVE_CONVERSION_DEFAULTS: Record<
  CampaignObjective,
  ObjectiveConversionDefault
> = {
  generate_leads: {
    conversion_label: "Form submission",
    conversion_intent: "Lead capture",
    conversion_stage: "lead",
    primary_conversion_type: "lead_form_submit",
    google_ads_mapping_hint:
      "Map to the primary lead-form or qualified lead conversion once the exact event is confirmed.",
  },
  attract_candidates: {
    conversion_label: "Completed application",
    conversion_intent: "Completed application and strong downstream conversion signal",
    conversion_stage: "completed_conversion",
    primary_conversion_type: "qualified_lead",
    google_ads_mapping_hint:
      "Map to the completed-application thank-you page as the primary conversion action. Configure apply_start as a secondary funnel signal only.",
  },
  increase_website_traffic: {
    conversion_label: "Qualified page visit",
    conversion_intent: "Traffic and content engagement",
    conversion_stage: "engagement",
    primary_conversion_type: "page_view",
    google_ads_mapping_hint:
      "Map to a page-view or engaged-visit conversion only if traffic optimization remains the true goal.",
  },
  build_brand_awareness: {
    conversion_label: "Engaged visit",
    conversion_intent: "Awareness and engagement",
    conversion_stage: "engagement",
    primary_conversion_type: "engaged_visit",
    google_ads_mapping_hint:
      "Map to an engagement proxy only if brand awareness needs a measurable downstream signal.",
  },
};
