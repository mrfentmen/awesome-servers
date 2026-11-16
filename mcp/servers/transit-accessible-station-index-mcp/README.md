# Accessible Station Archive

Archive accessible station by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/transit-accessible-station-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "transit-accessible-station-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/transit-accessible-station-index-mcp"]
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
      "id": "accessible_station_index-elevator",
      "name": "Platform elevator",
      "category": "elevator",
      "tags": [
        "street-to-platform",
        "working"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "accessible_station_index-backup",
      "name": "Backup elevator",
      "category": "elevator",
      "tags": [
        "maintenance",
        "slow"
      ],
      "cost": 6000,
      "quantity": 2,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_accessible_station_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_accessible_station_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_accessible_station_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_accessible_station_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_accessible_station_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_accessible_station_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_accessible_station_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_accessible_station_index_barrier_count` | Calculate the primary metric for every item with mean and pass count. |
| `find_accessible_station_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_accessible_station_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_accessible_station_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_accessible_station_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_accessible_station_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_accessible_station_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_accessible_station_index_duplicates` | Group items with the same category and normalized name. |
| `measure_accessible_station_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_accessible_station_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_accessible_station_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_accessible_station_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_accessible_station_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_accessible_station_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_accessible_station_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_accessible_station_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_accessible_station_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_accessible_station_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
