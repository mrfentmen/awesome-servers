# Pingdom MCP

## Tagline
Measure site performance and catch broken links - no API key.

## Description
Profile a page load from your AI assistant: DNS, connect, TLS and time-to-first-byte timings, response-time samples with jitter, redirect chains, certificate expiry and broken-link scanning. Live measurements, no account or key. An independent MCP server. Not affiliated with or endorsed by Pingdom or SolarWinds.

## Setup Requirements
No setup. Timings are measured by the server itself, so there is no key or account.

## Category
Developer Tools

## Features
- Check URL up or down: Test whether a URL is up right now and report its HTTP status, response time and redirect count. No API key needed.
- Response time samples: Request a URL several times in a row and report min, median, average, max and jitter, so you can tell whether a site is consistently fast or flaky.
- Check redirect chain: Follow every redirect for a URL and flag loops, plain-HTTP starts and hops that could be collapsed into one rule.
- Certificate expiry: Check when a host's TLS certificate expires and whether the chain is trusted, with a CRITICAL/WARNING/OK status.
- Find broken links: Scan a page for links, request each one and list the ones that return an error status. Great for catching dead links before visitors do.
- Performance report: Break a page load into DNS lookup, connect, TLS, time-to-first-byte and total time, then report payload size, compression, caching and page weight with a list of fixes.

## Getting Started
- Ask your assistant about pingdom using this server once installed
- Tool: check_url — Test whether a URL is up right now and report its HTTP status, response time and redirect count. No API key needed.
- Tool: response_times — Request a URL several times in a row and report min, median, average, max and jitter, so you can tell whether a site is consistently fast or flaky.
- Tool: check_redirects — Follow every redirect for a URL and flag loops, plain-HTTP starts and hops that could be collapsed into one rule.
- Tool: certificate_expiry — Check when a host's TLS certificate expires and whether the chain is trusted, with a CRITICAL/WARNING/OK status.
- Tool: broken_links — Scan a page for links, request each one and list the ones that return an error status. Great for catching dead links before visitors do.
- Tool: performance_report — Break a page load into DNS lookup, connect, TLS, time-to-first-byte and total time, then report payload size, compression, caching and page weight with a list of fixes.

## Tags
performance, uptime, monitoring, links, devops, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/pingdom-mcp
