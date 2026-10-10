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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_artists`: Search MusicBrainz artists by name or query.
- `search_releases`: Search albums and release editions in MusicBrainz.
- `search_recordings`: Search MusicBrainz recordings and track metadata.
- `get_artist`: Get one MusicBrainz artist by MBID.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_artists`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `search_release_groups`
* `search_labels`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
