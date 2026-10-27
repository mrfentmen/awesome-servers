# Launch Library MCP

Launch Library 2: upcoming and past rocket launches, missions, orbits, space events and agencies — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y launch-library-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "launch-library-mcp": { "command": "npx", "args": ["-y", "launch-library-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `upcoming_launches` | Next launches worldwide, soonest first |
| `recent_launches` | Recent launches with outcomes |
| `launch_detail` | Window, mission, orbit and image for one launch |
| `search_launches` | Search the whole launch history |
| `upcoming_events` | Space events beyond launches |
| `list_agencies` | Featured agencies, filterable by country |

## Example

```
1. Falcon 9 Block 5 | Starlink Group 15-16
   2026-10-27 07:25Z · Go · SpaceX
   Falcon 9 · Space Launch Complex 4E — Vandenberg SFB, CA, USA
```

## Notes

The free tier allows roughly 15 requests an hour per IP, so the server reports rate limiting plainly instead of retrying in a loop. Country filters want the 3-letter ISO code (USA, JPN).

## Licence

MIT
