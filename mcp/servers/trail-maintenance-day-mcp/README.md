# Trail Maintenance Day Tracker

Real local JSON analysis of trail maintenance day in the Good Neighbor lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/trail-maintenance-day-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "trail-maintenance-day-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/trail-maintenance-day-mcp"]
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
      "id": "good_neighbor_trail_maintenance_day-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "good-neighbor",
        "trail",
        "maintenance"
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
      "id": "good_neighbor_trail_maintenance_day-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "good-neighbor",
        "trail",
        "maintenance"
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
| `inventory_good_neighbor_trail_maintenance_day` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_good_neighbor_trail_maintenance_day_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_good_neighbor_trail_maintenance_day_coverage` | Show category coverage ratios and unknown categories. |
| `flag_good_neighbor_trail_maintenance_day_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_good_neighbor_trail_maintenance_day_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_good_neighbor_trail_maintenance_day_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_good_neighbor_trail_maintenance_day_baseline` | Compare category counts with the configured baseline. |
| `estimate_good_neighbor_trail_maintenance_day_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_good_neighbor_trail_maintenance_day_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_good_neighbor_trail_maintenance_day_dependencies` | Map dependency groups and show which ones are missing. |
| `test_good_neighbor_trail_maintenance_day_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_good_neighbor_trail_maintenance_day_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_good_neighbor_trail_maintenance_day_fixes` | Rank fixes by impact divided by effort. |
| `validate_good_neighbor_trail_maintenance_day_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_good_neighbor_trail_maintenance_day_duplicates` | Group items with the same category and normalized name. |
| `measure_good_neighbor_trail_maintenance_day_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_good_neighbor_trail_maintenance_day_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_good_neighbor_trail_maintenance_day_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_good_neighbor_trail_maintenance_day_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_good_neighbor_trail_maintenance_day_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_good_neighbor_trail_maintenance_day_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_good_neighbor_trail_maintenance_day_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_good_neighbor_trail_maintenance_day_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_good_neighbor_trail_maintenance_day_next_steps` | Recommend the next five actions with quick wins. |
| `open_good_neighbor_trail_maintenance_day_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
