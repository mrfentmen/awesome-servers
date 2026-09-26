# betterstack-mcp

Latency breakdown, response times and page audits - no API key.

## Tools

- `response_times` — Sample a URL several times and report min, median, average, max and jitter, so you can tell steady from flaky.
- `latency_breakdown` — Split one request into DNS, TCP connect, TLS handshake and time-to-headers, and say which stage is slowest.
- `content_check` — Audit a page's title, meta description, canonical, lang, viewport, headings, image alt text and word count.
- `redirect_chain` — Every hop from the URL you give to the URL that finally answers, with timing and loop detection.
- `headers_report` — Grouped response headers — origin, caching and CDN, compression, security and cookies — with what looks wrong.
- `endpoint_summary` — One call for a whole endpoint: reachable or not, latency stages, TLS certificate age and DNS address.

## Setup

No setup. Requests are measured live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
