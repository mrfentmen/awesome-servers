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
