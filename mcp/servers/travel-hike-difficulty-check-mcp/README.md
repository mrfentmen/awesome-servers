# Hike Difficulty Audit

Audit hike options by distance, difficulty, spend and route coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/travel-hike-difficulty-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "travel-hike-difficulty-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/travel-hike-difficulty-check-mcp"]
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
      "id": "hike-river",
      "name": "River walk",
      "category": "easy",
      "tags": [
        "flat"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "hike-ridge",
      "name": "Ridge trail",
      "category": "moderate",
      "tags": [
        "views"
      ],
      "cost": 5,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_hike_difficulty` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hike_difficulty_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hike_difficulty_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hike_difficulty_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hike_difficulty_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hike_difficulty_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hike_difficulty_baseline` | Compare category counts with the configured baseline. |
| `estimate_hike_difficulty_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hike_difficulty_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hike_difficulty_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hike_difficulty_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hike_difficulty_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hike_difficulty_fixes` | Rank fixes by impact divided by effort. |
| `validate_hike_difficulty_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hike_difficulty_duplicates` | Group items with the same category and normalized name. |
| `measure_hike_difficulty_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hike_difficulty_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hike_difficulty_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hike_difficulty_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hike_difficulty_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hike_difficulty_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hike_difficulty_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hike_difficulty_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hike_difficulty_next_steps` | Recommend the next five actions with quick wins. |
| `open_hike_difficulty_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
