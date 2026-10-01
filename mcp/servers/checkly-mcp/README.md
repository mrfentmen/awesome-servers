# checkly-mcp

Assertion checks for status, headers and content - no API key.

## Tools

- `assert_status` — Run a synthetic check on a URL: does it answer with the status you expect, inside the time budget, without a redirect loop.
- `assert_headers` — Check that required headers are present, forbidden ones are absent, or one header contains a given value.
- `assert_content` — Check that a page's HTML contains expected text and does not contain forbidden text — a smoke test for deploys.
- `check_url` — Plain reachability check: HTTP status, response time, server header and any redirects.
- `check_redirects` — Trace every redirect hop with its timing, and flag loops or an http-to-https upgrade that never happens.
- `broken_links` — Read the links on a page and report which ones answer with an error status, so a deploy cannot ship dead links.
- `assert_response_time` — Sample a URL a few times and assert the median and worst time stay inside a budget, reporting each sample.
- `assert_json` — Treat a URL as a JSON API: check it parses, then assert a dot-path exists and optionally equals or contains a value.
- `assert_redirect` — Assert that a URL redirects, optionally that it lands on a given Location and answers with a specific status.

## Setup

No setup. Checks run live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `http_security_report`
* `seo_meta`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
