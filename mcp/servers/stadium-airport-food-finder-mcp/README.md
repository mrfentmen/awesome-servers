# Stadium Airport Food Finder Audit

Stadium Airport Food Finder Audit: venue food map and prices. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/stadium-airport-food-finder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "stadium-airport-food-finder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/stadium-airport-food-finder-mcp"]
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
      "id": "venue_food-sample-1",
      "name": "Sample stadiums entry",
      "category": "stadium",
      "tags": [
        "stadium"
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
      "id": "venue_food-sample-2",
      "name": "Sample airports entry",
      "category": "airport",
      "tags": [
        "stadium"
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
| `inventory_venue_food` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_venue_food_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_venue_food_coverage` | Show category coverage ratios and unknown categories. |
| `flag_venue_food_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_venue_food_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_venue_food_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_venue_food_baseline` | Compare category counts with the configured baseline. |
| `estimate_venue_food_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_venue_food_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_venue_food_dependencies` | Map dependency groups and show which ones are missing. |
| `test_venue_food_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_venue_food_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_venue_food_fixes` | Rank fixes by impact divided by effort. |
| `validate_venue_food_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_venue_food_duplicates` | Group items with the same category and normalized name. |
| `measure_venue_food_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_venue_food_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_venue_food_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_venue_food_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_venue_food_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_venue_food_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_venue_food_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_venue_food_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_venue_food_next_steps` | Recommend the next five actions with quick wins. |
| `open_venue_food_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
