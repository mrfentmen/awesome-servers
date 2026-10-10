# ICS Generator MCP

Generate real calendar event files in the standard ics format. Compatible with Google Calendar, Apple Calendar, and Outlook.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `create_event`  Create a calendar event with times and details.
* `create_reminder`  Create an all day reminder.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `create_holiday_calendar`
* `create_sun_calendar`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ics-generator-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
