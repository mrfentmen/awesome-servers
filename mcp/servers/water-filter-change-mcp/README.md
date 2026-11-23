# Water Filter Change Budget

Real local JSON analysis of water filter change in the Water Filter lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/water-filter-change-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "water-filter-change-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/water-filter-change-mcp"]
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
      "id": "water_filter_water_filter_change-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "water-filter",
        "water",
        "filter"
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
      "id": "water_filter_water_filter_change-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "water-filter",
        "water",
        "filter"
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
| `inventory_water_filter_water_filter_change` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_water_filter_water_filter_change_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_water_filter_water_filter_change_coverage` | Show category coverage ratios and unknown categories. |
| `flag_water_filter_water_filter_change_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_water_filter_water_filter_change_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_water_filter_water_filter_change_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_water_filter_water_filter_change_baseline` | Compare category counts with the configured baseline. |
| `estimate_water_filter_water_filter_change_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_water_filter_water_filter_change_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_water_filter_water_filter_change_dependencies` | Map dependency groups and show which ones are missing. |
| `test_water_filter_water_filter_change_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_water_filter_water_filter_change_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_water_filter_water_filter_change_fixes` | Rank fixes by impact divided by effort. |
| `validate_water_filter_water_filter_change_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_water_filter_water_filter_change_duplicates` | Group items with the same category and normalized name. |
| `measure_water_filter_water_filter_change_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_water_filter_water_filter_change_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_water_filter_water_filter_change_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_water_filter_water_filter_change_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_water_filter_water_filter_change_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_water_filter_water_filter_change_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_water_filter_water_filter_change_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_water_filter_water_filter_change_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_water_filter_water_filter_change_next_steps` | Recommend the next five actions with quick wins. |
| `open_water_filter_water_filter_change_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
