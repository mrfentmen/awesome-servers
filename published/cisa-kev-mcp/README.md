# cisa-kev-mcp

Search CISA's Known Exploited Vulnerabilities catalog. This is a focused companion to vulnerability scanners: it helps an agent identify vulnerabilities that CISA has marked as exploited in the wild.

## Tools

- `search_known_exploited`: search CVE, vendor, product, vulnerability name, and description fields.
- `recent_known_exploited`: list recently added catalog entries.
- `catalog_info`: inspect catalog version, release date, and entry count.

- `by_cve`
- `by_vendor`
- `by_product`
- `ransomware`
- `vendors`
- `yearly`
The feed is public and keyless. Catalog inclusion is a prioritization signal, not a complete risk assessment or a guarantee that a system is vulnerable.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_known_exploited`: Search CISA
- `recent_known_exploited`: List the most recently added entries in the CISA KEV catalog.
- `catalog_info`: Get CISA KEV catalog version and release metadata.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_known_exploited`.
