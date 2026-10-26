# nyc-arrests-mcp

NYPD arrest records (NYC Open Data, keyless; optional NYC_APP_TOKEN): search by date, borough, offense and demographics across year-to-date plus the 2006-2023 archive.

**Honest limit:** no public NYC dataset contains arrestee names or birthdays (PII is not published). For name-based lookups use NYS WebCriminal (manual) or PACER with an account (federal, paid).

## Tools

- `search_arrests` — Arrests by date, borough, offense, demographics.
- `arrest_details` — One record by arrest key.
- `historic_search` — 2006-2023 archive, same filters.
- `top_offenses` — Offense ranking.
- `precinct_activity` — Recent arrests in a precinct.
- `borough_stats` — Felony/misd/violation split.
- `recent_felonies` — Latest felony arrests.
- `recent_misdemeanors` — Latest misdemeanor arrests.
- `offense_lookup` — Arrests by PD code.
- `arrest_map_data` — Arrests in a lat/lon box.

## Source

[nyc-arrests-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/nyc-arrests-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `arrest_trend`
* `borough_category_matrix`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-nyc-arrests-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
