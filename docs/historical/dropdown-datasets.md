# Beacon Dropdown and Dataset Strategy

> **Historical design document — not current authority.**
>
> This doc describes where dropdown enums and large datasets *should* live. Enums now live in `@mktg/domain-google-ads/src/types.ts`; large datasets live in `data/` and `@mktg/*` packages. Preserved for rationale only.

## Purpose

This document defines how Beacon should manage dropdowns, selectors, and large option datasets.

The main rule is simple:

Beacon should hardcode only small, stable product enums.
Beacon should not hardcode large or frequently changing Google Ads datasets directly into application logic.

## Current Intake Scope

Beacon's canonical enum strategy is broader than the current business-facing brief form.

The current brief UI intentionally exposes only the currently relevant business options:

- campaign objectives:
  - `generate_leads`
  - `attract_candidates`
  - `increase_website_traffic`
  - `build_brand_awareness`
- campaign families:
  - `search`
  - `search_local`
  - `display`
  - `responsive_display`
  - `demand_gen`
  - `performance_max`

Video is intentionally not exposed in the brief because the Google Ads API does not support creating or updating Video campaigns.
Beacon still keeps some broader canonical enums for internal modeling and documentation. That should not be confused with what normal users currently see in the brief form.

## Dataset Categories

Beacon should divide selector data into three categories.

## Category 1: Small stable product enums

These may be defined directly in Beacon documentation and code.

Examples:

- campaign family
- campaign objective
- budget type
- bidding strategy superset
- match type strategy
- audience mode
- location source type
- conversion tracking status
- feed status status labels
- local goal type
- listing group strategy

These change infrequently and are Beacon-governed product concepts.

## Category 2: Medium curated internal option sets

These should live in a maintained Beacon dataset or config layer, not scattered through UI files.

Examples:

- internal audience segment library
- internal campaign templates
- approved UTM defaults
- internal business-identity states
- internal readiness states

These are Beacon-owned, but likely to evolve with usage.

## Category 3: Large external Google-aligned datasets

These should not be hardcoded directly in app code.
They should be loaded from a maintained external dataset source.

Examples:

- countries
- states and provinces
- cities
- metro areas
- Google Ads-supported language list
- CTA choices where exact Google parity matters
- feed-country support lists
- app store markets if later needed

## Canonical Small Enum Models

Beacon should define these directly as canonical internal enums.

## Campaign family

- `search`
- `performance_max`
- `display`
- `responsive_display`
- `video`
- `demand_gen`
- `shopping`
- `app`
- `search_local`
- `performance_max_store_goals`

## Campaign objective

Active product enum:

- `generate_leads`
- `attract_candidates`
- `increase_website_traffic`
- `build_brand_awareness`

Deferred legacy objective coverage:

- `drive_sales`
- `promote_app`
- `drive_store_visits`

## Budget type

- `daily`
- `total_campaign`

## Bidding strategy superset

- `manual_cpc`
- `maximize_clicks`
- `manual_cpv`
- `target_cpm`
- `maximize_conversions`
- `target_cpa`
- `maximize_conversion_value`
- `target_roas`

Beacon should filter these by campaign family and subtype.

## Match type strategy

- `exact_first`
- `phrase_and_exact`
- `broad_and_signals`
- `mixed`

## Audience mode

- `not_used`
- `signals_only`
- `targeting_required`
- `observation_only`
- `remarketing`
- `prospecting`
- `mixed`

## Conversion tracking status

- `confirmed_live`
- `planned_not_live`
- `unknown`
- `missing`

## Merchant Center link status

- `linked_confirmed`
- `not_linked`
- `unknown`

## Merchant Center feed status

- `approved`
- `limited_issues`
- `disapproved`
- `in_review`
- `missing`
- `unknown`

## Final URL control mode

- `strict`
- `flexible`
- `unknown`

## Local goal type

- `store_visit`
- `local_action`
- `store_sales`

## Listing group strategy

- `all_products`
- `brand_split`
- `category_split`
- `custom_label_split`
- `top_sellers_split`

## Campaign Subtype Models

Beacon should define these as canonical subtype enums.

## Search subtypes

- `standard_search`
- `brand_search`
- `non_brand_search`
- `local_search`

## Performance Max subtypes

- `standard`
- `retail_with_feed`
- `store_goals`

## Display subtypes

- `responsive_display`

## Video subtypes

- `video_reach`
- `video_views`
- `video_action`

## Demand Gen subtypes

- `standard`
- `with_product_feed`

## Shopping subtypes

- `standard_shopping`
- `shopping_feed_only`

## App subtypes

- `app_installs`
- `app_engagement`

## Local subtypes

- `search_local`
- `performance_max_store_goals`

## Geography Dataset Strategy

Beacon should not embed full global geo datasets directly in UI code.

### Recommended model

Keep a dedicated maintained dataset source for:

- country list
- state and province list
- city list
- metro area list

The dataset should support:

- stable IDs or codes
- country-to-state hierarchy
- include and exclude logic
- optional city and metro expansion later

### Recommendation

V1:

- load countries and states or provinces from a maintained local dataset file
- support include and exclude rows

V2:

- add cities, metros, radius metadata

## Language Dataset Strategy

Beacon should manage language options through a maintained external dataset aligned to Google Ads-supported languages.

Reason:

- language support is broad
- codes and naming need to stay consistent
- hardcoding a partial list into product logic creates hidden gaps

Recommended model:

- internal normalized language code
- user-facing language label
- optional Google Ads-specific language ID later

## CTA Dataset Strategy

CTA options are tricky because:

- they matter to several asset-driven families
- exact Google-supported values can vary by format and over time

Beacon should not rely on a loose hardcoded CTA list if strict parity matters.

### Recommended approach

V1:

- maintain a Beacon CTA compatibility dataset by campaign family
- include only known-approved values for the supported families

V2:

- align directly to an externally maintained Google Ads CTA dataset where available

## Audience Dataset Strategy

Beacon should separate:

- internal audience segment labels used for planning
- actual Google Ads audience targeting values used later in execution

Why:

- Beacon may use internal segment language earlier than execution mapping exists
- execution mapping can evolve separately

Recommended model:

- internal audience segment ID
- user-facing label
- optional mapping to Google Ads audience taxonomy later

## Asset Orientation Enums

These are stable enough to define directly:

- `square_1_1`
- `landscape_1_91_1`
- `portrait_4_5`
- `horizontal_16_9`
- `vertical_9_16`

## What Should Never Live Inline in UI Components

These should not be scattered directly inside React pages:

- country option lists
- state/province lists
- language lists
- CTA compatibility lists
- large internal audience catalogs

They should live in one maintainable dataset layer.

## Beacon Rule

If a selector is:

- small
- stable
- Beacon-defined

it may live as a code enum.

If it is:

- large
- hierarchical
- externally governed
- likely to change

it should live in a managed dataset, not inline code.
