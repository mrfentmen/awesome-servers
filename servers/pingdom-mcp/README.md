# pingdom-mcp

Measure site performance and catch broken links - no API key.

## Tools

- `check_url` — Test whether a URL is up right now and report its HTTP status, response time and redirect count. No API key needed.
- `response_times` — Request a URL several times in a row and report min, median, average, max and jitter, so you can tell whether a site is consistently fast or flaky.
- `check_redirects` — Follow every redirect for a URL and flag loops, plain-HTTP starts and hops that could be collapsed into one rule.
- `certificate_expiry` — Check when a host's TLS certificate expires and whether the chain is trusted, with a CRITICAL/WARNING/OK status.
- `broken_links` — Scan a page for links, request each one and list the ones that return an error status. Great for catching dead links before visitors do.
- `performance_report` — Break a page load into DNS lookup, connect, TLS, time-to-first-byte and total time, then report payload size, compression, caching and page weight with a list of fixes.

## Setup

No setup. Timings are measured by the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
