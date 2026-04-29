import type { Option } from "../types";

export const CORPORATE_AUDIENCE_SEGMENTS: Option[] = [
  // ── Tier 1: Core buyer roles ─────────────────────────────────────────────────
  { value: "digital_transformation_leaders", label: "Digital transformation leaders" },
  { value: "it_decision_makers",             label: "IT decision-makers" },
  { value: "operations_leaders",             label: "Operations leaders" },
  { value: "customer_experience_leaders",    label: "Customer experience leaders" },
  { value: "contact_center_leaders",         label: "Contact center leaders" },
  { value: "marketing_executives",           label: "Marketing executives" },
  { value: "data_analytics_leaders",         label: "Data & analytics leaders" },
  // ── Tier 2: Specialist buyer roles ───────────────────────────────────────────
  { value: "ai_innovation_leaders",          label: "AI & innovation leaders" },
  { value: "security_leaders",               label: "Security leaders" },
  { value: "finance_operations_leaders",     label: "Finance operations leaders" },
  { value: "sales_revenue_leaders",          label: "Sales & revenue leaders" },
  { value: "procurement_stakeholders",       label: "Procurement stakeholders" },
  // ── Tier 3: Healthcare overlays (gated) ──────────────────────────────────────
  { value: "healthcare_operations_leaders",  label: "Healthcare operations leaders" },
  { value: "payer_executives",               label: "Payer executives" },
  { value: "provider_executives",            label: "Provider executives" },
  { value: "patient_experience_leaders",     label: "Patient experience leaders" },
  { value: "member_experience_leaders",      label: "Member experience leaders" },
];

export const CAREERS_AUDIENCE_SEGMENTS: Option[] = [
  { value: "active_job_seekers",      label: "Active job seekers" },
  { value: "passive_candidates",      label: "Passive candidates" },
  { value: "customer_support_talent", label: "Customer support talent" },
  { value: "operations_talent",       label: "Operations talent" },
  { value: "tech_and_data_talent",    label: "Tech & data talent" },
  { value: "multilingual_talent",     label: "Multilingual talent" },
  { value: "leadership_candidates",   label: "Leadership candidates" },
  { value: "early_career_candidates", label: "Early-career candidates" },
  { value: "experienced_hires",       label: "Experienced hires" },
];

export const CORPORATE_AD_GROUP_CONTEXTS: Option[] = [
  // ── Group 1: Universal intent buckets ────────────────────────────────────────
  { value: "brand",                 label: "Brand terms" },
  { value: "high_intent",           label: "High-intent solution search" },
  { value: "competitor",            label: "Competitor comparison" },
  { value: "remarketing",           label: "Remarketing / returning visitors" },
  // ── Group 2: Cross-cutting intent buckets ────────────────────────────────────
  { value: "transformation_intent", label: "Transformation & modernization intent" },
  { value: "cx_transformation",     label: "Customer service & CX transformation" },
  { value: "industry_solution",     label: "Industry-specific solution search" },
  { value: "use_case_challenge",    label: "Use-case & challenge-based search" },
  // ── Group 3: Service-specific contexts ───────────────────────────────────────
  { value: "ai_strategy",           label: "AI strategy & generative AI" },
  { value: "data_modernization",    label: "Data modernization & analytics" },
  { value: "marketing_automation",  label: "Marketing automation & MarTech" },
  { value: "loyalty_retention",     label: "Loyalty & lifecycle engagement" },
  { value: "process_automation",    label: "Process & intelligent automation" },
  { value: "security_transformation", label: "Security transformation" },
  { value: "platform_modernization", label: "Platform & technology modernization" },
  { value: "workforce_optimization", label: "Workforce & contact center optimization" },
  { value: "finance_compliance",    label: "Finance ops & compliance automation" },
  { value: "experience_design",     label: "Experience design & UX strategy" },
  // ── Group 4: Healthcare overlays (gated) ─────────────────────────────────────
  { value: "patient_experience",    label: "Patient experience" },
  { value: "member_engagement",     label: "Member engagement" },
];

export const CAREERS_AD_GROUP_CONTEXTS: Option[] = [
  { value: "employer_brand", label: "Employer brand" },
  { value: "job_search_intent", label: "Job search intent" },
  { value: "job_family", label: "Job family" },
  { value: "application_intent", label: "Application intent" },
  { value: "benefits_and_growth", label: "Benefits and growth" },
  { value: "culture", label: "Culture and values" },
  { value: "hiring_theme", label: "Hiring theme" },
  { value: "location", label: "Location-based recruiting" },
  { value: "remarketing_candidates", label: "Candidate remarketing" },
];

export function getAudienceSegmentsForCampaignContext(context?: string): Option[] {
  if (context === "careers") return CAREERS_AUDIENCE_SEGMENTS;
  if (context === "corporate") return CORPORATE_AUDIENCE_SEGMENTS;
  return [];
}

export function getAdGroupContextsForCampaignContext(context?: string): Option[] {
  if (context === "careers") return CAREERS_AD_GROUP_CONTEXTS;
  if (context === "corporate") return CORPORATE_AD_GROUP_CONTEXTS;
  return [];
}
