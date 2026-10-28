# Password Tools

Generate strong passwords and passphrases and estimate password strength, all offline with a crypto RNG, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/password-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "password-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/password-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `generate_password` | Random password using Node's crypto RNG, with an unbiased shuffle and a per-class character guarantee. |
| `generate_passphrase` | Passphrase drawn from the built-in word list, with an honest entropy estimate. |
| `check_password_strength` | Estimate the entropy of a password, flag repeated runs, sequences and dictionary words, and suggest fixes. |
| `list_password_words` | Look at the words the passphrase generator draws from. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
