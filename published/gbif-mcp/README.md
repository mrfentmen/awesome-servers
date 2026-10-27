# gbif-mcp

A niche biodiversity assistant backed by GBIF. Use it to normalize species names, inspect taxonomy, and explore public occurrence records for ecology, field research, and natural-history questions.

## Tools

- `match_species`: match a scientific or common name to a GBIF taxon.
- `get_species`: fetch taxonomy metadata by GBIF usage key.
- `search_occurrences`: search public observations by taxon, country, year, or bounding box.

- `search_species`
- `occurrence_count`
- `list_countries`
- `list_organizations`
- `list_installations`
- `list_nodes`
- `get_dataset`
GBIF is a public aggregation service. Individual records can have different dataset licenses and coordinate precision. Treat occurrence results as research leads, not proof of presence or absence. No API key is required and results are bounded.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `match_species`: Match a scientific or common name to GBIF taxonomy.
- `get_species`: Get GBIF taxonomy metadata by usage key.
- `search_occurrences`: Search public biodiversity observations by taxon, country, year, or bounding box.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `match_species`.
