# CLAUDE.md

Development instructions for Claude Code working on the `marketing-mcp-newux` repo.

## What this repo is

A shared internal domain layer **and active runtime service** for Concentrix marketing platform tooling.

The repo has two roles:

1. **Domain packages** (`@mktg/core`, `@mktg/domain-google-ads`, `@mktg/adapter-beacon`) — libraries consumed by Beacon via local `file:` references. These are stable, typed domain truth.

2. **MCP office runtime** (`apps/mcp-office`) — a Next.js application that is both an admin inspector UI **and an active HTTP runtime API** that Beacon calls at campaign-generation time. It is not read-only. It serves live endpoints that influence Beacon's output, enforces the push allowlist, and maintains a learning store.

## Operating contract

**`AGENTS.md` is the operating contract for this repo.** It defines the PLAN / VALIDATE / EXECUTE / AUDIT modes, the five specialist agents, routing rules, governance-sensitive files, and seven safety rules. Read it before starting any non-trivial change. Key safety rules summarized below — full text in `AGENTS.md`:

1. Never weaken a guardrail to unblock a task.
2. Never modify the push allowlist without explicit user instruction.
3. Never mark a capability as `supported` before its connector is implemented and tested.
4. Never change a public exported type shape without running `validate-payload` (see Validation) first.
5. Never put Beacon-specific logic in `@mktg/core` or `@mktg/domain-google-ads`.
6. Never create a new workspace package without a PLAN session.
7. Log non-obvious decisions (see `docs/` below).

## Package structure

Root is an **npm workspace** (`package.json` declares `workspaces: ["domain-google-ads", "adapters/beacon"]`). A single `npm install` at the root hydrates all three packages; do not `cd` into subpackages to install.

```
@mktg/core                    (root package.json)
  src/                         Concentrix business context and shared primitives
    concentrix/                Service normalization, MCC knowledge, segments
    knowledge/
      supported-capabilities/  Capability registry (supported | partial | visible_only | unsupported)
      vendor-docs/             Google Developer Docs connector
  data/                        Raw catalogs (mcc-export, people-targeting, services)

@mktg/domain-google-ads       (domain-google-ads/)
  src/                         Google Ads domain truth: types, model, readiness,
                               audience-mapping, asset-limits, sitelink-catalog,
                               campaign-naming, concentrix-context

@mktg/adapter-beacon           (adapters/beacon/)
  src/                         Beacon-specific: brief-rules, push-control,
                               conversion, prompt-builders

apps/mcp-office                (Next.js MCP runtime + inspector UI)
  app/api/mcp/                 Live HTTP endpoints called by Beacon at runtime
  lib/mcp/                     Context assembly and contract types
  lib/learning/                Learning store (SQLite, promotion logic)
  lib/knowledge/               Corporate knowledge packs (New Realities, etc.)
  components/mcp/              Admin inspector UI components
```

## MCP Runtime API

`apps/mcp-office/app/api/mcp/` exposes six endpoints. All are Node.js runtime (`runtime = "nodejs"`).

| Endpoint | Called from Beacon | What it does |
|---|---|---|
| `POST /api/mcp/family-guidance` | `/api/recommend` | Family ranking with hard guardrails + learning bias from promoted patterns |
| `POST /api/mcp/context` | `/api/plan`, `/api/translate` | Corporate messaging, copy governance, recurring blocker warnings from learning store |
| `POST /api/mcp/post-validation` | `/api/translate` | Governance audit on assembled blueprint (violations → gaps, corrections → field overwrites) |
| `POST /api/mcp/push-clearance` | `/api/google-ads/push` | Account allowlist gate — only approved accounts may push |
| `POST /api/mcp/learning/event` | `/api/plan`, `/api/translate` | Ingest Beacon operational signal (family_override, service_correction, recurring_blocker) |
| `GET /api/mcp/health` | — | Liveness probe |

**Hard guardrails in `/api/mcp/family-guidance`:** Careers campaigns are always forced to Search regardless of AI recommendation (`was_guardrail_forced: true`). This is deterministic — it fires before ranking, not after.

**Push clearance:** `/api/mcp/push-clearance` checks `getPushAllowedAccount()` from `@mktg/adapter-beacon`. When an account is not on the allowlist, Beacon blocks the push entirely (503). This is the only Beacon→MCP touchpoint with a hardened (non-permissive) fallback policy.

**Post-validation scope** (`/api/mcp/post-validation`):
- `LEGACY_DOMAIN_UNGATED` — blocker: a governance gap was not applied
- `SERVICE_TAXONOMY_DRIFT` — advisory: AI used wrong canonical offering
- `CAREERS_FAMILY_MISMATCH` — advisory: careers page with non-Search family

This endpoint does NOT rewrite ad copy, re-run AI, validate creative assets, or override human-approved decisions.

## Learning Store

`apps/mcp-office/lib/learning/` — SQLite-backed operational memory at `data/learning.sqlite`.

**Schema (two tables):**

- `learning_events` — append-only raw signals from Beacon: `event_type`, `signal_key`, `context_json`, `occurred_at`
- `learning_patterns` — deduped patterns promoted from events: `status` (`candidate` | `promoted`), `occurrence_count`, `promotion_count`

**Three event types:**

| Event | When Beacon emits it | Pattern type promoted |
|---|---|---|
| `family_override` | User selects a different family than MCP recommended | `family_override_preference` (threshold: 3) |
| `service_correction` | AI normalized a service differently than MCP canonical | `service_normalization_candidate` (threshold: 2) |
| `recurring_blocker` | A hard gap fires on a blueprint | `recurring_blocker_pattern` (threshold: 3) |

**Promotion is threshold-based and advisory.** Patterns cross from `candidate` to `promoted` when `occurrence_count` reaches the threshold. Promoted patterns are read back into Beacon's workflow:
- `family_override_preference` → +8 strategic score bias in `/api/mcp/family-guidance`
- `recurring_blocker_pattern` → pre-emptive warning surfaces in `/api/mcp/context` response

Promotion never autonomously rewrites policy. It surfaces as advisory inputs Beacon can read and apply.

## Corporate Knowledge Packs

`apps/mcp-office/lib/knowledge/` contains structured knowledge packs surfaced in the MCP Office Knowledge section and wired into context assembly.

- `new-realities.ts` — New Realities corporate identity and governance: 6 items covering corporate identity, positioning rules, campaign stories, message pillars, audience strategy, and copy governance wiring. Displayed in the "Corporate knowledge" category in the MCP Office Knowledge detail view (`components/mcp/McpDetailView.tsx`).

These packs inform the `corporate_messaging` field in `/api/mcp/context` responses, giving the AI planner access to Concentrix positioning rules and copy constraints.

## Boundary rules

### What belongs in `@mktg/core`
- Concentrix business context (MCC knowledge, service taxonomy, segment library)
- Shared primitives any marketing tool would use
- Vendor documentation connectors (`src/knowledge/vendor-docs/`)
- Capability registries (`src/knowledge/supported-capabilities/`)

### What belongs in `@mktg/domain-google-ads`
- Google Ads campaign family definitions and models
- Domain types (`CampaignType`, `CampaignObjective`, `BiddingStrategy`, …)
- Readiness evaluation logic
- Audience mapping definitions
- Asset limits and text asset requirements
- Sitelink catalog
- UTM templates and operational context

### What belongs in `@mktg/adapter-beacon`
- Brief validation rules and clarification templates
- Push authorization allowlist
- Conversion focus event profiles
- Prompt builders that are Beacon-specific
- Anything shaped by Beacon's product workflow

### What belongs in `apps/mcp-office`
- MCP runtime API endpoints (`app/api/mcp/`)
- Context assembly logic (`lib/mcp/context-assembly.ts`)
- Learning store (`lib/learning/`)
- Corporate knowledge packs (`lib/knowledge/`)
- MCP contract types (`lib/mcp/contract.ts`) — these must stay in sync with Beacon's `types/mcp-contract.ts`
- Inspector UI components (`components/mcp/`)

### What does NOT belong in this repo
- Beacon UI code, API routes, session management
- Google Ads API integration (HTTP, OAuth, payload construction)
- Run persistence or workflow orchestration
- Anything requiring `next/server` from Beacon's own runtime

## Governance-sensitive files

Edits to these require extra care (full rules in `AGENTS.md` → Governance Reviewer):

- `adapters/beacon/src/push-control/allowlist.ts` — never modify without explicit user instruction
- `adapters/beacon/src/brief-rules/catalog.ts`
- `src/knowledge/supported-capabilities/google-ads.ts`
- `domain-google-ads/src/readiness.ts` — any change affecting push eligibility requires user confirmation
- Exported shapes in `src/index.ts`, `domain-google-ads/src/index.ts`, `adapters/beacon/src/index.ts`
- `apps/mcp-office/lib/mcp/contract.ts` — MCP API contract; changes must be mirrored in Beacon's `types/mcp-contract.ts`

## Dependency direction

```
@mktg/core ← @mktg/domain-google-ads ← @mktg/adapter-beacon ← Beacon
                                                              ↑
                                         apps/mcp-office (runtime API, reads all three)
```

Each package may only depend on packages to its left. Beacon imports from all three packages and calls the MCP office runtime API over HTTP. This repo has **no code dependency** on Beacon — the connection is HTTP only.

## Commands

```bash
npm run typecheck                    # Typecheck all packages (tsc --noEmit)

# Run the MCP office app
cd apps/mcp-office && npm run dev       # Webpack, stable
cd apps/mcp-office && npm run dev:turbo # Turbopack, faster HMR
```

MCP office runs on port 3001 by default. Beacon reads `MCP_API_URL=http://localhost:3001` in `.env.local`.

## Validation

There is no test runner in this repo. Validation is by coupling to Beacon's QA:

1. From sibling `../Beacon-newux/`, run `npm run qa:all`. Beacon's `qa:mcp-typecheck` script runs `npm run typecheck` here; the payload and runtime-consistency scripts exercise changed exports end-to-end.
2. For any changed exported symbol, grep `../Beacon-newux/` for imports to verify no consumer breakage.
3. For MCP contract changes (`lib/mcp/contract.ts`), verify `../Beacon-newux/types/mcp-contract.ts` is updated in sync. A type error in either direction fails Beacon's QA.

This is the `validate-payload` skill in `AGENTS.md`. If a check fails, fix the code — never weaken the check.

## Key constants to keep aligned

- `CAMPAIGN_FAMILY_STATUS` in `domain-google-ads/src/model.ts` — domain modeling readiness per family
- `PUSH_SUPPORTED_GOOGLE_ADS_FAMILIES` in Beacon's `lib/google-ads/support.ts` — actual push support

These are intentionally separate: this repo tracks whether a family is fully modeled; Beacon tracks whether it can push.

## When adding a new campaign family model

1. Add the type to `CampaignType` in `domain-google-ads/src/types.ts`
2. Add the family definition to `CAMPAIGN_FAMILY_DEFINITIONS` in `domain-google-ads/src/model.ts`
3. Set `CAMPAIGN_FAMILY_STATUS` (does the model cover the full domain shape?)
4. Add field model to `domain-google-ads/src/model.ts` if the family has unique fields
5. Add readiness evaluation in `domain-google-ads/src/readiness.ts`
6. Update Beacon to consume the new family (payload builder, support gate, help pages)

## Documentation

- `AGENTS.md` — operating modes, agents, safety rules (authoritative for process)
- `README.md` — product-level overview and current scope
- `docs/architecture/` — architectural decisions (append non-obvious choices via `log-decision` per `AGENTS.md`)
- `docs/domain/` — domain decisions per area

## Style

- TypeScript strict mode
- No default exports — named exports only
- No runtime side effects in module scope
- Each source file should have a JSDoc header explaining its purpose
- Constants `UPPER_SNAKE_CASE`, types `PascalCase`, functions `camelCase`
