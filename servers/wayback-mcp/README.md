# wayback-mcp

MCP server for the Internet Archive Wayback Machine: closest snapshots, snapshot history for a URL, and archived page retrieval. Keyless.

## Tools

- `get_snapshots` — List the Wayback Machine snapshot history for a URL, optionally limited to a date range.
- `domain_snapshots` — List archived pages across a whole domain (every path), not just one exact URL.
- `site_history` — First and last capture of a URL, plus which years it was archived in.
- `get_availability` — Check whether a page is archived and get its closest snapshot.
- `read_snapshot` — Read the text content of an archived page — useful for reading dead or changed sites.
- `compare_years` — Read the same URL as it looked in several different years, to see how a page changed.
- `status_history` — One row per archived month with the HTTP status recorded then, so a page that started redirecting or failing can be dated.
- `capture_gaps` — How much of a period is actually archived for a URL: captured months, missing months, coverage percent and the longest gap.
- `snapshot_diff` — Compare the same page in two archived years and list the wording that appeared and the wording that vanished.
- `broken_pages` — Archived captures across a domain that were not HTTP 200 - redirects and dead pages, which is what link rot looks like.

## Source

[wayback-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/wayback-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `content_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-wayback-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
