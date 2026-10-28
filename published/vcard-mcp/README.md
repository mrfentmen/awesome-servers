# vCard

Read and build vCard contacts offline - parse .vcf cards or JSON, and generate vCard 4.0 text, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/vcard-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "vcard-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/vcard-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_vcard` | Parse .vcf text and show each contact's name, organisation, phones, emails, address and note. |
| `vcard_to_json` | Convert .vcf text into structured JSON: names split into parts, typed phones and emails. |
| `create_vcard` | Build vCard 4.0 text for one contact with escaped values and tel: URIs. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
