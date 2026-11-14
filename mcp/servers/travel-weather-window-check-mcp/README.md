# Weather Window Audit

Audit travel days for dry hours, coverage and backup windows. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/travel-weather-window-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "travel-weather-window-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/travel-weather-window-check-mcp"]
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
      "id": "weather-day1",
      "name": "Saturday window",
      "category": "day1",
      "tags": [
        "clear"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "weather-day2",
      "name": "Sunday window",
      "category": "day2",
      "tags": [
        "cloud"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_weather_window` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_weather_window_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_weather_window_coverage` | Show category coverage ratios and unknown categories. |
| `flag_weather_window_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_weather_window_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_weather_window_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_weather_window_baseline` | Compare category counts with the configured baseline. |
| `estimate_weather_window_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_weather_window_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_weather_window_dependencies` | Map dependency groups and show which ones are missing. |
| `test_weather_window_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_weather_window_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_weather_window_fixes` | Rank fixes by impact divided by effort. |
| `validate_weather_window_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_weather_window_duplicates` | Group items with the same category and normalized name. |
| `measure_weather_window_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_weather_window_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_weather_window_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_weather_window_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_weather_window_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_weather_window_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_weather_window_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_weather_window_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_weather_window_next_steps` | Recommend the next five actions with quick wins. |
| `open_weather_window_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
