# clinicaltrials-mcp

ClinicalTrials.gov search and PubMed.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `search` — Search clinical trials.
- `getTrial` — One clinical trial by NCT id.
- `searchPubmed` — Search PubMed articles.

- `recruiting`
- `by_phase`
- `by_sponsor`
- `by_intervention`
- `trial_locations`
## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
