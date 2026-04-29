# Beacon Campaign Type Matrix

> **Original Design Specification — not the runtime authority.**
>
> This document was written as a design reference for how Beacon should reason about campaign families, dependency domains, and draftability. The runtime implementation of campaign family behavior and readiness now lives in `@mktg/domain-google-ads`:
> - `domain-google-ads/src/model.ts` — campaign family definitions and status
> - `domain-google-ads/src/readiness.ts` — dependency evaluation and draftability logic
>
> If this document and the MCP implementation disagree, the MCP implementation is correct.
> This document is preserved as a readable cross-family comparison and design rationale reference.

## Purpose

This document is Beacon's canonical cross-campaign comparison table.

It answers:

- which campaign families Beacon should understand
- which objectives fit each family best
- which dependency domains matter most
- where Beacon can draft provisionally
- where Beacon should block
- where human clarification should be forced

## Current Business-Facing Scope

This matrix is canonical and intentionally broader than the current brief UI.

The current business-facing intake does not expose every family listed below.

Today the brief UI is focused on:

- Search
- Search local
- Display
- Responsive Display Ads
- Demand Gen
- Performance Max

Video is intentionally excluded from the current brief UI because the Google Ads API does not support creating or updating Video campaigns.
Shopping, App, and Performance Max store-goal scenarios remain part of Beacon's internal knowledge model, but they are not currently shown as selectable campaign families in the brief form.

## Campaign-Family Status

For current campaign-family status, see the runtime source of truth:
`@mktg/domain-google-ads` — `domain-google-ads/src/model.ts`

## Matrix

| Campaign family | Primary objectives | Destination type | Audience dependence | Feed dependence | Location dependence | Conversion dependence | Asset complexity | Safe to draft with partial information? | Force clarification early? | Typical blockers |
|---|---|---|---|---|---|---|---|---|---|---|
| Search | Leads, Candidate acquisition, Sales, Traffic, Local intent | URL | Medium | No | Optional for local | High for performance use | Low to Medium | Sometimes | Yes | no usable URL, weak conversion definition, no keywordable offer |
| Performance Max | Sales, Leads, Retail, Store goals | URL, feed, or location-linked | Medium | Optional to High | Optional to High | High | High | Rarely | Yes | missing conversion logic, missing feed or location dependency, missing asset minimums |
| Display | Awareness, Consideration, Traffic, Remarketing | URL | High | Optional | No | Medium for DR use | Medium to High | Weakly | Yes | no image coverage, no audience strategy, no URL |
| Responsive Display Ads | Awareness, Consideration, Traffic, Remarketing | URL | High | Optional | No | Medium for DR use | Medium to High | Weakly | Yes | missing required image ratios, missing text minimums, missing business identity |
| Video | Awareness, Consideration, some performance use | URL or video destination path | High | No | No | Medium to High | High | No | Yes | no video asset, unclear subtype, missing conversion path for action use |
| Demand Gen | Traffic, Leads, Sales, Consideration | URL | High | Optional | No | High for performance use | High | Weakly | Yes | missing visual assets, missing audience structure, missing URL |
| Shopping | Sales | Feed and product URLs | Low to Medium | Yes | Optional for local inventory later | High | Medium | No | Yes | no Merchant Center link, no usable feed, poor product-data readiness |
| App | App installs, App engagement | App store destination | Medium | No | No | High | Medium to High | No | Yes | no app identity, no app destination, no app measurement path |
| Search local | Local actions, store intent | URL, location, or local asset path | Medium | No | High | High | Medium | No | Yes | no local structure, no local action logic, geography too broad |
| PMax store goals | Store visits, local actions, store sales | URL and/or location source | Medium | No | High | High | High | No | Yes | no Business Profile or affiliate locations, no local measurement, missing location source |

## Family-by-Family Interpretation

### Search

Beacon may draft provisionally when:

- destination is strong
- objective is strong
- keyword themes can be inferred credibly

Search is also the default fit for Beacon's current recruitment objective:

- `attract_candidates`

Beacon should still warn when:

- conversion tracking is not confirmed
- language is under-specified
- ad group structure is too generic

### Performance Max

Beacon should be stricter than Search because PMax combines:

- conversion dependence
- asset-group dependence
- automation control choices
- optional feed or location dependencies

Beacon should rarely mark PMax as strong if the brief is thin.

### Display and Responsive Display Ads

Beacon should treat image readiness, logo readiness, and audience structure as major gating domains.
If those are weak, Beacon may still produce a planning object, but it should not act as if the campaign is execution-ready.

### Video

Beacon should treat "video" as incomplete unless the subtype is clear enough to support:

- correct bidding logic
- correct asset expectations
- correct destination and CTA expectations

### Demand Gen

Demand Gen should be modeled as more audience-dependent and more visual-asset-dependent than Search.
If Beacon lacks audience structure or required image/logo coverage, it should force clarification quickly.

### Shopping

Shopping should be treated as feed-dependent first and ad-copy-dependent second.
Feed readiness is the gating logic.

### App

App should be treated as destination- and measurement-dependent.
App identity is not optional.

### Local and store-goal families

Location infrastructure should be treated as a first-class dependency.
No amount of generic creative quality compensates for missing:

- Business Profile linkage
- affiliate location readiness
- local conversion logic
- local market structure

## Cross-Campaign Clarification Priority

Beacon should not ask all clarification questions with the same urgency.

### Highest priority

- Performance Max
- Shopping
- App
- PMax store goals
- Demand Gen when audience or visual assets are weak

### Medium priority

- Display
- Video

### Lower priority but still important

- Search when the brief already has strong destination and objective signals

## Cross-Campaign Draftability Levels

Beacon should adopt these internal draftability levels:

- `cannot_draft`
- `can_draft_with_placeholders`
- `can_draft_but_not_push`
- `can_prepare_push_ready_draft`

These levels should exist alongside general blueprint status.

### Interpretation

`cannot_draft`
- core family dependencies are missing

`can_draft_with_placeholders`
- Beacon can create a planning object but key campaign-family fields are still inferred or absent

`can_draft_but_not_push`
- campaign-family structure is usable, but measurement, assets, or linkage dependencies remain unresolved

`can_prepare_push_ready_draft`
- family-specific requirements are strong enough for controlled downstream activation planning

## Matrix Use in Beacon

Beacon should use this matrix to drive:

- campaign-type recommendation
- campaign-type validation
- conditional field display
- clarification prioritization
- blueprint readiness logic
- future AI reasoning boundaries

This document is not the field model itself.
For actual fields and conditions, use:

- [field-model-v2.md](/Users/aarroyo/Projects/ONGOING/co-workers/Beacon/docs/field-model-v2.md)
