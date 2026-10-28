# port-throughput-mcp

US port cargo throughput: rankings, volumes by cargo type and year for every major port - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/port-throughput-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "port-throughput-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/port-throughput-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `top_ports` | Busiest ports by cargo volume |
| `port_detail` | All cargo rows for one port in a year |
| `ports_in_state` | Ports in a US state |
| `port_trend` | Year-by-year volume trend for one port |
| `cargo_types` | Cargo types and units tracked by the dataset |

## Data source

USDOT BTS port data
