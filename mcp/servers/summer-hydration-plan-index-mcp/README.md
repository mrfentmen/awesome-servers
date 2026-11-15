# Hydration Plan Archive

Archive hydration plan by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/summer-hydration-plan-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "summer-hydration-plan-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/summer-hydration-plan-index-mcp"]
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
      "id": "hydration_plan_index-water-supply",
      "name": "Water supply",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 20,
      "quantity": 64,
      "condition": "good"
    },
    {
      "id": "hydration_plan_index-electrolyte-tabs",
      "name": "Electrolyte tabs",
      "category": "electrolyte",
      "tags": [
        "electrolyte"
      ],
      "cost": 15,
      "quantity": 10,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_hydration_plan_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hydration_plan_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hydration_plan_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hydration_plan_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hydration_plan_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hydration_plan_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hydration_plan_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_hydration_plan_index_water_ounces` | Calculate the primary metric for every item with mean and pass count. |
| `find_hydration_plan_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hydration_plan_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hydration_plan_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hydration_plan_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hydration_plan_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_hydration_plan_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hydration_plan_index_duplicates` | Group items with the same category and normalized name. |
| `measure_hydration_plan_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hydration_plan_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hydration_plan_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hydration_plan_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hydration_plan_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hydration_plan_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hydration_plan_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hydration_plan_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hydration_plan_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_hydration_plan_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
