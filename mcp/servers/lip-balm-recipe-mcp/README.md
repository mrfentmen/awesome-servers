# Lip Balm Recipe Budget

Real local JSON analysis of lip balm recipe in the Lip Balm lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/lip-balm-recipe-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "lip-balm-recipe-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/lip-balm-recipe-mcp"]
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
      "id": "lip_balm_lip_balm_recipe-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "lip-balm",
        "lip",
        "balm"
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
      "id": "lip_balm_lip_balm_recipe-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "lip-balm",
        "lip",
        "balm"
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
| `inventory_lip_balm_lip_balm_recipe` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_lip_balm_lip_balm_recipe_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_lip_balm_lip_balm_recipe_coverage` | Show category coverage ratios and unknown categories. |
| `flag_lip_balm_lip_balm_recipe_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_lip_balm_lip_balm_recipe_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_lip_balm_lip_balm_recipe_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_lip_balm_lip_balm_recipe_baseline` | Compare category counts with the configured baseline. |
| `estimate_lip_balm_lip_balm_recipe_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_lip_balm_lip_balm_recipe_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_lip_balm_lip_balm_recipe_dependencies` | Map dependency groups and show which ones are missing. |
| `test_lip_balm_lip_balm_recipe_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_lip_balm_lip_balm_recipe_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_lip_balm_lip_balm_recipe_fixes` | Rank fixes by impact divided by effort. |
| `validate_lip_balm_lip_balm_recipe_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_lip_balm_lip_balm_recipe_duplicates` | Group items with the same category and normalized name. |
| `measure_lip_balm_lip_balm_recipe_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_lip_balm_lip_balm_recipe_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_lip_balm_lip_balm_recipe_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_lip_balm_lip_balm_recipe_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_lip_balm_lip_balm_recipe_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_lip_balm_lip_balm_recipe_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_lip_balm_lip_balm_recipe_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_lip_balm_lip_balm_recipe_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_lip_balm_lip_balm_recipe_next_steps` | Recommend the next five actions with quick wins. |
| `open_lip_balm_lip_balm_recipe_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
