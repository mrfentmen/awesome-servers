# Driveway Clearing Planning Audit

Plan driveway clearing by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/snow-driveway-clear-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "snow-driveway-clear-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/snow-driveway-clear-plan-mcp"]
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
      "id": "driveway_clear_plan-driveway-snow",
      "name": "Driveway snow",
      "category": "driveway",
      "tags": [
        "driveway"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "fair"
    },
    {
      "id": "driveway_clear_plan-front-walk-snow",
      "name": "Front walk snow",
      "category": "walkway",
      "tags": [
        "walkway"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_driveway_clear_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_driveway_clear_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_driveway_clear_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_driveway_clear_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_driveway_clear_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_driveway_clear_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_driveway_clear_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_driveway_clear_plan_snow_depth` | Calculate the primary metric for every item with mean and pass count. |
| `find_driveway_clear_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_driveway_clear_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_driveway_clear_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_driveway_clear_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_driveway_clear_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_driveway_clear_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_driveway_clear_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_driveway_clear_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_driveway_clear_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_driveway_clear_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_driveway_clear_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_driveway_clear_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_driveway_clear_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_driveway_clear_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_driveway_clear_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_driveway_clear_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_driveway_clear_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
