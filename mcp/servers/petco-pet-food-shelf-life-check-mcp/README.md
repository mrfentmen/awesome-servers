# Pet Food Shelf Life Audit

Audit pet food stock for expiry, category coverage, spend and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/petco-pet-food-shelf-life-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "petco-pet-food-shelf-life-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/petco-pet-food-shelf-life-check-mcp"]
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
      "id": "pet-dog-kibble",
      "name": "Adult dog kibble",
      "category": "dog-food",
      "tags": [
        "chicken"
      ],
      "cost": 60,
      "quantity": 1,
      "acquired": "2026-09-01",
      "expires": "2027-05-01",
      "condition": "new"
    },
    {
      "id": "pet-cat-wet",
      "name": "Cat wet food pack",
      "category": "cat-food",
      "tags": [
        "fish"
      ],
      "cost": 30,
      "quantity": 12,
      "acquired": "2026-08-01",
      "expires": "2027-03-01",
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_pet_food_shelf_life` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pet_food_shelf_life_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pet_food_shelf_life_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pet_food_shelf_life_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pet_food_shelf_life_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pet_food_shelf_life_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pet_food_shelf_life_baseline` | Compare category counts with the configured baseline. |
| `estimate_pet_food_shelf_life_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_pet_food_shelf_life_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pet_food_shelf_life_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pet_food_shelf_life_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pet_food_shelf_life_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pet_food_shelf_life_fixes` | Rank fixes by impact divided by effort. |
| `validate_pet_food_shelf_life_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pet_food_shelf_life_duplicates` | Group items with the same category and normalized name. |
| `measure_pet_food_shelf_life_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pet_food_shelf_life_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pet_food_shelf_life_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pet_food_shelf_life_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pet_food_shelf_life_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pet_food_shelf_life_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pet_food_shelf_life_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pet_food_shelf_life_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pet_food_shelf_life_next_steps` | Recommend the next five actions with quick wins. |
| `open_pet_food_shelf_life_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
