# ISS Tracker MCP

Live ISS tracking: position, speed, daylight state, ground tracks, TLE and overhead checks — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y iss-tracker-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "iss-tracker-mcp": { "command": "npx", "args": ["-y", "iss-tracker-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_position` | Where the ISS is right now: lat/lon, altitude, speed, sunlit or dark |
| `position_track` | Recent ground track sampled over the past N minutes |
| `visibility_report` | Daylight/eclipse forecast for the next hours |
| `list_satellites` | Which satellites the API tracks |
| `satellite_tle` | Current orbital elements (TLE) |
| `overhead_check` | Is the ISS above a lat/lon now, and how far away |

## Example

```
ISS (id 25544) at 2026-10-27 02:14:07 UTC:
  Position: 37.0954, -82.5839
  Altitude: 419.6 km · velocity 27,583 km/h
  Visibility: daylight · footprint radius 2,271 km
```

## Notes

Uses the keyless WhereTheISS.at API. All satellite tools default to the ISS
(NORAD 25544) but accept any satellite id the API covers. Times are UTC.

## Licence

MIT
