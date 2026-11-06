# NTRS MCP

NASA Technical Reports Server: technical reports, conference papers, presentations and patents — search, full metadata, PDF links — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ntrs-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ntrs-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ntrs-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Full-text search with paging, plus optional `center` and `stiType` filters |
| `record` | One record by NTRS id: authors, center, dates, keywords, abstract, download links, related records |
| `facets` | Real result counts by center, document type, subject, keyword, year and author |

## Example

```
"artemis lunar landing" — 244 records, showing 1-3

1. [20250008727] Update on NASA's Human Landing System (HLS) Program: Public-Private Partnership Advancing Artemis Sustainable Lunar Exploration
   Steve Creech, Kent Chojnacki, Rene Ortega +8 more · 2025-10-03 · CONFERENCE_PAPER · MSFC · file available
2. [20260007363] Optimization of the SCALPSS Scientific Payload to support Lunar Landing Missions, from CLPs to Artemis
   Nicholas M Rienstra, Olivia K Tyrrell, Paul M Danehy · 2026-08-14 · POSTER · LaRC · file available
3. [20240011380] NASA's Human Landing System Program: Progress Toward Artemis III and Beyond
   Lisa Watson-Morgan, Kent Chojnacki, Rene Ortega +2 more · 2024-10-14 · CONFERENCE_PAPER · MSFC · file available
```

`record` on that first id returns the abstract, the keyword list, the subject
categories, the related-record link and the direct PDF URL.

## Notes

Reads the public NTRS API (`ntrs.nasa.gov/api/citations`). No key, no login.
NTRS allows 500 requests per rate-limit window; the server sends one request per
tool call and does not retry in a loop.

Results are relevance-ordered. NTRS accepts sort parameters but ignores them —
the order never changes — so this server does not offer sorting and you page
through results instead.

`facets` reads the same search call's aggregations. NTRS caps each facet at 20
buckets, so `top` above 20 shows no extra values.

Not every record has a document: some are metadata-only or export-controlled.
`record` prints `Files: none released (metadata only)` when there is nothing to
download.

## Licence

MIT
