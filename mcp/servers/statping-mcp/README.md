# statping-mcp

Service rollup, ports, DNS propagation and TLS chains - no API key.

## Tools

- `status_summary` — The rollup a status page shows: how many services are up, which are down, the slowest one and the overall state.
- `check_services` — Up/down sweep of up to 10 services in one call, with status code and response time for each.
- `service_status` — Detail for one service: HTTP status, response time, server, redirect chain and the first text on the page.
- `port_check` — Check whether TCP ports on a host accept connections, with the service usually found on each port.
- `dns_propagation` — Ask Cloudflare, Google and AdGuard for the same record and report whether they agree, plus the lowest TTL.
- `ssl_chain` — The whole certificate chain from the live handshake: leaf, intermediates, expiry and whether the chain is trusted.

## Setup

No setup. Every check runs live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `header_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-statping-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
