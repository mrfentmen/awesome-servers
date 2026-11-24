# Saddle Height Fit Compare

Real local JSON analysis of saddle height fit in the Bike Shop lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/saddle-height-fit-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "saddle-height-fit-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/saddle-height-fit-mcp"]
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
      "id": "bike_shop_saddle_height_fit-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "bike-shop",
        "saddle",
        "height"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "bike_shop_saddle_height_fit-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "bike-shop",
        "saddle",
        "height"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_bike_shop_saddle_height_fit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bike_shop_saddle_height_fit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bike_shop_saddle_height_fit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bike_shop_saddle_height_fit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bike_shop_saddle_height_fit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bike_shop_saddle_height_fit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bike_shop_saddle_height_fit_baseline` | Compare category counts with the configured baseline. |
| `estimate_bike_shop_saddle_height_fit_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bike_shop_saddle_height_fit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bike_shop_saddle_height_fit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bike_shop_saddle_height_fit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bike_shop_saddle_height_fit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bike_shop_saddle_height_fit_fixes` | Rank fixes by impact divided by effort. |
| `validate_bike_shop_saddle_height_fit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bike_shop_saddle_height_fit_duplicates` | Group items with the same category and normalized name. |
| `measure_bike_shop_saddle_height_fit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bike_shop_saddle_height_fit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bike_shop_saddle_height_fit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bike_shop_saddle_height_fit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bike_shop_saddle_height_fit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bike_shop_saddle_height_fit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bike_shop_saddle_height_fit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bike_shop_saddle_height_fit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bike_shop_saddle_height_fit_next_steps` | Recommend the next five actions with quick wins. |
| `open_bike_shop_saddle_height_fit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
