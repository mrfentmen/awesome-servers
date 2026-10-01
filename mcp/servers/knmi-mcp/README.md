# knmi-mcp

KNMI Data Platform open data: datasets, versions, file listings and downloads (weather, climate, radar).

## Setup

```bash
export KNMI_API_KEY=...
```

The API key goes in the Authorization header as-is (no Bearer prefix).

## Tools

- `list_datasets` — KNMI open datasets: weather stations, radar, climate series, forecasts.
- `list_versions` — Available versions of a KNMI dataset.
- `list_files` — Files in a KNMI dataset version with sizes and download links.
- `get_file` — Download one KNMI dataset file (CSV/BUFR/NetCDF metadata) as text, truncated.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
