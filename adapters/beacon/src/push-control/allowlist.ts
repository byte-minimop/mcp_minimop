/**
 * push-allowlist.ts
 *
 * Server-side allowlist for Beacon → Google Ads push operations.
 *
 * DESIGN INTENT
 * ─────────────
 * This allowlist reflects "approved active rollout accounts" — not every
 * account visible in the MCC. The MCC contains many inactive, legacy, and
 * defunct accounts that are not rollout candidates. An account must be
 * explicitly added here before Beacon can push to it. MCC membership alone
 * does not grant push eligibility.
 *
 * ROLLOUT PHASES
 * ──────────────
 *   Phase 1 (current) — controlled pilot, 2 EMEA careers accounts
 *   Phase 2           — remaining active EMEA careers accounts
 *   Phase 3           — NA careers + ANZ (Concentrix ANZ mixed)
 *   Phase 4           — Corporate accounts (requires budget governance sign-off)
 *   Never             — legacy, inactive, or defunct accounts
 *
 * TO ADD AN ACCOUNT
 * ─────────────────
 * 1. Confirm it is active and has live conversion tracking (or has an explicit
 *    exception agreed with the account owner).
 * 2. Add it to PUSH_ALLOWED_ACCOUNTS with a clear reason.
 * 3. Do NOT add legacy accounts (context: "legacy" in MCC_ACCOUNTS), accounts
 *    with high disapproval rates, or defunct brand accounts.
 */

export interface AllowedPushAccount {
  /** Google Ads customer ID (dash-formatted, matches MCC_ACCOUNTS) */
  id: string;
  /** Human-readable name — used in error messages and audit logs */
  name: string;
  /** Why this account is approved — required for review and accountability */
  reason: string;
}

/**
 * Authoritative list of accounts approved for Beacon push operations.
 *
 * Intentionally narrow. Accounts not on this list are rejected at the API
 * layer regardless of MCC visibility or session permissions.
 */
export const PUSH_ALLOWED_ACCOUNTS: readonly AllowedPushAccount[] = [
  // ── Phase 1: Controlled pilot ────────────────────────────────────────────
  // Two EMEA careers accounts selected for initial controlled testing.
  // Both are active, have established campaign structure, and are well understood.
  {
    id: "802-952-2037",
    name: "Concentrix Portugal (faturação Republica)",
    reason:
      "Pilot: most active careers account (19 live campaigns), R45_ naming convention, active PMax with conversion tracking",
  },
  {
    id: "702-064-4227",
    name: "Google_Ads_CNX",
    reason:
      "Pilot: active DACH careers account, GOO_ naming convention, well-defined campaign structure",
  },
] as const;

// Pre-computed stripped (digits-only) IDs for fast lookup.
// Google Ads API returns IDs without dashes; allowlist stores them with dashes.
const ALLOWED_STRIPPED = new Map<string, AllowedPushAccount>(
  PUSH_ALLOWED_ACCOUNTS.map((a) => [a.id.replace(/-/g, ""), a])
);

/**
 * Returns the AllowedPushAccount if the given customer ID is approved for
 * push, or null if it is not.
 *
 * Accepts both dash-formatted ("802-952-2037") and digits-only ("8029522037")
 * inputs — the Google Ads API normalizes to digits-only, so both forms work.
 */
export function getPushAllowedAccount(customerId: string): AllowedPushAccount | null {
  const stripped = customerId.replace(/-/g, "");
  return ALLOWED_STRIPPED.get(stripped) ?? null;
}
