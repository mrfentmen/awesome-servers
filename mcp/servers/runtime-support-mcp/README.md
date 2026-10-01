# runtime-support-mcp

Runtime Support summarizes how many runtime families appear across local manifests, Docker files, and CI configuration. It helps identify mixed toolchains before a release.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_runtime_support` with a project inside `RUNTIME_SUPPORT_ROOT`.

## Limits

The output contains counts and runtime family signals only. Versions, dependency names, paths, source text, and environment values are suppressed.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `runtime_support_matrix`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-runtime-support-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
