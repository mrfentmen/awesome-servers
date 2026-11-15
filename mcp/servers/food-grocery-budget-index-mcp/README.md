# Grocery Budget Archive

Archive grocery budget by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/food-grocery-budget-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "food-grocery-budget-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/food-grocery-budget-index-mcp"]
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
      "id": "grocery-apples",
      "name": "Apples",
      "category": "produce",
      "tags": [
        "fresh"
      ],
      "cost": 4,
      "quantity": 4,
      "expires": "2026-11-25",
      "condition": "good"
    },
    {
      "id": "grocery-chicken",
      "name": "Chicken breast",
      "category": "protein",
      "tags": [
        "fresh"
      ],
      "cost": 12,
      "quantity": 12,
      "expires": "2026-11-18",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_grocery_budget_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_grocery_budget_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_grocery_budget_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_grocery_budget_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_grocery_budget_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_grocery_budget_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_grocery_budget_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_grocery_budget_index_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_grocery_budget_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_grocery_budget_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_grocery_budget_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_grocery_budget_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_grocery_budget_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_grocery_budget_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_grocery_budget_index_duplicates` | Group items with the same category and normalized name. |
| `measure_grocery_budget_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_grocery_budget_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_grocery_budget_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_grocery_budget_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_grocery_budget_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_grocery_budget_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_grocery_budget_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_grocery_budget_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_grocery_budget_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_grocery_budget_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
