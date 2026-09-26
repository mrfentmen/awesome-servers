# Statuscake MCP

## Tagline
Uptime, TCP port, SSL chain and DNS propagation checks - no API key.

## Description
Run a full monitoring battery from your AI assistant: HTTP reachability, TCP port checks, TLS certificate chain and expiry, DNS propagation across three public resolvers, and one combined uptime verdict. No account or key needed. An independent MCP server. Not affiliated with or endorsed by StatusCake.

## Setup Requirements
No setup. Ports, certificates and DNS are probed live by the server itself.

## Category
Developer Tools

## Features

- Check URL up or down: Uptime-check a URL right now and report the HTTP status, response time and where it redirected. No API key needed.
- TCP port check: Try to open a TCP connection to up to 10 ports on a host and report which are open, how fast they answered and what service usually runs there.
- SSL certificate chain: Walk a host's full TLS certificate chain and show every certificate with its issuer and days until expiry, plus names the leaf certificate covers.
- DNS propagation check: Resolve a domain through Cloudflare, Google and AdGuard public resolvers and report whether they all give the same answer, plus the lowest TTL.
- Full uptime report: Run the whole monitoring battery on a host in one call: HTTP reachability, TCP port, SSL certificate expiry, DNS record and a single healthy verdict.
- Check several hosts: Uptime-check up to 10 hosts at once and report a compact up or down line with status and response time for each.

## Getting Started

- Ask your assistant about statuscake using this server once installed
- Tool: check_url — Uptime-check a URL right now and report the HTTP status, response time and where it redirected. No API key needed.
- Tool: port_check — Try to open a TCP connection to up to 10 ports on a host and report which are open, how fast they answered and what service usually runs there.
- Tool: ssl_chain — Walk a host's full TLS certificate chain and show every certificate with its issuer and days until expiry, plus names the leaf certificate covers.
- Tool: dns_propagation — Resolve a domain through Cloudflare, Google and AdGuard public resolvers and report whether they all give the same answer, plus the lowest TTL.
- Tool: uptime_report — Run the whole monitoring battery on a host in one call: HTTP reachability, TCP port, SSL certificate expiry, DNS record and a single healthy verdict.
- Tool: check_hosts — Uptime-check up to 10 hosts at once and report a compact up or down line with status and response time for each.

## Tags
uptime, monitoring, ssl, ports, dns, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/statuscake-mcp
