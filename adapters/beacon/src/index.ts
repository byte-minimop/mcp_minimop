/**
 * @mktg/adapter-beacon
 *
 * Beacon-specific adapter layer. Consumes @mktg/core and exposes
 * Beacon-specific brief rules, push control, and prompt builders.
 */

// Beacon brief validation rules and clarification templates
export * from "./brief-rules/catalog";
export * from "./brief-rules/clarifications";

// Beacon push authorization
export * from "./push-control/allowlist";

// Concentrix conversion event catalog and objective defaults
export * from "./conversion/focus-events";

// Beacon-specific prompt builders
export { buildSitelinkCatalogPromptBlock } from "./prompt-builders/sitelinks";
