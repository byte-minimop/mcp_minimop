/**
 * Shared primitive types used across the intelligence layer.
 * Defined here to avoid any dependency on Beacon or Google Ads SDKs.
 */

/** A display option with a stable machine value and a human-readable label. */
export interface Option {
  value: string;
  label: string;
}
