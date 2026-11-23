# Solar Battery Size Archive

Real local JSON analysis of solar battery size in the Solar Battery lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/solar-battery-size-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "solar-battery-size-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/solar-battery-size-mcp"]
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
      "id": "solar_battery_solar_battery_size-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "solar-battery",
        "solar",
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
      "id": "solar_battery_solar_battery_size-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "solar-battery",
        "solar",
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
| `inventory_solar_battery_solar_battery_size` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_solar_battery_solar_battery_size_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_solar_battery_solar_battery_size_coverage` | Show category coverage ratios and unknown categories. |
| `flag_solar_battery_solar_battery_size_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_solar_battery_solar_battery_size_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_solar_battery_solar_battery_size_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_solar_battery_solar_battery_size_baseline` | Compare category counts with the configured baseline. |
| `estimate_solar_battery_solar_battery_size_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_solar_battery_solar_battery_size_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_solar_battery_solar_battery_size_dependencies` | Map dependency groups and show which ones are missing. |
| `test_solar_battery_solar_battery_size_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_solar_battery_solar_battery_size_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_solar_battery_solar_battery_size_fixes` | Rank fixes by impact divided by effort. |
| `validate_solar_battery_solar_battery_size_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_solar_battery_solar_battery_size_duplicates` | Group items with the same category and normalized name. |
| `measure_solar_battery_solar_battery_size_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_solar_battery_solar_battery_size_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_solar_battery_solar_battery_size_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_solar_battery_solar_battery_size_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_solar_battery_solar_battery_size_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_solar_battery_solar_battery_size_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_solar_battery_solar_battery_size_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_solar_battery_solar_battery_size_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_solar_battery_solar_battery_size_next_steps` | Recommend the next five actions with quick wins. |
| `open_solar_battery_solar_battery_size_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
