# stadiamaps-mcp

MCP server for the [Stadia Maps](https://stadiamaps.com) geospatial APIs:
Pelias geocoding and search, Valhalla routing and elevation, and timezone
lookups — all behind one free development key.

Checked 2026-10-23: Stadia has no first-party MCP server and npm has no MCP
package for it. See `mcp/MISSING.md` for the log.

## Tools (12)

| Tool | Backing API | What it answers |
|---|---|---|
| `stadia_geocode` | Pelias `/geocoding/v1/search` | place name or address → compact label + position rows |
| `stadia_autocomplete` | Pelias `/geocoding/v1/autocomplete` | suggestions for partial input |
| `stadia_reverse` | Pelias `/geocoding/v1/reverse` | what is at this lat/lon |
| `stadia_structured` | Pelias `/geocoding/v1/structured` | geocode from separate country/city/address parts |
| `stadia_directions` | Valhalla `/route/v1/directions` | route between 2+ waypoints, per travel mode, summary + per-leg |
| `stadia_directions_summary` | Valhalla | the same route reduced to distance + time + leg count |
| `stadia_isochrone` | Valhalla `/isochrone/v1/isochrone` | reachable-area polygons within 1–120 minute contours |
| `stadia_isochrone_contours` | Valhalla | the same answer reduced to per-contour metadata |
| `stadia_route_matrix` | Valhalla `/sources_to_targets` | time/distance between many sources and targets |
| `stadia_elevation` | Valhalla `/height` | elevation along a path, optionally with cumulative range |
| `stadia_elevation_point` | Valhalla `/height` | elevation at one coordinate |
| `stadia_timezone` | Stadia `/timezone/v1` | IANA timezone and offsets for a coordinate |

Raw geometry is deliberately dropped (`shape`/encoded polylines) — the tools
return summaries so an agent does not burn its context on coordinate lists.

## Auth

```sh
export STADIA_MAPS_API_KEY=...
```

Free development key from the Stadia Maps client portal (no card needed).
Geocoding/timezone calls send it as `api_key`; the Valhalla-family calls send
a `Stadia-API-Key` header, per the Stadia docs.

## Run

```sh
cd mcp/servers/stadiamaps-mcp
npm install
npm run build
node dist/index.js        # stdio MCP server
npm test                  # unit tests (pure helpers)
python3 tools/smoke.py    # live check; SKIPs honestly without a key
```

## Wire into OpenCode (`~/.config/opencode/opencode.jsonc`)

```jsonc
"stadiamaps": {
  "type": "local",
  "command": ["node", "/path/to/awesome-servers/mcp/servers/stadiamaps-mcp/dist/index.js"],
  "enabled": true,
  "environment": { "STADIA_MAPS_API_KEY": "..." },
  "timeout": 60000
}
```

## Honesty notes

- Endpoint paths follow the Stadia Maps docs as read on 2026-10-23 (Pelias
  geocoding under `/geocoding/v1`, Valhalla-family routes at their Stadia
  paths); verify against the sandbox on first live use and record what
  actually answers.
- Directions and isochrone inputs take `"lat,lon"` waypoint text, not raw
  JSON arrays — validation errors name the offending point.
