# Skincare Ingredient Stack Audit

Audit a skincare routine for active-ingredient overlap, missing steps, duplicate products and shelf-life risk. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/skincare-ingredient-stack-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "skincare-ingredient-stack-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/skincare-ingredient-stack-check-mcp"]
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
      "id": "skin-cleanser",
      "name": "Gentle gel cleanser",
      "category": "cleanser",
      "tags": [
        "gentle"
      ],
      "cost": 18,
      "quantity": 1,
      "acquired": "2026-05-01",
      "expires": "2027-05-01",
      "condition": "good"
    },
    {
      "id": "skin-retinol",
      "name": "Retinol serum",
      "category": "treatment",
      "tags": [
        "retinol"
      ],
      "cost": 40,
      "quantity": 1,
      "acquired": "2026-08-01",
      "expires": "2027-02-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_ingredient_stack` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ingredient_stack_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ingredient_stack_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ingredient_stack_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ingredient_stack_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ingredient_stack_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ingredient_stack_baseline` | Compare category counts with the configured baseline. |
| `estimate_ingredient_stack_active_overlap` | Calculate the primary metric for every item with mean and pass count. |
| `find_ingredient_stack_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ingredient_stack_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ingredient_stack_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ingredient_stack_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ingredient_stack_fixes` | Rank fixes by impact divided by effort. |
| `validate_ingredient_stack_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ingredient_stack_duplicates` | Group items with the same category and normalized name. |
| `measure_ingredient_stack_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ingredient_stack_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ingredient_stack_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ingredient_stack_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ingredient_stack_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ingredient_stack_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ingredient_stack_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ingredient_stack_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ingredient_stack_next_steps` | Recommend the next five actions with quick wins. |
| `open_ingredient_stack_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
