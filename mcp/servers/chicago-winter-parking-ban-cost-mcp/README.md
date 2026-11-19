# Winter Parking Ban Budget

Real local JSON analysis of winter parking ban in the Chicago lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/chicago-winter-parking-ban-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "chicago-winter-parking-ban-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/chicago-winter-parking-ban-cost-mcp"]
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
      "id": "chicago_chicago_winter_parking_ban_cost-line-items-1",
      "name": "Line items primary",
      "category": "line-items",
      "tags": [
        "chicago",
        "chicago",
        "winter"
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
      "id": "chicago_chicago_winter_parking_ban_cost-actuals-2",
      "name": "Actuals primary",
      "category": "actuals",
      "tags": [
        "chicago",
        "chicago",
        "winter"
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
| `inventory_chicago_chicago_winter_parking_ban_cost` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_chicago_chicago_winter_parking_ban_cost_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_chicago_chicago_winter_parking_ban_cost_coverage` | Show category coverage ratios and unknown categories. |
| `flag_chicago_chicago_winter_parking_ban_cost_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_chicago_chicago_winter_parking_ban_cost_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_chicago_chicago_winter_parking_ban_cost_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_chicago_chicago_winter_parking_ban_cost_baseline` | Compare category counts with the configured baseline. |
| `estimate_chicago_chicago_winter_parking_ban_cost_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_chicago_chicago_winter_parking_ban_cost_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_chicago_chicago_winter_parking_ban_cost_dependencies` | Map dependency groups and show which ones are missing. |
| `test_chicago_chicago_winter_parking_ban_cost_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_chicago_chicago_winter_parking_ban_cost_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_chicago_chicago_winter_parking_ban_cost_fixes` | Rank fixes by impact divided by effort. |
| `validate_chicago_chicago_winter_parking_ban_cost_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_chicago_chicago_winter_parking_ban_cost_duplicates` | Group items with the same category and normalized name. |
| `measure_chicago_chicago_winter_parking_ban_cost_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_chicago_chicago_winter_parking_ban_cost_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_chicago_chicago_winter_parking_ban_cost_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_chicago_chicago_winter_parking_ban_cost_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_chicago_chicago_winter_parking_ban_cost_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_chicago_chicago_winter_parking_ban_cost_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_chicago_chicago_winter_parking_ban_cost_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_chicago_chicago_winter_parking_ban_cost_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_chicago_chicago_winter_parking_ban_cost_next_steps` | Recommend the next five actions with quick wins. |
| `open_chicago_chicago_winter_parking_ban_cost_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
