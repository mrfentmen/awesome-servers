# Internet Archive MCP

Books, films, audio, software, images and collections from archive.org — search and item metadata. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/internetarchive-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "internetarchive-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/internetarchive-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search items by words, with paging and an optional media type filter |
| `item` | One item by identifier: title, creator, date, media type, file count, description |

## Example

```
"climate change" — 143957 items, showing 1-2

1. Easthampton Candidates Climate Forum 9/24/2019
   movies · 2019-10-01 · Easthampton Media · 42 downloads
   id: ehmma-Easthampton_Candidates_Climate_Forum_9_24_2019
2. ...
```

`item` on `nasa` returns the collection title, its description and how many
files the archive holds for it.

## Notes

Reads the public archive.org search and metadata endpoints. No key, no login.

`search` only asks for six fields (`identifier`, `title`, `creator`, `date`,
`mediatype`, `downloads`) instead of the full Solr document, which keeps results
small and fast.

The media type filter is appended to the query as `AND mediatype:<type>` and is
not validated, so a wrong type simply returns nothing.

Identifiers are passed straight through; `archive.org/details/...` and
`archive.org/metadata/...` URLs are accepted and trimmed.

## Licence

MIT
