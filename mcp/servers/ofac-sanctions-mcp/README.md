# ofac-sanctions-mcp

OFAC sanctions screening: search the SDN and consolidated lists by name, program or entity type and pull one entry by its OFAC number.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ofac-sanctions-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ofac-sanctions-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ofac-sanctions-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `screen_name` | Screen a person or company name against the SDN list |
| `entry_detail` | One SDN entry by its OFAC number |
| `entries_by_program` | SDN entries in one sanctions program |
| `entries_by_type` | SDN entries of one type, such as vessels or entities |
| `list_stats` | How many SDN entries and which programs they cover |

## Data source

OFAC sanctions lists
