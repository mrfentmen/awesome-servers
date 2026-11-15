# Street Parking Audit

Audit parking signs, meters, sweep windows and garage fallback for a street parking plan. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/nyc-street-parking-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "nyc-street-parking-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/nyc-street-parking-check-mcp"]
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
      "id": "street_parking-sign-survey",
      "name": "Sign survey",
      "category": "signs",
      "tags": [
        "signs"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "street_parking-meter-zone",
      "name": "Meter zone",
      "category": "meters",
      "tags": [
        "meters"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_street_parking` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_street_parking_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_street_parking_coverage` | Show category coverage ratios and unknown categories. |
| `flag_street_parking_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_street_parking_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_street_parking_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_street_parking_baseline` | Compare category counts with the configured baseline. |
| `estimate_street_parking_park_minutes` | Calculate the primary metric for every item with mean and pass count. |
| `find_street_parking_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_street_parking_dependencies` | Map dependency groups and show which ones are missing. |
| `test_street_parking_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_street_parking_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_street_parking_fixes` | Rank fixes by impact divided by effort. |
| `validate_street_parking_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_street_parking_duplicates` | Group items with the same category and normalized name. |
| `measure_street_parking_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_street_parking_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_street_parking_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_street_parking_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_street_parking_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_street_parking_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_street_parking_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_street_parking_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_street_parking_next_steps` | Recommend the next five actions with quick wins. |
| `open_street_parking_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
