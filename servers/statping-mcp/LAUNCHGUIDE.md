# Status Page MCP

## Tagline
Service rollup, ports, DNS propagation and TLS chains - no API key.

## Description
Run a status page from your AI assistant: an overall status rollup with up and down counts, a bulk health check of up to ten services, TCP port checks, DNS propagation compared across three public resolvers, and the full TLS certificate chain with expiry dates. No account or key. An independent MCP server. Not affiliated with or endorsed by Statping.

## Setup Requirements
No setup. Every check runs live from the server itself, so there is no key or account.

## Category
Developer Tools

## Features
- Status summary: The rollup a status page shows: how many services are up, which are down, the slowest one and the overall state.
- Check services: Up/down sweep of up to 10 services in one call, with status code and response time for each.
- Service status: Detail for one service: HTTP status, response time, server, redirect chain and the first text on the page.
- Port check: Check whether TCP ports on a host accept connections, with the service usually found on each port.
- DNS propagation: Ask Cloudflare, Google and AdGuard for the same record and report whether they agree, plus the lowest TTL.
- TLS chain: The whole certificate chain from the live handshake: leaf, intermediates, expiry and whether the chain is trusted.

## Getting Started
- Ask your assistant about statping using this server once installed
- Tool: status_summary — The rollup a status page shows: how many services are up, which are down, the slowest one and the overall state.
- Tool: check_services — Up/down sweep of up to 10 services in one call, with status code and response time for each.
- Tool: service_status — Detail for one service: HTTP status, response time, server, redirect chain and the first text on the page.
- Tool: port_check — Check whether TCP ports on a host accept connections, with the service usually found on each port.
- Tool: dns_propagation — Ask Cloudflare, Google and AdGuard for the same record and report whether they agree, plus the lowest TTL.
- Tool: ssl_chain — The whole certificate chain from the live handshake: leaf, intermediates, expiry and whether the chain is trusted.

## Tags
status page, uptime, dns, ssl, ports, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/statping-mcp
