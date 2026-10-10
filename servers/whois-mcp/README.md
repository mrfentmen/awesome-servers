# whois-mcp

RDAP whois records for domains and IPs.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `domain` — Registration record for a domain.
- `ip` — Registration record for an IP.
- `domainInfo` — Registration info for a domain.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `asn_info`
* `asn_networks`
* `domain_contacts`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-whois-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
