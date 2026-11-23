# Dewalt Battery Picker Tracker

Real local JSON analysis of dewalt battery picker in the Dewalt Battery lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/dewalt-battery-picker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "dewalt-battery-picker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/dewalt-battery-picker-mcp"]
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
      "id": "dewalt_battery_dewalt_battery_picker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "dewalt-battery",
        "dewalt",
        "battery"
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
      "id": "dewalt_battery_dewalt_battery_picker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "dewalt-battery",
        "dewalt",
        "battery"
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
| `inventory_dewalt_battery_dewalt_battery_picker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_dewalt_battery_dewalt_battery_picker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_dewalt_battery_dewalt_battery_picker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_dewalt_battery_dewalt_battery_picker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_dewalt_battery_dewalt_battery_picker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_dewalt_battery_dewalt_battery_picker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_dewalt_battery_dewalt_battery_picker_baseline` | Compare category counts with the configured baseline. |
| `estimate_dewalt_battery_dewalt_battery_picker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_dewalt_battery_dewalt_battery_picker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_dewalt_battery_dewalt_battery_picker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_dewalt_battery_dewalt_battery_picker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_dewalt_battery_dewalt_battery_picker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_dewalt_battery_dewalt_battery_picker_fixes` | Rank fixes by impact divided by effort. |
| `validate_dewalt_battery_dewalt_battery_picker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_dewalt_battery_dewalt_battery_picker_duplicates` | Group items with the same category and normalized name. |
| `measure_dewalt_battery_dewalt_battery_picker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_dewalt_battery_dewalt_battery_picker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_dewalt_battery_dewalt_battery_picker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_dewalt_battery_dewalt_battery_picker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_dewalt_battery_dewalt_battery_picker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_dewalt_battery_dewalt_battery_picker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_dewalt_battery_dewalt_battery_picker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_dewalt_battery_dewalt_battery_picker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_dewalt_battery_dewalt_battery_picker_next_steps` | Recommend the next five actions with quick wins. |
| `open_dewalt_battery_dewalt_battery_picker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
