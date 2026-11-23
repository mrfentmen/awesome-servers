# Mcdonalds Menu Nutrition Tracker

Real local JSON analysis of mcdonalds menu nutrition in the Mcdonalds Menu lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/mcdonalds-menu-nutrition-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "mcdonalds-menu-nutrition-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/mcdonalds-menu-nutrition-mcp"]
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
      "id": "mcdonalds_menu_mcdonalds_menu_nutrition-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "mcdonalds-menu",
        "mcdonalds",
        "menu"
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
      "id": "mcdonalds_menu_mcdonalds_menu_nutrition-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "mcdonalds-menu",
        "mcdonalds",
        "menu"
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
| `inventory_mcdonalds_menu_mcdonalds_menu_nutrition` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_mcdonalds_menu_mcdonalds_menu_nutrition_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_mcdonalds_menu_mcdonalds_menu_nutrition_coverage` | Show category coverage ratios and unknown categories. |
| `flag_mcdonalds_menu_mcdonalds_menu_nutrition_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_mcdonalds_menu_mcdonalds_menu_nutrition_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_mcdonalds_menu_mcdonalds_menu_nutrition_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_mcdonalds_menu_mcdonalds_menu_nutrition_baseline` | Compare category counts with the configured baseline. |
| `estimate_mcdonalds_menu_mcdonalds_menu_nutrition_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_mcdonalds_menu_mcdonalds_menu_nutrition_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_mcdonalds_menu_mcdonalds_menu_nutrition_dependencies` | Map dependency groups and show which ones are missing. |
| `test_mcdonalds_menu_mcdonalds_menu_nutrition_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_mcdonalds_menu_mcdonalds_menu_nutrition_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_mcdonalds_menu_mcdonalds_menu_nutrition_fixes` | Rank fixes by impact divided by effort. |
| `validate_mcdonalds_menu_mcdonalds_menu_nutrition_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_mcdonalds_menu_mcdonalds_menu_nutrition_duplicates` | Group items with the same category and normalized name. |
| `measure_mcdonalds_menu_mcdonalds_menu_nutrition_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_mcdonalds_menu_mcdonalds_menu_nutrition_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_mcdonalds_menu_mcdonalds_menu_nutrition_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_mcdonalds_menu_mcdonalds_menu_nutrition_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_mcdonalds_menu_mcdonalds_menu_nutrition_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_mcdonalds_menu_mcdonalds_menu_nutrition_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_mcdonalds_menu_mcdonalds_menu_nutrition_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_mcdonalds_menu_mcdonalds_menu_nutrition_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_mcdonalds_menu_mcdonalds_menu_nutrition_next_steps` | Recommend the next five actions with quick wins. |
| `open_mcdonalds_menu_mcdonalds_menu_nutrition_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
