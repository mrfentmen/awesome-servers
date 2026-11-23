# Rain Bird Zone Tracker

Real local JSON analysis of rain bird zone in the Rain Bird lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/rain-bird-zone-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "rain-bird-zone-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/rain-bird-zone-mcp"]
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
      "id": "rain_bird_rain_bird_zone-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "rain-bird",
        "rain",
        "bird"
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
      "id": "rain_bird_rain_bird_zone-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "rain-bird",
        "rain",
        "bird"
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
| `inventory_rain_bird_rain_bird_zone` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_rain_bird_rain_bird_zone_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_rain_bird_rain_bird_zone_coverage` | Show category coverage ratios and unknown categories. |
| `flag_rain_bird_rain_bird_zone_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_rain_bird_rain_bird_zone_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_rain_bird_rain_bird_zone_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_rain_bird_rain_bird_zone_baseline` | Compare category counts with the configured baseline. |
| `estimate_rain_bird_rain_bird_zone_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_rain_bird_rain_bird_zone_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_rain_bird_rain_bird_zone_dependencies` | Map dependency groups and show which ones are missing. |
| `test_rain_bird_rain_bird_zone_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_rain_bird_rain_bird_zone_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_rain_bird_rain_bird_zone_fixes` | Rank fixes by impact divided by effort. |
| `validate_rain_bird_rain_bird_zone_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_rain_bird_rain_bird_zone_duplicates` | Group items with the same category and normalized name. |
| `measure_rain_bird_rain_bird_zone_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_rain_bird_rain_bird_zone_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_rain_bird_rain_bird_zone_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_rain_bird_rain_bird_zone_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_rain_bird_rain_bird_zone_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_rain_bird_rain_bird_zone_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_rain_bird_rain_bird_zone_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_rain_bird_rain_bird_zone_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_rain_bird_rain_bird_zone_next_steps` | Recommend the next five actions with quick wins. |
| `open_rain_bird_rain_bird_zone_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
