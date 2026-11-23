# Whole Foods Delivery Scheduler Tracker

Real local JSON analysis of whole foods delivery scheduler in the Whole Foods lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/whole-foods-delivery-scheduler-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "whole-foods-delivery-scheduler-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/whole-foods-delivery-scheduler-mcp"]
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
      "id": "whole_foods_whole_foods_delivery_scheduler-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "whole-foods",
        "whole",
        "foods"
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
      "id": "whole_foods_whole_foods_delivery_scheduler-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "whole-foods",
        "whole",
        "foods"
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
| `inventory_whole_foods_whole_foods_delivery_scheduler` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_whole_foods_whole_foods_delivery_scheduler_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_whole_foods_whole_foods_delivery_scheduler_coverage` | Show category coverage ratios and unknown categories. |
| `flag_whole_foods_whole_foods_delivery_scheduler_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_whole_foods_whole_foods_delivery_scheduler_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_whole_foods_whole_foods_delivery_scheduler_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_whole_foods_whole_foods_delivery_scheduler_baseline` | Compare category counts with the configured baseline. |
| `estimate_whole_foods_whole_foods_delivery_scheduler_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_whole_foods_whole_foods_delivery_scheduler_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_whole_foods_whole_foods_delivery_scheduler_dependencies` | Map dependency groups and show which ones are missing. |
| `test_whole_foods_whole_foods_delivery_scheduler_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_whole_foods_whole_foods_delivery_scheduler_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_whole_foods_whole_foods_delivery_scheduler_fixes` | Rank fixes by impact divided by effort. |
| `validate_whole_foods_whole_foods_delivery_scheduler_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_whole_foods_whole_foods_delivery_scheduler_duplicates` | Group items with the same category and normalized name. |
| `measure_whole_foods_whole_foods_delivery_scheduler_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_whole_foods_whole_foods_delivery_scheduler_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_whole_foods_whole_foods_delivery_scheduler_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_whole_foods_whole_foods_delivery_scheduler_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_whole_foods_whole_foods_delivery_scheduler_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_whole_foods_whole_foods_delivery_scheduler_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_whole_foods_whole_foods_delivery_scheduler_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_whole_foods_whole_foods_delivery_scheduler_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_whole_foods_whole_foods_delivery_scheduler_next_steps` | Recommend the next five actions with quick wins. |
| `open_whole_foods_whole_foods_delivery_scheduler_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
