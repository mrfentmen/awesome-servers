# Earth Day Guide Planner

Real local JSON analysis of earth day guide in the Earth Day lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/earth-day-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "earth-day-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/earth-day-guide-mcp"]
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
      "id": "earth_day_earth_day_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "earth-day",
        "earth",
        "day"
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
      "id": "earth_day_earth_day_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "earth-day",
        "earth",
        "day"
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
| `inventory_earth_day_earth_day_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_earth_day_earth_day_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_earth_day_earth_day_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_earth_day_earth_day_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_earth_day_earth_day_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_earth_day_earth_day_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_earth_day_earth_day_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_earth_day_earth_day_guide_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_earth_day_earth_day_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_earth_day_earth_day_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_earth_day_earth_day_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_earth_day_earth_day_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_earth_day_earth_day_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_earth_day_earth_day_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_earth_day_earth_day_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_earth_day_earth_day_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_earth_day_earth_day_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_earth_day_earth_day_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_earth_day_earth_day_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_earth_day_earth_day_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_earth_day_earth_day_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_earth_day_earth_day_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_earth_day_earth_day_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_earth_day_earth_day_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_earth_day_earth_day_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
