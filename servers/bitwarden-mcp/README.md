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

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
