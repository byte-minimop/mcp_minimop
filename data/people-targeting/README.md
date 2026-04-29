# People Targeting

## Purpose

This folder is the canonical source of Concentrix people-targeting knowledge.

It turns the FY25 people spreadsheet into a machine-readable knowledge area
usable by any MCP consumer (Beacon, tooling, future products).

## Source

- Original source file: `FY25 Sector Personas - Digital Marketing Table.xlsx`
- Source sheet used for structured import: `Data`

The spreadsheet's `Personas` sheet behaves more like a filtered view.
The `Data` sheet is treated as the source of truth.

## Files

- `catalog.json` — canonical machine-readable people-targeting catalog (1,599 records)
- `coverage.md` — readable coverage index by industry and service category
- `structure.md` — schema and normalization rules

## Terminology

This knowledge area uses `people` terminology consistently.

The spreadsheet column `Persona` is normalized to `people_role`.

## Maintenance

The catalog is generated from the Excel source via a Python import script.
The generation script currently lives in `Beacon/scripts/import-people-targeting.py`.
Output should land in this directory (`marketing-mcp/data/people-targeting/`).

```bash
# Run from the Beacon project (until the script is migrated)
python3 scripts/import-people-targeting.py
```

This rebuilds:
- `catalog.json`
- `coverage.md`

## Consumers

- `@mktg/core` (`src/concentrix/people-targeting.ts`) imports `catalog.json`
- Beacon consumes via `@mktg/core` re-exports
