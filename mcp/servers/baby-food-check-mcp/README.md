# Baby Food Check Audit

Baby Food Check Audit: check baby food labels and stages, not medical advice. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/baby-food-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "baby-food-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/baby-food-check-mcp"]
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
      "id": "baby_food-sample-1",
      "name": "Sample purees entry",
      "category": "puree",
      "tags": [
        "baby"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "baby_food-sample-2",
      "name": "Sample cereals entry",
      "category": "cereal",
      "tags": [
        "baby"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_baby_food` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_baby_food_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_baby_food_coverage` | Show category coverage ratios and unknown categories. |
| `flag_baby_food_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_baby_food_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_baby_food_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_baby_food_baseline` | Compare category counts with the configured baseline. |
| `estimate_baby_food_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_baby_food_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_baby_food_dependencies` | Map dependency groups and show which ones are missing. |
| `test_baby_food_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_baby_food_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_baby_food_fixes` | Rank fixes by impact divided by effort. |
| `validate_baby_food_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_baby_food_duplicates` | Group items with the same category and normalized name. |
| `measure_baby_food_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_baby_food_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_baby_food_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_baby_food_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_baby_food_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_baby_food_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_baby_food_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_baby_food_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_baby_food_next_steps` | Recommend the next five actions with quick wins. |
| `open_baby_food_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
