# Wayback Machine MCP

## Tagline
Snapshots and archived pages. Keyless.

## Description
MCP server for the Wayback Machine, snapshot history, page availability, and dead site recovery.

## Setup Requirements
- API key as documented in README where required (all free tiers/self-serve).

## Category
Other

## Features

- Get snapshots: List the Wayback Machine snapshot history for a URL, optionally limited to a date range.
- Domain snapshots: List archived pages across a whole domain (every path), not just one exact URL.
- Site history: First and last capture of a URL, plus which years it was archived in.
- Get availability: Check whether a page is archived and get its closest snapshot.
- Read snapshot: Read the text content of an archived page — useful for reading dead or changed sites.
- Compare years: Read the same URL as it looked in several different years, to see how a page changed.
- Status history: One row per archived month with the HTTP status recorded then, so a page that started redirecting or failing can be dated.
- Capture gaps: How much of a period is actually archived for a URL: captured months, missing months, coverage percent and the longest gap.
- Diff two snapshots: Compare the same page in two archived years and list the wording that appeared and the wording that vanished.
- Broken archived pages: Archived captures across a domain that were not HTTP 200 - redirects and dead pages, which is what link rot looks like.

## Getting Started

- "Earliest snapshot of example.com"
- Tool: get_snapshots — List the Wayback Machine snapshot history for a URL, optionally limited to a date range.
- Tool: domain_snapshots — List archived pages across a whole domain (every path), not just one exact URL.
- Tool: site_history — First and last capture of a URL, plus which years it was archived in.
- Tool: get_availability — Check whether a page is archived and get its closest snapshot.
- Tool: read_snapshot — Read the text content of an archived page — useful for reading dead or changed sites.
- Tool: compare_years — Read the same URL as it looked in several different years, to see how a page changed.
- Tool: status_history — One row per archived month with the HTTP status recorded then, so a page that started redirecting or failing can be dated.
- Tool: capture_gaps — How much of a period is actually archived for a URL: captured months, missing months, coverage percent and the longest gap.
- Tool: snapshot_diff — Compare the same page in two archived years and list the wording that appeared and the wording that vanished.
- Tool: broken_pages — Archived captures across a domain that were not HTTP 200 - redirects and dead pages, which is what link rot looks like.

## Tags
wayback, archive, web-history, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/wayback-mcp
