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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `podcast_episodes`
* `audiobooks`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
