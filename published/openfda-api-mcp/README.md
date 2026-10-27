# openFDA MCP

openFDA: drug labels, adverse events, drug/device/food recalls and NDC directory — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openfda-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openfda-api-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/openfda-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `drug_labels` | Label text for a brand name |
| `label_sections` | Indications, dosage, warnings and more |
| `adverse_events` | FAERS reports naming a drug |
| `drug_recalls` | Enforcement reports for drugs |
| `device_recalls` | Enforcement reports for devices |
| `food_recalls` | Enforcement reports for food |
| `ndc_lookup` | NDC directory entries with packaging |

## Example

```
Device recalls matching "infusion pump" (309 total):

1. 20180613 · class Class II · Terminated
   Baxter SIGMA Spectrum Infusion Pump with Master Drug Library (Version 8)
   Firm: Baxter Healthcare Corporation
```

## Notes

Every response carries the openFDA caveat: the data is unvalidated and a report does not mean the product caused the event. Anonymous access is rate limited to 240 requests/minute per IP.

## Licence

MIT
