# theaudiodb-mcp

TheAudioDB artist, album, and track search.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `artist` — Search artists by name.
- `album` — Albums by artist.
- `track` — Track details by id.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
