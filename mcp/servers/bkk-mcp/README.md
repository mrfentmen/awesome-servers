# bkk-mcp

Budapest BKK Futar: stops by location plus live arrivals and departures.

## Setup

```bash
export BKK_APP_ID=...
```

Needs free BKK Futar app id + key (BKK_APP_KEY): app_id and app_key ride along on every call. Register at https://opendata.bkk.hu.

## Tools

- `search_stops` — BKK stops near coordinates with ids, names and routes.
- `get_departures` — Live BKK arrivals and departures for a stop with delays and trip headsigns.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
