# doppler-mcp

Doppler API: projects, configs, secrets listing and download. Needs service or personal token.

## Setup

```bash
export DOPPLER_API_KEY=...
```

## Tools

- `list_projects` — Doppler projects with names and descriptions.
- `list_configs` — Doppler configs (environments) in a project.
- `list_secrets` — Secrets in a Doppler config with raw and computed values plus visibility.
- `download_secrets` — Doppler config secrets as JSON, env file, or dotenv for local use.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `inheritable_secrets`
* `secret_diff`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-doppler-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
