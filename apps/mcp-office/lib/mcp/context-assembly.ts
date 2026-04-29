/**
 * Assembles an MCPContextBundle from brief fields using @mktg/* packages.
 *
 * All logic here is deterministic — no AI calls, no external I/O.
 * The result is a structured snapshot of what MCP knows about a given brief
 * at request time, drawn from the live package state rather than build-time
 * embedded constants inside Beacon.
 */

import {
  resolveService,
  isLegacyCareerDomain,
  classifyCareerDomain,
} from "@mktg/core";
import { resolveAccountContext } from "@mktg/domain-google-ads";
import { getPushAllowedAccount } from "@mktg/adapter-beacon";
import type { MCPContextBundle, MCPContextRequest } from "./contract";
import { getCorporateMessagingGuidance } from "../knowledge/corporate-messaging";

export function assembleContext(input: MCPContextRequest): MCPContextBundle {
  // ── Service resolution ────────────────────────────────────────────────────
  const serviceResult = input.product_or_service?.trim()
    ? resolveService(input.product_or_service.trim())
    : null;

  // ── Account context ───────────────────────────────────────────────────────
  const accountRecord = input.account_id?.trim()
    ? resolveAccountContext(input.account_id.trim())
    : null;
  const pushAccount = input.account_id?.trim()
    ? getPushAllowedAccount(input.account_id.trim())
    : null;

  // ── Landing page classification ───────────────────────────────────────────
  const url = input.landing_page_url?.trim() ?? "";
  const isLegacy = url ? isLegacyCareerDomain(url) : false;
  const rawClassification = url ? classifyCareerDomain(url) : "unknown";
  const isCanonical = rawClassification === "canonical";
  const isAtsPattern = rawClassification === "country_ats" || rawClassification === "webhelp_ats";

  const domainStatus: MCPContextBundle["landing_page"]["domain_status"] = isLegacy
    ? "legacy_career"
    : isCanonical
    ? "canonical_career"
    : isAtsPattern
    ? "ats_pattern"
    : "unknown";

  // ── Campaign context inference ────────────────────────────────────────────
  // Prefer account knowledge, then fall back to objective signal.
  const accountContext = accountRecord?.context ?? null;
  const campaignContext: "careers" | "corporate" =
    accountContext === "careers"
      ? "careers"
      : input.campaign_objective === "attract_candidates"
      ? "careers"
      : "corporate";

  return {
    assembled_at: new Date().toISOString(),

    service: serviceResult
      ? {
          canonical_offering: serviceResult.canonical_offering,
          service_category: serviceResult.service_category,
          service_group: serviceResult.service_group,
          offering_id: serviceResult.offering_id,
          matched_alias: serviceResult.matched_alias,
          match_confidence: serviceResult.match_type === "exact" ? "confirmed" : "fuzzy",
        }
      : {
          canonical_offering: null,
          service_category: null,
          service_group: null,
          offering_id: null,
          matched_alias: null,
          match_confidence: "none",
        },

    account: {
      account_id: input.account_id ?? null,
      name: accountRecord?.name ?? null,
      context: accountContext,
      primary_region: accountRecord?.primary_region ?? null,
      push_eligible: pushAccount !== null,
      push_eligible_reason: pushAccount?.reason ?? null,
    },

    landing_page: {
      is_legacy_domain: isLegacy,
      is_canonical_career_domain: isCanonical,
      domain_status: domainStatus,
    },

    campaign_context: campaignContext,

    corporate_messaging: getCorporateMessagingGuidance(campaignContext),

    // Populated by the context route from the learning store — not assembled here
    // because recurring_blocker_warnings require a SQLite read that belongs in the
    // endpoint, not in the pure assembly function.
    recurring_blocker_warnings: [],
  };
}
