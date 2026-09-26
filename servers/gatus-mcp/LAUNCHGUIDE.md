# Health Check MCP

## Tagline
Endpoint conditions, latency and TLS checks - no API key.

## Description
Health-check endpoints from your AI assistant the way a monitoring dashboard does: conditions on the status code, a latency budget and text the body must contain, a rollup with a pass rate across ten endpoints, latency samples, TLS certificate expiry, DNS records and a security header grade. No account or key. An independent MCP server. Not affiliated with or endorsed by Gatus.

## Setup Requirements
No setup. Every condition is evaluated live from the server itself, so there is no key or account.

## Category
Developer Tools

## Features

- Check endpoint: Judge one endpoint against the conditions a health dashboard uses: status it must return, a latency budget and text its body must contain.
- Health rollup: Check up to 10 endpoints against the same conditions and report the pass rate and median latency across them.
- Endpoint latency: Sample an endpoint several times and report fastest, median, average, slowest and how much the timings spread.
- TLS expiry: Days left on a host's TLS certificate, who issued it and whether the chain is trusted.
- DNS records: A, AAAA, NS, MX, TXT and CAA records for a domain, or just one type if you name it.
- Security headers: Grade the response security headers a site sends: HSTS, CSP, frame options, content type options, referrer and permissions policy.

## Getting Started

- Ask your assistant about gatus using this server once installed
- Tool: check_endpoint — Judge one endpoint against the conditions a health dashboard uses: status it must return, a latency budget and text its body must contain.
- Tool: health_rollup — Check up to 10 endpoints against the same conditions and report the pass rate and median latency across them.
- Tool: endpoint_latency — Sample an endpoint several times and report fastest, median, average, slowest and how much the timings spread.
- Tool: tls_expiry — Days left on a host's TLS certificate, who issued it and whether the chain is trusted.
- Tool: dns_records — A, AAAA, NS, MX, TXT and CAA records for a domain, or just one type if you name it.
- Tool: security_headers — Grade the response security headers a site sends: HSTS, CSP, frame options, content type options, referrer and permissions policy.

## Tags
health check, monitoring, latency, conditions, tls, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/gatus-mcp
