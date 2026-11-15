# Heat Index Budget Audit

Audit heat index budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/summer-heat-index-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "summer-heat-index-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/summer-heat-index-cost-mcp"]
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
      "id": "heat_index_budget-indoor-cooling",
      "name": "Indoor cooling",
      "category": "indoor",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "heat_index_budget-outdoor-misting",
      "name": "Outdoor misting",
      "category": "outdoor",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_heat_index_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_heat_index_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_heat_index_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_heat_index_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_heat_index_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_heat_index_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_heat_index_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_heat_index_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_heat_index_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_heat_index_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_heat_index_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_heat_index_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_heat_index_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_heat_index_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_heat_index_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_heat_index_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_heat_index_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_heat_index_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_heat_index_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_heat_index_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_heat_index_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_heat_index_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_heat_index_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_heat_index_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_heat_index_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
