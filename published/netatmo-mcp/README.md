# netatmo-mcp

Netatmo API: weather stations, home data, device status, camera events. Token auto-refresh.

## Setup

```bash
export NETATMO_ACCESS_TOKEN=...
```

Needs a Netatmo access token from dev.netatmo.com. Optional NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET and NETATMO_REFRESH_TOKEN enable automatic token refresh.

## Tools

- `get_weather_stations` — Netatmo weather stations: indoor/outdoor modules, temperature, humidity, CO2, noise, pressure.
- `get_home_data` — Netatmo homes: rooms, modules, cameras, schedules, place info.
- `get_home_status` — Live Netatmo home status: thermostats, valves, windows, presence per room.
- `get_events` — Recent Netatmo home events: motion, doorbell, alarms, person seen.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
