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

These tools need a licence key:

* `runtime_lifecycle`
* `npm_latest`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
