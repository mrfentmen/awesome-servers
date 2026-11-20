# Utility Transfer Dates Tracker

Real local JSON analysis of utility transfer dates in the DIY Moving lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/moving-diy-utility-transfer-dates-track-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "moving-diy-utility-transfer-dates-track-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/moving-diy-utility-transfer-dates-track-mcp"]
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
      "id": "moving_diy_moving_diy_utility_transfer_dates_track-entries-1",
      "name": "Entries primary",
      "category": "entries",
      "tags": [
        "diy-moving",
        "moving",
        "diy"
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
      "id": "moving_diy_moving_diy_utility_transfer_dates_track-streaks-2",
      "name": "Streaks primary",
      "category": "streaks",
      "tags": [
        "diy-moving",
        "moving",
        "diy"
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
| `inventory_moving_diy_moving_diy_utility_transfer_dates_track` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_moving_diy_moving_diy_utility_transfer_dates_track_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_moving_diy_moving_diy_utility_transfer_dates_track_coverage` | Show category coverage ratios and unknown categories. |
| `flag_moving_diy_moving_diy_utility_transfer_dates_track_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_moving_diy_moving_diy_utility_transfer_dates_track_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_moving_diy_moving_diy_utility_transfer_dates_track_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_moving_diy_moving_diy_utility_transfer_dates_track_baseline` | Compare category counts with the configured baseline. |
| `estimate_moving_diy_moving_diy_utility_transfer_dates_track_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_moving_diy_moving_diy_utility_transfer_dates_track_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_moving_diy_moving_diy_utility_transfer_dates_track_dependencies` | Map dependency groups and show which ones are missing. |
| `test_moving_diy_moving_diy_utility_transfer_dates_track_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_moving_diy_moving_diy_utility_transfer_dates_track_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_moving_diy_moving_diy_utility_transfer_dates_track_fixes` | Rank fixes by impact divided by effort. |
| `validate_moving_diy_moving_diy_utility_transfer_dates_track_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_moving_diy_moving_diy_utility_transfer_dates_track_duplicates` | Group items with the same category and normalized name. |
| `measure_moving_diy_moving_diy_utility_transfer_dates_track_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_moving_diy_moving_diy_utility_transfer_dates_track_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_moving_diy_moving_diy_utility_transfer_dates_track_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_moving_diy_moving_diy_utility_transfer_dates_track_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_moving_diy_moving_diy_utility_transfer_dates_track_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_moving_diy_moving_diy_utility_transfer_dates_track_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_moving_diy_moving_diy_utility_transfer_dates_track_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_moving_diy_moving_diy_utility_transfer_dates_track_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_moving_diy_moving_diy_utility_transfer_dates_track_next_steps` | Recommend the next five actions with quick wins. |
| `open_moving_diy_moving_diy_utility_transfer_dates_track_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
