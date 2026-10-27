# betterstack-mcp

Latency breakdown, response times and page audits - no API key.

## Tools

- `response_times` — Sample a URL several times and report min, median, average, max and jitter, so you can tell steady from flaky.
- `latency_breakdown` — Split one request into DNS, TCP connect, TLS handshake and time-to-headers, and say which stage is slowest.
- `content_check` — Audit a page's title, meta description, canonical, lang, viewport, headings, image alt text and word count.
- `redirect_chain` — Every hop from the URL you give to the URL that finally answers, with timing and loop detection.
- `headers_report` — Grouped response headers — origin, caching and CDN, compression, security and cookies — with what looks wrong.
- `endpoint_summary` — One call for a whole endpoint: reachable or not, latency stages, TLS certificate age and DNS address.
- `certificate_info` — Read the TLS certificate a host presents: subject, issuer, validity and days left, chain length, SAN list and whether Node trusts it.
- `dns_records` — Look up a domain's A, AAAA, CNAME, MX, TXT, NS and CAA records at once and report its SPF and DMARC status.
- `port_check` — Test whether TCP ports accept a connection, with the time each port took and the reason a port is closed.
- `tls_versions` — Check whether a host still negotiates TLS 1.2 and TLS 1.3, and which protocol and cipher it picks for each.

## Setup

No setup. Requests are measured live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).


