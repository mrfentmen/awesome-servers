# gatus-mcp

Endpoint conditions, latency and TLS checks - no API key.

## Tools

- `check_endpoint` — Judge one endpoint against the conditions a health dashboard uses: status it must return, a latency budget and text its body must contain.
- `health_rollup` — Check up to 10 endpoints against the same conditions and report the pass rate and median latency across them.
- `endpoint_latency` — Sample an endpoint several times and report fastest, median, average, slowest and how much the timings spread.
- `tls_expiry` — Days left on a host's TLS certificate, who issued it and whether the chain is trusted.
- `dns_records` — A, AAAA, NS, MX, TXT and CAA records for a domain, or just one type if you name it.
- `security_headers` — Grade the response security headers a site sends: HSTS, CSP, frame options, content type options, referrer and permissions policy.
- `payload_report` — How much a page actually transfers: bytes, compression, content type, cache headers, and what to fix for page weight.
- `allowed_methods` — Which HTTP methods an endpoint answers: OPTIONS with its Allow header, plus whether HEAD and GET work.
- `health_path_probe` — Probe the usual health endpoints (/health, /healthz, /status, /ready, /livez...) and report which one answers.

## Setup

No setup. Every condition is evaluated live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `resolver_agreement`
* `port_check`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-gatus-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
