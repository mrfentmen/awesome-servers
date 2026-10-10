# ohdear-mcp

Uptime, TLS and DNS checks for any website - no API key.

## Tools

- `check_url` — Test whether a URL is up right now: HTTP status, response time and the full redirect chain. No API key needed.
- `check_many` — Uptime-check up to 10 URLs in one call and report how many are up, with status and response time for each.
- `ssl_certificate` — Read a host's live TLS certificate: issuer, validity dates, days until expiry, covered names and whether the chain is trusted.
- `dns_health` — Resolve a domain's A, AAAA, NS, MX, TXT and CAA records live and flag missing core records or a missing SPF policy.
- `security_headers` — Grade a site A-F on the six recommended security headers (HSTS, CSP, frame options, content-type options, referrer and permissions policy).
- `site_report` — One health report for a site: reachability and response time, TLS certificate expiry, DNS address and a clear healthy or needs-attention verdict.

## Setup

No setup. Every check runs live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `certificate_transparency`
* `domain_registration`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
