# Lotion Bar Recipe Matcher

Real local JSON analysis of lotion bar recipe in the Lotion Bar lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/lotion-bar-recipe-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "lotion-bar-recipe-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/lotion-bar-recipe-mcp"]
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
      "id": "lotion_bar_lotion_bar_recipe-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "lotion-bar",
        "lotion",
        "bar"
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
      "id": "lotion_bar_lotion_bar_recipe-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "lotion-bar",
        "lotion",
        "bar"
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
| `inventory_lotion_bar_lotion_bar_recipe` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_lotion_bar_lotion_bar_recipe_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_lotion_bar_lotion_bar_recipe_coverage` | Show category coverage ratios and unknown categories. |
| `flag_lotion_bar_lotion_bar_recipe_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_lotion_bar_lotion_bar_recipe_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_lotion_bar_lotion_bar_recipe_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_lotion_bar_lotion_bar_recipe_baseline` | Compare category counts with the configured baseline. |
| `estimate_lotion_bar_lotion_bar_recipe_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_lotion_bar_lotion_bar_recipe_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_lotion_bar_lotion_bar_recipe_dependencies` | Map dependency groups and show which ones are missing. |
| `test_lotion_bar_lotion_bar_recipe_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_lotion_bar_lotion_bar_recipe_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_lotion_bar_lotion_bar_recipe_fixes` | Rank fixes by impact divided by effort. |
| `validate_lotion_bar_lotion_bar_recipe_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_lotion_bar_lotion_bar_recipe_duplicates` | Group items with the same category and normalized name. |
| `measure_lotion_bar_lotion_bar_recipe_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_lotion_bar_lotion_bar_recipe_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_lotion_bar_lotion_bar_recipe_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_lotion_bar_lotion_bar_recipe_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_lotion_bar_lotion_bar_recipe_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_lotion_bar_lotion_bar_recipe_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_lotion_bar_lotion_bar_recipe_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_lotion_bar_lotion_bar_recipe_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_lotion_bar_lotion_bar_recipe_next_steps` | Recommend the next five actions with quick wins. |
| `open_lotion_bar_lotion_bar_recipe_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
