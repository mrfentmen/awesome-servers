# vgmdb mcp

Video game music database. Search game OSTs, composers, and full tracklists.

> The original VGMdb.info API went offline in 2024, and MusicBrainz
> resets connections from script IPs, this server is backed by the
> **iTunes Catalog API** (free, no key, no fingerprint blocking), which
> catalogs game soundtracks with full tracklists and composers.

## Tools

- `search_albums`, find game soundtrack albums ("Chrono Trigger OST")
- `get_album`, full tracklist with timings, artwork, Apple Music link
- `search_artists`, find composers ("Yasunori Mitsuda")
- `get_artist`, a composer's discography

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "Give me the Chrono Trigger OST tracklist"
> `search_albums("Chrono Trigger OST")` → `get_album(324080907)`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_albums`: Search for video game soundtrack albums by game or composer name.
- `get_album`: Get full album details: full tracklist with timings, release date, genre.
- `search_artists`: Search for video game composers / performers by name.
- `get_artist`: Get a composer

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_albums`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
