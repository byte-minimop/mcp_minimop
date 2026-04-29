# Beacon Field Model V2

> **Original Design Specification — not the runtime authority.**
>
> This document was written as the design specification for the Google Ads field model Beacon should eventually support. The runtime implementation of campaign-family types, enums, and readiness logic now lives in `@mktg/domain-google-ads`:
> - `domain-google-ads/src/types.ts` — canonical type definitions
> - `domain-google-ads/src/model.ts` — campaign family definitions and status
> - `domain-google-ads/src/readiness.ts` — field-level readiness evaluation
>
> If this document and the MCP implementation disagree, the MCP implementation is correct.
> This document is preserved for design rationale and historical context.

## Purpose

This document defines Beacon's canonical Google Ads field model.

It is intentionally broader than the current UI and broader than the current implementation.
Its job is to define the complete underlying requirements model Beacon should eventually support across all relevant Google Ads campaign families.

This is the canonical answer to:

- what fields Beacon should know about
- which fields are universal
- which fields are family-specific
- which fields are required, optional, or conditionally required
- which fields Beacon may infer
- which missing fields should block drafting
- which missing fields should only trigger warnings

## Current UI Scope

Beacon's canonical field model is broader than the current brief form.

As of the current implementation, the business-facing brief UI exposes:

- objectives:
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

Video is intentionally not exposed in the brief because the Google Ads API does not support campaign creation for that family.
The canonical model below still includes additional internal families such as Shopping, App, and store-goal variants because Beacon continues to model them at the system level even though they are not currently exposed in the brief UI.

## Campaign-Family Status

The field model should be read with the current family-status map in mind.

For current campaign-family status, see the runtime source of truth:
`@mktg/domain-google-ads` — `domain-google-ads/src/model.ts`

Rule:

- active families drive the current brief and live product flow
- review-only families may still have fields defined here for planning and review
- modeled inactive families may stay in the canonical field model, but should not be mistaken for current product support

## Field Type Vocabulary

Beacon should use the following field types:

- `text`
- `textarea`
- `number`
- `url`
- `boolean`
- `single_select`
- `multi_select`
- `date`
- `image_upload`
- `video_upload`
- `logo_upload`
- `structured_object`

## Requirement Vocabulary

Each field should be marked as one of:

- `required`
- `optional`
- `conditionally_required`

Each field should also specify:

- exact condition if conditional
- whether Beacon may infer it
- whether Beacon must block if missing
- whether Beacon should warn if missing

## Universal Base Field Set

These fields should exist in Beacon regardless of campaign family.

| field_name | field_label | field_type | requirement | condition | may infer | block if missing | warn if missing | practical purpose |
|---|---|---|---|---|---|---|---|---|
| `campaign_name` | Campaign name | text | optional | always | yes | no | yes | internal and downstream naming |
| `campaign_family` | Campaign type | single_select | required | always | no | yes | no | determines downstream field logic |
| `campaign_objective` | Campaign objective | single_select | required | always | no | yes | no | anchors recommendation and readiness logic |
| `campaign_subtype` | Campaign subtype | single_select | conditionally_required | when selected family has meaningful subtype logic | limited | yes | yes | handles family-specific variation |
| `brand_name` | Brand name | text | optional | always | no | no | yes | identifies the advertiser or brand |
| `business_name` | Business display name | text | conditionally_required | when ad-family asset specs require it | no | yes | yes | required for many asset-driven families |
| `business_identity_status` | Business identity status | single_select | optional | always | yes | no | yes | confidence in advertiser identity |
| `landing_page_url` | Final URL / landing page | url | conditionally_required | required for most non-app, non-feed-only flows | no | yes | yes | destination validity |
| `final_url_control_mode` | Final URL control mode | single_select | optional | always | yes | no | yes | helps Beacon reason about URL expansion safety |
| `primary_conversion_name` | Primary conversion | text | conditionally_required | required for performance-oriented use cases | yes | yes | yes | names the main conversion action |
| `primary_conversion_type` | Primary conversion type | single_select | conditionally_required | required for performance-oriented use cases | yes | yes | yes | standardizes measurement logic |
| `conversion_tracking_status` | Conversion tracking status | single_select | conditionally_required | required for push-ready performance use | no | yes | yes | separates planning from activation readiness |
| `budget_amount` | Budget amount | number | required | always | no | yes | no | required for campaign feasibility |
| `budget_type` | Budget type | single_select | required | always | no | yes | no | pacing interpretation |
| `budget_currency` | Budget currency | single_select | required | always | limited | yes | yes | budget interpretation and downstream formatting |
| `bidding_strategy` | Bidding strategy | single_select | conditionally_required | required for build-ready family setup | limited | yes | yes | required optimization direction |
| `target_cpa` | Target CPA | number | conditionally_required | when strategy is `target_cpa` | no | yes | no | required bid parameter |
| `target_roas` | Target ROAS | number | conditionally_required | when strategy is `target_roas` | no | yes | no | required bid parameter |
| `campaign_start_date` | Start date | date | optional | always | yes | no | yes | scheduling and pacing |
| `campaign_end_date` | End date | date | optional | always | no | no | yes | pacing and flight logic |
| `ad_schedule_enabled` | Ad schedule enabled | boolean | optional | always | yes | no | no | schedule control |
| `ad_schedule_rules` | Ad schedule rules | structured_object | conditionally_required | when scheduling is explicitly enabled | no | yes | no | explicit day/time serving windows |
| `geography_targets` | Geography targets | structured_object | required | always | limited | yes | no | structured geo targeting |
| `language_targets` | Language targets | multi_select | conditionally_required | required unless Beacon can safely infer narrow single-language case | limited | yes | yes | structured language targeting |
| `audience_mode` | Audience mode | single_select | conditionally_required | family dependent | limited | yes in audience-led families | yes | determines audience section behavior |
| `audience_segments` | Audience segments | multi_select | conditionally_required | when family requires or strongly depends on audience structure | limited | yes in Demand Gen/Display audience-led setups | yes | audience targeting or signal structure |
| `excluded_audiences` | Excluded audiences | multi_select | optional | always | no | no | yes | audience exclusion control |
| `utm_template` | UTM template | structured_object | optional | always | partial | no | yes | tracking consistency |
| `internal_notes` | Additional notes | textarea | optional | always | no | no | no | preserves contextual nuance |

## Geography Fields

Beacon should use a structured geography object, not a single free-text field.

### Canonical structure

```ts
geography_targets: Array<{
  include: boolean
  granularity: "country" | "state_province" | "city" | "metro_area" | "radius"
  country_code: string
  state_province_code?: string
  city_name?: string
  metro_area_code?: string
  radius_value?: number
  radius_unit?: "km" | "mi"
}>
```

### Geography fields

| field_name | field_label | field_type | requirement | may infer | block if missing | warn if missing | notes |
|---|---|---|---|---|---|---|---|
| `geography_targets` | Geography targets | structured_object | required | limited | yes | no | must support multiple included and excluded targets |
| `country_code` | Country | single_select | required in each geo row | no | yes | no | should use external maintained dataset |
| `state_province_code` | State / province | single_select | conditionally_required | no | yes in local/store scenarios where detail is required | yes | important for local and regional campaigns |
| `city_name` | City | single_select or text backed by dataset | optional in V1, more relevant in V2 | no | no | yes | later needed for city targeting |
| `metro_area_code` | Metro area | single_select | optional in V2 | no | no | yes | useful for local and regional planning |
| `include` | Include / exclude | boolean | required in each geo row | no | yes | no | support explicit exclusions |
| `granularity` | Geography granularity | single_select | required in each geo row | no | yes | no | required for validation |
| `radius_value` | Radius value | number | conditionally_required | no | yes if granularity is radius | no | V2 field |
| `radius_unit` | Radius unit | single_select | conditionally_required | no | yes if granularity is radius | no | values: `km`, `mi` |

## Language Fields

Beacon should use structured language targeting, backed by a maintained external language dataset.

| field_name | field_label | field_type | requirement | may infer | block if missing | warn if missing | notes |
|---|---|---|---|---|---|---|---|
| `language_targets` | Target languages | multi_select | conditionally_required | limited | yes in multilingual and non-English cases | yes | should support single or multi-select UX backed by array |
| `language_inference_mode` | Language inference mode | single_select | optional | yes | no | yes | values: `explicit`, `inferred_single_language`, `unknown` |

## Search-Specific Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `keyword_themes` | Keyword themes | structured_object | conditionally_required | required for build-ready Search | at least one theme | yes | yes for build-ready | yes | supports Search structure |
| `negative_keywords` | Negative keywords | structured_object | optional | always | text array | yes partially | no | yes | quality and control |
| `match_type_strategy` | Match type strategy | single_select | conditionally_required | required for build-ready Search | valid enum | limited | yes | yes | required execution logic |
| `search_partners_enabled` | Search partners enabled | boolean | optional | always | boolean | yes | no | yes | configuration detail |
| `rsa_headlines` | RSA headlines | structured_object | required | Search family | 1-15, max 30 chars each | yes provisionally | yes | yes | required text minimum |
| `rsa_descriptions` | RSA descriptions | structured_object | required | Search family | 1-4, max 90 chars each | yes provisionally | yes | yes | required text minimum |
| `display_path_1` | Display path 1 | text | optional | always | max 15 chars | yes | no | yes | URL path shaping |
| `display_path_2` | Display path 2 | text | optional | always | max 15 chars | yes | no | yes | URL path shaping |
| `search_logo_square` | Square logo | logo_upload | conditionally_required | when business assets are in scope | 1:1, min 128x128 | no | yes if required | yes | business identity asset |

## Performance Max-Specific Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `pmax_subtype` | PMax subtype | single_select | required | Performance Max family | valid enum | no | yes | no | distinguishes standard, retail, store goals |
| `pmax_headlines` | Headlines | structured_object | conditionally_required | non-feed or full-asset PMax | 3-15, max 30 chars | yes provisionally | yes | yes | asset-group minimum |
| `pmax_short_headline_present` | Short headline present | boolean | conditionally_required | when PMax headlines provided | at least one <=15 chars | no | yes | no | Google asset requirement |
| `pmax_long_headlines` | Long headlines | structured_object | conditionally_required | non-feed or full-asset PMax | 1-5, max 90 chars | yes provisionally | yes | yes | asset-group minimum |
| `pmax_descriptions` | Descriptions | structured_object | conditionally_required | non-feed or full-asset PMax | 2-5, max 90 chars | yes provisionally | yes | yes | asset-group minimum |
| `pmax_business_name` | Business name | text | conditionally_required | PMax family | max 25 chars | no | yes | yes | required asset field |
| `pmax_cta_choice` | CTA | single_select | conditionally_required | when CTA selection is exposed | valid family CTA dataset | limited | yes if required | yes | asset-group field |
| `pmax_horizontal_images` | Horizontal images | image_upload | conditionally_required | non-feed or full-asset PMax | min 1, 1.91:1, min 600x314 | no | yes | yes | required image coverage |
| `pmax_square_images` | Square images | image_upload | conditionally_required | non-feed or full-asset PMax | min 1, 1:1, min 300x300 | no | yes | yes | required image coverage |
| `pmax_vertical_images` | Vertical images | image_upload | optional | always | 4:5 | no | no | yes | recommended variety |
| `pmax_square_logos` | Square logos | logo_upload | conditionally_required | non-feed or full-asset PMax | min 1, 1:1, min 128x128 | no | yes | yes | required logo coverage |
| `pmax_horizontal_logos` | Horizontal logos | logo_upload | optional | always | 4:1 | no | no | yes | recommended logo variety |
| `pmax_videos` | Videos | video_upload | optional | always | valid upload/reference | no | no | yes | optional technically, important practically |
| `final_url_expansion_enabled` | Final URL expansion | boolean | optional | always | boolean | yes | no | yes | automation control |
| `url_exclusions` | URL exclusions | structured_object | optional | always | URL list or rule set | no | no | yes | control for automation |
| `search_themes` | Search themes | structured_object | optional | always | text array | yes | no | yes | additional Search signal support |
| `customer_acquisition_goal` | Customer acquisition goal | single_select | optional | always | valid enum | no | no | yes | optional optimization mode |

## Display / Responsive Display Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `rda_short_headlines` | Short headlines | structured_object | required | Responsive Display | 1-5, max 30 chars | yes provisionally | yes | yes | required text minimum |
| `rda_long_headline` | Long headline | text | required | Responsive Display | max 90 chars | yes provisionally | yes | yes | required text minimum |
| `rda_descriptions` | Descriptions | structured_object | required | Responsive Display | 1-5, max 90 chars | yes provisionally | yes | yes | required text minimum |
| `rda_business_name` | Business name | text | required | Responsive Display | max 25 chars | no | yes | yes | required identity field |
| `rda_cta_choice` | CTA | single_select | conditionally_required | when CTA is explicitly selected | valid CTA enum | limited | yes if required | yes | creative field |
| `rda_landscape_images` | Landscape images | image_upload | required | Responsive Display | min 1, 1.91:1, min 600x314 | no | yes | yes | required image coverage |
| `rda_square_images` | Square images | image_upload | required | Responsive Display | min 1, 1:1, min 300x300 | no | yes | yes | required image coverage |
| `rda_square_logos` | Square logos | logo_upload | conditionally_required | recommended and often operationally required | 1:1, min 128x128 | no | yes if org requires | yes | brand identity |
| `rda_landscape_logos` | Landscape logos | logo_upload | optional | always | 4:1 | no | no | yes | additional asset coverage |
| `rda_videos` | Videos | video_upload | optional | always | valid video reference | no | no | yes | optional enrichment |
| `optimized_targeting_enabled` | Optimized targeting | boolean | optional | always | boolean | yes | no | yes | audience automation control |
| `placement_targets` | Placement targets | structured_object | optional | always | placement list | no | no | yes | explicit placement control |
| `placement_exclusions` | Placement exclusions | structured_object | optional | always | placement list | no | no | yes | exclusion control |
| `content_suitability_mode` | Content suitability | single_select | optional | always | enum | yes | no | yes | brand safety |

## Video Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `video_subtype` | Video subtype | single_select | required | Video family | valid enum | no | yes | no | determines setup path |
| `video_assets` | Video assets | video_upload | required | Video family | min 1 | no | yes | no | core creative requirement |
| `video_orientation_coverage` | Orientation coverage | multi_select | optional | always | valid enum values | no | no | yes | placement flexibility |
| `video_duration_seconds` | Video duration | number | conditionally_required | if metadata not embedded | positive number | no | yes if subtype depends on duration validation | yes | subtype fit |
| `video_headline` | Headline | text | conditionally_required | subtype dependent | family-specific max length | yes provisionally | yes if subtype requires | yes | supporting text |
| `video_long_headline` | Long headline | text | conditionally_required | subtype dependent | max length by subtype | yes provisionally | yes if required | yes | supporting text |
| `video_description` | Description | text | conditionally_required | subtype dependent | max length by subtype | yes provisionally | yes if required | yes | supporting text |
| `video_cta_choice` | CTA | single_select | conditionally_required | action-led video | valid CTA enum | limited | yes | yes | action direction |
| `inventory_type` | Inventory type | single_select | optional | always | enum | yes | no | yes | serving context |
| `network_placements` | Network placements | multi_select | optional | always | valid placement enum | yes | no | yes | inventory control |
| `frequency_cap` | Frequency cap | structured_object | optional | always | positive numbers | no | no | yes | reach and repetition control |

## Demand Gen Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `demand_gen_subtype` | Demand Gen subtype | single_select | required | Demand Gen family | `standard` or `with_product_feed` | no | yes | no | determines dependency path |
| `demand_gen_headlines` | Headlines | structured_object | required | Demand Gen family | 1-5, max 40 chars | yes provisionally | yes | yes | text minimum |
| `demand_gen_descriptions` | Descriptions | structured_object | required | Demand Gen family | 1-5, max 90 chars | yes provisionally | yes | yes | text minimum |
| `demand_gen_business_name` | Business name | text | required | Demand Gen family | max 25 chars | no | yes | yes | identity requirement |
| `demand_gen_cta_choice` | CTA | single_select | required | Demand Gen family | valid CTA enum | limited | yes | yes | action direction |
| `demand_gen_horizontal_images` | Horizontal images | image_upload | required | Demand Gen family | min 1, 1.91:1 | no | yes | yes | required image coverage |
| `demand_gen_square_images` | Square images | image_upload | required | Demand Gen family | min 1, 1:1 | no | yes | yes | required image coverage |
| `demand_gen_square_logos` | Square logos | logo_upload | required | Demand Gen family | min 1, 1:1, min 144x144 | no | yes | yes | required logo coverage |
| `demand_gen_vertical_images` | Vertical images | image_upload | optional | always | 4:5 | no | no | yes | recommended variety |
| `demand_gen_horizontal_videos` | Horizontal videos | video_upload | optional | always | valid video reference | no | no | yes | optional enrichment |
| `demand_gen_vertical_videos` | Vertical videos | video_upload | optional | always | valid video reference | no | no | yes | optional enrichment |
| `demand_gen_square_videos` | Square videos | video_upload | optional | always | valid video reference | no | no | yes | optional enrichment |
| `optimized_targeting_enabled` | Optimized targeting | boolean | optional | always | boolean | yes | no | yes | audience automation |
| `ad_group_audience_structure` | Ad group audience structure | structured_object | conditionally_required | when Beacon supports multi-group Demand Gen | structured list | no | yes in detailed build-ready mode | yes | preserves audience logic |

## Shopping Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `shopping_subtype` | Shopping subtype | single_select | required | Shopping family | valid enum | no | yes | no | distinguishes flow |
| `merchant_center_link_status` | Merchant Center link status | single_select | required | Shopping and feed-backed families | valid enum | no | yes | yes | core dependency |
| `merchant_center_feed_status` | Feed status | single_select | required | Shopping and feed-backed families | valid enum | no | yes | yes | core dependency |
| `website_verified_claimed` | Website verified and claimed | boolean | conditionally_required | Merchant Center-dependent cases | boolean | no | yes | yes | account readiness |
| `product_count_available` | Product count available | number | conditionally_required | feed-backed families | non-negative | no | yes | yes | practical feed coverage |
| `product_disapproval_status` | Product disapproval status | single_select | optional | always | enum | no | no | yes | feed health |
| `feed_country_coverage` | Feed country coverage | structured_object | required | Shopping and feed-backed families | country dataset values | no | yes | yes | geo alignment |
| `product_link_validity_status` | Product link validity | single_select | optional | always | enum | no | no | yes | destination quality |
| `product_title_quality_status` | Product title quality | single_select | optional | always | enum | no | no | yes | feed quality |
| `product_image_quality_status` | Product image quality | single_select | optional | always | enum | no | no | yes | feed quality |
| `price_and_availability_sync_status` | Price and availability sync | single_select | optional | always | enum | no | no | yes | feed freshness |
| `listing_group_strategy` | Listing group strategy | single_select | conditionally_required | Shopping family | valid enum | no | yes in build-ready mode | yes | product grouping control |
| `inventory_filter_notes` | Inventory filter notes | textarea | optional | always | text | no | no | yes | grouping nuance |
| `local_inventory_enabled` | Local inventory enabled | boolean | optional | always | boolean | no | no | yes | local retail extension |

## App Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `app_subtype` | App subtype | single_select | required | App family | `app_installs`, `app_engagement` | no | yes | no | determines setup |
| `app_platform` | App platform | single_select | required | App family | `android`, `ios` | no | yes | no | destination and measurement |
| `app_store_url` | App store URL | url | required | App family | valid store URL | no | yes | no | app destination |
| `app_id_or_package_name` | App ID / package name | text | required | App family | non-empty | no | yes | no | app identity |
| `app_headlines` | App headlines | structured_object | required | App family | 1-5, max 30 chars | yes provisionally | yes | yes | text minimum |
| `app_descriptions` | App descriptions | structured_object | required | App family | 1-5, max 90 chars | yes provisionally | yes | yes | text minimum |
| `app_images_horizontal` | Horizontal images | image_upload | optional | always | 1.91:1 | no | no | yes | optional enrichment |
| `app_images_vertical` | Vertical images | image_upload | optional | always | 4:5 | no | no | yes | optional enrichment |
| `app_images_square` | Square images | image_upload | optional | always | 1:1 | no | no | yes | optional enrichment |
| `app_videos` | App videos | video_upload | optional | always | valid video reference | no | no | yes | optional enrichment |
| `app_measurement_partner` | App measurement partner | single_select | optional | always | managed enum | no | no | yes | app measurement context |
| `firebase_link_status` | Firebase link status | single_select | optional | always | enum | no | no | yes | app measurement readiness |
| `ga4_app_stream_status` | GA4 app stream status | single_select | optional | always | enum | no | no | yes | app measurement readiness |
| `in_app_event_name` | In-app event name | text | conditionally_required | app engagement flows | non-empty | no | yes | yes | engagement optimization |
| `deep_link_enabled` | Deep linking enabled | boolean | optional | always | boolean | no | no | yes | app destination quality |

## Local and Store-Goal Fields

| field_name | field_label | field_type | requirement | condition | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|---|
| `location_source_type` | Location source type | single_select | conditionally_required | local/store-goal families | valid enum | no | yes | no | location dependency |
| `business_profile_link_status` | Business Profile link status | single_select | conditionally_required | store-goal PMax and local flows where BP is used | valid enum | no | yes | yes | key dependency |
| `store_locations_defined` | Store locations defined | boolean | conditionally_required | local/store-goal families | boolean | no | yes | no | hard local dependency |
| `affiliate_location_mode` | Affiliate location mode | boolean | optional | always | boolean | no | no | yes | store-goal nuance |
| `local_goal_type` | Local goal type | single_select | conditionally_required | local/store-goal families | valid enum | no | yes | yes | measurement and bidding logic |
| `location_granularity` | Location granularity | single_select | conditionally_required | local/store-goal families | valid enum | no | yes | yes | targeting detail |
| `radius_targets` | Radius targets | structured_object | conditionally_required | when local targeting uses radius | valid radius rows | no | yes | no | V2 local targeting |
| `store_set_name` | Store set name | text | optional | always | text | no | no | yes | operational grouping |

## Account and Linkage Readiness Fields

These are shared dependency fields that should be available when relevant.

| field_name | field_label | field_type | requirement | condition | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|
| `merchant_center_link_status` | Merchant Center link status | single_select | conditionally_required | feed-backed and Shopping families | no | yes | yes | feed dependency |
| `merchant_center_feed_status` | Merchant Center feed status | single_select | conditionally_required | feed-backed and Shopping families | no | yes | yes | feed dependency |
| `business_profile_link_status` | Business Profile link status | conditionally_required | local/store-goal families | no | yes | yes | location dependency |
| `website_verified_claimed` | Website verified and claimed | boolean | conditionally_required | Merchant Center-dependent families | no | yes | yes | account readiness |
| `shopping_ads_enabled` | Shopping ads enabled | boolean | conditionally_required | Demand Gen with product feed and Shopping-linked flows | no | yes | yes | feed-backed campaign requirement |

## UTM Field Model

```ts
utm_template: {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}
```

| field_name | field_label | field_type | requirement | validation | may infer | block if missing | warn if missing | why |
|---|---|---|---|---|---|---|---|---|
| `utm_template` | UTM template | structured_object | optional | strings should remain bounded and URL-safe | partial | no | yes | traffic and attribution consistency |
| `utm_source` | utm_source | text | optional | bounded text | yes | no | yes | source tracking |
| `utm_medium` | utm_medium | text | optional | bounded text | yes | no | yes | medium tracking |
| `utm_campaign` | utm_campaign | text | optional | bounded text | yes | no | yes | campaign tracking |
| `utm_content` | utm_content | text | optional | bounded text | yes | no | yes | creative/ad group variation tracking |
| `utm_term` | utm_term | text | optional | bounded text | yes | no | yes | keyword or term tracking |

## Field-Model Rules

### Rule 1

Beacon should support a complete field model even if the current UI only surfaces a staged subset.

### Rule 2

Large volatile dropdown datasets should not be hardcoded inline in application code.
They should be managed via an external maintained dataset strategy.

### Rule 3

Family-specific fields should not be shown or required when irrelevant.

### Rule 4

Beacon should distinguish:

- field missing but inferable
- field missing and warning-level
- field missing and draft-blocking
- field missing and activation-blocking

### Rule 5

The field model should drive:

- dynamic form logic later
- clarification logic later
- readiness logic later
- AI reasoning later

This document defines the canonical field foundation Beacon should grow into.
