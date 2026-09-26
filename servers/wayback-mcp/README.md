# wayback-mcp

MCP server for the Internet Archive Wayback Machine: closest snapshots, snapshot history for a URL, and archived page retrieval. Keyless.

## Tools

- `get_snapshots` — List the Wayback Machine snapshot history for a URL, optionally limited to a date range.
- `domain_snapshots` — List archived pages across a whole domain (every path), not just one exact URL.
- `site_history` — First and last capture of a URL, plus which years it was archived in.
- `get_availability` — Check whether a page is archived and get its closest snapshot.
- `read_snapshot` — Read the text content of an archived page — useful for reading dead or changed sites.
- `compare_years` — Read the same URL as it looked in several different years, to see how a page changed.

## Source

[wayback-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/wayback-mcp)
