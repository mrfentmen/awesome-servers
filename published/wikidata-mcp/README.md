# wikidata-mcp

A compact interface to Wikidata for entity lookup and structured public knowledge exploration.

## Tools

- `search_entities`: search labels and descriptions.
- `get_entity`: fetch English labels, descriptions, claims, and sitelinks for a Q id.
- `query_knowledge`: run a bounded, read-only SPARQL query.

SPARQL input is capped at 8,000 characters and blocks write, federation, and dataset-management operations. Include a selective `LIMIT` in queries. Wikidata statements vary in completeness and should be checked against their references for important work.

## Run

```bash
npm install
npm run build
node dist/index.js
```
