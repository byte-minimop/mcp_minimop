# Beacon Readiness Model

> **Boundary note.** This document describes **domain-level dependency readiness** only. Beacon now runs a separate three-layer **runtime execution-truth model** (creative-asset / execution-support / launch-readiness, recomputed at validate/push time) that is authoritative for push eligibility. For that model, see Beacon's `lib/google-ads/launch-readiness.ts`, `runtime-launch-readiness.ts`, and `docs/blueprint-readiness.md`. Neither doc supersedes the other — they gate different stages.

## Scope

This document covers **campaign-family execution readiness** — the domain-level evaluation of whether a campaign's Google Ads dependencies are satisfied. The runtime implementation lives in [`@mktg/domain-google-ads` — `domain-google-ads/src/readiness.ts`](../../../domain-google-ads/src/readiness.ts).

This is distinct from **brief-level intake readiness** (the `ready` / `ready_with_gaps` / `blocked` blueprint status), which evaluates whether a brief is plannable based on validity, sufficiency, coherence, and downstream practicality. That is owned by Beacon and documented in `Beacon-newux/docs/blueprint-readiness.md`.

Both layers are needed. Brief readiness gates the planning step. Domain readiness gates the drafting step. Beacon's runtime three-layer execution-truth gates validate and push.

## Purpose

This document defines how Beacon interprets campaign readiness.

Beacon should not use one vague notion of "ready."
It should distinguish between:

- understanding the campaign
- drafting the campaign
- activating the campaign

## Campaign-Family Status Context

Readiness should always be interpreted through Beacon's current family-status map.

For current campaign-family status, see the runtime source of truth:
`@mktg/domain-google-ads` — `domain-google-ads/src/model.ts`

This means:

- activation readiness matters most for `active_publish_ready` families
- `active_review_only` families may still be interpreted and reviewed, but should not be presented as publish-ready
- `modeled_inactive` families may still appear in canonical readiness logic, but they are outside the current business-facing product flow

## Readiness Layers

Beacon should evaluate readiness in three layers.

## 1. Interpretation readiness

Question:

Does Beacon understand the campaign well enough to recommend a credible campaign family and planning direction?

Inputs considered:

- objective
- destination
- campaign family
- geography
- language
- audience signal quality

Failure here means Beacon should often be `blocked` at blueprint level.

## 2. Draft readiness

Question:

Does Beacon have enough campaign-family-specific information to prepare a structured draft?

Inputs considered:

- asset minimums
- bidding structure
- ad group or audience structure
- campaign-family configuration fields
- measurement definition

Failure here may still allow a planning object, but should often downgrade draftability.

## 3. Activation readiness

Question:

Would Beacon have enough dependency coverage to support a controlled Google Ads handoff or push-ready draft?

Inputs considered:

- live measurement status
- Business Profile or location readiness
- final asset coverage
- approval state
- campaign-family-specific blockers

Failure here should not be hidden behind a previewable draft.

## Blueprint Status vs Draftability

Beacon should keep blueprint status and draftability separate.

## Blueprint status

- `ready`
- `ready_with_gaps`
- `blocked`

## Draftability

- `cannot_draft`
- `can_draft_with_placeholders`
- `can_draft_but_not_push`
- `can_prepare_push_ready_draft`

These should answer different questions.

Example:

- a blueprint may be `ready_with_gaps`
- but the campaign may still be only `can_draft_with_placeholders`

## Dependency Domains

Beacon should evaluate readiness across six domains.

## 1. Destination readiness

Questions:

- is the destination valid?
- does it fit the objective?
- does it support the claimed campaign family?

Typical blockers:

- invalid URL
- missing app destination
- product destinations absent in feed

## 2. Measurement readiness

Questions:

- is the primary conversion defined?
- is the conversion type appropriate?
- is tracking status known?

Typical blockers:

- no conversion path for performance use
- app campaign with no app-event or install measurement
- local/store-goal campaign with no local measurement logic

## 3. Asset readiness

Questions:

- are minimum text assets present?
- are required image or logo formats present?
- is video present when the campaign family requires it?

Typical blockers:

- Search with no RSA minimums
- Demand Gen with no image and logo minimums
- Video family with no video asset

## 4. Audience readiness

Questions:

- is audience optional, required, or signal-only for this family?
- if required, is enough audience structure present?

Typical blockers:

- Demand Gen with no audience structure
- Display plan with no audience or placement logic

## 5. Linkage readiness

Questions:

- is Merchant Center linked?
- is Business Profile linked?
- is the app identity usable?

Typical blockers:

- Shopping without Merchant Center
- PMax store goals without location source
- App campaign without app identity

## 6. Geo-language readiness

Questions:

- is geography structured enough?
- is language explicit enough?
- does geo align with feed or local availability?

Typical blockers:

- store-goal campaign with country-only geography
- multilingual geography with no language guidance in a non-inferable case
- feed-country mismatch

## Family-Specific Readiness Interpretation

## Search

Search may be the most tolerant family for provisional drafting.

Beacon may allow:

- inferred keyword themes
- inferred negative-keyword starting points
- inferred conversion direction when destination is strong

Beacon should still block when:

- destination is invalid
- the offer is not search-addressable
- no credible conversion path exists for performance use

## Performance Max

Beacon should be less tolerant.

PMax combines:

- conversion dependence
- asset dependence
- automation controls
- optional feed or location dependencies

Beacon should rarely treat thin PMax briefs as strong.

## Display and Responsive Display Ads

Beacon should treat creative and audience readiness as central.

Without image and audience coverage, Beacon may still produce a planning output, but not a trustworthy build-ready draft.

## Video

Beacon should require real video readiness.

Subtype ambiguity should lower readiness sharply.

## Demand Gen

Beacon should require:

- required visual coverage
- audience structure
- CTA and URL readiness

Feed-backed Demand Gen adds Merchant Center dependency.

## Shopping

Beacon should treat feed readiness as the main gating factor.
Creative weakness matters, but missing feed readiness is the true blocker.

## App

Beacon should treat app identity and app measurement as non-negotiable.

## Local and store-goal campaigns

Beacon should treat location infrastructure as non-negotiable.

## Blockers, Warnings, and Inference Rules

Beacon should classify missing fields in three different ways.

## Hard blockers

Missing conditions that prevent a responsible family-level draft.

Examples:

- no Merchant Center for Shopping
- no app identity for App campaigns
- no video asset for Video campaigns
- no location source for store-goal PMax

## Soft warnings

Missing conditions that weaken campaign quality materially but do not always prevent a structured draft.

Examples:

- no videos for PMax
- no vertical assets for Demand Gen
- weak negatives for Search

## Inferable fields

Fields Beacon may derive provisionally when evidence is strong enough.

Examples:

- Search keyword themes from destination and product
- language in a narrow single-country single-language case
- provisional conversion focus from CTA and page structure

Beacon should never silently infer:

- live tracking status
- feed approval
- Business Profile linkage
- app measurement readiness

## Activation Boundary

A major Beacon rule should be:

Previewable does not mean activation-ready.

The ability to produce a campaign-shaped draft does not mean:

- all dependencies are satisfied
- all assets are approved
- all linkages are configured
- the campaign is safe to push

## Canonical Readiness Output Model

Beacon should eventually expose readiness like this:

```ts
{
  blueprint_status: "ready" | "ready_with_gaps" | "blocked",
  draftability: "cannot_draft" | "can_draft_with_placeholders" | "can_draft_but_not_push" | "can_prepare_push_ready_draft",
  readiness_domains: {
    destination: "strong" | "weak" | "blocked",
    measurement: "strong" | "weak" | "blocked",
    assets: "strong" | "weak" | "blocked",
    audiences: "strong" | "weak" | "blocked",
    linkage: "strong" | "weak" | "blocked",
    geo_language: "strong" | "weak" | "blocked"
  }
}
```

The readiness domain structure is implemented in `@mktg/domain-google-ads`. This output shape represents the canonical target for how that evaluation should be surfaced in the Beacon review layer.
