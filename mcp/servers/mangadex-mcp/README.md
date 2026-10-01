# mangadex mcp

Search the [MangaDex](https://mangadex.org) library (API v5). Free, no auth.

## Tools

- `search_manga`, title, authors, year, status, tags, description
- `get_manga`, full detail for a manga UUID
- `list_chapters`, chapters with volumes, scanlation groups, page counts
- `search_author`, find mangaka by name
- `list_tags`, the full tag taxonomy (build search filters from it)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What's the newest English Berserk chapter?"
> `search_manga("Berserk")` → `list_chapters(<id>, "en", oldestFirst=false)`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_manga`: Search MangaDex for manga by title.
- `get_manga`: Get full details for a manga by its MangaDex UUID.
- `list_chapters`: List chapters of a manga, newest or oldest first.
- `search_author`: Search MangaDex for authors/mangaka by name.
- `list_tags`: List all MangaDex content tags grouped by category - useful for building search filters.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_manga`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `manga_statistics`
* `manga_by_tag`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
