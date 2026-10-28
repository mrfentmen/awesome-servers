# MusicBrainz MCP

Open music metadata for artists, releases, recordings, and MBIDs. No API key is required.

## Tools

* `search_artists`
* `search_releases`
* `search_recordings`
* `get_artist`

The client uses a descriptive User Agent and spaces requests at about one request per second to respect MusicBrainz policy.

```bash
npm install
npm run build
node dist/index.js
```
