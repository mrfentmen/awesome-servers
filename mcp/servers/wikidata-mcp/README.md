# wikidata-mcp

Wikidata entity search, lookup, and bounded SPARQL.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `searchEntities` — Search Wikidata entities.
- `getEntity` — Wikidata entity details.
- `queryKnowledge` — Bounded read-only SPARQL query.
- `search` — Search Wikidata entities.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


