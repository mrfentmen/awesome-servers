# Tire Wear Audit

Audit front, rear, spare and winter tires for tread depth and replacement risk. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cars-tire-wear-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cars-tire-wear-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cars-tire-wear-check-mcp"]
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
      "id": "tire-front",
      "name": "Front left",
      "category": "front",
      "tags": [
        "summer"
      ],
      "cost": 120,
      "quantity": 5.5,
      "condition": "good"
    },
    {
      "id": "tire-rear",
      "name": "Rear right",
      "category": "rear",
      "tags": [
        "summer"
      ],
      "cost": 120,
      "quantity": 4.2,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_tire_wear` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_tire_wear_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_tire_wear_coverage` | Show category coverage ratios and unknown categories. |
| `flag_tire_wear_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_tire_wear_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_tire_wear_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_tire_wear_baseline` | Compare category counts with the configured baseline. |
| `estimate_tire_wear_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_tire_wear_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_tire_wear_dependencies` | Map dependency groups and show which ones are missing. |
| `test_tire_wear_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_tire_wear_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_tire_wear_fixes` | Rank fixes by impact divided by effort. |
| `validate_tire_wear_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_tire_wear_duplicates` | Group items with the same category and normalized name. |
| `measure_tire_wear_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_tire_wear_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_tire_wear_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_tire_wear_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_tire_wear_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_tire_wear_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_tire_wear_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_tire_wear_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_tire_wear_next_steps` | Recommend the next five actions with quick wins. |
| `open_tire_wear_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
