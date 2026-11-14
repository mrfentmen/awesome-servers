# Car Maintenance Audit

Audit oil, tires, brakes and filters by miles since service and replacement risk. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cars-car-maintenance-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cars-car-maintenance-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cars-car-maintenance-check-mcp"]
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
      "id": "car-oil",
      "name": "Engine oil",
      "category": "oil",
      "tags": [
        "synthetic"
      ],
      "cost": 60,
      "quantity": 3000,
      "condition": "good"
    },
    {
      "id": "car-tires",
      "name": "All-season tires",
      "category": "tires",
      "tags": [
        "tread"
      ],
      "cost": 500,
      "quantity": 7000,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_car_maintenance` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_car_maintenance_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_car_maintenance_coverage` | Show category coverage ratios and unknown categories. |
| `flag_car_maintenance_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_car_maintenance_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_car_maintenance_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_car_maintenance_baseline` | Compare category counts with the configured baseline. |
| `estimate_car_maintenance_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_car_maintenance_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_car_maintenance_dependencies` | Map dependency groups and show which ones are missing. |
| `test_car_maintenance_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_car_maintenance_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_car_maintenance_fixes` | Rank fixes by impact divided by effort. |
| `validate_car_maintenance_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_car_maintenance_duplicates` | Group items with the same category and normalized name. |
| `measure_car_maintenance_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_car_maintenance_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_car_maintenance_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_car_maintenance_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_car_maintenance_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_car_maintenance_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_car_maintenance_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_car_maintenance_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_car_maintenance_next_steps` | Recommend the next five actions with quick wins. |
| `open_car_maintenance_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
