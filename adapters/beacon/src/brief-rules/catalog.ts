/**
 * Beacon brief validation rules catalog.
 *
 * Declarative definitions — no evaluation logic.
 * Evaluation (when rules fire, how gaps are built) lives in Beacon's lib/beacon-policy.ts.
 */

export type RuleSeverity = "Hard" | "Soft" | "Informational";

export type RuleCategory =
  | "input_validity"
  | "input_completeness"
  | "input_quality"
  | "interpretive_conflict"
  | "planning_feasibility";

export interface RuleDefinition {
  name: string;
  category: RuleCategory;
  field: string;
  severity: RuleSeverity;
  defaultMessage: string;
  explanation: string;
}

export const BEACON_RULES = {
  "BRIEF-001": {
    name: "Landing page URL must be valid",
    category: "input_validity",
    field: "landing_page_url",
    severity: "Hard",
    defaultMessage:
      "Landing page URL does not appear to be valid. It must begin with http:// or https:// and include a usable domain.",
    explanation:
      "Google Ads requires a functioning final URL for every campaign. Without a valid destination, Beacon cannot evaluate landing page signals, and the campaign cannot serve.",
  },
  "BRIEF-002": {
    name: "Budget amount must be positive",
    category: "input_validity",
    field: "budget_amount",
    severity: "Hard",
    defaultMessage: "Budget amount must be a positive number.",
    explanation:
      "A zero or negative budget cannot produce a valid campaign. Beacon needs a real budget figure to interpret pacing, recommend structure, and assess feasibility.",
  },
  "BRIEF-003": {
    name: "End date must follow start date",
    category: "planning_feasibility",
    field: "end_date",
    severity: "Hard",
    defaultMessage: "End date must be after start date.",
    explanation:
      "An end date that precedes the start date produces a zero-length or negative flight. Beacon cannot model campaign pacing or structure without a valid date range.",
  },
  "BRIEF-004": {
    name: "Placeholder landing page should not be treated as trusted",
    category: "input_quality",
    field: "landing_page_url",
    severity: "Soft",
    defaultMessage:
      "Landing page URL looks like a placeholder. Confirm the intended destination before using this blueprint operationally.",
    explanation:
      "Placeholder URLs (example.com, yoursite.com, TBD) cannot be analysed for landing page signals. Beacon's messaging and conversion inferences are weaker when the destination is not a real page.",
  },
  "BRIEF-005": {
    name: "Total campaign budget without end date weakens planning quality",
    category: "planning_feasibility",
    field: "end_date",
    severity: "Soft",
    defaultMessage:
      "Total campaign budget provided without an end date. Daily pacing cannot be interpreted confidently.",
    explanation:
      "A total budget only makes sense when the flight length is known. Without an end date, Beacon cannot derive a daily spend rate or assess whether the budget is appropriate for the objective.",
  },
  "BRIEF-006": {
    name: "Very short campaign flight may be strategically weak",
    category: "planning_feasibility",
    field: "end_date",
    severity: "Soft",
    defaultMessage:
      "Campaign flight may be too short for the stated objective to produce stable signal.",
    explanation:
      "Campaigns under roughly seven days often do not accumulate enough signal for Google's bidding algorithms to optimise. Performance objectives (leads, sales) are particularly sensitive to short flights.",
  },
  "BRIEF-007": {
    name: "Start date in the past requires confirmation",
    category: "input_quality",
    field: "start_date",
    severity: "Soft",
    defaultMessage:
      "Start date is in the past. Confirm whether this is intentional or stale input.",
    explanation:
      "A past start date is usually a copy-paste error or stale brief. Beacon preserves it but flags it so the campaign does not launch with a date that implies it should already be running.",
  },
  "BRIEF-008": {
    name: "Audience description too weak for confident structuring",
    category: "input_quality",
    field: "target_audience",
    severity: "Soft",
    defaultMessage:
      "Audience description is too broad or generic to support confident campaign structuring.",
    explanation:
      "Beacon uses the audience description to recommend ad group structure, keyword themes, and people-targeting signals. A description like 'everyone' or 'businesses' does not provide enough specificity to make those recommendations reliably.",
  },
  "BRIEF-009": {
    name: "Missing key message reduces message quality",
    category: "input_completeness",
    field: "key_message",
    severity: "Soft",
    defaultMessage:
      "No key message provided. Beacon will infer message direction, but output quality is weaker without explicit value proposition guidance.",
    explanation:
      "The key message is the primary input for Beacon's headline angle and messaging direction generation. Without it, Beacon falls back to inferring a value proposition from the landing page and objective — which is less precise than an explicit brief.",
  },
  "BRIEF-011": {
    name: "No focus conversion event selected",
    category: "input_completeness",
    field: "focus_conversion_event",
    severity: "Informational",
    defaultMessage:
      "No focus conversion event selected. Beacon will infer a provisional conversion direction from the objective.",
    explanation:
      "Beacon uses the conversion event to shape bidding direction, tracking requirements, and readiness evaluation. When none is selected, Beacon infers a default from the objective — which is serviceable but less precise than an explicit selection.",
  },
  "BRIEF-012": {
    name: "Weak key message should not be treated as strong guidance",
    category: "input_quality",
    field: "key_message",
    severity: "Soft",
    defaultMessage:
      "Key message is present but too generic to guide strong campaign messaging. Beacon will keep messaging direction bounded.",
    explanation:
      "A key message like 'We are a leading provider' or 'Best in class solutions' does not carry differentiated value proposition content. Beacon recognises these patterns and limits how strongly it uses the key message to generate headline angles.",
  },
  "BRIEF-013": {
    name: "Missing language guidance for multilingual geography",
    category: "input_completeness",
    field: "target_language",
    severity: "Soft",
    defaultMessage:
      "No target language specified for a geography that likely requires localization or multiple market languages.",
    explanation:
      "Geographies like India, APAC, or Latin America span multiple languages. Without explicit language guidance, Beacon cannot safely assume a single campaign language, which affects copy direction, bidding scope, and audience targeting.",
  },
  "BRIEF-014": {
    name: "English-only language signal may be weak for the target markets",
    category: "interpretive_conflict",
    field: "target_language",
    severity: "Soft",
    defaultMessage:
      "Target language is English, but the geography suggests markets where localization may materially affect campaign fit.",
    explanation:
      "Some geographies — particularly parts of APAC, LATAM, and EMEA — have significant audiences who search and engage in languages other than English. An English-only campaign in those markets may underperform compared to a localised approach.",
  },
  "BRIEF-015": {
    name: "Broad geography weakens planning specificity",
    category: "input_quality",
    field: "target_geography",
    severity: "Soft",
    defaultMessage:
      "Target geography is broad. Additional market or regional specificity would improve planning quality and localization judgment.",
    explanation:
      "Continent-level or global geographies make it harder for Beacon to recommend appropriate language, budget pacing, and local market context. More specific geography inputs (country, region, city) produce more precise plans.",
  },
  "BRIEF-016": {
    name: "Campaign type conflicts with objective",
    category: "interpretive_conflict",
    field: "campaign_type",
    severity: "Soft",
    defaultMessage:
      "The provided campaign type may not fit the stated objective. Beacon preserved it as input and flagged it for review.",
    explanation:
      "Beacon detected a mismatch between the chosen campaign family and the stated objective — for example, a Display campaign with a lead-generation goal, where Search would typically be a stronger fit. Beacon preserved your explicit selection but surfaced this so you can confirm it is intentional.",
  },
  "BRIEF-017": {
    name: "Recruitment objective with apparent transactional destination",
    category: "interpretive_conflict",
    field: "landing_page_url",
    severity: "Soft",
    defaultMessage:
      "Recruitment objective selected, but the landing page appears commercially transactional rather than candidate-oriented. Confirm the destination is the intended careers landing page.",
    explanation:
      "Beacon detected that the landing page appears to be a product or service page rather than a careers or job-listing destination. If this is a recruitment campaign, the destination should be a page where candidates can apply or learn about open roles.",
  },
  "BRIEF-020": {
    name: "Traffic objective may conflict with lead-oriented destination",
    category: "interpretive_conflict",
    field: "landing_page_url",
    severity: "Soft",
    defaultMessage:
      "The objective is traffic, but the landing page appears lead-oriented. Confirm whether traffic is the true goal or whether lead generation is the better planning interpretation.",
    explanation:
      "Beacon detected that the landing page contains strong lead-capture signals (forms, contact CTA, demo requests), which suggests the actual business goal may be lead generation rather than raw traffic. Confirming this would produce a more accurate blueprint.",
  },
  "BRIEF-021": {
    name: "Landing page domain is a legacy defunct brand",
    category: "input_validity",
    field: "landing_page_url",
    severity: "Hard",
    defaultMessage:
      "Landing page URL points to a defunct brand domain that is no longer active under the Concentrix identity. Replace with a current Concentrix destination before this campaign can proceed.",
    explanation:
      "The landing page domain matches a brand that was discontinued as part of the Concentrix identity consolidation. Campaigns pointing to defunct domains will not serve correctly and may violate brand governance. Replace with a current concentrix.com destination.",
  },
} as const satisfies Record<string, RuleDefinition>;

export type BeaconRuleId = keyof typeof BEACON_RULES;
