# statuscake-mcp

Uptime, TCP port, SSL chain and DNS propagation checks - no API key.

## Tools

- `check_url` — Uptime-check a URL right now and report the HTTP status, response time and where it redirected. No API key needed.
- `port_check` — Try to open a TCP connection to up to 10 ports on a host and report which are open, how fast they answered and what service usually runs there.
- `ssl_chain` — Walk a host's full TLS certificate chain and show every certificate with its issuer and days until expiry, plus names the leaf certificate covers.
- `dns_propagation` — Resolve a domain through Cloudflare, Google and AdGuard public resolvers and report whether they all give the same answer, plus the lowest TTL.
- `uptime_report` — Run the whole monitoring battery on a host in one call: HTTP reachability, TCP port, SSL certificate expiry, DNS record and a single healthy verdict.
- `check_hosts` — Uptime-check up to 10 hosts at once and report a compact up or down line with status and response time for each.

## Setup

No setup. Ports, certificates and DNS are probed live by the server itself.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
