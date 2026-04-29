/**
 * service-suggestions.ts
 *
 * Dynamic audience segment and ad group context suggestions derived from
 * service, objective, and campaign signals.
 *
 * Corporate path: service/industry-driven (uses resolved Concentrix service taxonomy)
 * Careers path:   recruitment-driven (uses objective + campaign_type only)
 *
 * Both return ordered value arrays — top items are highest relevance.
 * Callers own the full static option list; these functions only rank/filter.
 *
 * ── Audience segment scoring weights ─────────────────────────────────────────
 * offering (offering_id map)    : primary +3, secondary +2
 * service group (fallback map)  : primary +2, secondary +1
 * audience text keyword         : +2 per matched role signal
 * conversion event              : primary +2, secondary +1
 * objective                     : +1 per relevant segment
 * campaign type                 : +1 per relevant segment
 *
 * ── Procurement gate ─────────────────────────────────────────────────────────
 * procurement_stakeholders only scores when the brief contains an explicit
 * buying-committee signal: a formal evaluation conversion event, or explicit
 * procurement/vendor language in the target_audience or additional_notes text.
 * It is never scored from service group or objective defaults.
 *
 * ── Segment library gaps (tracked, not fixed here) ───────────────────────────
 * The current 5 non-healthcare corporate segments cannot fully differentiate:
 *   - Analytics / Gen AI  → needs "chief_data_officers" / "analytics_leaders"
 *   - MarTech / Lifecycle → needs "marketing_executives"
 *   - Finance / BPO ops   → needs "finance_operations_leaders"
 * These gaps are documented here. Library expansion is a separate change.
 */

import type { ResolvedService } from "./service-normalization";
import {
  CORPORATE_AUDIENCE_SEGMENTS,
  CAREERS_AUDIENCE_SEGMENTS,
  CORPORATE_AD_GROUP_CONTEXTS,
  CAREERS_AD_GROUP_CONTEXTS,
} from "./segment-library";

// ── Input type ────────────────────────────────────────────────────────────────
// campaign_objective and campaign_type are string here (not tied to Beacon's
// CampaignObjective / CampaignType enums) — the logic only checks string values.

export interface ServiceSuggestionInput {
  campaign_context?: string;
  campaign_objective?: string;
  campaign_type?: string;
  focus_conversion_event?: string;
  landing_page_url?: string;
  product_or_service?: string;
  target_audience?: string;
  additional_notes?: string;
}

// ── Healthcare gate ───────────────────────────────────────────────────────────

const HEALTHCARE_AUDIENCE_SEGMENTS = new Set([
  "healthcare_operations_leaders",
  "payer_executives",
  "provider_executives",
  "patient_experience_leaders",
  "member_experience_leaders",
]);

const HEALTHCARE_AD_GROUP_CONTEXTS = new Set([
  "patient_experience",
  "member_engagement",
]);

const HEALTHCARE_PATTERN =
  /healthcare|payer|provider|hospital|health system|health plan|clinical|patient\b|member\b/i;

function hasHealthcareSignal(input: ServiceSuggestionInput): boolean {
  return HEALTHCARE_PATTERN.test(
    [
      input.product_or_service ?? "",
      input.target_audience ?? "",
      input.additional_notes ?? "",
      input.landing_page_url ?? "",
    ].join(" ")
  );
}

// ── Procurement gate ──────────────────────────────────────────────────────────
// Procurement is only a valid audience when the brief signals a formal buying
// evaluation or vendor selection process. It should NOT appear as a generic
// tiebreaker for lead-gen objectives or most service groups.

const PROCUREMENT_CONVERSION_EVENTS = new Set([
  "take_the_assessment",
]);

const PROCUREMENT_AUDIENCE_PATTERN =
  /procurement|sourcing|vendor selection|vendor management|buying committee|rfp\b|rfq\b/i;

function hasProcurementSignal(input: ServiceSuggestionInput): boolean {
  if (input.focus_conversion_event && PROCUREMENT_CONVERSION_EVENTS.has(input.focus_conversion_event)) {
    return true;
  }
  return PROCUREMENT_AUDIENCE_PATTERN.test(
    [input.target_audience ?? "", input.additional_notes ?? ""].join(" ")
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sortedTopN(scores: Map<string, number>, n: number): string[] {
  return [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}

// ── Offering-level segment map ────────────────────────────────────────────────
// Keyed by offering_id from the Concentrix service taxonomy.
// Primary segment = index 0 (+3), secondary = index 1 (+2), tertiary = index 2 (+1).
// No procurement_stakeholders — procurement is exclusively gated via hasProcurementSignal().

const OFFERING_TO_SEGMENTS: Record<string, string[]> = {
  // ── Strategy & Design ────────────────────────────────────────────────────
  // Digital Innovation
  "SD-DI-GAI": ["ai_innovation_leaders",       "it_decision_makers",            "digital_transformation_leaders"], // Gen AI
  "SD-DI-MOB": ["digital_transformation_leaders", "it_decision_makers",          "customer_experience_leaders"],   // Mobility

  // Business Transformation
  "SD-BT-PA":  ["digital_transformation_leaders", "operations_leaders",          "it_decision_makers"],
  "SD-BT-OMD": ["digital_transformation_leaders", "it_decision_makers",          "operations_leaders"],
  "SD-BT-OC":  ["digital_transformation_leaders", "customer_experience_leaders", "operations_leaders"],

  // Experience Design
  "SD-ED-CXD": ["customer_experience_leaders",   "digital_transformation_leaders"],
  "SD-ED-UXD": ["customer_experience_leaders",   "digital_transformation_leaders"],
  "SD-ED-EXD": ["digital_transformation_leaders", "customer_experience_leaders"],   // Employee exp → transformation first
  "SD-ED-BXD": ["customer_experience_leaders",   "digital_transformation_leaders"],
  "SD-ED-BS":  ["customer_experience_leaders",   "digital_transformation_leaders"],

  // Lifecycle Engagement
  "SD-LE-DM":  ["marketing_executives",          "customer_experience_leaders"],    // Digital Marketing
  "SD-LE-CL":  ["marketing_executives",          "customer_experience_leaders"],    // Customer Loyalty
  "SD-LE-LTV": ["marketing_executives",          "customer_experience_leaders"],
  "SD-LE-DS":  ["sales_revenue_leaders",         "marketing_executives"],           // Digital Selling

  // ── Data & Analytics ─────────────────────────────────────────────────────
  "DA-DAT-DVR": ["data_analytics_leaders",  "it_decision_makers",          "digital_transformation_leaders"],
  "DA-AA-MLO":  ["data_analytics_leaders",  "ai_innovation_leaders",       "it_decision_makers"],          // ML/Advanced Analytics
  "DA-EI-HCBI": ["data_analytics_leaders",  "it_decision_makers",          "digital_transformation_leaders"], // Enterprise BI
  "DA-OI-CCA":  ["contact_center_leaders",  "data_analytics_leaders",      "it_decision_makers"],          // Contact Center Analytics
  "DA-IDS-SRA": ["sales_revenue_leaders",   "data_analytics_leaders",      "it_decision_makers"],          // Sales/Revenue Analytics
  "DA-DAT-DG":  ["data_analytics_leaders",  "it_decision_makers",          "digital_transformation_leaders"],

  // ── Enterprise Technology ─────────────────────────────────────────────────
  // Technology Transformation
  "ET-TT-TA":   ["it_decision_makers",        "digital_transformation_leaders"],
  "ET-TT-MTS":  ["marketing_executives",      "it_decision_makers",          "customer_experience_leaders"], // MarTech

  // Application Services
  "ET-AS-AM":   ["it_decision_makers",        "digital_transformation_leaders"],
  "ET-AS-AIE":  ["ai_innovation_leaders",     "it_decision_makers",          "digital_transformation_leaders"], // AI Engineering

  // Experience Platforms
  "ET-EP-SF":   ["it_decision_makers",        "customer_experience_leaders", "marketing_executives"],   // Salesforce
  "ET-EP-AD":   ["marketing_executives",      "customer_experience_leaders", "it_decision_makers"],    // Adobe
  "ET-EP-SC":   ["marketing_executives",      "customer_experience_leaders", "it_decision_makers"],    // Sitecore

  // CX Technology
  "ET-CXT-CCaaS": ["contact_center_leaders",  "it_decision_makers",          "customer_experience_leaders"], // CCaaS
  "ET-CXT-SAB":   ["contact_center_leaders",  "ai_innovation_leaders",       "it_decision_makers"],   // AI Bots
  "ET-CXT-VOC":   ["customer_experience_leaders", "contact_center_leaders",  "data_analytics_leaders"], // VoC

  // Enterprise Automation
  "ET-EA-PA":   ["operations_leaders",        "it_decision_makers",          "digital_transformation_leaders"],

  // Cybersecurity
  "ET-CYB-SOC": ["security_leaders",          "it_decision_makers",          "digital_transformation_leaders"],

  // ── Digital Operations ────────────────────────────────────────────────────
  // Customer Service
  "DO-CS-CC":   ["contact_center_leaders",    "customer_experience_leaders", "operations_leaders"],
  "DO-CS-TS":   ["contact_center_leaders",    "it_decision_makers",          "operations_leaders"],

  // Marketing
  "DO-MKT-PM":  ["marketing_executives",      "customer_experience_leaders"],                         // Performance Marketing
  "DO-MKT-LOY": ["marketing_executives",      "customer_experience_leaders"],
  "DO-MKT-CS":  ["marketing_executives",      "customer_experience_leaders"],                         // Content Studio

  // Sales
  "DO-SAL-B2B": ["sales_revenue_leaders",     "customer_experience_leaders"],
  "DO-SAL-B2C": ["sales_revenue_leaders",     "customer_experience_leaders"],

  // Trust & Safety
  "DO-TS-CM":   ["it_decision_makers",        "operations_leaders",          "digital_transformation_leaders"],

  // Finance & Compliance
  "DO-FC-FCC":  ["finance_operations_leaders", "operations_leaders",         "it_decision_makers"],
  "DO-FC-FA":   ["finance_operations_leaders", "operations_leaders",         "it_decision_makers"],

  // Workforce Management
  "DO-WFM-CON":   ["operations_leaders",      "contact_center_leaders",      "digital_transformation_leaders"],
  "DO-WFM-WFMAS": ["operations_leaders",      "contact_center_leaders",      "digital_transformation_leaders"],
};

// ── Service-group fallback segment map ───────────────────────────────────────
// Used when offering_id is not in OFFERING_TO_SEGMENTS, or to accumulate
// additional signal on top of an offering match.
// No procurement_stakeholders — procurement is gated separately.

const SERVICE_GROUP_TO_SEGMENTS: Record<string, string[]> = {
  "Experience Design":               ["customer_experience_leaders",    "digital_transformation_leaders"],
  "Digital Innovation":              ["ai_innovation_leaders",           "it_decision_makers"],
  "Business Transformation":         ["digital_transformation_leaders",  "operations_leaders"],
  "Lifecycle Engagement":            ["marketing_executives",            "customer_experience_leaders"],
  "CX Technology":                   ["contact_center_leaders",          "it_decision_makers"],
  "Enterprise Automation":           ["operations_leaders",              "it_decision_makers"],
  "Application Services":            ["it_decision_makers",              "digital_transformation_leaders"],
  "Technology Transformation":       ["it_decision_makers",              "digital_transformation_leaders"],
  "Experience Platforms":            ["marketing_executives",            "it_decision_makers"],
  "Data & Analytics Transformation": ["data_analytics_leaders",          "it_decision_makers"],
  "Advanced Analytics":              ["data_analytics_leaders",          "ai_innovation_leaders"],
  "Enterprise Intelligence":         ["data_analytics_leaders",          "it_decision_makers"],
  "Operational Insights":            ["contact_center_leaders",          "data_analytics_leaders"],
  "Industry & Domain Solutions":     ["it_decision_makers",              "digital_transformation_leaders"],
  "Customer Service":                ["contact_center_leaders",          "customer_experience_leaders"],
  "Sales":                           ["sales_revenue_leaders",           "customer_experience_leaders"],
  "Marketing":                       ["marketing_executives",            "customer_experience_leaders"],
  "Trust & Safety":                  ["it_decision_makers",              "operations_leaders"],
  "Finance & Compliance":            ["finance_operations_leaders",      "operations_leaders"],
  "Workforce Management":            ["operations_leaders",              "contact_center_leaders"],
  "Cybersecurity":                   ["security_leaders",                "it_decision_makers"],
};

const SERVICE_CATEGORY_TO_SEGMENTS: Record<string, string[]> = {
  "Strategy & Design":     ["digital_transformation_leaders", "customer_experience_leaders"],
  "Enterprise Technology": ["it_decision_makers",             "digital_transformation_leaders"],
  "Digital Operations":    ["operations_leaders",             "contact_center_leaders"],
  "Data & Analytics":      ["data_analytics_leaders",         "it_decision_makers"],
};

// ── Audience text keyword extraction ─────────────────────────────────────────
// Scans target_audience and additional_notes for buyer role signals.
// When present, audience text is a strong signal (+2 per match).
// Each pattern maps to the segment it most strongly implies.

const AUDIENCE_ROLE_SIGNALS: Array<{ pattern: RegExp; segment: string }> = [
  // IT / Technology buyers
  {
    pattern: /\bcto\b|chief technology officer|vp.*technology|technology officer|head of.*tech/i,
    segment: "it_decision_makers",
  },
  {
    pattern: /\bcio\b|chief information officer|information technology leader|it director|it manager|enterprise.*architect/i,
    segment: "it_decision_makers",
  },
  {
    pattern: /it.*decision.maker|technology.*decision.maker/i,
    segment: "it_decision_makers",
  },
  // Data & Analytics buyers
  {
    pattern: /\bcdo\b|chief data officer|vp.*data|head of data|data officer|data leader|data executive/i,
    segment: "data_analytics_leaders",
  },
  {
    pattern: /analytics leader|analytics executive|vp.*analytics|head of analytics|bi leader|chief analytics/i,
    segment: "data_analytics_leaders",
  },
  // AI & Innovation buyers
  {
    pattern: /chief ai officer|head of ai|ai leader|ai.*strategy|vp.*ai\b|innovation leader|head of innovation/i,
    segment: "ai_innovation_leaders",
  },
  // Security buyers
  {
    pattern: /\bciso\b|chief.*security officer|security leader|security executive|vp.*security|head of.*security/i,
    segment: "security_leaders",
  },
  // CX buyers
  {
    pattern: /\bcxo\b|chief.*experience officer|cx leader|customer experience vp|vp.*customer experience|cx executive/i,
    segment: "customer_experience_leaders",
  },
  {
    pattern: /customer experience director|head of.*cx\b|cx director/i,
    segment: "customer_experience_leaders",
  },
  // Marketing buyers
  {
    pattern: /\bcmo\b|chief marketing officer|vp.*marketing|marketing vp|marketing leader|marketing executive/i,
    segment: "marketing_executives",
  },
  {
    pattern: /demand gen leader|growth leader|head of marketing|marketing director/i,
    segment: "marketing_executives",
  },
  // Contact center buyers
  {
    pattern: /contact center|call center|cx operations|customer service director|head of.*contact/i,
    segment: "contact_center_leaders",
  },
  // Transformation buyers
  {
    pattern: /digital transformation|transformation leader|chief digital officer|head of digital/i,
    segment: "digital_transformation_leaders",
  },
  // Operations buyers
  {
    pattern: /\bcoo\b|chief operations officer|operations vp|vp.*operations|operations leader|shared services|operations executive/i,
    segment: "operations_leaders",
  },
  // Finance buyers
  {
    pattern: /\bcfo\b|chief financial officer|finance operations|head of finance|vp.*finance|finance leader|finance executive/i,
    segment: "finance_operations_leaders",
  },
  {
    pattern: /compliance officer|head of compliance|regulatory lead|finance.*compliance/i,
    segment: "finance_operations_leaders",
  },
  // Sales & Revenue buyers
  {
    pattern: /\bcro\b|chief revenue officer|vp.*sales|sales leader|revenue operations|head of sales|sales executive/i,
    segment: "sales_revenue_leaders",
  },
  // Procurement / buying committee (very specific — only scores if explicitly stated)
  {
    pattern: /procurement|sourcing manager|vendor selection|vendor management|buying committee|\brfp\b|\brfq\b/i,
    segment: "procurement_stakeholders",
  },
];

// ── Conversion event scoring ──────────────────────────────────────────────────
// Maps focus_conversion_event values to segment score contributions.
// Primary = +2, secondary = +1. Procurement only via take_the_assessment.

const CONVERSION_EVENT_SEGMENTS: Record<string, { primary: string; secondary?: string }> = {
  "contact_form_submission": { primary: "it_decision_makers",          secondary: "digital_transformation_leaders" },
  "take_the_assessment":     { primary: "procurement_stakeholders",    secondary: "it_decision_makers" },
  "webinar_registration":    { primary: "customer_experience_leaders", secondary: "marketing_executives" },
  "Download_gated":          { primary: "it_decision_makers",          secondary: "data_analytics_leaders" },
  "download_ungated":        { primary: "digital_transformation_leaders", secondary: "customer_experience_leaders" },
  "Watch_now":               { primary: "marketing_executives",        secondary: "customer_experience_leaders" },
};

// ── Audience segments ─────────────────────────────────────────────────────────

export function suggestAudienceSegments(
  input: ServiceSuggestionInput,
  resolvedService: ResolvedService | null
): string[] {
  if (input.campaign_context === "corporate") {
    return suggestCorporateAudienceSegments(input, resolvedService);
  }
  if (input.campaign_context === "careers") {
    return suggestCareersAudienceSegments(input);
  }
  return [];
}

function suggestCorporateAudienceSegments(
  input: ServiceSuggestionInput,
  resolvedService: ResolvedService | null
): string[] {
  const allValues = new Set(CORPORATE_AUDIENCE_SEGMENTS.map((o) => o.value));
  const healthcare = hasHealthcareSignal(input);
  const procurement = hasProcurementSignal(input);

  const scores = new Map<string, number>();

  const add = (seg: string, score: number) => {
    if (!allValues.has(seg)) return;
    if (HEALTHCARE_AUDIENCE_SEGMENTS.has(seg) && !healthcare) return;
    if (seg === "procurement_stakeholders" && !procurement) return;
    scores.set(seg, (scores.get(seg) ?? 0) + score);
  };

  // ── Layer 1: Offering-level mapping (weight: primary +3, secondary +2) ──────
  if (resolvedService?.offering_id) {
    const offeringSegs = OFFERING_TO_SEGMENTS[resolvedService.offering_id];
    if (offeringSegs) {
      offeringSegs.forEach((seg, i) => add(seg, i === 0 ? 3 : 2));
    }
  }

  // ── Layer 2: Service group fallback (weight: primary +2, secondary +1) ──────
  // Always runs — accumulates on top of offering score when both resolve.
  if (resolvedService?.service_group) {
    const groupSegs = SERVICE_GROUP_TO_SEGMENTS[resolvedService.service_group] ?? [];
    groupSegs.forEach((seg, i) => add(seg, i === 0 ? 2 : 1));
  }

  // ── Layer 3: Service category (weight: +1 each) ───────────────────────────
  if (resolvedService?.service_category) {
    const catSegs = SERVICE_CATEGORY_TO_SEGMENTS[resolvedService.service_category] ?? [];
    catSegs.forEach((seg) => add(seg, 1));
  }

  // ── Layer 4: Audience text keyword extraction (weight: +2 per match) ────────
  // Strongest per-signal weight — reflects explicit user intent.
  if (input.target_audience) {
    for (const { pattern, segment } of AUDIENCE_ROLE_SIGNALS) {
      if (pattern.test(input.target_audience)) {
        add(segment, 2);
      }
    }
  }

  // ── Layer 5: Conversion event (weight: primary +2, secondary +1) ────────────
  if (input.focus_conversion_event) {
    const eventMapping = CONVERSION_EVENT_SEGMENTS[input.focus_conversion_event];
    if (eventMapping) {
      add(eventMapping.primary, 2);
      if (eventMapping.secondary) add(eventMapping.secondary, 1);
    }
  }

  // ── Layer 6: Objective (weight: +1) ──────────────────────────────────────────
  const obj = input.campaign_objective;
  if (obj === "generate_leads") {
    add("it_decision_makers",             1);
    add("digital_transformation_leaders", 1);
    add("operations_leaders",             1);
  } else if (obj === "build_brand_awareness") {
    add("digital_transformation_leaders", 1);
    add("customer_experience_leaders",    1);
    add("marketing_executives",           1);
  } else if (obj === "increase_website_traffic") {
    add("digital_transformation_leaders", 1);
    add("customer_experience_leaders",    1);
  }

  // ── Layer 7: Campaign type (weight: +1) ──────────────────────────────────────
  const ct = input.campaign_type;
  if (ct === "search") {
    add("it_decision_makers",             1);
    add("digital_transformation_leaders", 1);
  } else if (ct === "demand_gen" || ct === "display" || ct === "responsive_display") {
    add("customer_experience_leaders",    1);
    add("marketing_executives",           1);
  }

  // ── Healthcare: boost segments when signal present ───────────────────────────
  if (healthcare) {
    add("healthcare_operations_leaders", 4);
    add("payer_executives",              3);
    add("provider_executives",           3);
    add("patient_experience_leaders",    2);
    add("member_experience_leaders",     2);
  }

  // ── Fallback ──────────────────────────────────────────────────────────────────
  if (scores.size === 0) {
    return ["digital_transformation_leaders", "it_decision_makers"];
  }

  return sortedTopN(scores, 5);
}

function suggestCareersAudienceSegments(input: ServiceSuggestionInput): string[] {
  const allValues = new Set(CAREERS_AUDIENCE_SEGMENTS.map((o) => o.value));

  const scores = new Map<string, number>();
  const add = (seg: string, score: number) => {
    if (allValues.has(seg)) scores.set(seg, (scores.get(seg) ?? 0) + score);
  };

  const obj = input.campaign_objective;

  if (obj === "attract_candidates") {
    add("active_job_seekers",      4);
    add("customer_support_talent", 3);
    add("operations_talent",       3);
    add("passive_candidates",      2);
    add("experienced_hires",       1);
    add("early_career_candidates", 1);
  } else if (obj === "build_brand_awareness") {
    add("passive_candidates",      4);
    add("early_career_candidates", 3);
    add("active_job_seekers",      2);
    add("customer_support_talent", 1);
    add("operations_talent",       1);
    add("tech_and_data_talent",    1);
  } else {
    add("active_job_seekers",  3);
    add("passive_candidates",  2);
  }

  const ct = input.campaign_type;
  if (ct === "search") {
    add("active_job_seekers",      2);
    add("customer_support_talent", 1);
    add("tech_and_data_talent",    1);
  } else if (ct === "demand_gen" || ct === "video") {
    add("passive_candidates",     2);
    add("leadership_candidates",  1);
    add("tech_and_data_talent",   1);
  } else if (ct === "display" || ct === "responsive_display") {
    add("passive_candidates",     1);
    add("leadership_candidates",  1);
  }

  return sortedTopN(scores, 4);
}

// ── Ad group contexts ─────────────────────────────────────────────────────────

export function suggestAdGroupContexts(
  input: ServiceSuggestionInput,
  resolvedService: ResolvedService | null
): string[] {
  if (input.campaign_context === "corporate") {
    return suggestCorporateAdGroupContexts(input, resolvedService);
  }
  if (input.campaign_context === "careers") {
    return suggestCareersAdGroupContexts(input);
  }
  return [];
}

// ── Offering-level ad group context map ──────────────────────────────────────
// Primary context = index 0 (+3), secondary = index 1 (+2), tertiary = index 2 (+1).

const OFFERING_TO_CONTEXTS: Record<string, string[]> = {
  // Strategy & Design — Digital Innovation
  "SD-DI-GAI": ["ai_strategy",           "transformation_intent",   "use_case_challenge"],
  "SD-DI-MOB": ["platform_modernization", "transformation_intent",  "use_case_challenge"],
  // Business Transformation
  "SD-BT-PA":  ["transformation_intent", "use_case_challenge",      "process_automation"],
  "SD-BT-OMD": ["transformation_intent", "platform_modernization",  "use_case_challenge"],
  "SD-BT-OC":  ["transformation_intent", "use_case_challenge",      "cx_transformation"],
  // Experience Design
  "SD-ED-CXD": ["experience_design",     "cx_transformation",       "use_case_challenge"],
  "SD-ED-UXD": ["experience_design",     "cx_transformation",       "use_case_challenge"],
  "SD-ED-EXD": ["experience_design",     "transformation_intent",   "use_case_challenge"],
  "SD-ED-BXD": ["experience_design",     "cx_transformation",       "use_case_challenge"],
  "SD-ED-BS":  ["experience_design",     "cx_transformation"],
  // Lifecycle Engagement
  "SD-LE-DM":  ["marketing_automation",  "loyalty_retention",       "use_case_challenge"],
  "SD-LE-CL":  ["loyalty_retention",     "marketing_automation",    "use_case_challenge"],
  "SD-LE-LTV": ["loyalty_retention",     "marketing_automation"],
  "SD-LE-DS":  ["marketing_automation",  "use_case_challenge"],
  // Data & Analytics
  "DA-DAT-DVR": ["data_modernization",   "transformation_intent",   "use_case_challenge"],
  "DA-AA-MLO":  ["data_modernization",   "ai_strategy",             "use_case_challenge"],
  "DA-EI-HCBI": ["data_modernization",   "use_case_challenge"],
  "DA-OI-CCA":  ["data_modernization",   "workforce_optimization",  "cx_transformation"],
  "DA-IDS-SRA": ["data_modernization",   "use_case_challenge"],
  "DA-DAT-DG":  ["data_modernization",   "transformation_intent"],
  // Enterprise Technology — Technology Transformation
  "ET-TT-TA":   ["platform_modernization", "transformation_intent", "use_case_challenge"],
  "ET-TT-MTS":  ["marketing_automation",   "platform_modernization", "use_case_challenge"],
  // Application Services
  "ET-AS-AM":   ["platform_modernization", "transformation_intent"],
  "ET-AS-AIE":  ["ai_strategy",            "platform_modernization", "transformation_intent"],
  // Experience Platforms
  "ET-EP-SF":   ["platform_modernization", "marketing_automation",  "cx_transformation"],
  "ET-EP-AD":   ["marketing_automation",   "platform_modernization", "cx_transformation"],
  "ET-EP-SC":   ["marketing_automation",   "platform_modernization"],
  // CX Technology
  "ET-CXT-CCaaS": ["cx_transformation",    "workforce_optimization", "use_case_challenge"],
  "ET-CXT-SAB":   ["cx_transformation",    "ai_strategy",            "workforce_optimization"],
  "ET-CXT-VOC":   ["cx_transformation",    "use_case_challenge",     "data_modernization"],
  // Enterprise Automation
  "ET-EA-PA":   ["process_automation",     "transformation_intent",  "use_case_challenge"],
  // Cybersecurity
  "ET-CYB-SOC": ["security_transformation", "transformation_intent", "use_case_challenge"],
  // Digital Operations — Customer Service
  "DO-CS-CC":   ["cx_transformation",      "workforce_optimization", "use_case_challenge"],
  "DO-CS-TS":   ["cx_transformation",      "workforce_optimization"],
  // Marketing
  "DO-MKT-PM":  ["marketing_automation",   "loyalty_retention",      "use_case_challenge"],
  "DO-MKT-LOY": ["loyalty_retention",      "marketing_automation",   "use_case_challenge"],
  "DO-MKT-CS":  ["marketing_automation",   "use_case_challenge"],
  // Sales
  "DO-SAL-B2B": ["use_case_challenge",     "cx_transformation",      "industry_solution"],
  "DO-SAL-B2C": ["use_case_challenge",     "cx_transformation",      "industry_solution"],
  // Trust & Safety
  "DO-TS-CM":   ["use_case_challenge",     "industry_solution"],
  // Finance & Compliance
  "DO-FC-FCC":  ["finance_compliance",     "process_automation",     "use_case_challenge"],
  "DO-FC-FA":   ["finance_compliance",     "process_automation",     "use_case_challenge"],
  // Workforce Management
  "DO-WFM-CON":   ["workforce_optimization", "cx_transformation",    "use_case_challenge"],
  "DO-WFM-WFMAS": ["workforce_optimization", "process_automation",   "use_case_challenge"],
};

function suggestCorporateAdGroupContexts(
  input: ServiceSuggestionInput,
  resolvedService: ResolvedService | null
): string[] {
  const allValues = new Set(CORPORATE_AD_GROUP_CONTEXTS.map((o) => o.value));
  const healthcare = hasHealthcareSignal(input);

  const scores = new Map<string, number>();

  const add = (ctx: string, score: number) => {
    if (!allValues.has(ctx)) return;
    if (HEALTHCARE_AD_GROUP_CONTEXTS.has(ctx) && !healthcare) return;
    scores.set(ctx, (scores.get(ctx) ?? 0) + score);
  };

  // ── Offering-level context mapping (primary +3, secondary +2, tertiary +1) ──
  if (resolvedService?.offering_id) {
    const offeringCtxs = OFFERING_TO_CONTEXTS[resolvedService.offering_id];
    if (offeringCtxs) {
      offeringCtxs.forEach((ctx, i) => add(ctx, 3 - i));
    }
  }

  // ── Service group fallback contexts ──────────────────────────────────────────
  const grp = resolvedService?.service_group;
  if (grp === "Digital Innovation")                              { add("ai_strategy", 2);            add("transformation_intent", 1); }
  else if (grp === "Experience Design")                         { add("experience_design", 2);       add("cx_transformation", 1); }
  else if (grp === "Lifecycle Engagement")                      { add("marketing_automation", 2);    add("loyalty_retention", 1); }
  else if (grp === "Business Transformation")                   { add("transformation_intent", 2);   add("use_case_challenge", 1); }
  else if (grp === "CX Technology")                             { add("cx_transformation", 2);       add("workforce_optimization", 1); }
  else if (grp === "Enterprise Automation")                     { add("process_automation", 2);      add("transformation_intent", 1); }
  else if (grp === "Application Services")                      { add("platform_modernization", 2);  add("transformation_intent", 1); }
  else if (grp === "Technology Transformation")                 { add("platform_modernization", 2);  add("transformation_intent", 1); }
  else if (grp === "Experience Platforms")                      { add("marketing_automation", 2);    add("platform_modernization", 1); }
  else if (grp === "Data & Analytics Transformation")           { add("data_modernization", 2);      add("transformation_intent", 1); }
  else if (grp === "Advanced Analytics")                        { add("data_modernization", 2);      add("ai_strategy", 1); }
  else if (grp === "Enterprise Intelligence")                   { add("data_modernization", 2);      add("use_case_challenge", 1); }
  else if (grp === "Operational Insights")                      { add("data_modernization", 2);      add("cx_transformation", 1); }
  else if (grp === "Customer Service")                          { add("cx_transformation", 2);       add("workforce_optimization", 1); }
  else if (grp === "Sales")                                     { add("use_case_challenge", 2);      add("cx_transformation", 1); }
  else if (grp === "Marketing")                                 { add("marketing_automation", 2);    add("loyalty_retention", 1); }
  else if (grp === "Finance & Compliance")                      { add("finance_compliance", 2);      add("process_automation", 1); }
  else if (grp === "Workforce Management")                      { add("workforce_optimization", 2);  add("cx_transformation", 1); }
  else if (grp === "Trust & Safety")                            { add("use_case_challenge", 2);      add("industry_solution", 1); }
  else if (grp === "Cybersecurity")                             { add("security_transformation", 2); add("transformation_intent", 1); }

  // ── Objective layer ───────────────────────────────────────────────────────────
  const obj = input.campaign_objective;
  if (obj === "generate_leads") {
    add("high_intent",  4);
    add("competitor",   3);
    add("brand",        2);
    add("industry_solution", 2);
    add("remarketing",  1);
  } else if (obj === "build_brand_awareness") {
    add("brand",             4);
    add("transformation_intent", 2);
    add("industry_solution", 2);
    add("remarketing",       1);
  } else if (obj === "increase_website_traffic") {
    add("high_intent",       3);
    add("brand",             3);
    add("use_case_challenge", 2);
    add("industry_solution", 1);
    add("remarketing",       1);
  } else {
    add("brand",      2);
    add("high_intent", 2);
  }

  // ── Campaign type layer ───────────────────────────────────────────────────────
  const ct = input.campaign_type;
  if (ct === "search") {
    add("high_intent",   2);
    add("competitor",    2);
    add("brand",         1);
  } else if (ct === "demand_gen") {
    add("brand",         2);
    add("remarketing",   2);
    add("industry_solution", 1);
  } else if (ct === "performance_max") {
    add("remarketing",   2);
    add("high_intent",   1);
  } else if (ct === "display" || ct === "responsive_display") {
    add("remarketing",   2);
    add("brand",         1);
  }

  // ── Healthcare overlay ────────────────────────────────────────────────────────
  if (healthcare) {
    add("patient_experience", 3);
    add("member_engagement",  2);
    add("industry_solution",  2);
  }

  return sortedTopN(scores, 4);
}

function suggestCareersAdGroupContexts(input: ServiceSuggestionInput): string[] {
  const allValues = new Set(CAREERS_AD_GROUP_CONTEXTS.map((o) => o.value));

  const scores = new Map<string, number>();
  const add = (ctx: string, score: number) => {
    if (allValues.has(ctx)) scores.set(ctx, (scores.get(ctx) ?? 0) + score);
  };

  const obj = input.campaign_objective;
  if (obj === "attract_candidates") {
    add("job_search_intent",    4);
    add("application_intent",   3);
    add("job_family",           3);
    add("employer_brand",       2);
    add("benefits_and_growth",  1);
    add("location",             1);
  } else if (obj === "build_brand_awareness") {
    add("employer_brand",       4);
    add("culture",              3);
    add("benefits_and_growth",  3);
    add("hiring_theme",         2);
    add("location",             1);
  } else {
    add("job_search_intent", 3);
    add("employer_brand",    2);
    add("job_family",        2);
  }

  const ct = input.campaign_type;
  if (ct === "search") {
    add("job_search_intent",   3);
    add("application_intent",  2);
    add("job_family",          1);
  } else if (ct === "demand_gen" || ct === "video") {
    add("employer_brand",         2);
    add("culture",                2);
    add("benefits_and_growth",    1);
    add("remarketing_candidates", 1);
  } else if (ct === "performance_max") {
    add("remarketing_candidates", 2);
    add("job_search_intent",      1);
    add("employer_brand",         1);
  } else if (ct === "display" || ct === "responsive_display") {
    add("employer_brand",         2);
    add("remarketing_candidates", 2);
    add("culture",                1);
  }

  return sortedTopN(scores, 4);
}
