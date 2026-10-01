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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `secret_entropy_audit`
* `secret_set_diff`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
