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
