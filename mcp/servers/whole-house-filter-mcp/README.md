# Whole House Filter Planner

Real local JSON analysis of whole house filter in the Whole House lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/whole-house-filter-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "whole-house-filter-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/whole-house-filter-mcp"]
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
      "id": "whole_house_whole_house_filter-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "whole-house",
        "whole",
        "house"
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
      "id": "whole_house_whole_house_filter-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "whole-house",
        "whole",
        "house"
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
| `inventory_whole_house_whole_house_filter` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_whole_house_whole_house_filter_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_whole_house_whole_house_filter_coverage` | Show category coverage ratios and unknown categories. |
| `flag_whole_house_whole_house_filter_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_whole_house_whole_house_filter_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_whole_house_whole_house_filter_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_whole_house_whole_house_filter_baseline` | Compare category counts with the configured baseline. |
| `estimate_whole_house_whole_house_filter_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_whole_house_whole_house_filter_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_whole_house_whole_house_filter_dependencies` | Map dependency groups and show which ones are missing. |
| `test_whole_house_whole_house_filter_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_whole_house_whole_house_filter_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_whole_house_whole_house_filter_fixes` | Rank fixes by impact divided by effort. |
| `validate_whole_house_whole_house_filter_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_whole_house_whole_house_filter_duplicates` | Group items with the same category and normalized name. |
| `measure_whole_house_whole_house_filter_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_whole_house_whole_house_filter_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_whole_house_whole_house_filter_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_whole_house_whole_house_filter_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_whole_house_whole_house_filter_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_whole_house_whole_house_filter_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_whole_house_whole_house_filter_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_whole_house_whole_house_filter_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_whole_house_whole_house_filter_next_steps` | Recommend the next five actions with quick wins. |
| `open_whole_house_whole_house_filter_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
