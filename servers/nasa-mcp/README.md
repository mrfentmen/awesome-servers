# nasa-mcp

Unified NASA server: APOD, asteroids (NEO), Mars rover photos, InSight weather, and TechPort projects.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `apod` — Astronomy Picture of the Day.
- `neo` — Near Earth Objects in a date range.
- `marsPhotos` — Mars rover photos.
- `latestWeather` — Latest InSight Mars weather.
- `asteroids` — Browse near earth objects.
- `techPort` — One NASA TechPort project.

- `neo_lookup`
- `epic_images`
- `apod_dated`
- `earth_assets`
- `tech_patents`
## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
