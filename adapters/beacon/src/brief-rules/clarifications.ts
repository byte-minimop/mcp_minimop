/**
 * Clarification templates for Beacon brief validation rules.
 *
 * Each entry maps a rule ID to the question Beacon should ask when that
 * rule fires, plus the rationale and priority for surfacing it.
 *
 * question() receives a minimal context object. Beacon's buildClarificationQuestion
 * (lib/beacon-clarifications.ts) maps BriefInput fields into this context.
 */

export interface ClarificationContext {
  product_or_service?: string;
  target_geography?: string;
  campaign_type?: string;
}

export interface ClarificationEntry {
  question: (context?: ClarificationContext) => string;
  why_it_matters: string;
  priority: "High" | "Medium" | "Low";
}

export const CLARIFICATION_TEMPLATES: Partial<Record<string, ClarificationEntry>> = {
  "BRIEF-001": {
    question: () =>
      "What is the final live landing page URL Beacon should use for this campaign?",
    why_it_matters:
      "Beacon cannot produce a trustworthy planning recommendation without a usable destination.",
    priority: "High",
  },
  "BRIEF-002": {
    question: () =>
      "What approved campaign budget should Beacon plan against?",
    why_it_matters:
      "A non-positive or missing usable budget blocks operational planning.",
    priority: "High",
  },
  "BRIEF-003": {
    question: () =>
      "What should the correct campaign start and end dates be?",
    why_it_matters:
      "Beacon cannot treat the campaign flight as valid until the date range is coherent.",
    priority: "High",
  },
  "BRIEF-004": {
    question: () =>
      "Can you confirm that the current landing page URL is the intended final destination and not a placeholder?",
    why_it_matters:
      "Placeholder destinations weaken trust in the blueprint and downstream handoff.",
    priority: "Medium",
  },
  "BRIEF-005": {
    question: () =>
      "If this is a total campaign budget, what end date should Beacon use to calculate pacing?",
    why_it_matters:
      "Beacon cannot interpret daily pacing confidently without a campaign end date.",
    priority: "Medium",
  },
  "BRIEF-006": {
    question: () =>
      "Is the short campaign flight intentional, or should Beacon plan against a longer run window?",
    why_it_matters:
      "Very short flights can materially weaken performance signal and planning quality.",
    priority: "Medium",
  },
  "BRIEF-007": {
    question: () =>
      "Is the past start date intentional, or should Beacon use a future launch date instead?",
    why_it_matters:
      "Past dates are often stale inputs and can distort planning assumptions.",
    priority: "Medium",
  },
  "BRIEF-008": {
    question: () =>
      "Who is the primary audience Beacon should optimize for, in more specific operational terms?",
    why_it_matters:
      "Broader audience language weakens campaign structure and targeting direction.",
    priority: "High",
  },
  "BRIEF-009": {
    question: (ctx) =>
      `What is the core campaign message Beacon should use${ctx?.product_or_service ? ` for ${ctx.product_or_service}` : ""}?`,
    why_it_matters:
      "Explicit message guidance materially improves output quality and keeps Beacon from inferring weak copy direction.",
    priority: "High",
  },
  "BRIEF-011": {
    question: () =>
      "Which focus conversion event should Beacon use for this campaign? (e.g. contact_form_submission, apply_start)",
    why_it_matters:
      "An explicit conversion event is stronger than an objective-based provisional default.",
    priority: "Medium",
  },
  "BRIEF-012": {
    question: () =>
      "Can you provide a more specific, campaign-usable key message instead of generic brand language?",
    why_it_matters:
      "Weak message direction leads Beacon to keep copy framing conservative and less useful.",
    priority: "Medium",
  },
  "BRIEF-013": {
    question: (ctx) =>
      `What target language or language mix should Beacon use${ctx?.target_geography ? ` for ${ctx.target_geography}` : ""}?`,
    why_it_matters:
      "Beacon should not assume a single language strategy in multilingual or localization-sensitive geographies.",
    priority: "High",
  },
  "BRIEF-014": {
    question: (ctx) =>
      `Is English-only intentional${ctx?.target_geography ? ` for ${ctx.target_geography}` : ""}, or should Beacon plan for localized market languages?`,
    why_it_matters:
      "Language-market mismatch can materially reduce campaign fit and destination relevance.",
    priority: "High",
  },
  "BRIEF-015": {
    question: () =>
      "Which specific markets, countries, or regions should Beacon prioritize within the current geography scope?",
    why_it_matters:
      "Broad geography weakens targeting precision and localization judgment.",
    priority: "Medium",
  },
  "BRIEF-016": {
    question: (ctx) => {
      const typeLabel = ctx?.campaign_type?.replace(/_/g, " ") ?? "requested campaign";
      return `Should Beacon keep the ${typeLabel} type, or switch to the better-fit recommendation for the stated objective?`;
    },
    why_it_matters:
      "Campaign type conflicts change how Beacon interprets the whole planning direction.",
    priority: "High",
  },
  "BRIEF-017": {
    question: () =>
      "Does the landing page support direct purchase intent, or should Beacon plan this as a non-transactional campaign instead?",
    why_it_matters:
      "Sales objectives need a destination that credibly supports transactional behavior.",
    priority: "High",
  },
  "BRIEF-020": {
    question: () =>
      "Should Beacon treat this as a traffic campaign, or is lead generation actually the stronger planning objective for this destination?",
    why_it_matters:
      "Objective-to-destination mismatch changes how Beacon should structure and review the campaign.",
    priority: "High",
  },
};
