# schema-compatibility-mcp

Schema Compatibility compares bounded JSON type fingerprints. It highlights broad type-count changes without exposing property names, values, or schema text. It is not semantic schema compatibility validation.

## Quick start

```bash
npm install
npm test
npm start
```

Use `compare_schema_shapes` with two JSON files inside `SCHEMA_COMPATIBILITY_ROOT`.

## Limits

This is a shape signal, not semantic schema validation. The response contains aggregate type counts only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `schema_profile`
* `key_vocabulary`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-schema-compatibility-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
