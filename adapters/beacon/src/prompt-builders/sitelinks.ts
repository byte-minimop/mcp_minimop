import { SITELINK_CATALOG } from "@mktg/domain-google-ads";

/**
 * Renders the sitelink catalog as a compact prompt block for injection into
 * the Beacon translator system prompt. Beacon-specific — format is tuned for
 * Beacon's LLM prompt structure.
 */
export function buildSitelinkCatalogPromptBlock(): string {
  const rows = SITELINK_CATALOG.map(
    (s) => `  • "${s.text}" | ${s.desc1}. ${s.desc2}. | ${s.url}`
  ).join("\n");

  return `## Concentrix approved sitelink catalog

The following sitelinks are pre-approved for Concentrix campaigns. Use them as your PRIMARY source before generating generic sitelinks.

${rows}

### Matching rules — apply in this order

1. **Exact URL match**: If the landing page URL exactly matches a catalog URL (ignore trailing slash), that sitelink is a direct match. Prioritise it.

2. **Normalized path match**: Normalize both URLs (lowercase, strip trailing slash, strip query string). If they match, use that catalog entry.

3. **Parent-path match**: If the LP URL path starts with a catalog entry's path, that catalog entry is a strong candidate.
   Example: LP = concentrix.com/services-solutions/data-analytics/data-engineering/ → matches catalog entry for /services-solutions/data-analytics/ AND /services-solutions/data-analytics/data-engineering/

4. **Service-family fallback**: If no exact or parent match, find catalog entries that share the same top-level service family (e.g. /services-solutions/ or /industries/).

5. **Generic fallback**: Only if none of the above apply, generate sitelinks from scratch.

### Selection behavior

- From all matched candidates, pick the 4 most specific and relevant entries.
- When multiple entries match the same service area, prefer deeper/more-specific paths over broad overview pages.
- For corporate campaigns: always include "Contact Us" (concentrix.com/contact/) as one of the 4 sitelinks unless a stronger conversion action (demo, trial, form) clearly replaces it.
- For careers campaigns: NEVER include "Contact Us" — it is a corporate conversion action and is wrong context for a hiring campaign. Use the Careers catalog entry (jobs.concentrix.com/) as the primary sitelink anchor and generate 3 careers-specific sitelinks (open roles, culture, benefits, apply).
- Use the catalog url as the url_hint value verbatim.
- Use desc1 + " " + desc2 combined as the description field, or just desc1 if space is tight.`;
}
