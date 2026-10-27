# NHTSA Vehicle Safety MCP

NHTSA: VIN decoding, safety recalls, owner complaints, make and model catalogues — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y nhtsa-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nhtsa-mcp": { "command": "npx", "args": ["-y", "nhtsa-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `decode_vin` | 17-character VIN to full vehicle spec |
| `vehicle_recalls` | Recalls with risk and remedy, by make/model/year |
| `vehicle_complaints` | Complaint counts plus crash, fire and injury totals |
| `makes_with_recalls` | Makes with recalls in a model year |
| `models_with_recalls` | Models with recalls for one make |

## Example

```
NHTSA owner complaints for 2015 honda accord: 601 total · 37 crashes · 7 fires · 26 with injuries
```

## Notes

Mixes both NHTSA services: vPIC for VIN decoding and the safety API for recalls and complaints. Wildcards are allowed inside a VIN where digits are unknown.

## Licence

MIT
