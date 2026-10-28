# Aviation Weather

Aviation weather from NOAA: METAR, TAF, PIREP and station information.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/aviationweather-mcp
```

## Tools

| Tool | What it does |
|---|---|
| `metar` | Current METAR observations for one or more stations |
| `taf` | Terminal aerodrome forecasts for one or more stations |
| `airport_info` | Airport details: name, location, elevation and radio frequencies |
| `station_info` | Reporting station metadata for an airport code |
| `decode_metar` | Decode a raw METAR string into wind, visibility, cloud and pressure fields |

## Data source

aviationweather.gov API
