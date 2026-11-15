# Summer Wardrobe Budget Audit

Audit summer wardrobe budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/summer-summer-wardrobe-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "summer-summer-wardrobe-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/summer-summer-wardrobe-cost-mcp"]
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
      "id": "summer_wardrobe_budget-linen-shirts",
      "name": "Linen shirts",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "summer_wardrobe_budget-shorts",
      "name": "Shorts",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_summer_wardrobe_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_summer_wardrobe_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_summer_wardrobe_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_summer_wardrobe_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_summer_wardrobe_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_summer_wardrobe_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_summer_wardrobe_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_summer_wardrobe_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_summer_wardrobe_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_summer_wardrobe_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_summer_wardrobe_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_summer_wardrobe_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_summer_wardrobe_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_summer_wardrobe_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_summer_wardrobe_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_summer_wardrobe_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_summer_wardrobe_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_summer_wardrobe_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_summer_wardrobe_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_summer_wardrobe_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_summer_wardrobe_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_summer_wardrobe_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_summer_wardrobe_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_summer_wardrobe_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_summer_wardrobe_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
