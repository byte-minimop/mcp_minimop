/**
 * @mktg/core
 *
 * Shared marketing intelligence core.
 * Concentrix business context and shared marketing primitives.
 * Consumed by domain packages, coworker adapters, and product applications.
 *
 * Google Ads domain intelligence has moved to @mktg/domain-google-ads.
 */

// Shared primitive types
export type { Option } from "./types";
export type { VendorDocSnippet, VendorDocSearchResult } from "./knowledge/vendor-docs/types";
export type {
  SupportLevel,
  SupportedCapability,
  SupportedCapabilityRegistry,
} from "./knowledge/supported-capabilities/types";

// Concentrix intelligence
export * from "./concentrix/segment-library";
export * from "./concentrix/mcc-knowledge";
export * from "./concentrix/service-normalization";
export * from "./concentrix/service-suggestions";
export * from "./concentrix/people-targeting";

// Vendor documentation connectors
export * from "./knowledge/vendor-docs/google/developer-docs";

// MCP-supported capability registries
export * from "./knowledge/supported-capabilities/google-ads";
