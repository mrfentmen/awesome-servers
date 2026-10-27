# IP Subnet

IPv4 subnet calculator: network, broadcast, masks, host ranges and CIDR splitting - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ip-subnet-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ip-subnet-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ip-subnet-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `describe_subnet` | Full breakdown of an IPv4 CIDR block: network, broadcast, mask, wildcard and usable host range. |
| `check_ip` | Check whether an IPv4 address is inside a CIDR block. |
| `split_subnet` | Split a CIDR block into equal smaller subnets with a longer prefix. |

## Data source

Pure local computation, no network calls.
