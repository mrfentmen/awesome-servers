# infisical-mcp

Infisical API: list, read, create, update and delete secrets via universal auth.

## Setup

```bash
export INFISICAL_CLIENT_ID=...
```

Needs an Infisical machine identity (client id + secret). Optional INFISICAL_SITE_URL for self-hosted instances.

## Tools

- `list_secrets` — Secrets in an Infisical project environment and path.
- `get_secret` — Single Infisical secret value by key.
- `create_secret` — Create an Infisical secret. Fails if the key already exists (use update).
- `update_secret` — Change an existing Infisical secret value.
- `delete_secret` — Delete an Infisical secret by key.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).


