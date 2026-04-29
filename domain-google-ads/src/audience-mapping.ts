import type {
  AudienceApplicationMode,
  AudienceExecutionCandidate,
  AudienceExecutionGuidance,
  AudienceExecutionStatus,
  CampaignContext,
  CampaignType,
  GoogleAdsAudienceEntityType,
} from "./types";
import {
  getAudienceSegmentsForCampaignContext,
  isRelocationRecruitmentSignal,
} from "@mktg/core";
import type { Option } from "@mktg/core";

// Inlined from lib/google-ads/options.ts — a 3-line lookup utility that does
// not justify pulling the entire options module (which is mostly UI dropdown
// data) into the intelligence layer.
function labelForOption(options: Option[], value?: string): string | undefined {
  if (!value) return undefined;
  return options.find((option) => option.value === value)?.label;
}

interface BeaconAudienceSegmentMappingDefinition {
  segment: string;
  summary: string;
  first_party_list_hint: string;
  custom_segment_hint: string;
}

const CORPORATE_SEGMENT_MAPPINGS: Record<string, BeaconAudienceSegmentMappingDefinition> = {
  healthcare_operations_leaders: {
    segment: "healthcare_operations_leaders",
    summary: "Business decision-makers responsible for healthcare operations improvement and operational performance.",
    first_party_list_hint: "Use an existing CRM or first-party list of healthcare operations contacts if one already exists in the Google Ads account.",
    custom_segment_hint: "Build a custom segment around healthcare operations, patient flow, care operations, and payer/provider transformation research signals.",
  },
  payer_executives: {
    segment: "payer_executives",
    summary: "Payer-side executive audiences evaluating operational, member, and digital experience solutions.",
    first_party_list_hint: "Use an existing payer executive or payer-account stakeholder list if the account already has one.",
    custom_segment_hint: "Build a custom segment around payer operations, member engagement, health plan experience, and claims/customer operations themes.",
  },
  provider_executives: {
    segment: "provider_executives",
    summary: "Provider-side executives evaluating experience, operations, and modernization initiatives.",
    first_party_list_hint: "Use an existing provider executive or provider-account stakeholder list if one is already available.",
    custom_segment_hint: "Build a custom segment around provider operations, patient experience, health system modernization, and care delivery themes.",
  },
  patient_experience_leaders: {
    segment: "patient_experience_leaders",
    summary: "Healthcare leaders responsible for patient journey, access, and experience quality.",
    first_party_list_hint: "Use an existing first-party audience of patient-experience stakeholders or related healthcare contacts if available.",
    custom_segment_hint: "Build a custom segment around patient experience, access, member/patient satisfaction, and care journey themes.",
  },
  member_experience_leaders: {
    segment: "member_experience_leaders",
    summary: "Payer-side leaders focused on member engagement, retention, and service experience.",
    first_party_list_hint: "Use an existing first-party list of member-experience stakeholders if the account already has it.",
    custom_segment_hint: "Build a custom segment around member engagement, health plan experience, service quality, and retention themes.",
  },
  digital_transformation_leaders: {
    segment: "digital_transformation_leaders",
    summary: "Leaders responsible for digital modernization, transformation, and enterprise experience change.",
    first_party_list_hint: "Use an existing first-party list of transformation or digital program stakeholders if one already exists.",
    custom_segment_hint: "Build a custom segment around digital transformation, modernization, platform change, and operational automation themes.",
  },
  contact_center_leaders: {
    segment: "contact_center_leaders",
    summary: "Leaders responsible for service operations, support performance, and contact center transformation.",
    first_party_list_hint: "Use an existing contact-center or service-operations stakeholder list if available in the account.",
    custom_segment_hint: "Build a custom segment around contact center operations, service delivery, CX operations, and support transformation themes.",
  },
  customer_experience_leaders: {
    segment: "customer_experience_leaders",
    summary: "Leaders responsible for CX strategy, service improvement, and experience outcomes.",
    first_party_list_hint: "Use an existing first-party CX stakeholder or known decision-maker audience if one already exists.",
    custom_segment_hint: "Build a custom segment around customer experience, service quality, journey improvement, and engagement themes.",
  },
  it_decision_makers: {
    segment: "it_decision_makers",
    summary: "Technology decision-makers evaluating platforms, enterprise systems, and operational technology change.",
    first_party_list_hint: "Use an existing technology buyer or IT stakeholder list if it already exists in the account.",
    custom_segment_hint: "Build a custom segment around enterprise technology, platform modernization, cloud, and systems integration themes.",
  },
  operations_leaders: {
    segment: "operations_leaders",
    summary: "Operations executives and shared-services leaders responsible for process efficiency, service delivery, and operational transformation.",
    first_party_list_hint: "Use an existing operations or shared-services stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around operations transformation, process improvement, shared services, outsourcing, and BPO-adjacent themes.",
  },
  marketing_executives: {
    segment: "marketing_executives",
    summary: "Marketing leaders evaluating digital marketing, lifecycle engagement, MarTech, and demand generation solutions.",
    first_party_list_hint: "Use an existing marketing leadership or CMO-level stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around marketing automation, MarTech, customer lifecycle, campaign performance, and growth marketing themes.",
  },
  data_analytics_leaders: {
    segment: "data_analytics_leaders",
    summary: "Data and analytics executives evaluating data modernization, BI, advanced analytics, and AI-readiness programs.",
    first_party_list_hint: "Use an existing data or analytics stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around data strategy, analytics modernization, data governance, BI platforms, and AI/ML readiness themes.",
  },
  ai_innovation_leaders: {
    segment: "ai_innovation_leaders",
    summary: "Innovation and AI strategy leaders evaluating generative AI, intelligent automation, and AI transformation programs.",
    first_party_list_hint: "Use an existing AI strategy or innovation stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around generative AI, AI strategy, intelligent automation, AI engineering, and enterprise AI adoption themes.",
  },
  security_leaders: {
    segment: "security_leaders",
    summary: "Security executives evaluating cybersecurity strategy, SOC capabilities, and security transformation programs.",
    first_party_list_hint: "Use an existing CISO or security leadership stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around cybersecurity transformation, SOC-as-a-service, zero trust, threat detection, and security operations themes.",
  },
  finance_operations_leaders: {
    segment: "finance_operations_leaders",
    summary: "Finance operations and compliance leaders evaluating F&A automation, regulatory compliance, and financial process improvement.",
    first_party_list_hint: "Use an existing finance operations or compliance stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around finance automation, accounts payable/receivable, compliance operations, regulatory reporting, and F&A transformation themes.",
  },
  sales_revenue_leaders: {
    segment: "sales_revenue_leaders",
    summary: "Sales and revenue operations leaders evaluating B2B/B2C sales solutions, digital selling, and revenue analytics programs.",
    first_party_list_hint: "Use an existing sales leadership or revenue operations stakeholder list if one already exists in the account.",
    custom_segment_hint: "Build a custom segment around B2B sales, digital selling, revenue operations, sales transformation, and CRM/sales analytics themes.",
  },
  procurement_stakeholders: {
    segment: "procurement_stakeholders",
    summary: "Commercial and sourcing stakeholders involved in vendor evaluation and purchase governance.",
    first_party_list_hint: "Use an existing procurement or commercial stakeholder list if the account already maintains one.",
    custom_segment_hint: "Build a custom segment around vendor evaluation, outsourcing, sourcing, procurement, and commercial assessment themes.",
  },
};

function defaultApplicationMode(family: CampaignType): AudienceApplicationMode {
  switch (family) {
    case "search":
    case "search_local":
      return "observation";
    case "display":
    case "responsive_display":
    case "demand_gen":
      return "targeting";
    case "performance_max":
      return "signal";
    default:
      return "observation";
  }
}

function buildCandidate(
  family: CampaignType,
  entityType: GoogleAdsAudienceEntityType,
  status: AudienceExecutionStatus,
  label: string,
  implementationHint: string,
  rationale: string
): AudienceExecutionCandidate {
  return {
    google_ads_entity_type: entityType,
    application_mode: defaultApplicationMode(family),
    execution_status: status,
    candidate_label: label,
    implementation_hint: implementationHint,
    rationale,
  };
}

function resolveKnownSegmentForFamily(
  definition: BeaconAudienceSegmentMappingDefinition,
  family: CampaignType
): AudienceExecutionCandidate[] {
  switch (family) {
    case "search":
    case "search_local":
      return [
        buildCandidate(
          family,
          "user_list",
          "ready_with_existing_account_audience",
          "Existing first-party audience list",
          definition.first_party_list_hint,
          "Strategist Opinion: Search should use high-intent audiences in observation mode to validate whether key buyer patterns are present without restricting reach."
        ),
        buildCandidate(
          family,
          "custom_segment",
          "requires_custom_segment_definition",
          "Custom segment for research intent",
          definition.custom_segment_hint,
          "Strategist Opinion: Use custom segments to overlay specific research intent (e.g. searching for competitor solutions) on top of your primary keywords."
        ),
      ];
    case "display":
    case "responsive_display":
    case "demand_gen":
      return [
        buildCandidate(
          family,
          "user_list",
          "ready_with_existing_account_audience",
          "Existing first-party audience list",
          definition.first_party_list_hint,
          "Strategist Opinion: Demand Gen and Display families are highly effective when targeting known first-party audiences directly."
        ),
        buildCandidate(
          family,
          "custom_segment",
          "requires_custom_segment_definition",
          "Custom segment audience",
          definition.custom_segment_hint,
          "Strategist Opinion: Custom segments are the primary targeting vehicle for Demand Gen. Ensure your keyword and URL signals reflect recent buyer research."
        ),
      ];
    case "performance_max":
      return [
        buildCandidate(
          family,
          "audience_signal",
          "ready_with_existing_account_audience",
          "Existing first-party audience signal",
          definition.first_party_list_hint,
          "Strategist Opinion: Performance Max uses these as signals to jumpstart the algorithm. High-quality first-party data is the strongest signal you can provide."
        ),
        buildCandidate(
          family,
          "audience_signal",
          "requires_custom_segment_definition",
          "Custom audience signal",
          definition.custom_segment_hint,
          "Strategist Opinion: Signals guide Google's AI towards the right buyer profiles. Custom segments based on intent are essential for B2B performance."
        ),
      ];
    default:
      return [
        buildCandidate(
          family,
          "custom_segment",
          "strategy_only",
          "Strategy label only",
          "No governed Google Ads execution path is defined yet for this campaign family.",
          "Beacon can preserve the audience segment as strategy guidance, but it should not pretend to have a live audience application path here."
        ),
      ];
  }
}

export function resolveAudienceExecutionGuidance(input: {
  campaignFamily: CampaignType;
  campaignContext: CampaignContext | undefined;
  selectedSegments: string[];
  targetGeography?: string;
  additionalNotes?: string;
}): AudienceExecutionGuidance | null {
  const { campaignFamily, campaignContext, selectedSegments, targetGeography, additionalNotes } = input;

  const isRelocation = isRelocationRecruitmentSignal(targetGeography ?? "", additionalNotes);

  if (selectedSegments.length === 0 && !isRelocation) {
    return null;
  }

  const options = getAudienceSegmentsForCampaignContext(campaignContext);
  const segmentGuidance = selectedSegments.slice(0, 5).map((segment) => {
    const definition = CORPORATE_SEGMENT_MAPPINGS[segment];
    const segmentLabel = labelForOption(options, segment) ?? segment;

    return {
      beacon_segment: segment,
      beacon_segment_label: segmentLabel,
      strategy_summary:
        definition?.summary ??
        "Beacon currently treats this segment as an internal targeting concept, but does not yet have a governed Google Ads execution mapping for it.",
      candidates:
        definition && campaignContext === "corporate"
          ? resolveKnownSegmentForFamily(definition, campaignFamily)
          : [
              buildCandidate(
                campaignFamily,
                "custom_segment",
                "strategy_only",
                "No governed Google Ads mapping defined yet",
                "Keep this Beacon segment as internal strategy guidance until a governed family-specific Google Ads mapping is defined.",
                "Beacon should not treat internal audience segment labels as executable Google Ads targeting objects without an explicit mapping layer."
              ),
            ],
    };
  });

  // ── Relocation Recruitment Specialized Guidance ──────────────────────────
  if (isRelocation && campaignContext === "careers") {
    segmentGuidance.unshift({
      beacon_segment: "relocation_candidates",
      beacon_segment_label: "Relocation Candidates",
      strategy_summary: "Candidates living in origin markets who are actively researching jobs in the destination country.",
      candidates: [
        buildCandidate(
          campaignFamily,
          "custom_segment",
          "requires_custom_segment_definition",
          "Custom segment: Relocation Intent",
          "Build a custom segment using intent keywords like 'work in [Destination]', 'jobs in [Destination]', and 'relocate to [Destination]'.",
          "Strategist Opinion: Relocation campaigns perform best when intent keywords are combined with origin-market geo-targeting."
        )
      ]
    });
  }

  return {
    campaign_family: campaignFamily,
    advisory_note:
      "Strategist Advice: Beacon is translating selected audience segments into Google Ads implementation candidates based on Concentrix portfolio benchmarks.",
    segments: segmentGuidance,
  };
}
