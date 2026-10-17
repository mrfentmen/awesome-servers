# itunes-mcp

iTunes Search API: apps, podcasts, and media.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `search` — Search iTunes media.
- `topFree` — Top free apps.
- `topPaid` — Top paid apps.
- `appLookup` — App details by App Store id.
- `searchPodcasts` — Search podcasts by term.
- `topPodcasts` — Top podcasts in a category.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


