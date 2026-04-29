# MCC Export Data

## Purpose

This directory holds Concentrix MCC account snapshots extracted from Google Ads Editor exports.

These snapshots are the source material for `@mktg/core`'s `mcc-knowledge.ts` module,
which extracts structured business intelligence (career domains, naming patterns,
bid strategy defaults) from the raw export data.

## Files

- `insights-2026-04-02.md` — structured insights extracted from the 2026-04-02 export
  (24 accounts, 698 campaigns, 40 active, ~$1,169/day budget)
- `source/` — raw Google Ads Editor CSV exports (gitignored, not committed)

## Provenance

- Source: Google Ads Editor CSV export
- Rows: 74,538 across 24 accounts
- Export date: 2026-04-02

## Maintenance

When a new MCC export is generated:
1. Place the raw CSV in `source/`
2. Update the insights markdown
3. Update `src/concentrix/mcc-knowledge.ts` if new patterns are discovered
