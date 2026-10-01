# license-boundary-mcp

License Boundary summarizes local license evidence before a release. It classifies common license markers and highlights unknown evidence without pretending to provide legal advice.

## Quick start

```bash
npm install
npm test
npm start
```

Call `inspect_license_boundary` with a bounded project path.

## Privacy and limits

The server reads license files and recognized manifests, but only returns aggregate categories. It never returns license text, package names, paths, or source. Classification is intentionally conservative.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `npm_license_evidence`
* `repo_license_evidence`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
