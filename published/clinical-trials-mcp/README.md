# ClinicalTrials.gov MCP

ClinicalTrials.gov v2 API: trial search, sponsors, eligibility, sites and outcomes — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/clinical-trials-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "clinical-trials-mcp": {
      "command": "npx",
      "args": ["-y", "clinical-trials-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_studies` | Free-text trial search |
| `study_detail` | Full protocol summary for one NCT id |
| `recruiting_by_condition` | Only currently recruiting trials |
| `by_sponsor` | Trials run by a company or institution |
| `intervention_search` | Trials testing a drug, device or procedure |
| `study_locations` | Trial sites by country and city |

## Example

```
NCT00801892 — Obstructive Sleep Apnea (OSA), Sleepiness, and Activity in Diabetes Management
Status: COMPLETED · started 2009-04 · completes 2012-04
Phase: PHASE3 · type: INTERVENTIONAL · enrollment: 23
```

## Notes

Uses the v2 REST API (`/api/v2/studies`). No key, no signup. Results are relevance-ranked by ClinicalTrials.gov.

## Licence

MIT
