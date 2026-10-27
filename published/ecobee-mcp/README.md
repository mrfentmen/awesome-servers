# ecobee MCP

MCP server for ecobee thermostats: list, runtime, sensors. Needs API key + tokens.

## Setup (one-time PIN flow)

1. Get an API key at https://www.ecobee.com/home/developer/ (free).
2. Get a PIN: open `https://api.ecobee.com/authorize?response_type=ecobeePin&client_id=YOUR_KEY&scope=smartRead` — it shows a 4-character code.
3. Within 9 minutes, enter the code at https://www.ecobee.com/consumerportal/.
4. Exchange it for tokens:
   ```bash
   curl -X POST 'https://api.ecobee.com/token' \
     -d 'grant_type=ecobeePin&code=YOUR_PIN&client_id=YOUR_KEY'
   ```
   Save the `refresh_token`, then:

```bash
export ECOBEE_API_KEY=your_key
export ECOBEE_REFRESH_TOKEN=your_refresh_token
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client. It auto-refreshes the access token.

## Tools at a glance

- `list_thermostats`: Temperature, humidity, mode, sensors.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to ecobee's API. All tools are read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
