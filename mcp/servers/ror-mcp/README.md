# ROR MCP

ROR: search 110k+ research organizations by name, country and type with stable ids — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y ror-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ror-mcp": { "command": "npx", "args": ["-y", "ror-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_organizations` | Search by name or acronym, optionally in one country |
| `organization_detail` | Full record: aliases, labels, location, links, dates |
| `organizations_by_country` | Sample of organizations registered in a country |
| `organizations_by_type` | Education, company, government, healthcare, funder... |
| `organization_batch` | Summaries for up to 10 ROR ids at once |

## Example

```
1. ETH Zurich (ETH)
   Zurich, Switzerland · education · est. 1855
   05a28rw58 · https://ethz.ch
```

## Notes

Uses the keyless ROR v2 API (api.ror.org). ROR ids are the standard way to
disambiguate institution names in research software, so these tools are handy
before writing metadata or matching affiliation strings.

## Licence

MIT
