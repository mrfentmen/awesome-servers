# OSTI MCP

US Department of Energy science: journal articles, technical reports, conference papers, patents and datasets from OSTI — 5.1 million records, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/osti-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "osti-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/osti-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Full-text search with paging, plus filters for title, author, subject, record type, research org, sponsor and publication year |
| `record` | One record by OSTI id: authors, journal, DOI, sponsors, subjects, description and full-text links |

## Example

```
"solar desalination" — 3943 records, showing 1-3

1. [17065278] Solar Desalination Prize Rules
   no authors listed · 2026-09-25 · Technical Report · NLR · fulltext · doi:10.2172/17065278
2. [17304859] Custom Power Electronics Solution to Improve WEC Power Output
   Schnabel, Alec · 2026-10-09 · Conference · NLR · fulltext · doi:10.66816/pr3400050
3. [3708665] An Analysis of Energy Needs and Seawater Extraction Approaches for the Integration of Primary Magnesium Production with Nuclear Power
   Rigby, Aidan C.; Wilson, Aaron D · 2026-09-02 · Journal Article · INL · fulltext · doi:10.1016/j.nucengdes.2026.115174
```

`record` on `3376901` returns the journal name and volume, the publisher, the
LLNL report number, the subject list, the sponsor and the `/servlets/purl/`
full-text link.

## Notes

Reads the public OSTI API (`osti.gov/api/v1`). No key, no login.

Date filters want a year (`2025`) or a US date (`06/01/2025`). A bare
`2025-06-01` makes OSTI return HTTP 500, so this server converts it for you.

No sorting: OSTI accepts `sort=` and `order=` but returns the same order as an
unsorted request, so paging is the only way through results.

No facet counts: OSTI has no facet endpoint (`/api/v1/facets` and
`/api/v1/records/facets` both 404), so this server does not invent them.

A few search results point at ids that have no public record page — OSTI answers
those with website HTML instead of JSON. `record` says plainly when that happens
rather than returning an empty result.

## Licence

MIT
