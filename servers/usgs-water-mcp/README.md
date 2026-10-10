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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_streamflow`: Get USGS instantaneous water observations for one gauge.
- `find_gauges`: Find active USGS stream gauges in a longitude,latitude bounding box.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_streamflow`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `daily_values`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
