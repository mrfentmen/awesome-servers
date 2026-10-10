# api-deprecation-radar-mcp

API Deprecation Radar counts deprecation, sunset, and obsolete markers in local API-adjacent files. It gives maintainers a quick review queue without exposing endpoint names or code.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_deprecation_radar` with a bounded local project path.

## Privacy and limits

The output contains counts and broad severity buckets only. Marker severity is heuristic and should be reviewed by a developer. No endpoint names, paths, source text, values, or filenames are emitted.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `inspect_version_pins`
* `inspect_endpoint_inventory`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-api-deprecation-radar-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
