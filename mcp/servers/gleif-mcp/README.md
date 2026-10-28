# GLEIF

Legal entity identifiers: look up LEIs, parent companies and reporting status.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/gleif-mcp
```

## Tools

| Tool | What it does |
|---|---|
| `search_by_name` | Search legal entities by name and return their LEIs |
| `lei_record` | Full LEI record: legal name, address and registration status |
| `ultimate_parent` | Ultimate parent company of an LEI |
| `direct_children` | Direct children of an LEI |
| `fuzzy_search` | Fuzzy legal-name completion to find near matches |

## Data source

GLEIF API
