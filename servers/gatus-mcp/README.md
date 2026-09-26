# gatus-mcp

Endpoint conditions, latency and TLS checks - no API key.

## Tools

- `check_endpoint` — Judge one endpoint against the conditions a health dashboard uses: status it must return, a latency budget and text its body must contain.
- `health_rollup` — Check up to 10 endpoints against the same conditions and report the pass rate and median latency across them.
- `endpoint_latency` — Sample an endpoint several times and report fastest, median, average, slowest and how much the timings spread.
- `tls_expiry` — Days left on a host's TLS certificate, who issued it and whether the chain is trusted.
- `dns_records` — A, AAAA, NS, MX, TXT and CAA records for a domain, or just one type if you name it.
- `security_headers` — Grade the response security headers a site sends: HSTS, CSP, frame options, content type options, referrer and permissions policy.

## Setup

No setup. Every condition is evaluated live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
