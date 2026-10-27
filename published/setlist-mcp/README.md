# setlist mcp

Concert setlists via the [Setlist.fm API](https://www.setlist.fm/settings/api).
"Who played what live, and how many times?"

## Tools

- `search_artist`, find an artist by name (returns MusicBrainz ID)
- `get_artist_setlists`, recent shows for an artist, filter by year
- `get_setlist_detail`, full song by song setlist for a show
- `count_song_plays`, how many times a song was played live + example shows

## Setup

Get a free API key at https://www.setlist.fm/settings/api, then:

```bash
export SETLISTFM_API_KEY=your-key
npm install && npm run build
```

## Claude Desktop / Cursor config

```json
{
  "mcpServers": {
    "setlist": {
      "command": "node",
      "args": ["/absolute/path/to/setlist-mcp/dist/index.js"],
      "env": { "SETLISTFM_API_KEY": "your-key" }
    }
  }
}
```

## Example

> "What did Radiohead play on their last tour?"
> `search_artist("Radiohead")` → `get_artist_setlists(<mbid>)` → `get_setlist_detail(<id>)`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_artist`: Search Setlist.fm for an artist by name. Returns MusicBrainz IDs (mbid)
- `get_artist_setlists`: Fetch recent concert setlists for an artist by MusicBrainz ID.
- `get_setlist_detail`: Get the full song-by-song setlist for a specific concert.
- `count_song_plays`: Count how many times an artist has played a specific song live,

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_artist`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
