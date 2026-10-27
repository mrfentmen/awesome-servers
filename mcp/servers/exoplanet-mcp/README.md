# exoplanet-mcp

NASA Exoplanet Archive: planet search, orbital and physical parameters, system listings, discovery trends.

Data source: https://exoplanetarchive.ipac.caltech.edu (TAP, no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_planets` | Find planets by planet or host-star name fragment. |
| `planet_detail` | Radius, mass, period, temperature and stellar data for one planet. |
| `system_planets` | All confirmed planets around a host star, ordered by orbit. |
| `recent_discoveries` | Planets confirmed from a given year onward. |
| `habitable_candidates` | Small planets with equilibrium temperatures of 180-310 K. |
| `discovery_stats` | Confirmed planets per discovery year. |

## Install

```bash
npx -y exoplanet-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "exoplanet-mcp": { "command": "npx", "args": ["-y", "exoplanet-mcp"] }
  }
}
```

## Example prompts

- how many planets does TRAPPIST-1 have
- which small planets are temperate

## Notes

Responses are plain text, trimmed to the fields that matter. Errors come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
