# usgs-water-mcp

Query public USGS water observations for stream gauges and watershed research. This is separate from earthquake data and focuses on streamflow and gauge discovery.

## Tools

- `get_streamflow`: instantaneous observations for a gauge and USGS parameter code. `00060` is the common discharge parameter.
- `find_gauges`: find active stream gauges in a `min longitude,min latitude,max longitude,max latitude` bounding box, with a bounded result count.

The server uses USGS Water Services without an API key. Data can be provisional and may be revised by USGS. Requests time out after 20 seconds.

## Run

```bash
npm install
npm run build
node dist/index.js
```

Read-only stdio MCP server. No credentials or local source data are required.
