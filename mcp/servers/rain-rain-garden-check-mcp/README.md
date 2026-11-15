# Rain Garden Audit

Audit basin size, soil, native plants and overflow for a rain garden. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/rain-rain-garden-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "rain-rain-garden-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/rain-rain-garden-check-mcp"]
    }
  }
}
```

## Input

Pass an array, an object with an `items` array, or a JSON file path. Every item needs a name and category. Cost, quantity, dates, condition, tags and notes are optional.

```json
{
  "items": [
    {
      "id": "rain_garden-rain-garden-basin",
      "name": "Rain garden basin",
      "category": "basin",
      "tags": [
        "basin"
      ],
      "cost": 300,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "rain_garden-compost",
      "name": "Compost",
      "category": "soil",
      "tags": [
        "soil"
      ],
      "cost": 40,
      "quantity": 2,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_rain_garden` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_rain_garden_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_rain_garden_coverage` | Show category coverage ratios and unknown categories. |
| `flag_rain_garden_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_rain_garden_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_rain_garden_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_rain_garden_baseline` | Compare category counts with the configured baseline. |
| `estimate_rain_garden_drainage_area` | Calculate the primary metric for every item with mean and pass count. |
| `find_rain_garden_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_rain_garden_dependencies` | Map dependency groups and show which ones are missing. |
| `test_rain_garden_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_rain_garden_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_rain_garden_fixes` | Rank fixes by impact divided by effort. |
| `validate_rain_garden_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_rain_garden_duplicates` | Group items with the same category and normalized name. |
| `measure_rain_garden_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_rain_garden_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_rain_garden_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_rain_garden_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_rain_garden_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_rain_garden_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_rain_garden_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_rain_garden_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_rain_garden_next_steps` | Recommend the next five actions with quick wins. |
| `open_rain_garden_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
