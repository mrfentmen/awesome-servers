# vndb mcp

Search the [Visual Novel Database](https://vndb.org) (API v2). No auth, no key.

## Tools

- `search_vns`, search VNs, sort by rating / popularity / released / title
- `get_vn`, full details: description, tags, developers, platforms
- `search_characters`, find characters by name or trait
- `get_vn_releases`, every release of a VN (platforms, languages, catalogs)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What's the highest rated VN with mecha?"
> `search_vns("mecha", sort="rating")`

> "Does Muv Luv have a console release?"
> `get_vn_releases("v92")`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_vns`: Search the Visual Novel Database for visual novels.
- `get_vn`: Get full details for a visual novel by its VNDB id (e.g.
- `search_characters`: Search VNDB for characters by name or description text.
- `get_vn_releases`: List all releases (platforms, languages, catalog numbers) for a visual novel.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_vns`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
