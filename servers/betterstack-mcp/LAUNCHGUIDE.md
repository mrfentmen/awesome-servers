# Web Observability MCP

## Tagline
Latency breakdown, response times and page audits - no API key.

## Description
Observe any site from your AI assistant: split one request into DNS, TCP, TLS and time-to-headers stages, sample response times to see jitter, audit a page for title, meta description, language, viewport, headings and image alt text, trace redirect chains and group the response headers. No account or key. An independent MCP server. Not affiliated with or endorsed by Better Stack.

## Setup Requirements
No setup. Requests are measured live from the server itself, so there is no key or account.

## Category
Developer Tools

## Features

- Response times: Sample a URL several times and report min, median, average, max and jitter, so you can tell steady from flaky.
- Latency breakdown: Split one request into DNS, TCP connect, TLS handshake and time-to-headers, and say which stage is slowest.
- Content check: Audit a page's title, meta description, canonical, lang, viewport, headings, image alt text and word count.
- Redirect chain: Every hop from the URL you give to the URL that finally answers, with timing and loop detection.
- Header report: Grouped response headers — origin, caching and CDN, compression, security and cookies — with what looks wrong.
- Endpoint summary: One call for a whole endpoint: reachable or not, latency stages, TLS certificate age and DNS address.
- Certificate info: Read the TLS certificate a host presents: subject, issuer, validity and days left, chain length, SAN list and whether Node trusts it.
- DNS records: Look up a domain's A, AAAA, CNAME, MX, TXT, NS and CAA records at once and report its SPF and DMARC status.
- Port check: Test whether TCP ports accept a connection, with the time each port took and the reason a port is closed.
- TLS versions: Check whether a host still negotiates TLS 1.2 and TLS 1.3, and which protocol and cipher it picks for each.

## Getting Started

- Ask your assistant about betterstack using this server once installed
- Tool: response_times — Sample a URL several times and report min, median, average, max and jitter, so you can tell steady from flaky.
- Tool: latency_breakdown — Split one request into DNS, TCP connect, TLS handshake and time-to-headers, and say which stage is slowest.
- Tool: content_check — Audit a page's title, meta description, canonical, lang, viewport, headings, image alt text and word count.
- Tool: redirect_chain — Every hop from the URL you give to the URL that finally answers, with timing and loop detection.
- Tool: headers_report — Grouped response headers — origin, caching and CDN, compression, security and cookies — with what looks wrong.
- Tool: endpoint_summary — One call for a whole endpoint: reachable or not, latency stages, TLS certificate age and DNS address.
- Tool: certificate_info — Read the TLS certificate a host presents: subject, issuer, validity and days left, chain length, SAN list and whether Node trusts it.
- Tool: dns_records — Look up a domain's A, AAAA, CNAME, MX, TXT, NS and CAA records at once and report its SPF and DMARC status.
- Tool: port_check — Test whether TCP ports accept a connection, with the time each port took and the reason a port is closed.
- Tool: tls_versions — Check whether a host still negotiates TLS 1.2 and TLS 1.3, and which protocol and cipher it picks for each.

## Tags
observability, latency, performance, seo, headers, mcp

## Documentation URL
https://github.com/mrfentmen/awesome-servers/tree/main/servers/betterstack-mcp
