# Park and Ride Planning Audit

Plan park and ride by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/transit-park-and-ride-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "transit-park-and-ride-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/transit-park-and-ride-plan-mcp"]
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
      "id": "park_and_ride_plan-main-lot",
      "name": "Main lot",
      "category": "lot",
      "tags": [
        "paved",
        "daily"
      ],
      "cost": 4,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "park_and_ride_plan-north-lot",
      "name": "North lot",
      "category": "lot",
      "tags": [
        "gravel",
        "overflow"
      ],
      "cost": 4,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_park_and_ride_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_park_and_ride_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_park_and_ride_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_park_and_ride_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_park_and_ride_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_park_and_ride_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_park_and_ride_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_park_and_ride_plan_walk_minutes` | Calculate the primary metric for every item with mean and pass count. |
| `find_park_and_ride_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_park_and_ride_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_park_and_ride_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_park_and_ride_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_park_and_ride_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_park_and_ride_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_park_and_ride_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_park_and_ride_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_park_and_ride_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_park_and_ride_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_park_and_ride_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_park_and_ride_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_park_and_ride_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_park_and_ride_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_park_and_ride_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_park_and_ride_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_park_and_ride_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
