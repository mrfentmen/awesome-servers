# CelesTrak

Satellite orbits and catalogue data: TLEs, groups and object lookups.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/celestrak-mcp
```

## Tools

| Tool | What it does |
|---|---|
| `satellites_by_group` | Satellites in a named CelesTrak group, with current orbital elements |
| `satellite_by_catnr` | Orbital elements for one satellite by NORAD catalogue number |
| `satellite_by_name` | Find satellites by name |
| `satcat_by_catnr` | Catalogue entry for a satellite: launch date, orbit class and radar cross-section |
| `groups` | List the satellite groups this server can fetch |

## Data source

CelesTrak API
