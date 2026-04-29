# Beacon Google Ads Requirements

> **Original Design Specification — not the runtime authority.**
>
> This document was written as the design specification for what Beacon should understand about Google Ads campaign families. The runtime implementation of this knowledge now lives in `@mktg/domain-google-ads`:
> - `domain-google-ads/src/model.ts` — campaign family definitions and status
> - `domain-google-ads/src/readiness.ts` — readiness evaluation logic
>
> If this document and the MCP implementation disagree, the MCP implementation is correct.
> This document is preserved for design rationale and historical context.

## Purpose

This document defines Beacon's canonical Google Ads knowledge model at the campaign-family level.

It is not a UI specification and not an implementation checklist by itself.
Its purpose is to give Beacon a complete internal understanding of:

- which Google Ads campaign families exist
- what each family is designed to do
- what each family requires
- what Beacon may infer
- what Beacon must never guess silently
- what should block drafting
- what should only trigger warnings

This document should be read together with (all historical):

- `./campaign-type-matrix.md`
- `./field-model.md`
- `./dropdown-datasets.md`
- `../domain/google-ads/readiness-model.md` — still current conceptual reference

## Scope

Beacon should model at least these major Google Ads campaign families:

- Search
- Performance Max
- Display
- Responsive Display Ads
- Video
- Demand Gen
- Shopping
- App
- Search local scenarios
- Performance Max store-goal scenarios

Beacon may later support more detailed internal subtypes, but these are the minimum canonical families the product should understand.

## Current Product Scope

Beacon's canonical Google Ads knowledge model is intentionally broader than the current user-facing intake.

The current brief UI is focused on the campaign families that match the current business scope:

- Search
- Search local
- Display
- Responsive Display Ads
- Demand Gen
- Performance Max

The current brief UI also exposes these objectives:

- Generate leads
- Attract candidates
- Increase website traffic
- Build brand awareness

Video is intentionally not exposed in the current brief UI because the Google Ads API does not support creating or updating Video campaigns programmatically.
Beacon still documents Shopping, App, and store-goal families here because they remain part of the broader knowledge model, even though they are not currently exposed as business-facing brief choices.

## Campaign-Family Status

Beacon should distinguish between the broader canonical model and the current product using this status map:

| Family | Status |
|---|---|
| Search | `active_publish_ready` |
| Search local | `active_publish_ready` |
| Display | `active_publish_ready` |
| Responsive Display Ads | `active_publish_ready` |
| Demand Gen | `active_publish_ready` |
| Performance Max | `active_publish_ready` |
| Video | `active_review_only` |
| Shopping | `modeled_inactive` |
| App | `modeled_inactive` |
| Performance Max store-goal scenarios | `modeled_inactive` |

Interpretation rule:

- `active_publish_ready` families define Beacon's normal product claims
- `active_review_only` families may remain in the knowledge model, but must not be described as publish-ready
- `modeled_inactive` families may stay in canonical docs as future or dormant model coverage, but must be clearly labeled as outside the current business-facing product

## Source of Truth

Beacon should rely on official Google Ads and Merchant Center documentation wherever possible.

Primary sources:

- [Google Ads specs: ad formats, sizes, and best practices](https://support.google.com/google-ads/answer/13676244?hl=en)
- [About campaign objectives in Google Ads](https://support.google.com/google-ads/answer/7450050?hl=en)
- [About campaign settings](https://support.google.com/google-ads/answer/9293325)
- [About Performance Max campaigns](https://support.google.com/google-ads/answer/10724817/about-performance-max-campaigns)
- [About text assets for Performance Max campaigns](https://support.google.com/google-ads/answer/14528373?hl=en)
- [Optimization tips for Performance Max campaigns with a Merchant Center feed](https://support.google.com/google-ads/answer/13776350)
- [Create a responsive display ad](https://support.google.com/google-ads/answer/7005917?hl=en)
- [About advanced format options for responsive display ads](https://support.google.com/google-ads/answer/9848687?hl=en)
- [Use a product feed to show products in Demand Gen campaigns](https://support.google.com/google-ads/answer/13721750?hl=en)
- [Shopping ad: Definition](https://support.google.com/google-ads/answer/186472?hl=en)
- [Link a Google Ads account to Merchant Center](https://support.google.com/google-ads/answer/12499498?hl=en-GB)
- [Product data specification](https://support.google.com/merchants/answer/7052112?hl=en)
- [Link attribute for Merchant Center product pages](https://support.google.com/merchants/answer/6324416)
- [Asset requirements for App campaigns for engagement](https://support.google.com/google-ads/answer/9234183?hl=en)
- [About local actions conversions](https://support.google.com/google-ads/answer/9013908)
- [About Performance Max for store goals](https://support.google.com/google-ads/answer/12971048?hl=en)

## Governing Principles

### 1. Campaign family is a requirement bundle, not a label

Beacon should not think "this is Search" and stop there.
It should think:

- what is Search for?
- what fields does Search need?
- what assets does Search need?
- what blockers apply to Search?
- what can be inferred for Search?

The same applies to every campaign family.

### 2. Beacon must distinguish interpretation from activation

Beacon's knowledge model should be more complete than the current UI or implementation.
That is acceptable and expected.

The field model can be complete even if:

- the UI only exposes part of it today
- the draft layer only uses part of it today
- live Google Ads push is not yet fully implemented

### 3. Google-allowed does not mean Beacon-ready

Google Ads sometimes allows a campaign to launch with weak coverage.
Beacon should not collapse:

- technically possible

into:

- ready for controlled internal use

### 4. Beacon must model dependency domains explicitly

Every campaign-family decision should consider:

- objective fit
- destination fit
- measurement readiness
- asset readiness
- audience readiness
- geography and language fit
- account or linkage readiness

## Canonical Campaign Families

## Search

### What it is

Intent-led text advertising on Google Search.

### Strongest fit

- leads
- candidate acquisition and recruitment demand
- sales
- website traffic with clear query intent
- local search demand when location logic exists

### Core requirement domains

- valid destination URL
- campaign objective
- keyword or query-intent structure
- language and geography
- bidding choice
- conversion definition for performance use
- minimum text-asset coverage

### Main blockers

- invalid final URL
- no credible conversion path for leads or sales
- no keywordable offer or search intent framing
- store-visit use case without local action logic

### Main warnings

- weak keyword themes
- missing negatives
- weak language fit
- objective and destination mismatch

### Safe inference rules

Beacon may infer:

- provisional keyword themes
- provisional Search fit for leads, sales, and some traffic
- provisional conversion direction if destination is clear

Beacon should not silently infer:

- production-ready keyword lists
- complete negative-keyword strategy
- live measurement status

### Recruitment note

Beacon's current recruitment objective, `attract_candidates`, should generally be treated as a Search-first planning problem unless stronger evidence suggests a different family.

## Performance Max

### What it is

Goal-based multi-channel campaign family using Google automation across inventory.

### Strongest fit

- sales
- leads
- retail growth
- store-goal scenarios with valid location dependencies

### Core requirement domains

- explicit conversion logic
- budget and bidding strategy
- geography and language
- asset-group readiness
- audience signals
- final URL controls
- Merchant Center dependency for retail
- Business Profile or location dependency for store goals

### Main blockers

- no conversion goal
- no valid URL for non-feed use
- missing minimum asset-group requirements for non-feed use
- missing Merchant Center linkage or feed for retail use
- missing location source for store-goal use

### Main warnings

- no audience signals
- no videos
- overreliance on auto-generated assets
- unsafe final URL expansion assumptions

### Safe inference rules

Beacon may infer:

- provisional audience-signal categories
- that PMax is a plausible fit for cross-channel performance use

Beacon should not silently infer:

- Merchant Center readiness
- Business Profile readiness
- safe final URL expansion

### Internal subtype rule

Beacon should treat these as separate operational modes:

- standard PMax
- retail PMax with feed
- store-goal PMax

## Display

### What it is

Audience-led visual advertising across Display inventory.

### Strongest fit

- awareness
- consideration
- audience-led traffic
- remarketing support

### Core requirement domains

- final URL
- visual creative readiness
- text asset readiness
- audience logic
- geo and language
- bidding aligned to objective

### Main blockers

- no required image coverage
- no final URL
- no text asset minimums
- no meaningful audience strategy

### Main warnings

- minimal image set only
- weak logo coverage
- no exclusions
- weak direct-response measurement

### Safe inference rules

Beacon may infer:

- broad audience categories
- Display as a plausible awareness family

Beacon should not silently infer:

- remarketing availability
- dynamic feed readiness

## Responsive Display Ads

### What it is

The main practical display ad format Beacon should assume by default inside Display campaigns.

### Why Beacon should model it separately

Responsive Display Ads have specific:

- headline limits
- long headline requirements
- image ratio requirements
- logo requirements
- business name rules

If Beacon does not model these separately, Display readiness becomes too vague.

## Video

### What it is

Video-led campaign family spanning awareness, views, and action-oriented variants.

### Strongest fit

- awareness
- consideration
- storytelling
- some performance cases when asset and measurement coverage are strong

### Core requirement domains

- video subtype
- real video asset availability
- destination or action path
- audience logic
- geo and language
- bidding aligned to subtype

### Main blockers

- no video asset reality
- no destination for action-led use
- no conversion path for performance-oriented video

### Main warnings

- one video only
- weak orientation coverage
- unclear subtype intent

### Safe inference rules

Beacon may infer:

- awareness or consideration as a default direction

Beacon should not silently infer:

- a specific video subtype
- video readiness when no video asset exists

## Demand Gen

### What it is

Visually led, audience-led campaign family across YouTube, Discover, and Gmail, with optional product-feed extension.

### Strongest fit

- consideration
- traffic
- leads
- sales
- visual prospecting and remarketing

### Core requirement domains

- final URL
- text assets
- image coverage
- logo coverage
- CTA
- audience structure
- geo and language
- conversion readiness for performance use
- Merchant Center dependency when feed-backed

### Main blockers

- no required visual or text coverage
- no valid URL
- no audience structure
- no Merchant Center/feed readiness when feed-backed

### Main warnings

- no video coverage
- weak image variety
- feed-backed use with too little product coverage

### Safe inference rules

Beacon may infer:

- Demand Gen as a better visual discovery family than classic Display in some cases

Beacon should not silently infer:

- ad-group audience definitions
- feed-backed readiness

## Shopping

### What it is

Product-feed-driven retail campaign family dependent on Merchant Center product data.

### Strongest fit

- ecommerce sales
- product-led retail demand capture
- feed-backed product discovery

### Core requirement domains

- Merchant Center linkage
- feed status
- website verification and claim status
- product link validity
- product data quality
- geo alignment between campaign and feed
- sales-oriented measurement

### Main blockers

- no Merchant Center linkage
- no usable feed
- no valid product destinations
- feed-country mismatch

### Main warnings

- weak title quality
- weak image quality
- stale availability or pricing
- unclear listing-group structure

### Safe inference rules

Beacon may infer:

- that Shopping is relevant for product-catalog retail

Beacon should not silently infer:

- approved feed health
- product policy compliance

## App

### What it is

App-promotion campaign family for app installs and app engagement.

### Strongest fit

- app installs
- app engagement
- app re-engagement

### Core requirement domains

- app store destination
- app platform
- app identifier
- install versus engagement goal
- app measurement readiness
- text asset minimums
- optional richer creative coverage

### Main blockers

- no app destination
- no app identifier
- no install or engagement measurement path

### Main warnings

- text-only setup
- no richer visual or video support
- install versus engagement goal unclear

### Safe inference rules

Beacon may infer:

- app family fit from app-store destination

Beacon should not silently infer:

- Firebase readiness
- app event setup

## Search local scenarios

### What it is

Search-led local campaign logic where location intent matters directly.

### Strongest fit

- local actions
- local intent
- location-qualified service demand

### Core requirement domains

- local geography detail
- local destination or location asset path
- local conversion definition
- search text assets

### Main blockers

- no location logic
- no local action path
- geography too broad for the stated local goal

## Performance Max store-goal scenarios

### What it is

Store-goal-focused PMax logic for store visits, local actions, or store sales.

### Strongest fit

- store visits
- local actions
- store sales

### Core requirement domains

- Business Profile or affiliate location readiness
- store location source
- local conversion family
- PMax asset readiness

### Main blockers

- no store location source
- no Business Profile or affiliate-location path
- no local measurement logic

## Dependency Domains Beacon Must Model Explicitly

Beacon's canonical knowledge model should cover these dependency domains for every campaign family:

### Objective domain

- what the campaign is trying to achieve
- whether the chosen family fits that goal

### Destination domain

- whether the URL, app, feed, or location destination is real
- whether it supports the objective

### Measurement domain

- whether conversion logic exists
- whether conversion tracking exists
- whether app, local, or retail measurement is appropriate

### Asset domain

- text assets
- image assets
- logo assets
- video assets
- count and size requirements

### Audience domain

- whether audience logic is optional, required, or signal-only

### Linkage domain

- Merchant Center
- Business Profile
- app store and app identity
- website verification

### Geo-language domain

- target geography structure
- language targeting
- geo-to-feed alignment
- geo-to-location alignment

## Relationship to Implementation

Beacon should now treat this document set as the complete internal knowledge model, even if the UI and runtime implementation still lag behind it.

That means:

- implementation may be staged
- activation may be staged
- UI may be staged

But the documentation should already define the target operating model clearly.

## What This Document Does Not Do

This document does not list every field in the product model in one place.
That lives in:

- [field-model-v2.md](/Users/aarroyo/Projects/ONGOING/co-workers/Beacon/docs/field-model-v2.md)

This document also does not serve as the final comparison table.
That lives in:

- [campaign-type-matrix.md](/Users/aarroyo/Projects/ONGOING/co-workers/Beacon/docs/campaign-type-matrix.md)

This document is the canonical campaign-family requirements overview.
