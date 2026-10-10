# dependency-license-change-mcp

Dependency License Change compares license evidence across two local snapshots and reports category changes without exposing package names or license text.

## Quick start

```bash
npm install
npm test
npm start
```

Set `LICENSE_CHANGE_ROOT`, then call `compare_license_evidence` with `before` and `after` snapshot paths.

## Limits

Only aggregate categories and counts are returned. Classification is conservative and is not legal advice.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `category_matrix`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
