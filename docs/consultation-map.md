# MCP Consultation Map

Front door for AI consultation in `marketing-mcp-newux`. Routes a question to the right source.

## Ground rules

1. **Code and data in the packages are primary truth.** Docs are secondary rationale.
2. **`src/knowledge/supported-capabilities/google-ads.ts` always beats vendor docs.** Vendor docs describe what the platform *says* is possible; the capability registry describes what MCP actually supports.
3. **Beacon owns runtime orchestration, push, and the three-layer runtime execution-truth model.** MCP owns domain definitions, static catalogs, and domain-level readiness only. Don't answer Beacon-runtime questions from MCP.
4. Anything under `docs/historical/` is **historical design spec, not authority.** Quote only for rationale.
5. Anything in `apps/mcp-office/` is **human UI copy, not authority.**

---

## Routing table

### Google Ads support / capabilities ("Does MCP support X?")
- **Use when:** question is about current MCP support level for a Google Ads capability, feature, or execution path.
- **Primary:** `src/knowledge/supported-capabilities/google-ads.ts` (`getGoogleAdsSupportedCapabilities()` — returns `supported` / `partial` / `visible_only` / `unsupported` with notes).
- **Secondary:** `domain-google-ads/src/model.ts` for family-level status (`CAMPAIGN_FAMILY_STATUS`).
- **Avoid as primary:** `src/knowledge/vendor-docs/google/developer-docs.ts` (platform possibility ≠ MCP support); all `docs/domain/google-ads/*.md`.
- **Notes:** If the registry does not answer the question, that itself is the answer (capability is not modeled).

### Campaign families
- **Use when:** question is about which Google Ads families MCP models, their status, definitions, objectives, or safe-to-draft behavior.
- **Primary:** `domain-google-ads/src/model.ts` — `GOOGLE_ADS_CAMPAIGN_FAMILIES`, `CAMPAIGN_FAMILY_STATUS`, `ACTIVE_PUBLISH_READY_CAMPAIGN_FAMILIES`, `ACTIVE_REVIEW_ONLY_CAMPAIGN_FAMILIES`, `MODELED_INACTIVE_CAMPAIGN_FAMILIES`.
- **Secondary:** `domain-google-ads/src/types.ts` for `CampaignType`, `CampaignObjective` enums.
- **Avoid as primary:** `docs/historical/campaign-type-matrix.md`; `docs/historical/google-ads-requirements.md`.
- **Notes:** Video = `active_review_only` — modeled, no push path. Shopping/App = `modeled_inactive`.

### Readiness (domain-level)
- **Use when:** question is about dependency evaluation for a campaign family — does the brief satisfy what the family requires?
- **Primary:** `domain-google-ads/src/readiness.ts`.
- **Secondary:** `docs/domain/google-ads/readiness-model.md` for the conceptual framing (interpretation / draft / activation).
- **Avoid as primary:** anything claiming to describe "Beacon readiness." That's a different layer.
- **Notes:** **Beacon runs its own three-layer runtime execution-truth model** (`creative-asset / execution-support / launch-readiness` in Beacon's `lib/google-ads/`) that is authoritative for validate/push. Domain readiness here ≠ Beacon runtime readiness. For push eligibility, consult Beacon, not MCP.

### Asset limits & text asset requirements
- **Use when:** question is about character limits, asset counts, minimums/maximums per family.
- **Primary:** `domain-google-ads/src/asset-limits.ts`.
- **Secondary:** none.
- **Avoid as primary:** vendor docs (may not reflect what MCP enforces); `docs/historical/field-model.md`.
- **Notes:** `CALLOUT_TEXT_MAX = 25` is owned here; generation/validation live in Beacon.

### Sitelinks
- **Use when:** question is about the Concentrix sitelink catalog, selection, or prompt construction.
- **Primary:**
  - Catalog: `domain-google-ads/src/sitelink-catalog.ts` (100+ entries).
  - Prompt builder: `adapters/beacon/src/prompt-builders/sitelinks.ts` (`buildSitelinkCatalogPromptBlock`).
- **Secondary:** `domain-google-ads/src/concentrix-context.ts` for UTM/context rules.
- **Avoid as primary:** any narrative doc.

### Audience mapping & segments
- **Use when:** question is about audience segments, segment → execution guidance mapping, corporate vs. careers context.
- **Primary:**
  - Mapping: `domain-google-ads/src/audience-mapping.ts`.
  - Segment library: `src/concentrix/segment-library.ts` (Tier 1/2/3 buyer roles, careers segments).
- **Secondary:** `src/knowledge/supported-capabilities/google-ads.ts` → `audience-modeling` capability note.
- **Avoid as primary:** historical docs.
- **Notes:** Corporate has 17 governed segment mappings; careers has partial coverage — non-relocation careers segments fall through to strategy-only guidance. State this caveat when relevant.

### Brief rules / clarifications
- **Use when:** question is about which rules evaluate a brief and what clarification questions they produce.
- **Primary:**
  - Rules catalog: `adapters/beacon/src/brief-rules/catalog.ts` (Hard / Soft / Informational severities).
  - Clarification templates: `adapters/beacon/src/brief-rules/clarifications.ts`.
- **Secondary:** none.
- **Notes:** Governance-sensitive. Edits require PLAN mode per `AGENTS.md`.

### Push eligibility / push allowlist
- **Use when:** question is about which Concentrix accounts Beacon may push to.
- **Primary:** `adapters/beacon/src/push-control/allowlist.ts` (`PUSH_ALLOWED_ACCOUNTS`).
- **Secondary:** none.
- **Notes:** **Governance-sensitive — never modify without explicit user instruction** (`AGENTS.md` safety rule #2). Currently Phase 1 pilot: 2 accounts.

### Conversion focus events
- **Use when:** question is about Concentrix conversion event profiles (careers vs. corporate).
- **Primary:** `adapters/beacon/src/conversion/focus-events.ts` (`FOCUS_EVENT_PROFILES`, keyed `careers::*` / `corporate::*`).
- **Secondary:** `src/knowledge/supported-capabilities/google-ads.ts` for support level notes.

### Services / service normalization
- **Use when:** question is about what Concentrix services exist, alias resolution, or service taxonomy.
- **Primary:**
  - Normalizer: `src/concentrix/service-normalization.ts` (46 canonical services, alias resolver).
  - Data: `data/services/service_taxonomy.json` + `data/services/alias_mapping.json`.
- **Secondary:** `src/concentrix/service-suggestions.ts` for scored ranking given brief signals.

### People targeting
- **Use when:** question is about personas, industries, subsectors, people roles.
- **Primary:**
  - Reader: `src/concentrix/people-targeting.ts`.
  - Catalog: `data/people-targeting/catalog.json` (1,599 records).
- **Secondary:** `data/people-targeting/coverage.md` (readable index), `data/people-targeting/structure.md` (schema).
- **Notes:** Generated from the FY25 sector personas spreadsheet via `../Beacon-newux/scripts/import-people-targeting.py`.

### MCC / account context
- **Use when:** question is about the Concentrix MCC: accounts, campaign context, legacy patterns, known brands.
- **Primary:**
  - Code: `src/concentrix/mcc-knowledge.ts` — live readable truth (`MCC_ACCOUNTS`, career domains, bid strategy defaults).
  - Snapshot: `data/mcc-export/insights-2026-04-02.md` — dated snapshot (24 accounts, 698 campaigns, 40 active as of 2026-04-02).
- **Secondary:** `domain-google-ads/src/concentrix-context.ts` for UTM/bid defaults tied to the MCC.
- **Notes:** Treat the insights file as a point-in-time snapshot; do not cite its numbers as current state.

### Beacon ↔ MCP relationship
- **Use when:** question is about what MCP owns vs. what Beacon owns, or why the split exists.
- **Primary:** `README.md` (current scope tables) and `CLAUDE.md` (boundary rules).
- **Secondary:** `docs/architecture/composable-marketing-architecture.md` — **conceptual reference only.** Route names in its diagrams are stale; do not cite specific API paths from it.
- **Avoid as primary:** design-spec docs in `docs/historical/`.

### Working on MCP itself (development process)
- **Use when:** the task is to edit MCP code, add a capability, or change a governance-sensitive file.
- **Primary:** `AGENTS.md` — PLAN / VALIDATE / EXECUTE / AUDIT modes, agent roles, governance-sensitive file list, seven safety rules.
- **Secondary:** `CLAUDE.md` for repo layout and commands.
- **Notes:** `AGENTS.md` is the operational contract; it is **not** a knowledge-lookup source and should not be consulted to answer "what does MCP support for X?"

---

## Historical / non-primary (quote only for rationale)

These docs are preserved for design context. They carry banners. Do **not** use them as primary sources.

- `docs/historical/campaign-type-matrix.md`
- `docs/historical/field-model.md`
- `docs/historical/google-ads-requirements.md`
- `docs/historical/dropdown-datasets.md`
- `docs/domain/google-ads/readiness-model.md` *(still current conceptual reference; see the boundary note at the top)*
- `docs/architecture/composable-marketing-architecture.md` *(concept-level; see the diagram banner)*

## UI copy (never cite as MCP truth)

- `apps/mcp-office/lib/mcp/office-data.ts`, `architecture-data.ts`, `beacon-activity.ts` — display strings and layout data for the MCP Office inspector UI.

---

## External verification / vendor-change monitoring

### Google Developer Docs connector
- **File:** `src/knowledge/vendor-docs/google/developer-docs.ts` (`searchGoogleDeveloperDocs`).
- **Requires:** `GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY` env var at runtime.
- **Role:** Supporting external lookup. Useful for periodic capability review, checking whether Google Ads fields/constraints/supported behaviors have changed, and verifying existing MCP modeling against current platform reality.
- **Use when:**
  - Periodically auditing an existing capability for drift against current Google docs.
  - Implementing a new integration whose API shape isn't modeled in the codebase.
  - Checking whether new Google Ads fields, features, or constraints have appeared.
  - User explicitly asks for a live lookup.
- **Do not use as primary source for:** "what does MCP support today?" or "what does Beacon support today?" — those are answered by `supported-capabilities/google-ads.ts` and the code in `domain-google-ads/src/` / Beacon's runtime respectively.
- **Rule:** Subordinate to MCP/Beacon canonical support truth. Platform possibility ≠ MCP support. If vendor docs and MCP disagree about what is supported today, the answer is what MCP supports, not what Google documents.
