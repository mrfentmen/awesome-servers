# TOTP

Generate and verify TOTP two-factor codes offline - RFC 6238 with SHA-1/256/512, plus fresh base32 secrets and otpauth URIs, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/totp-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "totp-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/totp-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `generate_totp` | Current TOTP code for a base32 secret, with seconds left and the next code. Pass at to evaluate a specific moment. |
| `verify_totp` | Check a TOTP code against a secret within a drift window, using a constant-time comparison. |
| `generate_secret` | Create a fresh random base32 secret, optionally with an otpauth:// URI for authenticator apps. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
