# DataONE MCP

Earth and environmental science data from DataONE: NCEI, PANGAEA, LTER, DRYAD and other repositories — search, metadata and facet counts — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dataone-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dataone-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dataone-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search the index with paging. Shows author, date, source node, format and size |
| `record` | One record by identifier: format, source, size, licence, keywords, abstract and the data link |
| `facets` | Real counts by format type, data source and keyword |

## Example

```
"climate" — 228644 records, showing 1-3

1. Global Aggregations Climate Types
   Gilmour, Jonathan · 2024-09-23 · HD · Dataset · 177.5 KB
   id: sha256:ec318a95f2fd9d93ac0e2b9bd7eebfdaf31ac9e7cb3eb4ec4ddb2a96d0418f6f
2. Tweet IDs used to study emoji syntax - Climate change
   Pereira, Alexandre · 2024-06-21 · HD · Dataset · 130.7 KB
   id: sha256:9f53c2834a9cfe354a61eaf9b0c6f254b3c6d2915977d278bded05e7728ebb76
3. Current and potential future distribution of the American dog tick (Dermacentor variabilis, Say) in North America
   Minigan, Jordan N. · 2018-02-08 · BOREALIS · Dataset · 42.7 KB
   id: sha256:6ec1c5580c440aac48f0444885739c3ff53977da5623712be40b64527373b704
```

`record` prints the licence, the keyword list, the abstract and the
`cn/v2/resolve/` link that serves the data itself.

## Notes

Reads the public DataONE Solr endpoint (`cn.dataone.org/cn/v2/query/solr/`).
No key, no login.

`q` takes plain words and also Solr field syntax — `title:climate` and
`keywords:oceanography` both work. Not every field query is accepted:
`datasource:urn:node:NCEI` is rejected with HTTP 400.

No sorting: `sort=datePublished desc` returns HTTP 400, so results stay in
relevance order.

`facets` uses the same endpoint's own facet counts for format type, data source
and keyword — no counts are computed by this server.

Each call asks the API for a trimmed field list. Without that, one row carries
the full indexed text and a two-row page is over 100 KB.

## Licence

MIT
