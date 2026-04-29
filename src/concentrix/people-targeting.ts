import catalog from "../../data/people-targeting/catalog.json";
import { resolveService } from "./service-normalization";

// Local structural interface — callers (e.g. Beacon's BriefInput) satisfy this
// via TypeScript structural typing without importing Beacon types.
interface PeopleTargetingBriefSignals {
  campaign_context?: string;
  product_or_service?: string;
  target_audience?: string;
  additional_notes?: string;
  landing_page_url?: string;
  key_message?: string;
  preferred_ad_group_contexts?: string[];
}

export interface PeopleTargetingRecord {
  id: string;
  industry: string;
  service_category: string;
  tier_level: string;
  people_role: string;
  subsector_text: string;
  subsectors: string[];
  buying_considerations_text: string;
  buying_considerations: string[];
  relation_to_service: string;
}

export interface CorporatePeopleTargetingSuggestion {
  industry: string | null;
  service_category: string | null;
  industry_was_inferred: boolean;
  service_category_was_inferred: boolean;
  recommended_people_roles: string[];
  suggested_audience_segments: string[];
  confidence: "low" | "medium" | "high";
}

export interface CorporatePeopleTargetingPartialSignal {
  service_category: string;
  needs_industry_or_buyer_signal: true;
}

interface PeopleTargetingServiceIndex {
  service_category: string;
  record_count: number;
  tier_levels: string[];
  people_roles: string[];
}

interface PeopleTargetingIndustryIndex {
  industry: string;
  record_count: number;
  service_categories: PeopleTargetingServiceIndex[];
}

interface PeopleTargetingCatalog {
  metadata: {
    knowledge_area: string;
    generated_at: string;
    source_file: string;
    source_sheet: string;
    row_count: number;
    normalized_columns: Record<string, string>;
    normalization_notes: string[];
  };
  dimensions: {
    industries: string[];
    service_categories: string[];
    tier_levels: string[];
  };
  counts: {
    by_industry: Record<string, number>;
    by_service_category: Record<string, number>;
    by_tier_level: Record<string, number>;
  };
  index: PeopleTargetingIndustryIndex[];
  records: PeopleTargetingRecord[];
}

const peopleCatalog = catalog as PeopleTargetingCatalog;
const peopleRecords = peopleCatalog.records;

const PEOPLE_ROLE_TO_AUDIENCE_SEGMENTS: Array<{
  patterns: RegExp;
  segments: string[];
}> = [
  {
    patterns: /healthcare|patient|provider|payer|clinical|hospital/i,
    segments: [
      "healthcare_operations_leaders",
      "payer_executives",
      "provider_executives",
      "patient_experience_leaders",
      "member_experience_leaders",
    ],
  },
  {
    patterns: /digital|transformation|innovation/i,
    segments: [
      "digital_transformation_leaders",
      "it_decision_makers",
    ],
  },
  {
    patterns: /customer experience|cx\b|experience leader/i,
    segments: [
      "customer_experience_leaders",
      "digital_transformation_leaders",
    ],
  },
  {
    patterns: /contact center|call center|support operations/i,
    segments: [
      "contact_center_leaders",
      "customer_experience_leaders",
    ],
  },
  {
    patterns: /\bai\b|artificial intelligence|generative|machine learning|automation/i,
    segments: [
      "ai_innovation_leaders",
      "it_decision_makers",
    ],
  },
  {
    patterns: /data|analytics|intelligence|reporting|insight/i,
    segments: [
      "data_analytics_leaders",
      "it_decision_makers",
    ],
  },
  {
    patterns: /security|cyber|ciso|risk/i,
    segments: [
      "security_leaders",
      "it_decision_makers",
    ],
  },
  {
    patterns: /technology|platform|systems|engineering|architecture/i,
    segments: [
      "it_decision_makers",
      "digital_transformation_leaders",
    ],
  },
  {
    patterns: /marketing|lifecycle|loyalty|campaign|demand gen/i,
    segments: [
      "marketing_executives",
      "customer_experience_leaders",
    ],
  },
  {
    patterns: /sales|revenue|commercial|b2b|pipeline/i,
    segments: [
      "sales_revenue_leaders",
      "customer_experience_leaders",
    ],
  },
  {
    patterns: /finance|compliance|regulatory|accounts payable|accounts receivable|f&a/i,
    segments: [
      "finance_operations_leaders",
      "operations_leaders",
    ],
  },
  {
    patterns: /operations|workforce|shared services|bpo|process|outsourcing/i,
    segments: [
      "operations_leaders",
      "digital_transformation_leaders",
    ],
  },
  {
    patterns: /procurement|sourcing|vendor|commercial/i,
    segments: [
      "procurement_stakeholders",
    ],
  },
];

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeUrlLikeText(value?: string): string {
  return (value ?? "").toLowerCase().replace(/[-_/]/g, " ");
}

function matchesValue(actual: string, expected?: string): boolean {
  if (!expected) return true;
  return normalize(actual) === normalize(expected);
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function dedupeRecords(records: PeopleTargetingRecord[]): PeopleTargetingRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

export function getPeopleTargetingCatalog() {
  return peopleCatalog;
}

export function listPeopleTargetingIndustries(): string[] {
  return peopleCatalog.dimensions.industries;
}

export function listPeopleTargetingServiceCategories(): string[] {
  return peopleCatalog.dimensions.service_categories;
}

export function listPeopleTargetingTierLevels(): string[] {
  return peopleCatalog.dimensions.tier_levels;
}

export function findPeopleTargetingRecords(filters?: {
  industry?: string;
  serviceCategory?: string;
  tierLevel?: string;
  peopleRole?: string;
}): PeopleTargetingRecord[] {
  return peopleRecords.filter((record) =>
    matchesValue(record.industry, filters?.industry) &&
    matchesValue(record.service_category, filters?.serviceCategory) &&
    matchesValue(record.tier_level, filters?.tierLevel) &&
    matchesValue(record.people_role, filters?.peopleRole)
  );
}

export function getPeopleRolesForIndustryAndService(
  industry: string,
  serviceCategory?: string,
  tierLevel?: string
): string[] {
  const records = findPeopleTargetingRecords({ industry, serviceCategory, tierLevel });
  return dedupeStrings(records.map((record) => record.people_role));
}

export function getPeopleRecordsForIndustryAndService(
  industry: string,
  serviceCategory?: string,
  tierLevel?: string
): PeopleTargetingRecord[] {
  return dedupeRecords(findPeopleTargetingRecords({ industry, serviceCategory, tierLevel }));
}

export function getBuyingConsiderationsForPeopleRole(
  industry: string,
  serviceCategory: string,
  peopleRole: string
): string[] {
  const records = findPeopleTargetingRecords({
    industry,
    serviceCategory,
    peopleRole,
  });

  return dedupeStrings(records.flatMap((record) => record.buying_considerations));
}

export function getRelationToServiceForPeopleRole(
  industry: string,
  serviceCategory: string,
  peopleRole: string
): string[] {
  const records = findPeopleTargetingRecords({
    industry,
    serviceCategory,
    peopleRole,
  });

  return dedupeStrings(records.map((record) => record.relation_to_service));
}

export function getSubsectorsForIndustryAndService(
  industry: string,
  serviceCategory?: string
): string[] {
  const records = findPeopleTargetingRecords({ industry, serviceCategory });
  return dedupeStrings(records.flatMap((record) => record.subsectors));
}

export function getCoverageSummary(industry?: string) {
  const entries = industry
    ? peopleCatalog.index.filter((entry) => matchesValue(entry.industry, industry))
    : peopleCatalog.index;

  return entries.map((entry) => ({
    industry: entry.industry,
    record_count: entry.record_count,
    service_categories: entry.service_categories.map((service) => ({
      service_category: service.service_category,
      record_count: service.record_count,
      tier_levels: service.tier_levels,
      people_roles_count: service.people_roles.length,
    })),
  }));
}

export function recommendPeopleTargeting(filters: {
  industry: string;
  serviceCategory?: string;
  tierLevel?: string;
  limit?: number;
}) {
  const matched = getPeopleRecordsForIndustryAndService(
    filters.industry,
    filters.serviceCategory,
    filters.tierLevel
  );

  const ranked = matched
    .map((record) => ({
      people_role: record.people_role,
      tier_level: record.tier_level,
      service_category: record.service_category,
      buying_considerations: record.buying_considerations,
      subsectors: record.subsectors,
      relation_to_service: record.relation_to_service,
    }))
    .slice(0, filters.limit ?? 25);

  return ranked;
}

export function inferCorporatePeopleTargetingSuggestion(
  brief: PeopleTargetingBriefSignals
): CorporatePeopleTargetingSuggestion | null {
  if (brief.campaign_context !== "corporate") {
    return null;
  }

  const industries = listPeopleTargetingIndustries();
  const industryText = [
    brief.product_or_service,
    brief.target_audience,
    brief.additional_notes ?? "",
    brief.landing_page_url,
  ].join(" ").toLowerCase();

  const directIndustry = industries.find((industry) => industryText.includes(industry.toLowerCase()));
  const industry =
    directIndustry ??
    (/healthcare|patient|payer|provider|hospital|member/i.test(industryText)
      ? "Healthcare"
      : /insurance|claims|policyholder/i.test(industryText)
        ? "Insurance"
        : /bank|financial|finance|credit|payments|bfs/i.test(industryText)
          ? "BFS"
          : /retail|consumer|commerce|shop/i.test(industryText)
            ? "Retail"
            : /travel|hospitality|airline|hotel/i.test(industryText)
              ? "Travel"
              : /technology|electronics|software|saas|device/i.test(industryText)
                ? "Technology and Consumer Electronics"
                : /media|communications|telecom|advertising/i.test(industryText)
                  ? "Media and Communications"
                  : /automotive|vehicle|mobility/i.test(industryText)
                    ? "Automotive"
                    : null);

  if (!industry) {
    return null;
  }

  const categories = listPeopleTargetingServiceCategories();
  const serviceText = [
    brief.product_or_service,
    brief.key_message ?? "",
    brief.additional_notes ?? "",
    normalizeUrlLikeText(brief.landing_page_url),
    ...(brief.preferred_ad_group_contexts ?? []),
  ].join(" ").toLowerCase();

  // ── Resolver-based category inference (higher precision than keyword regex) ──
  // Taxonomy uses "Strategy & Design" etc; people catalog uses "and" form.
  const TAXONOMY_TO_CATALOG_CATEGORY: Record<string, string> = {
    "Strategy & Design":     "Strategy and Design",
    "Data & Analytics":      "Data and Analytics",
    "Enterprise Technology": "Enterprise Technology",
    "Digital Operations":    "Digital Operations",
  };

  const resolved = resolveService(brief.product_or_service ?? "");
  const resolvedCatalogCategory = resolved
    ? (TAXONOMY_TO_CATALOG_CATEGORY[resolved.service_category] ?? null)
    : null;
  const resolvedCategoryIsValid =
    resolvedCatalogCategory !== null && categories.includes(resolvedCatalogCategory);

  // ── Fallback: keyword regex map ──────────────────────────────────────────────
  const keywordMap: Array<{ category: string; patterns: RegExp }> = [
    {
      category: "Data and Analytics",
      patterns: /analytics|insight|data|measurement|reporting|ga4|bi\b|dashboard|attribution|optimization|intelligence/,
    },
    {
      category: "Digital Operations",
      patterns: /operations|workflow|process|contact center|member experience|patient experience|customer experience|\bcx\b|care delivery|journey|engagement|support operations|service operations|back office|front office/,
    },
    {
      category: "Enterprise Technology",
      patterns: /technology|platform|cloud|integration|security|ai|automation|software|saas|infrastructure|systems|engineering|digital stack|enterprise architecture/,
    },
    {
      category: "Strategy and Design",
      patterns: /strategy|design|transformation|consulting|experience strategy|brand|creative|ux\b|service design|innovation|go to market|gtm/,
    },
    {
      category: "BPO",
      patterns: /\bbpo\b|outsourcing|managed service|managed services|support team|operations team|service delivery|customer care|business process/,
    },
  ];

  const regexCategory =
    keywordMap.find((entry) => categories.includes(entry.category) && entry.patterns.test(serviceText))?.category ?? null;

  // Resolver wins over regex when it finds a valid catalog match
  const serviceCategory = resolvedCategoryIsValid ? resolvedCatalogCategory : regexCategory;

  const recommendedPeopleRoles = getPeopleRolesForIndustryAndService(industry, serviceCategory ?? undefined).slice(0, 6);
  if (recommendedPeopleRoles.length === 0) {
    return null;
  }

  const confidence: "low" | "medium" | "high" =
    resolvedCategoryIsValid && recommendedPeopleRoles.length >= 4
      ? "high"
      : resolvedCategoryIsValid || (serviceCategory && recommendedPeopleRoles.length >= 4)
        ? "medium"
        : serviceCategory
          ? "low"
          : "low";

  const suggestedAudienceSegments = dedupeStrings(
    recommendedPeopleRoles.flatMap((role) =>
      PEOPLE_ROLE_TO_AUDIENCE_SEGMENTS.flatMap((entry) =>
        entry.patterns.test(role) ? entry.segments : []
      )
    )
  ).slice(0, 5);

  return {
    industry,
    service_category: serviceCategory,
    industry_was_inferred: true,
    service_category_was_inferred: Boolean(serviceCategory),
    recommended_people_roles: recommendedPeopleRoles,
    suggested_audience_segments: suggestedAudienceSegments,
    confidence,
  };
}

export function inferCorporatePeopleTargetingPartialSignal(
  brief: PeopleTargetingBriefSignals
): CorporatePeopleTargetingPartialSignal | null {
  if (brief.campaign_context !== "corporate") {
    return null;
  }

  const industries = listPeopleTargetingIndustries();
  const industryText = [
    brief.product_or_service,
    brief.target_audience,
    brief.additional_notes ?? "",
    brief.landing_page_url,
  ].join(" ").toLowerCase();

  const directIndustry = industries.find((industry) => industryText.includes(industry.toLowerCase()));
  const inferredIndustry =
    directIndustry ??
    (/healthcare|patient|payer|provider|hospital|member/i.test(industryText)
      ? "Healthcare"
      : /insurance|claims|policyholder/i.test(industryText)
        ? "Insurance"
        : /bank|financial|finance|credit|payments|bfs/i.test(industryText)
          ? "BFS"
          : /retail|consumer|commerce|shop/i.test(industryText)
            ? "Retail"
            : /travel|hospitality|airline|hotel/i.test(industryText)
              ? "Travel"
              : /technology|electronics|software|saas|device/i.test(industryText)
                ? "Technology and Consumer Electronics"
                : /media|communications|telecom|advertising/i.test(industryText)
                  ? "Media and Communications"
                  : /automotive|vehicle|mobility/i.test(industryText)
                    ? "Automotive"
                    : null);

  if (inferredIndustry) {
    return null;
  }

  const categories = listPeopleTargetingServiceCategories();
  const serviceText = [
    brief.product_or_service,
    brief.key_message ?? "",
    brief.additional_notes ?? "",
    normalizeUrlLikeText(brief.landing_page_url),
    ...(brief.preferred_ad_group_contexts ?? []),
  ].join(" ").toLowerCase();

  // ── Resolver-based category inference (higher precision than keyword regex) ──
  const TAXONOMY_TO_CATALOG_CATEGORY: Record<string, string> = {
    "Strategy & Design":     "Strategy and Design",
    "Data & Analytics":      "Data and Analytics",
    "Enterprise Technology": "Enterprise Technology",
    "Digital Operations":    "Digital Operations",
  };

  const resolved = resolveService(brief.product_or_service ?? "");
  const resolvedCatalogCategory = resolved
    ? (TAXONOMY_TO_CATALOG_CATEGORY[resolved.service_category] ?? null)
    : null;
  const resolvedCategoryIsValid =
    resolvedCatalogCategory !== null && categories.includes(resolvedCatalogCategory);

  const keywordMap: Array<{ category: string; patterns: RegExp }> = [
    {
      category: "Data and Analytics",
      patterns: /analytics|insight|data|measurement|reporting|ga4|bi\b|dashboard|attribution|optimization|intelligence/,
    },
    {
      category: "Digital Operations",
      patterns: /operations|workflow|process|contact center|member experience|patient experience|customer experience|\bcx\b|care delivery|journey|engagement|support operations|service operations|back office|front office/,
    },
    {
      category: "Enterprise Technology",
      patterns: /technology|platform|cloud|integration|security|ai|automation|software|saas|infrastructure|systems|engineering|digital stack|enterprise architecture/,
    },
    {
      category: "Strategy and Design",
      patterns: /strategy|design|transformation|consulting|experience strategy|brand|creative|ux\b|service design|innovation|go to market|gtm/,
    },
    {
      category: "BPO",
      patterns: /\bbpo\b|outsourcing|managed service|managed services|support team|operations team|service delivery|customer care|business process/,
    },
  ];

  const regexCategory =
    keywordMap.find((entry) => categories.includes(entry.category) && entry.patterns.test(serviceText))?.category ?? null;

  const serviceCategory = resolvedCategoryIsValid ? resolvedCatalogCategory : regexCategory;

  if (!serviceCategory) {
    return null;
  }

  return {
    service_category: serviceCategory,
    needs_industry_or_buyer_signal: true,
  };
}
