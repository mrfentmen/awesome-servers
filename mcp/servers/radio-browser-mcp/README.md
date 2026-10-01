# radio browser mcp

MCP server for **Radio Browser**, a community directory of 40,000+ internet radio stations.

## Tools

| Tool | What it does |
|---|---|
| `search_stations` | Search stations by name |
| `stations_by_tag` | Stations by genre tag (hardcore, jazz, lofi, pirate…) |
| `stations_by_country` | Stations from a country (Japan, Germany…) |
| `get_top_voted` | The most voted stations network wide |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
stations_by_tag { tag: "hardcore" }
stations_by_country { country: "Japan" }
```

Keyless. Results are sorted by listener clicks and filtered to working streams (`hidebroken=true`). Each entry includes the resolved stream URL, codec/bitrate, and vote count.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_stations`: Search 40,000+ internet radio stations by name.
- `stations_by_tag`: Find stations by genre tag (e.g.
- `stations_by_country`: Find stations from a country (e.g.
- `get_top_voted`: The most-voted stations on the whole network - a good

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_stations`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `list_tags`
* `list_countries`
* `stations_by_language`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
