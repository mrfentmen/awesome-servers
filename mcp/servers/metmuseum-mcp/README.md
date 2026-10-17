# metmuseum-mcp

Metropolitan Museum collection search.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `searchObjects` — Search the Met collection.
- `getObject` — One Met object by id.
- `getDepartments` — List Met departments.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


