# Recipe Scaling Audit

Audit recipe ingredients for servings, cost, coverage and scaling gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/food-recipe-scaling-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "food-recipe-scaling-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/food-recipe-scaling-check-mcp"]
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
      "id": "recipe-rice",
      "name": "Jasmine rice",
      "category": "base",
      "tags": [
        "staple"
      ],
      "cost": 3,
      "quantity": 6,
      "expires": "2027-12-01",
      "condition": "new"
    },
    {
      "id": "recipe-chicken",
      "name": "Chicken thighs",
      "category": "protein",
      "tags": [
        "fresh"
      ],
      "cost": 8,
      "quantity": 4,
      "expires": "2026-11-20",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_recipe_scaling` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_recipe_scaling_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_recipe_scaling_coverage` | Show category coverage ratios and unknown categories. |
| `flag_recipe_scaling_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_recipe_scaling_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_recipe_scaling_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_recipe_scaling_baseline` | Compare category counts with the configured baseline. |
| `estimate_recipe_scaling_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_recipe_scaling_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_recipe_scaling_dependencies` | Map dependency groups and show which ones are missing. |
| `test_recipe_scaling_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_recipe_scaling_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_recipe_scaling_fixes` | Rank fixes by impact divided by effort. |
| `validate_recipe_scaling_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_recipe_scaling_duplicates` | Group items with the same category and normalized name. |
| `measure_recipe_scaling_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_recipe_scaling_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_recipe_scaling_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_recipe_scaling_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_recipe_scaling_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_recipe_scaling_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_recipe_scaling_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_recipe_scaling_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_recipe_scaling_next_steps` | Recommend the next five actions with quick wins. |
| `open_recipe_scaling_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
