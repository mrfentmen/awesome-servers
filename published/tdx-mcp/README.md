# tdx-mcp

Taiwan TDX transport: TRA and THSR stations, live boards, daily timetables. Needs app keys.

## Setup

```bash
export TDX_CLIENT_ID=...
```

Needs free TDX client id + secret (TDX_CLIENT_SECRET) from tdx.transportdata.tw.

## Tools

- `list_tra_stations` — Taiwan Railway stations with ids, names, coordinates for live boards.
- `get_tra_liveboard` — Live Taiwan Railway departures and arrivals for a station.
- `list_thsr_stations` — Taiwan High Speed Rail stations with ids and addresses.
- `get_tra_timetable` — Taiwan Railway daily timetable for a station on a date.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
