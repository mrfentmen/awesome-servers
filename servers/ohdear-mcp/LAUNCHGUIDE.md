# Ohdear MCP

## Tagline
Uptime, TLS and DNS checks for any website - no API key.

## Description
Check any site from your AI assistant: is it up, how fast it answers, when its TLS certificate expires, whether its DNS records are healthy and which security headers are missing. Every check runs live, with no account or key. An independent MCP server. Not affiliated with or endorsed by Ohdear.

## Setup Requirements
No setup. Every check runs live from the server itself, so there is no key or account.

## Category
Developer Tools

## Features
- Check URL up or down: Test whether a URL is up right now: HTTP status, response time and the full redirect chain. No API key needed.
- Check many URLs: Uptime-check up to 10 URLs in one call and report how many are up, with status and response time for each.
- SSL certificate check: Read a host's live TLS certificate: issuer, validity dates, days until expiry, covered names and whether the chain is trusted.
- DNS health: Resolve a domain's A, AAAA, NS, MX, TXT and CAA records live and flag missing core records or a missing SPF policy.
- Security headers audit: Grade a site A-F on the six recommended security headers (HSTS, CSP, frame options, content-type options, referrer and permissions policy).
- Full site report: One health report for a site: reachability and response time, TLS certificate expiry, DNS address and a clear healthy or needs-attention verdict.

## Getting Started
- Ask your assistant about ohdear using this server once installed
- Tool: check_url — Test whether a URL is up right now: HTTP status, response time and the full redirect chain. No API key needed.
- Tool: check_many — Uptime-check up to 10 URLs in one call and report how many are up, with status and response time for each.
- Tool: ssl_certificate — Read a host's live TLS certificate: issuer, validity dates, days until expiry, covered names and whether the chain is trusted.
- Tool: dns_health — Resolve a domain's A, AAAA, NS, MX, TXT and CAA records live and flag missing core records or a missing SPF policy.
- Tool: security_headers — Grade a site A-F on the six recommended security headers (HSTS, CSP, frame options, content-type options, referrer and permissions policy).
- Tool: site_report — One health report for a site: reachability and response time, TLS certificate expiry, DNS address and a clear healthy or needs-attention verdict.

## Tags
uptime, monitoring, ssl, dns, devops, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/ohdear-mcp
