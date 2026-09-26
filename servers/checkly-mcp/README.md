# checkly-mcp

Assertion checks for status, headers and content - no API key.

## Tools

- `assert_status` — Run a synthetic check on a URL: does it answer with the status you expect, inside the time budget, without a redirect loop.
- `assert_headers` — Check that required headers are present, forbidden ones are absent, or one header contains a given value.
- `assert_content` — Check that a page's HTML contains expected text and does not contain forbidden text — a smoke test for deploys.
- `check_url` — Plain reachability check: HTTP status, response time, server header and any redirects.
- `check_redirects` — Trace every redirect hop with its timing, and flag loops or an http-to-https upgrade that never happens.
- `broken_links` — Read the links on a page and report which ones answer with an error status, so a deploy cannot ship dead links.

## Setup

No setup. Checks run live from the server itself, so there is no key or account.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
