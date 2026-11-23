# Dirt Bike Mix Planner

Real local JSON analysis of dirt bike mix in the Dirt Bike lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/dirt-bike-mix-ratio-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "dirt-bike-mix-ratio-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/dirt-bike-mix-ratio-mcp"]
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
      "id": "dirt_bike_dirt_bike_mix_ratio-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
      "id": "dirt_bike_dirt_bike_mix_ratio-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "dirt-bike",
        "dirt",
        "bike"
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
| `inventory_dirt_bike_dirt_bike_mix_ratio` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_dirt_bike_dirt_bike_mix_ratio_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_dirt_bike_dirt_bike_mix_ratio_coverage` | Show category coverage ratios and unknown categories. |
| `flag_dirt_bike_dirt_bike_mix_ratio_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_dirt_bike_dirt_bike_mix_ratio_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_dirt_bike_dirt_bike_mix_ratio_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_dirt_bike_dirt_bike_mix_ratio_baseline` | Compare category counts with the configured baseline. |
| `estimate_dirt_bike_dirt_bike_mix_ratio_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_dirt_bike_dirt_bike_mix_ratio_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_dirt_bike_dirt_bike_mix_ratio_dependencies` | Map dependency groups and show which ones are missing. |
| `test_dirt_bike_dirt_bike_mix_ratio_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_dirt_bike_dirt_bike_mix_ratio_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_dirt_bike_dirt_bike_mix_ratio_fixes` | Rank fixes by impact divided by effort. |
| `validate_dirt_bike_dirt_bike_mix_ratio_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_dirt_bike_dirt_bike_mix_ratio_duplicates` | Group items with the same category and normalized name. |
| `measure_dirt_bike_dirt_bike_mix_ratio_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_dirt_bike_dirt_bike_mix_ratio_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_dirt_bike_dirt_bike_mix_ratio_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_dirt_bike_dirt_bike_mix_ratio_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_dirt_bike_dirt_bike_mix_ratio_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_dirt_bike_dirt_bike_mix_ratio_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_dirt_bike_dirt_bike_mix_ratio_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_dirt_bike_dirt_bike_mix_ratio_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_dirt_bike_dirt_bike_mix_ratio_next_steps` | Recommend the next five actions with quick wins. |
| `open_dirt_bike_dirt_bike_mix_ratio_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
