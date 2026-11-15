# Water District Audit

Audit supply, quality, conservation and billing for a California water district. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/california-water-district-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "california-water-district-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/california-water-district-check-mcp"]
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
      "id": "water_district-water-supply",
      "name": "Water supply",
      "category": "supply",
      "tags": [
        "supply"
      ],
      "cost": 0,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "water_district-quality-test",
      "name": "Quality test",
      "category": "quality",
      "tags": [
        "quality"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_water_district` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_water_district_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_water_district_coverage` | Show category coverage ratios and unknown categories. |
| `flag_water_district_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_water_district_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_water_district_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_water_district_baseline` | Compare category counts with the configured baseline. |
| `estimate_water_district_gallons_per_day` | Calculate the primary metric for every item with mean and pass count. |
| `find_water_district_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_water_district_dependencies` | Map dependency groups and show which ones are missing. |
| `test_water_district_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_water_district_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_water_district_fixes` | Rank fixes by impact divided by effort. |
| `validate_water_district_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_water_district_duplicates` | Group items with the same category and normalized name. |
| `measure_water_district_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_water_district_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_water_district_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_water_district_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_water_district_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_water_district_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_water_district_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_water_district_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_water_district_next_steps` | Recommend the next five actions with quick wins. |
| `open_water_district_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
