# gbif-mcp

A niche biodiversity assistant backed by GBIF. Use it to normalize species names, inspect taxonomy, and explore public occurrence records for ecology, field research, and natural-history questions.

## Tools

- `match_species`: match a scientific or common name to a GBIF taxon.
- `get_species`: fetch taxonomy metadata by GBIF usage key.
- `search_occurrences`: search public observations by taxon, country, year, or bounding box.

GBIF is a public aggregation service. Individual records can have different dataset licenses and coordinate precision. Treat occurrence results as research leads, not proof of presence or absence. No API key is required and results are bounded.

## Run

```bash
npm install
npm run build
node dist/index.js
```
