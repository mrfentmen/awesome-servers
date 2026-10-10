# config-weather-mcp

Config Weather reports whether a project feels clear, cloudy, or stormy based on configuration file count, environment reference pressure, duplicate key signals, and format spread.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_config_weather` with a local project path.

## Privacy and limits

The scanner reads bounded configuration and source-like files but returns only counts and broad categories. Values, secrets, paths, source text, and configuration key names are suppressed. This is a complexity signal, not a configuration validator.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `inspect_env_contract`
* `inspect_config_layers`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-config-weather-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
