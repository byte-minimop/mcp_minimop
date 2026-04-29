# People Targeting Structure

## Canonical Record Shape

Each imported row becomes one normalized record.

```json
{
  "id": "healthcare-strategy-and-design-tier-1-chief-marketing-officer-cmo-1",
  "industry": "Healthcare",
  "service_category": "Strategy and Design",
  "tier_level": "Tier 1",
  "people_role": "Chief Marketing Officer (CMO)",
  "subsector_text": "Healthcare Marketing",
  "subsectors": ["Healthcare Marketing"],
  "buying_considerations_text": "Customer engagement strategies, brand positioning",
  "buying_considerations": ["Customer engagement strategies", "brand positioning"],
  "relation_to_service": "Driving customer engagement through marketing strategies."
}
```

## Source Column Mapping

| Spreadsheet column | Beacon field |
|---|---|
| `Industry` | `industry` |
| `Service Category` | `service_category` |
| `Tier Level` | `tier_level` |
| `Persona` | `people_role` |
| `Subsector` | `subsector_text`, `subsectors` |
| `Buying Considerations` | `buying_considerations_text`, `buying_considerations` |
| `Relation to Service` | `relation_to_service` |

## Normalization Rules

- `Persona` is renamed to `people_role`
- `Service Category` casing is normalized where needed
- `Buying Considerations` is preserved as:
  - raw text
  - list form split on commas and semicolons
- `Subsector` is preserved as:
  - raw text
  - list form split on commas and semicolons
- every record gets a stable slug-style `id`

## Why Raw Text and List Forms Both Exist

Beacon will likely need both:

- raw text for readable review and documentation
- list form for future filtering, matching, ranking, and recommendation logic

Keeping both forms avoids losing human meaning while still making the data machine-usable.

## Recommended Future Usage Pattern

Beacon should treat this as a knowledge source, not as UI configuration.

That means later logic can:

- filter by `industry`
- narrow by `service_category`
- narrow by `tier_level`
- recommend `people_role`
- pull `buying_considerations`
- explain `relation_to_service`

This keeps people-targeting guidance readable and grounded in a normalized source.
