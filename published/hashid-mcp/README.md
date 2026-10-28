# Hash Identifier

Identify hash types offline: match a hex or crypt string against known algorithms, list lengths and hashcat modes - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hashid-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hashid-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hashid-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `identify_hash` | Guess which hash algorithm(s) produced a string, with hashcat mode numbers where known. |
| `hash_details` | Parse the structure of a password hash: bcrypt cost and salt, argon2 parameters, SHA-crypt rounds and salts. |
| `hash_lengths` | Reference table of common hash algorithms: hex length, byte length and hashcat mode. |

## Data source

Pattern matching on well-known hash and password-hash formats, implemented locally
