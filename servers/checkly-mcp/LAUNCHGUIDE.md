# Synthetic Monitoring MCP

## Tagline
Assertion checks for status, headers and content - no API key.

## Description
Run synthetic checks from your AI assistant: assert the status a URL must return, require or forbid response headers, assert page text so a deploy cannot ship a broken page, trace redirect chains and crawl a page for broken links. Every check prints PASS or FAIL for each assertion. No account or key. An independent MCP server. Not affiliated with or endorsed by Checkly.

## Setup Requirements
No setup. Checks run live from the server itself, so there is no key or account.

## Category
Developer Tools

## Features

- Assert status: Run a synthetic check on a URL: does it answer with the status you expect, inside the time budget, without a redirect loop.
- Assert headers: Check that required headers are present, forbidden ones are absent, or one header contains a given value.
- Assert content: Check that a page's HTML contains expected text and does not contain forbidden text — a smoke test for deploys.
- Check URL: Plain reachability check: HTTP status, response time, server header and any redirects.
- Check redirects: Trace every redirect hop with its timing, and flag loops or an http-to-https upgrade that never happens.
- Broken links: Read the links on a page and report which ones answer with an error status, so a deploy cannot ship dead links.
- Assert response time: Sample a URL a few times and assert the median and worst time stay inside a budget, reporting each sample.
- Assert JSON: Treat a URL as a JSON API: check it parses, then assert a dot-path exists and optionally equals or contains a value.
- Assert redirect: Assert that a URL redirects, optionally that it lands on a given Location and answers with a specific status.

## Getting Started

- Ask your assistant about checkly using this server once installed
- Tool: assert_status — Run a synthetic check on a URL: does it answer with the status you expect, inside the time budget, without a redirect loop.
- Tool: assert_headers — Check that required headers are present, forbidden ones are absent, or one header contains a given value.
- Tool: assert_content — Check that a page's HTML contains expected text and does not contain forbidden text — a smoke test for deploys.
- Tool: check_url — Plain reachability check: HTTP status, response time, server header and any redirects.
- Tool: check_redirects — Trace every redirect hop with its timing, and flag loops or an http-to-https upgrade that never happens.
- Tool: broken_links — Read the links on a page and report which ones answer with an error status, so a deploy cannot ship dead links.
- Tool: assert_response_time — Sample a URL a few times and assert the median and worst time stay inside a budget, reporting each sample.
- Tool: assert_json — Treat a URL as a JSON API: check it parses, then assert a dot-path exists and optionally equals or contains a value.
- Tool: assert_redirect — Assert that a URL redirects, optionally that it lands on a given Location and answers with a specific status.

## Tags
synthetic, monitoring, assertions, smoke test, links, mcp

## Documentation URL
https://github.com/mrfentmen/awesome-servers/tree/main/servers/checkly-mcp
