# Crossref MCP

Crossref: search 160M+ scholarly works, DOIs, journals, authors and funders — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/crossref-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "crossref-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/crossref-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_works` | Bibliographic search across all indexed works |
| `work_by_doi` | Full record for one DOI: authors, venue, citations, references |
| `journal_info` | Journal record by ISSN with indexed-work counts |
| `recent_works` | Journal articles published in the last N days |
| `works_by_author` | Most-cited works attributed to an author |
| `funder_search` | Research funders registered with Crossref |

## Example

```
1. A foundation model for proteins [journal-article]
   Zelina Wang, Hiroshi Tanaka +6 more · Nature · 2026-10-18 · cited 412x · doi:10.1038/nature12373
```

## Notes

Uses api.crossref.org, the keyless metadata backbone behind most DOI links.
Search runs on bibliographic fields; results include citation counts so you can
rank follow-up lookups. All tools are read-only.

## Licence

MIT
