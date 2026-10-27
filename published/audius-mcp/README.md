# audius mcp

MCP server for **Audius**, the decentralized streaming platform where underground and independent artists live.

## Tools

| Tool | What it does |
|---|---|
| `trending_tracks` | Trending tracks, filterable by genre (use exact values like `Hip-Hop/Rap`, `Electronic`, `Dubstep`, `Trap`) |
| `search_tracks` | Search tracks by keyword |
| `search_artists` | Search artists by name/handle |
| `get_artist_tracks` | An artist's uploaded tracks |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
trending_tracks { genre: "Hip-Hop/Rap", limit: 5 }
search_artists { query: "nettspend" }
```

Keyless (public discovery API, `app_name` sent per docs). Includes play counts, durations, genres, and Audius permalinks.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `trending_tracks`: Trending tracks on Audius - underground/independent music that isn
- `search_tracks`: Search tracks by title/artist keyword.
- `search_artists`: Search artists by handle or name.
- `get_artist_tracks`: Get an artist

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `trending_tracks`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
