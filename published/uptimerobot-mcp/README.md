# uptimerobot-mcp

Uptime, port, TLS and DNS checks for any site - no API key.

## Tools

- `check_url` — Is a page up right now: HTTP status, response time, server, redirect chain and the first text on the page.
- `check_endpoints` — Up/down sweep of up to 10 URLs in one call, with status code and response time for each.
- `port_monitor` — Check whether TCP ports on a host accept connections, with the service usually found on each port.
- `ssl_expiry` — Days left on a site's TLS certificate, who issued it and whether the chain is trusted.
- `dns_health` — A, AAAA, NS, MX, TXT and CAA records for a domain, plus whether SPF is published.
- `monitor_report` — One call that runs the whole monitor sweep on a URL: reachability, TLS certificate and DNS, with a verdict.

## Setup

No setup. Every check runs live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
