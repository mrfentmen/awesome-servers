# Used Car Listing Audit

Audit used car listings by body type, price, mileage and listing gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/car-buying-used-listing-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "car-buying-used-listing-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/car-buying-used-listing-check-mcp"]
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
      "id": "listing-sedan",
      "name": "2019 sedan",
      "category": "sedan",
      "tags": [
        "petrol"
      ],
      "cost": 12000,
      "quantity": 45000,
      "condition": "good"
    },
    {
      "id": "listing-suv",
      "name": "2018 SUV",
      "category": "suv",
      "tags": [
        "awd"
      ],
      "cost": 18000,
      "quantity": 60000,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_used_listing` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_used_listing_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_used_listing_coverage` | Show category coverage ratios and unknown categories. |
| `flag_used_listing_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_used_listing_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_used_listing_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_used_listing_baseline` | Compare category counts with the configured baseline. |
| `estimate_used_listing_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_used_listing_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_used_listing_dependencies` | Map dependency groups and show which ones are missing. |
| `test_used_listing_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_used_listing_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_used_listing_fixes` | Rank fixes by impact divided by effort. |
| `validate_used_listing_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_used_listing_duplicates` | Group items with the same category and normalized name. |
| `measure_used_listing_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_used_listing_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_used_listing_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_used_listing_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_used_listing_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_used_listing_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_used_listing_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_used_listing_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_used_listing_next_steps` | Recommend the next five actions with quick wins. |
| `open_used_listing_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
