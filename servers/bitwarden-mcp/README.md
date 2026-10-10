# bitwarden-mcp

Bitwarden public API: organization members, collections, groups, event logs. Needs API key.

## Setup

```bash
export BITWARDEN_CLIENT_ID=...
```

Needs a Bitwarden API key (client id + secret) from Account Settings, plus org access. Optional BITWARDEN_API_URL / BITWARDEN_IDENTITY_URL for self-hosted servers.

## Tools

- `list_members` — Organization members: names, emails, status, collections access.
- `list_collections` — Organization collections with member and group assignments.
- `list_groups` — Organization groups with member ids and collection access.
- `get_events` — Organization event log: logins, item actions, admin changes. Optional date range.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `collection_access`
* `two_factor_coverage`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-bitwarden-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
