# nyc311-mcp

Explore public NYC 311 service-request data for civic research, neighborhood-level trend analysis, and city-service questions.

## Tools

- `search_requests`: search bounded request metadata by complaint type, borough, agency, and dates.
- `count_requests`: aggregate request totals by complaint type with the same filters.

The server intentionally excludes street addresses, latitude, longitude, and other precise location fields. NYC 311 records are reports of requests, not verified findings, and may contain reporting delays or duplicates. The public Socrata API requires no key for these read-only queries.

## Run

```bash
npm install
npm run build
node dist/index.js
```
