# SciELO MCP

SciELO: 567k+ open-access articles from Latin America, Spain, Portugal and South Africa — articles, journals, collections — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/scielo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "scielo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/scielo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `article` | One article by SciELO code: title, authors, journal, pages, keywords, abstract |
| `recent_articles` | Newest indexed articles in a collection, with an optional date window |
| `journal` | One journal by ISSN: title, ISSNs, publisher, collection |
| `journals` | Browse the journals indexed in one collection, paginated |
| `collections` | Every SciELO collection (Brazil, Argentina, Mexico, …) with its code and domain |

## Example

```
E. coli a-hemolysin: a membrane-active protein toxin

Authors: F.M. Goñi, H. Ostolaza
Journal: Braz J Med Biol Res
Volume/issue: 31 / 8
Pages: 1019-1034
Published: 1998-08
Collection: scl
SciELO code: S0100-879X1998000800002
```

## Notes

Reads the public ArticleMeta API (`articlemeta.scielo.org`). Article bodies are
MARC-style tag maps, read directly (`v10` authors, `v977`/`v12` title, `v83`
abstract, `v14` pages, `v65` date, `v85` keywords).

`recent_articles` is ordered by the date SciELO indexed the record, not by
publication date — pass `from`/`until` to bound the indexing window.

ArticleMeta has no full-text search endpoint; use `recent_articles` to browse and
`article` to look one up. Results are capped at 100 per call.

## Licence

MIT
