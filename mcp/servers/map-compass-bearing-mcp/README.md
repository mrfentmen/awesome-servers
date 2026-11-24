# Map Compass Bearing Planner

Real local JSON analysis of map compass bearing in the Trail Camp lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/map-compass-bearing-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "map-compass-bearing-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/map-compass-bearing-mcp"]
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
      "id": "trail_camp_map_compass_bearing-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "trail-camp",
        "map",
        "compass"
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
      "id": "trail_camp_map_compass_bearing-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "trail-camp",
        "map",
        "compass"
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
| `inventory_trail_camp_map_compass_bearing` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_trail_camp_map_compass_bearing_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_trail_camp_map_compass_bearing_coverage` | Show category coverage ratios and unknown categories. |
| `flag_trail_camp_map_compass_bearing_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_trail_camp_map_compass_bearing_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_trail_camp_map_compass_bearing_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_trail_camp_map_compass_bearing_baseline` | Compare category counts with the configured baseline. |
| `estimate_trail_camp_map_compass_bearing_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_trail_camp_map_compass_bearing_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_trail_camp_map_compass_bearing_dependencies` | Map dependency groups and show which ones are missing. |
| `test_trail_camp_map_compass_bearing_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_trail_camp_map_compass_bearing_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_trail_camp_map_compass_bearing_fixes` | Rank fixes by impact divided by effort. |
| `validate_trail_camp_map_compass_bearing_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_trail_camp_map_compass_bearing_duplicates` | Group items with the same category and normalized name. |
| `measure_trail_camp_map_compass_bearing_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_trail_camp_map_compass_bearing_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_trail_camp_map_compass_bearing_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_trail_camp_map_compass_bearing_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_trail_camp_map_compass_bearing_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_trail_camp_map_compass_bearing_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_trail_camp_map_compass_bearing_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_trail_camp_map_compass_bearing_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_trail_camp_map_compass_bearing_next_steps` | Recommend the next five actions with quick wins. |
| `open_trail_camp_map_compass_bearing_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
