# Zenodo MCP

Search CERN's Zenodo repository and read records — datasets, software, papers, posters and presentations. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/zenodo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "zenodo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/zenodo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Records matching a query, newest first |
| `record` | One record by id or DOI: creators, date, type, files, downloads, description |

## Example

```
"electrolyser" — 191 records

1. Improved cold-start behavior for alkaline electrolysis through electrolyte concentration heat storage
   Grewe, Fabian; Zwaschka, Gregor; Höflinger, Johannes · 2026-10-01 · publication/preprint
   doi: 10.5281/zenodo.24002992
```

## Notes

Reads the public Zenodo REST API. No key, no login.

`record` takes a numeric record id, a DOI, or a `zenodo.org/records/...` URL.
A DOI is resolved through the search endpoint, because Zenodo serves records by
their internal id.

Descriptions arrive as HTML and are stripped to plain text.

`search` passes Zenodo's own query syntax through, so `creators.name:"Grewe"`
and `resource_type.type:dataset` both work.

## Licence

MIT
