# Bitcoin Addresses

Validate Bitcoin addresses offline with real base58check and bech32/bech32m checksums, and decode BIP-32 derivation paths, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/btc-address-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "btc-address-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/btc-address-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `validate_btc_address` | Check an address's checksum and shape: P2PKH, P2SH, P2WPKH, P2WSH or P2TR, with network and hash. |
| `derivation_path_info` | Explain a BIP-32 derivation path level by level, including the purpose presets and hardened flags. |
| `list_address_types` | The address types this checker recognises, with their prefixes and version bytes. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
