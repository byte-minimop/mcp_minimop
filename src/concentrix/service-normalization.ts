/**
 * service-normalization.ts
 *
 * Phase 1: Deterministic, alias-based normalization of messy product_or_service
 * inputs into official Concentrix service language.
 *
 * No AI calls. No external APIs. Pure lookup from static JSON.
 *
 * Usage:
 *   resolveService("gen ai")        → { canonical_offering: "Generative AI", ... }
 *   resolveService("loyalty")       → { canonical_offering: "Customer Loyalty", ... }
 *   resolveService("martech")       → { canonical_offering: "MarTech Strategy", ... }
 *   resolveService("unknown thing") → null
 */

import aliasData from "../../data/services/alias_mapping.json";

export interface ResolvedService {
  canonical_offering: string;
  service_category: string;  // e.g. "Strategy & Design", "Digital Operations"
  service_group: string;     // e.g. "Experience Design", "CX Technology"
  offering_id: string;       // e.g. "SD-ED-UXD"
  matched_alias: string;     // the alias token that matched
  match_type: "exact" | "substring";
}

type AliasRecord = (typeof aliasData.alias_map)[0];

// Build a flat lookup at module load time: normalized alias → record
const aliasLookup = new Map<string, AliasRecord>();

for (const record of aliasData.alias_map) {
  for (const alias of record.aliases) {
    const key = alias.toLowerCase().trim();
    // First writer wins — avoids later entries shadowing shorter canonical aliases
    if (!aliasLookup.has(key)) {
      aliasLookup.set(key, record);
    }
  }
}

/**
 * Attempt to resolve a free-text product_or_service string to a canonical
 * Concentrix service offering.
 *
 * Resolution order:
 *   1. Exact match: normalized input equals a known alias
 *   2. Substring match: normalized input contains a known alias (longest alias wins)
 *
 * Returns null if no alias matches — caller should treat unresolved inputs as
 * generic and not attempt to infer service category from the taxonomy.
 */
export function resolveService(input: string): ResolvedService | null {
  if (!input?.trim()) return null;

  const normalized = input.trim().toLowerCase();

  // Pass 1 — exact
  const exact = aliasLookup.get(normalized);
  if (exact) {
    return toResolved(exact, normalized, "exact");
  }

  // Pass 2 — substring (longest alias match wins)
  // Short aliases (≤ 4 chars) use word-boundary matching to prevent false matches
  // inside longer words — e.g. "ex" must not match inside "Concentrix".
  let bestRecord: AliasRecord | null = null;
  let bestAlias = "";

  for (const [alias, record] of aliasLookup) {
    const isMatch =
      alias.length <= 4
        ? new RegExp(`(?<![a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "i").test(normalized)
        : normalized.includes(alias);

    if (isMatch && alias.length > bestAlias.length) {
      bestAlias = alias;
      bestRecord = record;
    }
  }

  if (bestRecord) {
    return toResolved(bestRecord, bestAlias, "substring");
  }

  return null;
}

function toResolved(
  record: AliasRecord,
  matchedAlias: string,
  matchType: "exact" | "substring"
): ResolvedService {
  return {
    canonical_offering: record.canonical_offering,
    service_category: record.canonical_category,
    service_group: record.canonical_group,
    offering_id: record.offering_id,
    matched_alias: matchedAlias,
    match_type: matchType,
  };
}

/**
 * Convenience: returns just the canonical service_category string, or null.
 * Useful when you only need the category for catalog lookups.
 */
export function resolveServiceCategory(input: string): string | null {
  return resolveService(input)?.service_category ?? null;
}
