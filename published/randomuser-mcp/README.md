# Random User Generator

Fake people for demos and tests: names, emails, addresses and photos from randomuser.me - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/randomuser-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "randomuser-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/randomuser-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_users` | Generate fake users, optionally from one nationality. |
| `users_by_gender` | Generate fake users of one gender, optionally from one nationality. |

## Data source

randomuser.me API (synthetic people - nothing here is a real person)
