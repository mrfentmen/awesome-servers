# Restaurant Wait Audit

Audit restaurant options by wait time, category coverage, spend and service gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/food-restaurant-wait-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "food-restaurant-wait-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/food-restaurant-wait-check-mcp"]
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
      "id": "wait-taco",
      "name": "Taco stand",
      "category": "quick",
      "tags": [
        "walk-in"
      ],
      "cost": 12,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "wait-diner",
      "name": "Corner diner",
      "category": "casual",
      "tags": [
        "table"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_restaurant_wait` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_restaurant_wait_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_restaurant_wait_coverage` | Show category coverage ratios and unknown categories. |
| `flag_restaurant_wait_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_restaurant_wait_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_restaurant_wait_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_restaurant_wait_baseline` | Compare category counts with the configured baseline. |
| `estimate_restaurant_wait_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_restaurant_wait_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_restaurant_wait_dependencies` | Map dependency groups and show which ones are missing. |
| `test_restaurant_wait_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_restaurant_wait_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_restaurant_wait_fixes` | Rank fixes by impact divided by effort. |
| `validate_restaurant_wait_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_restaurant_wait_duplicates` | Group items with the same category and normalized name. |
| `measure_restaurant_wait_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_restaurant_wait_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_restaurant_wait_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_restaurant_wait_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_restaurant_wait_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_restaurant_wait_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_restaurant_wait_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_restaurant_wait_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_restaurant_wait_next_steps` | Recommend the next five actions with quick wins. |
| `open_restaurant_wait_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
