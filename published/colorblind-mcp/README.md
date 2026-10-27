# Colour Blindness

Simulate colour-vision deficiency on hex colours and palettes, and measure how far colours collapse - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/colorblind-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "colorblind-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/colorblind-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `simulate_color` | Show how one hex colour appears with a given colour-vision deficiency. |
| `simulate_palette` | Simulate a whole palette and flag pairs that become hard to tell apart. |
| `color_distance` | Perceptual distance between two colours, before and after simulation. |

## Data source

Pure local computation, no network calls.
